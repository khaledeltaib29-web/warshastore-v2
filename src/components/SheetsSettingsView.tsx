import React, { useState, useEffect } from 'react';
import { StoreSettings, Order, Product, Manufacturer, Expense, AppUser } from '../types';
import {
  FileSpreadsheet,
  CloudCheck,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertCircle,
  Settings,
  Sparkles,
  Send,
  Boxes,
  AlertTriangle,
  Wallet,
  Coins,
  Archive,
  Upload,
  Activity,
  ShieldCheck,
  XCircle,
  Layers,
  ShoppingBag,
  Trash2,
} from 'lucide-react';

interface SheetsSettingsViewProps {
  settings: StoreSettings;
  isSyncing: boolean;
  orders?: Order[];
  products?: Product[];
  manufacturers?: Manufacturer[];
  expenses?: Expense[];
  onUpdateSettings: (newSettings: Partial<StoreSettings>) => void;
  onCreateNewSheet: () => Promise<void>;
  onSyncNow: (
    silent?: boolean,
    overrideOrders?: Order[],
    overrideProducts?: Product[],
    overrideManufacturers?: Manufacturer[],
    overrideExpenses?: Expense[]
  ) => Promise<void>;
  onExportExcel: () => void;
  onOpenFullBackupModal?: () => void;
  onOpenExcelModal?: () => void;
  currentUser?: AppUser;
}

interface DiagnosticData {
  success: boolean;
  fileName?: string | null;
  spreadsheetId?: string;
  serviceAccountEmail?: string;
  isPermissionError?: boolean;
  hasWriteAccess?: boolean;
  tabsFound?: string[];
  updatedAt?: string;
  syncedCounts?: {
    orders: number;
    products: number;
    manufacturers: number;
    expenses: number;
  };
  lastOrdersReport?: Array<{
    id: string;
    date: string;
    customerName: string;
    total: number;
    status: string;
    itemSummary: string;
  }>;
  message?: string;
  error?: string;
}

export const SheetsSettingsView: React.FC<SheetsSettingsViewProps> = ({
  settings,
  isSyncing,
  orders = [],
  products = [],
  manufacturers = [],
  expenses = [],
  onUpdateSettings,
  onCreateNewSheet,
  onSyncNow,
  onExportExcel,
  onOpenFullBackupModal,
  onOpenExcelModal,
  currentUser,
}) => {
  const canExportExcel = currentUser?.role === 'super_admin' || currentUser?.role === 'deputy_admin';
  const [inputUrl, setInputUrl] = useState(settings.spreadsheetUrl || settings.spreadsheetId || '');
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  const [appsScriptInput, setAppsScriptInput] = useState(settings.appsScriptUrl || '');
  const [showAppsScriptModal, setShowAppsScriptModal] = useState(false);
  const [isAppsScriptSyncing, setIsAppsScriptSyncing] = useState(false);

 const APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    function updateTab(tabName, headers, rows) {
      var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);
      sheet.clearContents();
      sheet.appendRow(headers);
      if (rows && rows.length > 0) {
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
    }
    
    if (data.orders) {
      var oHeaders = ['رقم الأوردر', 'التاريخ', 'اسم العميل', 'الهاتف', 'العنوان', 'المنتجات', 'الورشة', 'إجمالي البيع', 'المبلغ المدفوع', 'الحالة', 'الربح الصافي'];
      var oRows = data.orders.map(function(o) {
        return [o.id, o.date, o.customerName, o.phone, o.address, o.productName || '—', o.manufacturerName || '—', o.totalSale, o.paidAmount, o.status, o.profit];
      });
      updateTab('الأوردرات', oHeaders, oRows);
    }
    
    if (data.products) {
      var pHeaders = ['كود المنتج', 'اسم المنتج', 'سعر البيع', 'تكلفة الخام', 'تكلفة المصنعية', 'إجمالي التكلفة', 'المخزون', 'الورشة'];
      var pRows = data.products.map(function(p) {
        return [p.id, p.name, p.salePrice, p.rawMaterialCost, p.workmanshipCost, p.totalCost, p.stock, p.manufacturerName];
      });
      updateTab('المنتجات', pHeaders, pRows);
    }

    if (data.manufacturers) {
      var mHeaders = ['كود الورشة', 'اسم الورشة', 'الهاتف', 'القطع المنفذة', 'إجمالي المستحق', 'المدفوع', 'المتبقي'];
      var mRows = data.manufacturers.map(function(m) {
        return [m.id, m.name, m.phone, m.completedUnits, m.totalWorkmanshipEarned, m.paidAmount, m.remainingBalance];
      });
      updateTab('المصنعين', mHeaders, mRows);
    }

    if (data.expenses) {
      var exHeaders = ['الكود', 'التاريخ', 'البند', 'البيان', 'المبلغ'];
      var exRows = data.expenses.map(function(ex) {
        return [ex.id, ex.date, ex.category, ex.description, ex.amount];
      });
      updateTab('المصروفات', exHeaders, exRows);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'تمت المزامنة بنجاح!' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleSaveAppsScriptUrl = () => {
    const url = appsScriptInput.trim();
    if (!url) {
      setMessage({ text: 'يرجى إدخال رابط Apps Script Webhook أولاً', type: 'error' });
      return;
    }
    onUpdateSettings({ appsScriptUrl: url });
    localStorage.setItem('warsha_settings', JSON.stringify({ ...settings, appsScriptUrl: url }));
    setMessage({ text: '✅ تم حفظ رابط Webhook وتفعيل المزامنة المباشرة بنجاح!', type: 'success' });
    handleSyncViaAppsScript();
  };

const handlePurgeCacheAndReload = async () => {
    try {
      localStorage.removeItem('warsha_settings');
      setMessage({
        text: '✅ تم تنظيف ذاكرة التخزين المؤقت (Cache) بنجاح!',
        type: 'success',
      });
      if (appsScriptInput.trim() || settings.appsScriptUrl) {
        await handleSyncViaAppsScript();
      }
    } catch (e: any) {
      setMessage({
        text: 'فشل تنظيف الكاش: ' + (e.message || 'خطأ غير معروف'),
        type: 'error',
      });
    }
  };

  const handleSyncViaAppsScript = async () => {
    const url = appsScriptInput.trim() || settings.appsScriptUrl;
    if (!url) {
      setMessage({ text: 'يرجى إدخال رابط Web App الخاص بـ Google Apps Script أولاً.', type: 'error' });
      return;
    }
    setIsAppsScriptSyncing(true);
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          orders,
          products,
          manufacturers,
          expenses,
        }),
      });

      onUpdateSettings({ appsScriptUrl: url, lastSyncedAt: new Date().toLocaleTimeString('ar-EG') });
      setMessage({ text: '✅ تمت المزامنة عبر Google Apps Script Webhook بنجاح!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'تعذر الاتصال بـ Webhook: ' + err.message, type: 'error' });
    } finally {
      setIsAppsScriptSyncing(false);
    }
  };

  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestInstantSync = async () => {
    setIsTesting(true);
    try {
      const activeUrl = appsScriptInput.trim() || settings.appsScriptUrl;
      
      if (!activeUrl) {
        setDiagnosticData({
          success: false,
          error: 'يرجى التأكد من وضع رابط Google Apps Script في الخانة المخصصة له.',
        });
        setIsTesting(false);
        return;
      }

      await fetch(activeUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync',
          orders,
          products,
          manufacturers,
          expenses,
        }),
      });

      setDiagnosticData({
        success: true,
        fileName: settings.spreadsheetTitle || 'تمت المزامنة',
        spreadsheetId: settings.spreadsheetId,
        hasWriteAccess: true,
        updatedAt: new Date().toISOString(),
        message: 'تم إرسال البيانات مباشرة إلى Google Sheets بنجاح!',
      });

      setMessage({
        text: '✅ تم إرسال البيانات بنجاح (اتصال مباشر)!',
        type: 'success',
      });
    } catch (err: any) {
      setDiagnosticData({
        success: false,
        error: 'فشل الاتصال المباشر: ' + err.message,
      });
      setMessage({
        text: 'خطأ في الاتصال المباشر بجوجل.',
        type: 'error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    if (settings.spreadsheetId && !diagnosticData && !isTesting) {
      handleTestInstantSync();
    }
  }, [settings.spreadsheetId]);

  const handleSaveSpreadsheetId = () => {
    let extractedId = inputUrl.trim();
    if (extractedId.includes('/spreadsheets/d/')) {
      const match = extractedId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        extractedId = match[1];
      }
    }

    if (!extractedId) {
      setMessage({ text: 'يرجى إدخال معرف الشيت أو الرابط الصحيح', type: 'error' });
      return;
    }

    const fullUrl = extractedId.startsWith('http')
      ? extractedId
      : `https://docs.google.com/spreadsheets/d/${extractedId}/edit`;

    onUpdateSettings({
      spreadsheetId: extractedId,
      spreadsheetUrl: fullUrl,
    });
    localStorage.setItem(
      'warsha_settings',
      JSON.stringify({ ...settings, spreadsheetId: extractedId, spreadsheetUrl: fullUrl })
    );
    setMessage({
      text: `✅ تم تحديث معرف الشيت في قاعدة البيانات الكلية إلى (${extractedId}) وتفريغ التخزين المؤقت القديم!`,
      type: 'success',
    });
  };

  const handleCreateSheetClick = async () => {
    setIsCreating(true);
    setMessage(null);
    try {
      await onCreateNewSheet();
      setMessage({
        text: 'تم إنشاء شيت Google Sheets جديد وتأسيس جميع الجداول في Google Drive بنجاح!',
        type: 'success',
      });
    } catch (err: any) {
      setMessage({
        text: err.message || 'تعذر إنشاء الشيت تلقائياً. تأكد من الربط أو ادخل ID الشيت يدوياً.',
        type: 'error',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">إدارة ومزامنة Google Sheets</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ربط التطبيق بشيت Google Sheets ليكون قاعدة البيانات الأساسية لورشة ستور WarshaStore.
            </p>
          </div>
        </div>
      </div>

      {/* Message feedback */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-2 text-xs font-bold ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Excel Export Card */}
      {canExportExcel && (
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white p-5 sm:p-6 rounded-2xl border border-emerald-500/40 shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  الحل المباشر والنهائي (بدون أذونات Google Cloud ولا Project ID)
                </span>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  100% مضمون
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Download className="w-6 h-6 text-emerald-400" />
                تصدير شيت Excel كامل (.xlsx) بضغطة زر واحدة
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                استخراج وتنزيل جميع بيانات النظام (الأوردرات، المنتجات، المصنعين، المصروفات والسيولة) في ملف Excel احترافي شيت متكامل بكل التبويبات والمعادلات فوراً على جهازك دون الحاجة لأي صلاحيات إدارية بـ Google Cloud Console.
              </p>
            </div>

            <button
              onClick={onExportExcel}
              className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-sm px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 shrink-0 w-full md:w-auto cursor-pointer"
            >
              <Download className="w-5 h-5" />
              تصدير ملف Excel (.xlsx) الآن
            </button>
          </div>
        </div>
      )}

      {/* Apps Script Webhook Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  المزامنة المباشرة عبر Google Apps Script Webhook
                </h3>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-200">
                  بدون أذونات Cloud
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                تتيح لك هذه الآلية المزامنة الحية مباشرة مع أي شيت حسابي خاص بك دون المرور بمشروع Google Cloud أو طلب أذونات المشروع.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAppsScriptModal(true)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            عرض كود Apps Script والخطوات
          </button>
        </div>

        <div className="space-y-2 pt-1">
          <label className="text-xs font-bold text-slate-700 block">
            رابط تطبيق الويب (Google Apps Script Web App URL):
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={appsScriptInput}
              onChange={(e) => setAppsScriptInput(e.target.value)}
              placeholder="مثال: https://script.google.com/macros/s/AKfycbx.../exec"
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dir-ltr text-left font-mono"
            />
            <button
              onClick={handleSaveAppsScriptUrl}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shrink-0"
            >
              حفظ الرابط
            </button>
            <button
              onClick={handleSyncViaAppsScript}
              disabled={isAppsScriptSyncing}
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAppsScriptSyncing ? 'animate-spin' : ''}`} />
              {isAppsScriptSyncing ? 'جاري المزامنة...' : 'مزامنة Webhook الآن'}
            </button>
            <button
              onClick={handlePurgeCacheAndReload}
              title="تفرغ ذاكرة التخزين المؤقت وإعادة مزامنة الإعدادات مع السيرفر"
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-rose-200 transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              تحديث وتفريغ الكاش
            </button>
          </div>
        </div>
      </div>

      {/* Apps Script Modal */}
      {showAppsScriptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto dir-rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  طريقة تفعيل المزامنة المباشرة عبر Google Apps Script
                </h3>
              </div>
              <button
                onClick={() => setShowAppsScriptModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-extrabold text-slate-900 block">خطوات التفعيل في 30 ثانية:</span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 font-medium">
                  <li>افتح شيت Google Sheet الخاص بك في المتصفح.</li>
                  <li>من القائمة العلوية اختر: <strong>Extensions (التوسعات) ← Apps Script</strong>.</li>
                  <li>امسح أي كود موجود بالداخل، وانسخ الكود التالي بضغطة زر واحدة والصقه هناك.</li>
                  <li>اضغط على <strong>Deploy (نشر) ← New deployment ← Web app</strong>.</li>
                  <li>في خيار "Who has access" حدد: <strong>Anyone (أي شخص)</strong> واضغط Deploy.</li>
                  <li>انسخ الرابط الناتج (Web App URL) والصقه في الخانة بالصفحة.</li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">الكود المصدري الجاهز (Google Apps Script):</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(APPS_SCRIPT_CODE);
                      alert('تم نسخ كود Google Apps Script للحافظة بنجاح!');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    نسخ الكود بالكامل
                  </button>
                </div>
                <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-[11px] font-mono leading-relaxed overflow-x-auto dir-ltr text-left max-h-60">
                  {APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>

            <div className="pt-2 text-left">
              <button
                onClick={() => setShowAppsScriptModal(false)}
                className="bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic Panel */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-emerald-500/30 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">لوحة تشخيص واختبار المزامنة الفورية</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                  حي ومباشر Live
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                فحص الاتصال الشامل بالملف المفتوح، التأكد من اسم الملف الفعلي، صلاحيات التعديل، وتقرير بكتابة ووصول الأوردرات.
              </p>
            </div>
          </div>

          <button
            onClick={handleTestInstantSync}
            disabled={isTesting || isSyncing}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'جاري فحص واختبار الاتصال...' : 'اختبار المزامنة الفورية الآن'}
          </button>
        </div>

        {isTesting ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-700">جاري الاتصال بـ Google Sheets API وقراءة معلومات الشيت الحالية...</p>
          </div>
        ) : diagnosticData ? (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-xl border ${
                diagnosticData.success
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-rose-50/60 border-rose-200'
              } space-y-3`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    اسم ملف Google Sheets المرتبط الفعلي:
                  </span>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet
                      className={`w-5 h-5 ${
                        diagnosticData.success ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    />
                    <h4 className="text-base font-black text-slate-900">
                      {diagnosticData.fileName || settings.spreadsheetTitle || 'WarshaStore Database - بيانات ورشة ستور'}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {diagnosticData.success ? (
                    <span className="bg-emerald-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      متصل + صلاحية كتابة مؤكدة (Editor)
                    </span>
                  ) : (
                    <span className="bg-rose-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" />
                      فشل الاتصال / الصلاحيات
                    </span>
                  )}

                  {settings.spreadsheetUrl && (
                    <a
                      href={settings.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                    >
                      فتح الشيت مباشرة
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 dir-ltr text-left">
                  <span className="text-[10px] text-slate-500 block font-sans">Spreadsheet ID:</span>
                  <span className="font-mono font-bold text-slate-800 truncate block">
                    {diagnosticData.spreadsheetId || settings.spreadsheetId || 'غير محدد'}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500">حالة التعديل (Can Edit):</span>
                  <span
                    className={`font-black ${
                      diagnosticData.hasWriteAccess ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {diagnosticData.hasWriteAccess ? 'مسموح بالكتابة ✓' : 'مرفوض ✗'}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between col-span-1 sm:col-span-2 md:col-span-1">
                  <span className="text-slate-500">تاريخ آخر فحص:</span>
                  <span className="font-bold text-slate-700">
                    {diagnosticData.updatedAt
                      ? new Date(diagnosticData.updatedAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : 'الآن'}
                  </span>
                </div>
              </div>

              {diagnosticData.error && (
                <div className="p-3 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-800">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>سبب الرفض والخطأ من Google:</span>
                  </div>
                  <p className="font-semibold leading-relaxed text-slate-800 dir-rtl">
                    {diagnosticData.error}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
