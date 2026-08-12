import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Product } from '../types';
import {
  FileSpreadsheet,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  Download,
  Info,
  PackageCheck,
} from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProducts: (newProducts: Product[]) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImportProducts,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');

  if (!isOpen) return null;

  // Helper to parse raw object rows into valid Product items
  const parseRowsToProducts = (rows: any[]) => {
    const parsedList: Product[] = [];

    rows.forEach((row, index) => {
      // Flexibly extract fields from Arabic or English column headers
      const code = String(
        row['الكود'] ||
          row['كود المنتج'] ||
          row['ID'] ||
          row['Code'] ||
          `PROD-${Date.now()}-${index + 1}`
      ).trim();

      const name = String(
        row['اسم المنتج'] || row['اسم القطعة'] || row['المنتج'] || row['Name'] || row['Product'] || ''
      ).trim();

      if (!name) return; // Skip empty rows without name

      const manufacturerName = String(
        row['الورشة المصنعة'] || row['الورشة'] || row['المصنع'] || row['Manufacturer'] || 'الورشة الرئيسية'
      ).trim();

      const weight = parseFloat(
        row['وزن الخامة (كجم)'] ||
          row['وزن الخامة'] ||
          row['الوزن'] ||
          row['Weight'] ||
          row['WeightKg'] ||
          '0'
      ) || 0;

      const pricePerKg = parseFloat(
        row['سعر كيلو الخامة'] ||
          row['سعر الكيلو'] ||
          row['PricePerKg'] ||
          '0'
      ) || 0;

      const rawMaterialCost = Math.round(weight * pricePerKg);

      const workmanshipCost = parseFloat(
        row['تكلفة المصنعية'] ||
          row['المصنعية'] ||
          row['Workmanship'] ||
          '0'
      ) || 0;

      const totalCost = rawMaterialCost + workmanshipCost;

      const salePrice = parseFloat(
        row['سعر البيع'] ||
          row['سعر القطعة'] ||
          row['Price'] ||
          '0'
      ) || 0;

      const unitProfit = salePrice - totalCost;

      const stock = parseInt(
        row['المخزون'] ||
          row['الكمية'] ||
          row['Stock'] ||
          '0',
        10
      ) || 0;

      parsedList.push({
        id: code,
        name,
        manufacturerName,
        rawMaterialWeightKg: weight,
        rawMaterialPricePerKg: pricePerKg,
        rawMaterialCost,
        workmanshipCost,
        totalCost,
        salePrice,
        unitProfit,
        stock,
      });
    });

    return parsedList;
  };

  // Handle Excel/CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
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
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          setErrorMsg('الملف المرفوع فارغ أو يفتقر إلى بيانات المنتجات.');
          return;
        }

        const parsed = parseRowsToProducts(data);
        if (parsed.length === 0) {
          setErrorMsg('تعذر استخراج بيانات منتجات صحيحة. يرجى التأكد من أسماء الأعمدة في الملف.');
        } else {
          setPreviewProducts(parsed);
        }
      } catch (err) {
        setErrorMsg('حدث خطأ أثناء قراءة الملف. يرجى التكاد من بصيغة Excel (.xlsx, .xls) أو CSV.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // Handle Text Paste (Tab-separated copied directly from Excel or Google Sheets)
  const handleParsePastedText = () => {
    setErrorMsg('');
    if (!pasteText.trim()) {
      setErrorMsg('يرجى لصق الجدول أولاً في الحقل المخصص.');
      return;
    }

    try {
      const lines = pasteText.trim().split('\n');
      if (lines.length < 2) {
        setErrorMsg('يجب أن يحتوي النص المنسوخ على صف العناوين الهيدر بالإضافة إلى منتج واحد على الأقل.');
        return;
      }

      // Check if delimiter is tab (\t) or comma (,)
      const delimiter = lines[0].includes('\t') ? '\t' : ',';
      const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));

      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));
        const rowObj: any = {};
        headers.forEach((h, colIdx) => {
          rowObj[h] = values[colIdx] || '';
        });
        rows.push(rowObj);
      }

      const parsed = parseRowsToProducts(rows);
      if (parsed.length === 0) {
        setErrorMsg('لم يتم التعرف على أي منتجات صالحة من النص المنسوخ.');
      } else {
        setPreviewProducts(parsed);
      }
    } catch (err) {
      setErrorMsg('حدث خطأ أثناء تحليل النص المنسوخ.');
    }
  };

  // Download Sample Template file
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'الكود': 'PROD-101',
        'اسم المنتج': 'صينية استيل دائرية 40 سم',
        'الورشة المصنعة': 'ورشة الامل',
        'وزن الخامة (كجم)': 1.2,
        'سعر كيلو الخامة': 250,
        'تكلفة المصنعية': 80,
        'سعر البيع': 500,
        'المخزون': 50,
      },
      {
        'الكود': 'PROD-102',
        'اسم المنتج': 'إبريق استانلس ممتاز 2 ليتر',
        'الورشة المصنعة': 'ورشة السلام',
        'وزن الخامة (كجم)': 0.8,
        'سعر كيلو الخامة': 280,
        'تكلفة المصنعية': 120,
        'سعر البيع': 550,
        'المخزون': 35,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المنتجات');
    XLSX.writeFile(wb, 'نموذج_استيراد_منتجات_WarshaStore.xlsx');
  };

  const handleConfirmImport = () => {
    if (previewProducts.length === 0) return;
    onImportProducts(previewProducts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl font-black">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">الاستيراد الجماعي للمنتجات (Bulk Import)</h3>
              <p className="text-xs text-slate-400">
                رفع قاعدة البيانات من ملف Excel أو CSV وربطها تلقائياً بـ WarshaStore و Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Instructions Banner & Download Sample */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="font-black text-amber-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600" />
                طريقة تحضير الملف لاستيراد الناجح:
              </span>
              <p className="text-amber-800 font-medium leading-relaxed">
                يجب أن يحتوي الملف أو الجدول المنسوخ على الأعمدة التالية: (اسم المنتج، الكود، الورشة المصنعة، وزن الخامة، سعر الكيلو، تكلفة المصنعية، سعر البيع، والمخزون).
              </p>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="shrink-0 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl transition-all flex items-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4" />
              تحميل نموذج Excel الجاهز
            </button>
          </div>

          {/* Import Method Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => {
                setActiveTab('upload');
                setPreviewProducts([]);
                setErrorMsg('');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'upload'
                  ? 'bg-slate-900 text-amber-400 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              رفع ملف Excel / CSV
            </button>

            <button
              onClick={() => {
                setActiveTab('paste');
                setPreviewProducts([]);
                setErrorMsg('');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'paste'
                  ? 'bg-slate-900 text-amber-400 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              لصق مباشر من Excel أو Sheets
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-amber-50/30 transition-all">
                <Upload className="w-10 h-10 text-amber-600 mb-2" />
                <span className="text-sm font-black text-slate-900">اضغط هنا لاختيار ملف Excel أو CSV</span>
                <span className="text-xs text-slate-400 mt-1">يدعم امتدادات .xlsx, .xls, .csv</span>

                {fileName && (
                  <span className="mt-3 bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1 rounded-full border border-emerald-200">
                    تم اختيار: {fileName}
                  </span>
                )}

                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* TAB 2: DIRECT PASTE */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                انسخ الأعمدة والصفوف من Excel ولصقها هنا مباشرةً:
              </label>
              <textarea
                rows={5}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`اسم المنتج\tالكود\tالورشة المصنعة\tوزن الخامة (كجم)\tسعر كيلو الخامة\tتكلفة المصنعية\tسعر البيع\tالمخزون
صينية دائرية 40سم\tPROD-101\tورشة الأمل\t1.2\t250\t80\t500\t50`}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleParsePastedText}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
              >
                تحليل ودراسة النص المنسوخ
              </button>
            </div>
          )}

          {/* PREVIEW TABLE BEFORE IMPORTING */}
          {previewProducts.length > 0 && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  تم التعرف على ({previewProducts.length}) منتج جاهز للاستيراد:
                </h4>
                <span className="text-xs font-bold text-slate-500">معاينة قبل الحفظ النهائي</span>
              </div>

              <div className="overflow-x-auto max-h-60 rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-white font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">الكود</th>
                      <th className="p-2.5">اسم المنتج</th>
                      <th className="p-2.5">الورشة</th>
                      <th className="p-2.5">الوزن (كجم)</th>
                      <th className="p-2.5">تكلفة الخامة</th>
                      <th className="p-2.5">المصنعية</th>
                      <th className="p-2.5">سعر البيع</th>
                      <th className="p-2.5">الربح المقدر</th>
                      <th className="p-2.5">المخزون</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                    {previewProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-amber-700">{p.id}</td>
                        <td className="p-2.5 font-bold text-slate-900">{p.name}</td>
                        <td className="p-2.5">{p.manufacturerName}</td>
                        <td className="p-2.5">{p.rawMaterialWeightKg} كجم</td>
                        <td className="p-2.5 text-slate-700">{p.rawMaterialCost} ج.م</td>
                        <td className="p-2.5 text-purple-700">{p.workmanshipCost} ج.م</td>
                        <td className="p-2.5 font-bold text-slate-900">{p.salePrice} ج.م</td>
                        <td className="p-2.5 text-emerald-700 font-bold">{p.unitProfit} ج.م</td>
                        <td className="p-2.5 font-bold text-slate-900">{p.stock} قطعة</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            إلغاء
          </button>

          <button
            type="button"
            disabled={previewProducts.length === 0}
            onClick={handleConfirmImport}
            className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${
              previewProducts.length > 0
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            تأكيد استيراد ({previewProducts.length}) منتج إلى النظام
          </button>
        </div>
      </div>
    </div>
  );
};
