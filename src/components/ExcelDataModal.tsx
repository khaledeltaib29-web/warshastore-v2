import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  PackageCheck,
  Package,
  ShoppingCart,
  Factory,
  RefreshCw,
} from 'lucide-react';
import { Product, Order, Manufacturer, AppUser } from '../types';

interface ExcelDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: Order[];
  manufacturers: Manufacturer[];
  onImportProducts: (newProducts: Product[], updateExisting: boolean) => void;
  onImportOrders?: (newOrders: Order[], updateExisting: boolean) => void;
  onImportManufacturers?: (newManufacturers: Manufacturer[], updateExisting: boolean) => void;
  currentUser?: AppUser;
}

export const ExcelDataModal: React.FC<ExcelDataModalProps> = ({
  isOpen,
  onClose,
  products,
  orders,
  manufacturers,
  onImportProducts,
  onImportOrders,
  onImportManufacturers,
  currentUser,
}) => {
  const canExportExcel = currentUser?.role === 'super_admin' || currentUser?.role === 'deputy_admin';
  const [activeEntity, setActiveEntity] = useState<'products' | 'orders' | 'manufacturers'>('products');
  const [activeMode, setActiveMode] = useState<'export' | 'import'>(canExportExcel ? 'export' : 'import');
  const [updateExisting, setUpdateExisting] = useState(true);

  // Import state
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const [previewOrders, setPreviewOrders] = useState<Order[]>([]);
  const [previewManufacturers, setPreviewManufacturers] = useState<Manufacturer[]>([]);

  if (!isOpen) return null;

  // Helper to ensure cell values don't exceed Excel limit
  const safeCell = (val: any) => {
    if (typeof val !== 'string') return val;
    if (val.startsWith('data:image/')) return '[صورة مرفقة Base64]';
    if (val.length > 32000) return val.substring(0, 31950) + '... [مختصر]';
    return val;
  };

  const sanitizeRows = <T extends Record<string, any>>(rows: T[]): T[] => {
    return rows.map((row) => {
      const sanitized: Record<string, any> = {};
      for (const [k, v] of Object.entries(row)) {
        sanitized[k] = safeCell(v);
      }
      return sanitized as T;
    });
  };

  // --- EXPORT HANDLERS ---
  const handleExportProductsXlsx = () => {
    const data = products.map((p) => ({
      'الكود': p.id,
      'اسم المنتج': p.name,
      'الورشة المصنعة': p.manufacturerName,
      'وزن الخامة (كجم)': p.rawMaterialWeightKg,
      'سعر كيلو الخامة': p.rawMaterialPricePerKg,
      'تكلفة الخامة (ج.م)': p.rawMaterialCost,
      'تكلفة المصنعية (ج.م)': p.workmanshipCost,
      'إجمالي التكلفة (ج.م)': p.totalCost,
      'سعر البيع (ج.م)': p.salePrice,
      'ربح القطعة (ج.م)': p.unitProfit,
      'المخزون الحالي': p.stock,
    }));

    const ws = XLSX.utils.json_to_sheet(sanitizeRows(data));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المنتجات');
    XLSX.writeFile(wb, `منتجات_WarshaStore_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportOrdersXlsx = () => {
    let safeOrders = orders;
    if ((!safeOrders || safeOrders.length === 0) && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('warsha_orders');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) safeOrders = parsed;
        }
      } catch (e) {}
    }

    const data = (safeOrders || []).map((o) => ({
      'رقم الأوردر': o.id,
      'اسم العميل': o.customerName,
      'رقم الهاتف': o.phone,
      'العنوان التفصيلي': o.address,
      'إجمالي المبيعات (ج.م)': o.totalSale,
      'المبلغ المدفوع (ج.م)': o.paidAmount,
      'الحالة': o.status,
      'تاريخ الطلب': o.date,
      'عدد الأصناف': o.items?.length || 0,
      'المنتجات والكميات': o.items
        ?.map((i) => `${i.productName} (${i.quantity} قطعة)`)
        .join(' + ') || '',
    }));

    const ws = XLSX.utils.json_to_sheet(sanitizeRows(data));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الأوردرات');
    XLSX.writeFile(wb, `أوردرات_WarshaStore_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportManufacturersXlsx = () => {
    const data = manufacturers.map((m) => ({
      'كود الورشة': m.id,
      'اسم الورشة': m.name,
      'رقم الهاتف': m.phone,
      'العنوان': m.address || '',
      'المنتجات التي تصنعها': m.productsList || '',
      'إجمالي المصنعية المستحقة (ج.م)': m.totalWorkmanshipEarned,
      'إجمالي المسدد (ج.م)': m.paidAmount,
      'المتبقي والمديونية (ج.م)': m.remainingBalance,
    }));

    const ws = XLSX.utils.json_to_sheet(sanitizeRows(data));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الورش والمديونيات');
    XLSX.writeFile(wb, `ورش_ومستحقات_WarshaStore_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- IMPORT HANDLERS & COLUMN VALIDATION ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setPreviewProducts([]);
    setPreviewOrders([]);
    setPreviewManufacturers([]);

    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          setErrorMsg('الملف فارغ أو لا يحتوي على صفوف بيانات.');
          return;
        }

        if (activeEntity === 'products') {
          parseProducts(data);
        } else if (activeEntity === 'orders') {
          parseOrders(data);
        } else if (activeEntity === 'manufacturers') {
          parseManufacturers(data);
        }
      } catch (err: any) {
        setErrorMsg('حدث خطأ أثناء قراءة ملف Excel: ' + (err.message || 'صيغة غير صالحة'));
      }
    };

    reader.readAsBinaryString(file);
  };

  const parseProducts = (rows: any[]) => {
    const parsed: Product[] = [];
    rows.forEach((row, index) => {
      const code = String(row['الكود'] || row['كود المنتج'] || row['Code'] || `PROD-${Date.now()}-${index + 1}`).trim();
      const name = String(row['اسم المنتج'] || row['المنتج'] || row['Name'] || '').trim();
      if (!name) return;

      const mName = String(row['الورشة المصنعة'] || row['الورشة'] || 'الورشة الرئيسية').trim();
      const weight = parseFloat(row['وزن الخامة (كجم)'] || row['الوزن'] || '0') || 0;
      const pPerKg = parseFloat(row['سعر كيلو الخامة'] || row['سعر الكيلو'] || '0') || 0;
      const rawCost = Math.round(weight * pPerKg);
      const workCost = parseFloat(row['تكلفة المصنعية (ج.م)'] || row['تكلفة المصنعية'] || '0') || 0;
      const totalCost = rawCost + workCost;
      const salePrice = parseFloat(row['سعر البيع (ج.م)'] || row['سعر البيع'] || '0') || 0;
      const stock = parseInt(row['المخزون الحالي'] || row['المخزون'] || '0', 10) || 0;

      parsed.push({
        id: code,
        name,
        manufacturerName: mName,
        rawMaterialWeightKg: weight,
        rawMaterialPricePerKg: pPerKg,
        rawMaterialCost: rawCost,
        workmanshipCost: workCost,
        totalCost,
        salePrice,
        unitProfit: salePrice - totalCost,
        stock,
      });
    });

    if (parsed.length === 0) {
      setErrorMsg('لم يتم التعرف على أي صفوف منتجات صالحة. يرجى مراجعة عناوين الأعمدة.');
    } else {
      setPreviewProducts(parsed);
    }
  };

  const parseOrders = (rows: any[]) => {
    const parsed: Order[] = [];
    rows.forEach((row, index) => {
      const orderId = String(row['رقم الأوردر'] || row['ID'] || `ORD-${Date.now()}-${index + 1}`).trim();
      const cName = String(row['اسم العميل'] || row['العميل'] || 'عميل نقدي').trim();
      const cPhone = String(row['رقم الهاتف'] || row['الهاتف'] || '').trim();
      const address = String(row['العنوان التفصيلي'] || row['العنوان'] || '').trim();
      const price = parseFloat(row['إجمالي المبيعات (ج.م)'] || row['إجمالي الأوردر (ج.م)'] || row['السعر'] || '0') || 0;
      const paid = parseFloat(row['المبلغ المدفوع (ج.م)'] || row['المدفوع'] || '0') || price;
      const status = (String(row['الحالة'] || 'جديد').trim()) as Order['status'];
      const date = String(row['تاريخ الطلب'] || new Date().toISOString().split('T')[0]).trim();

      parsed.push({
        id: orderId,
        date,
        customerName: cName,
        phone: cPhone,
        address,
        shippingCost: 0,
        paidAmount: paid,
        status,
        totalSale: price,
        totalRawCost: 0,
        totalWorkmanshipCost: 0,
        profit: 0,
        items: [],
      });
    });

    if (parsed.length === 0) {
      setErrorMsg('لم يتم استخراج أوردرات صالحة من الملف.');
    } else {
      setPreviewOrders(parsed);
    }
  };

  const parseManufacturers = (rows: any[]) => {
    const parsed: Manufacturer[] = [];
    rows.forEach((row, index) => {
      const id = String(row['كود الورشة'] || row['ID'] || `M-${Date.now()}-${index + 1}`).trim();
      const name = String(row['اسم الورشة'] || row['الورشة'] || '').trim();
      if (!name) return;

      const phone = String(row['رقم الهاتف'] || '').trim();
      const address = String(row['العنوان'] || '').trim();
      const prodsList = String(row['المنتجات التي تصنعها'] || '').trim();
      const totalDues = parseFloat(row['إجمالي المصنعية المستحقة (ج.م)'] || row['إجمالي الأعمال المسندة (ج.م)'] || '0') || 0;
      const totalPaid = parseFloat(row['إجمالي المسدد (ج.م)'] || '0') || 0;

      parsed.push({
        id,
        name,
        phone,
        address,
        productsList: prodsList,
        completedUnits: 0,
        totalWorkmanshipEarned: totalDues,
        paidAmount: totalPaid,
        remainingBalance: totalDues - totalPaid,
      });
    });

    if (parsed.length === 0) {
      setErrorMsg('لم يتم استخراج بيانات ورش صالحة.');
    } else {
      setPreviewManufacturers(parsed);
    }
  };

  const handleConfirmImport = () => {
    if (activeEntity === 'products' && previewProducts.length > 0) {
      onImportProducts(previewProducts, updateExisting);
    } else if (activeEntity === 'orders' && previewOrders.length > 0 && onImportOrders) {
      onImportOrders(previewOrders, updateExisting);
    } else if (
      activeEntity === 'manufacturers' &&
      previewManufacturers.length > 0 &&
      onImportManufacturers
    ) {
      onImportManufacturers(previewManufacturers, updateExisting);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500 text-slate-950 rounded-2xl font-black">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">تصدير واستيراد ملفات Excel المتقدم</h3>
              <p className="text-xs text-slate-400">
                إدارة ملفات XLSX للمنتجات، الأوردرات، والورش المصنعة والمديونيات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Entity Type Selection */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setActiveEntity('products');
                setErrorMsg('');
              }}
              className={`p-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 border ${
                activeEntity === 'products'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Package className="w-4 h-4" />
              المنتجات ({products.length})
            </button>

            <button
              onClick={() => {
                setActiveEntity('orders');
                setErrorMsg('');
              }}
              className={`p-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 border ${
                activeEntity === 'orders'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              الأوردرات ({orders.length})
            </button>

            <button
              onClick={() => {
                setActiveEntity('manufacturers');
                setErrorMsg('');
              }}
              className={`p-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 border ${
                activeEntity === 'manufacturers'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Factory className="w-4 h-4" />
              الورش ({manufacturers.length})
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            {canExportExcel && (
              <button
                onClick={() => setActiveMode('export')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  activeMode === 'export'
                    ? 'bg-slate-900 text-emerald-400 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Download className="w-4 h-4" />
                تصدير إلى Excel (.xlsx)
              </button>
            )}

            <button
              onClick={() => setActiveMode('import')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeMode === 'import'
                  ? 'bg-slate-900 text-emerald-400 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              استيراد من Excel (.xlsx)
            </button>
          </div>

          {/* MODE 1: EXPORT */}
          {activeMode === 'export' && (
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 text-center">
              <FileSpreadsheet className="w-12 h-12 text-emerald-600 mx-auto" />
              <div>
                <h4 className="font-black text-base text-slate-900">
                  تصدير قائمة {activeEntity === 'products' ? 'المنتجات' : activeEntity === 'orders' ? 'الأوردرات' : 'الورش المصنعة'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  توليد ملف Excel شامل يحتوي على جميع الحقول والحسابات الدقيقة.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  activeEntity === 'products'
                    ? handleExportProductsXlsx
                    : activeEntity === 'orders'
                    ? handleExportOrdersXlsx
                    : handleExportManufacturersXlsx
                }
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 mx-auto"
              >
                <Download className="w-4 h-4" />
                تحميل ملف Excel الآن
              </button>
            </div>
          )}

          {/* MODE 2: IMPORT */}
          {activeMode === 'import' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600" />
                  خيارات المعالجة عند وجود بيانات سابقة:
                </span>
                <label className="flex items-center gap-2 font-black text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="accent-amber-600 w-4 h-4 rounded"
                  />
                  <span>تحديث السجلات القائمة إذا تطابق الكود/الرقم</span>
                </label>
              </div>

              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/30 transition-all">
                <Upload className="w-10 h-10 text-emerald-600 mb-2" />
                <span className="text-sm font-black text-slate-900">
                  اختر ملف Excel (.xlsx / .csv) لاستيراد الـ {activeEntity === 'products' ? 'منتجات' : activeEntity === 'orders' ? 'أوردرات' : 'ورش'}
                </span>

                {fileName && (
                  <span className="mt-2 bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1 rounded-full border border-emerald-200">
                    تم اختيار: {fileName}
                  </span>
                )}

                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
              </label>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Preview */}
              {(previewProducts.length > 0 || previewOrders.length > 0 || previewManufacturers.length > 0) && (
                <div className="space-y-2 bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      جاهز للاستيراد ({previewProducts.length || previewOrders.length || previewManufacturers.length}) سجل
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    <PackageCheck className="w-4 h-4" />
                    تأكيد معالجة وحفظ البيانات بالنظام
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
