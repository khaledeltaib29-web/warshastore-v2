import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Archive,
  Download,
  Upload,
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
  RefreshCw,
  Info,
  Clock,
  Database,
  Lock,
} from 'lucide-react';
import {
  AppUser,
  Order,
  Product,
  Manufacturer,
  Expense,
  ManufacturerPayment,
  StoreSettings,
  SystemNotification,
  ScheduledReminder,
  Announcement,
  AuditLog,
  PendingApprovalRequest,
  ActiveUserSession,
} from '../types';

export interface FullBackupData {
  version: string;
  exportedAt: string;
  exportedBy: string;
  orders: Order[];
  products: Product[];
  manufacturers: Manufacturer[];
  expenses: Expense[];
  payments: ManufacturerPayment[];
  settings: StoreSettings;
  notifications: SystemNotification[];
  reminders: ScheduledReminder[];
  users: AppUser[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  pendingApprovals: PendingApprovalRequest[];
  activeSessions: ActiveUserSession[];
  expenseCategories?: string[];
}

interface FullBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AppUser;
  // Current app state to export
  appState: FullBackupData;
  // Handler when user confirms backup import
  onRestoreBackup: (restoredData: FullBackupData) => void;
}

export const FullBackupModal: React.FC<FullBackupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  appState,
  onRestoreBackup,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isExporting, setIsExporting] = useState(false);
  const [importedBackupData, setImportedBackupData] = useState<FullBackupData | null>(null);
  const [importedFileName, setImportedFileName] = useState('');
  const [importError, setImportError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState('');

  if (!isOpen) return null;

  const isSuperAdmin = currentUser?.role === 'super_admin';

  // 1. Export ZIP Backup
  const handleExportZipBackup = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `warshastore_full_backup_${timestamp.split('T')[0]}.zip`;

      const backupContent: FullBackupData = {
        ...appState,
        version: '2.5.0',
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser?.name || 'المدير العام',
      };

      const jsonStr = JSON.stringify(backupContent, null, 2);

      const manifestContent = {
        app: 'WarshaStore ERP',
        version: '2.5.0',
        exportedAt: new Date().toLocaleString('ar-EG'),
        exportedBy: currentUser?.name || 'المدير العام',
        counts: {
          orders: appState.orders.length,
          products: appState.products.length,
          manufacturers: appState.manufacturers.length,
          expenses: appState.expenses.length,
          users: appState.users.length,
        },
      };

      // Add files to ZIP
      zip.file('warshastore_database.json', jsonStr);
      zip.file('MANIFEST.json', JSON.stringify(manifestContent, null, 2));
      zip.file(
        'README.txt',
        `==================================================\n` +
          `ملف النسخة الاحتياطية الشاملة - WarshaStore ERP\n` +
          `تاريخ التصدير: ${new Date().toLocaleString('ar-EG')}\n` +
          `المستخدم: ${currentUser?.name || 'المدير العام'}\n` +
          `==================================================\n\n` +
          `تنبيه: يحتوي هذا الملف على كافة بيانات الأوردرات، الورش، المنتجات،\n` +
          `المصروفات، والحسابات. احتفظ به في مكان آمن لاستعادة النظام عند الحاجة.\n`
      );

      const blob = await zip.generateAsync({ type: 'blob' });

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('حدث خطأ أثناء إنشاء ملف ZIP: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Read Uploaded File (ZIP or JSON)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportedBackupData(null);
    setRestoreSuccessMsg('');

    const file = e.target.files?.[0];
    if (!file) return;

    setImportedFileName(file.name);

    try {
      if (file.name.endsWith('.zip')) {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);

        const dbFile = zipContent.file('warshastore_database.json');
        if (!dbFile) {
          setImportError('الملف المضغوط ZIP لا يحتوي على warshastore_database.json الصحيح.');
          return;
        }

        const jsonText = await dbFile.async('string');
        const parsed: FullBackupData = JSON.parse(jsonText);
        validateAndSetBackupData(parsed);
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        const parsed: FullBackupData = JSON.parse(text);
        validateAndSetBackupData(parsed);
      } else {
        setImportError('صيغة الملف غير مدعومة. يرجى اختيار ملف ZIP أو JSON فقط.');
      }
    } catch (err: any) {
      setImportError('فشل تحليل بيانات الملف المرفوع. تأكد من سلامة ملف النسخة الاحتياطية.');
    }
  };

  const validateAndSetBackupData = (data: any) => {
    if (!data || typeof data !== 'object') {
      setImportError('ملف النسخة الاحتياطية تالف أو يحتوي على بنية غير صالحة.');
      return;
    }

    if (!Array.isArray(data.orders) && !Array.isArray(data.products)) {
      setImportError('الملف لا يحتوي على جداول البيانات الأساسية للنظام (أوردرات / منتجات).');
      return;
    }

    setImportedBackupData(data);
  };

  // 3. Confirm and Apply Restore
  const handleExecuteRestore = () => {
    if (!importedBackupData) return;
    setIsRestoring(true);

    try {
      onRestoreBackup(importedBackupData);
      setRestoreSuccessMsg('تمت استعادة كافة بيانات النظام والنسخة الاحتياطية بنجاح!');
      setShowConfirmModal(false);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setImportError('حدث خطأ أثناء كتابة واستعادة البيانات: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">النسخ الاحتياطي الشامل واستعادة النظام (ZIP)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تصدير واستيراد كافة بيانات وقواعد بيانات WarshaStore بأمان تام
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Access Check */}
        {!isSuperAdmin ? (
          <div className="p-8 text-center space-y-3">
            <Lock className="w-12 h-12 text-rose-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">خاص بالمدير العام فقط</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              إجراءات النسخ الاحتياطي الشامل واستعادة قاعدة البيانات متاحة حصرياً لحساب المدير العام.
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setActiveTab('export')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  activeTab === 'export'
                    ? 'bg-slate-900 text-amber-400 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Download className="w-4 h-4" />
                تحميل نسخة احتياطية (Export ZIP)
              </button>

              <button
                onClick={() => setActiveTab('import')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  activeTab === 'import'
                    ? 'bg-slate-900 text-amber-400 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Upload className="w-4 h-4" />
                استيراد واستعادة النظام (Import Backup)
              </button>
            </div>

            {restoreSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in zoom-in-95">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{restoreSuccessMsg}</span>
              </div>
            )}

            {/* TAB 1: EXPORT */}
            {activeTab === 'export' && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                    <Database className="w-4 h-4 text-amber-600" />
                    <span>محتويات النسخة الاحتياطية الحالية:</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold">
                      📦 الأوردرات: <strong className="text-slate-900">{appState.orders.length}</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold">
                      🏷️ المنتجات: <strong className="text-slate-900">{appState.products.length}</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold">
                      🏭 الورش: <strong className="text-slate-900">{appState.manufacturers.length}</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold">
                      💸 المصروفات: <strong className="text-slate-900">{appState.expenses.length}</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold">
                      👥 المستخدمين: <strong className="text-slate-900">{appState.users.length}</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold">
                      📝 السجلات: <strong className="text-slate-900">{appState.auditLogs.length}</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">
                    سيتم توليد أرشيف مضغوط مضغوط (ZIP) يحتوي على ملف القواعد البيانات الشاملة (`warshastore_database.json`) مع ملخص للمانيفست ودليل التشغيل.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportZipBackup}
                  disabled={isExporting}
                  className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 active:scale-98 text-white font-black text-sm rounded-2xl transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-2"
                >
                  <Download className={`w-5 h-5 ${isExporting ? 'animate-bounce' : ''}`} />
                  {isExporting ? 'جاري تجهيز وتنزيل ZIP...' : 'تحميل نسخة احتياطية كاملة (ZIP)'}
                </button>
              </div>
            )}

            {/* TAB 2: IMPORT */}
            {activeTab === 'import' && (
              <div className="space-y-4">
                <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-amber-50/30 transition-all">
                  <Upload className="w-10 h-10 text-amber-600 mb-2" />
                  <span className="text-sm font-black text-slate-900">اضغط هنا لاختيار ملف النسخة الاحتياطية (ZIP / JSON)</span>
                  <span className="text-xs text-slate-400 mt-1">يدعم ملفات `.zip` أو `.json` الصادرة من النظام</span>

                  {importedFileName && (
                    <span className="mt-3 bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1 rounded-full border border-emerald-200">
                      تم اختيار: {importedFileName}
                    </span>
                  )}

                  <input
                    type="file"
                    accept=".zip, .json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>

                {importError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    {importError}
                  </div>
                )}

                {importedBackupData && (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        تم فحص النسخة بنجاح وهي صالحة للاستعادة!
                      </span>
                      {importedBackupData.exportedAt && (
                        <span className="text-slate-500 text-[11px] font-mono">
                          تاريخ التصدير: {new Date(importedBackupData.exportedAt).toLocaleDateString('ar-EG')}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                      <div className="bg-white p-2 rounded-xl border border-emerald-200 text-slate-700 text-center">
                        أوردرات: {importedBackupData.orders?.length || 0}
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-emerald-200 text-slate-700 text-center">
                        منتجات: {importedBackupData.products?.length || 0}
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-emerald-200 text-slate-700 text-center">
                        ورش: {importedBackupData.manufacturers?.length || 0}
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-emerald-200 text-slate-700 text-center">
                        مصروفات: {importedBackupData.expenses?.length || 0}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      استعادة واستبدال بيانات النظام الآن
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            حماية كاملة واستعادة آمنة 100%
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* WARNING CONFIRMATION MODAL BEFORE RESTORING */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border-2 border-rose-500 space-y-5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center border border-rose-200 animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-black text-lg text-slate-900">
                تحذير هام ومطلوب موافقة المدير العام!
              </h3>
              <p className="text-xs text-rose-700 font-extrabold bg-rose-50 p-3 rounded-2xl border border-rose-200">
                "تحذير: سيتم استبدال/تحديث البيانات الحالية بالنسخة المستوردة، هل أنت متأكد؟"
              </p>
              <p className="text-xs text-slate-500 leading-relaxed pt-1">
                سيتم استبدال كافة الأوردرات، الورش، والمنتجات الحالية بالبيانات الموجودة في هذا الملف. نوصي بتنزيل نسخة احتياطية من الوضع الحالي أولاً.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                إلغاء الأمر
              </button>

              <button
                type="button"
                disabled={isRestoring}
                onClick={handleExecuteRestore}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isRestoring ? 'جاري الاستعادة...' : 'تأكيد واستعادة البيانات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
