import React, { useState } from 'react';
import { Product } from '../types';
import { formatCurrency } from '../utils/calculations';
import { BulkImportModal } from './BulkImportModal';
import {
  PackageCheck,
  Plus,
  Search,
  Scale,
  Boxes,
  Edit2,
  Trash2,
  AlertTriangle,
  Users,
  FileSpreadsheet,
  ShoppingBag,
  Sparkles,
  MapPin,
  Palette,
  DollarSign,
  Layers,
  X,
  Image,
  Eye,
} from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  lowStockThreshold?: number;
  onOpenNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onImportBulkProducts?: (newProducts: Product[]) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  lowStockThreshold = 10,
  onOpenNewProduct,
  onEditProduct,
  onDeleteProduct,
  onUpdateStock,
  onImportBulkProducts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.manufacturerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.color && p.color.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.governorate && p.governorate.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.manufacturerCode && p.manufacturerCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Summary Metrics Calculations
  const totalAvailableUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalModelsCount = products.length;
  const totalManufacturerDuesInStock = products.reduce(
    (sum, p) => sum + (p.stock || 0) * (p.workmanshipCost || 0),
    0
  );
  const totalPotentialSalesValue = products.reduce(
    (sum, p) => sum + (p.stock || 0) * (p.salePrice || 0),
    0
  );

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Main Banner & Header */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                المخزون والورش
              </span>
              <span className="text-slate-400 text-xs">| {totalModelsCount} قطعة وموديل</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              مركز إدارة المنتجات والمخزون التفصيلي
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              سجل تفصيلي لجميع القطع المسجلة بالمخزون، الربط بالمصنّعات اليدوية، ومستحقات كل قطعة.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
            <button
              onClick={() => setIsBulkImportOpen(true)}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl transition-all shadow-md active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              استيراد من Excel
            </button>

            <button
              onClick={onOpenNewProduct}
              className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm px-5 py-3 rounded-2xl transition-all shadow-lg shadow-amber-500/25"
            >
              <Plus className="w-4 h-4" />
              إضافة قطعة جديدة
            </button>
          </div>
        </div>
      </div>

      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-900 rounded-2xl shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-bold block">إجمالي القطع بالمخزون</span>
            <strong className="text-xl font-black text-slate-900">{totalAvailableUnits} قطعة</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-bold block">عدد الأكواد والموديلات</span>
            <strong className="text-xl font-black text-slate-900">{totalModelsCount} كود</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-900 rounded-2xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-bold block">مستحقات المصنّعات بالمخزون العام</span>
            <strong className="text-base font-extrabold text-purple-900 block">
              0 ج.م
            </strong>
            <span className="text-[10px] text-slate-400 font-bold block">تُحسب وتستحق فقط عند البيع والتسليم</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-900 rounded-2xl shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-bold block">إجمالي قيمة البيع المقدرة</span>
            <strong className="text-lg font-extrabold text-emerald-900">
              {formatCurrency(totalPotentialSalesValue)}
            </strong>
          </div>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute right-4 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث سريع بكود القطعة (A001), اسم المصنعة (نسمه سمير), كود الورشة (MF001), أو اللون..."
          className="w-full pr-12 pl-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 shadow-xs transition-all"
        />
      </div>

      {/* Main Detailed Inventory Table (Inventory Hub) */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <Boxes className="w-14 h-14 text-slate-300 mx-auto mb-3" />
          <h3 className="text-slate-800 font-extrabold text-lg">لا توجد قطع مسجلة تفي بالبحث</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
            اضغط على زر "إضافة قطعة جديدة" لإدخال أول كود ورابطه بالورشة والمصنعة.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900 text-white font-extrabold border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-center w-16">صورة المنتج</th>
                  <th className="p-4">كود القطعة</th>
                  <th className="p-4">اسم المنتج والموديل</th>
                  <th className="p-4">المصنعة اليدوية</th>
                  <th className="p-4">اللون والوزن</th>
                  <th className="p-4">سعر البيع</th>
                  <th className="p-4 text-purple-300">مستحق المصنعة</th>
                  <th className="p-4">الحالة / المخزون</th>
                  <th className="p-4 text-center">إجراءات سريعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {filteredProducts.map((p, idx) => {
                  const isLowStock = p.stock <= lowStockThreshold;
                  const isOutOfStock = p.stock === 0;

                  return (
                    <tr
                      key={`${p.id}-${idx}`}
                      className="hover:bg-amber-50/40 transition-colors group"
                    >
                      {/* Column 1: صورة المنتج */}
                      <td className="p-3 text-center">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            onClick={() => setSelectedImage(p.imageUrl || null)}
                            className="w-12 h-12 mx-auto object-cover rounded-2xl border-2 border-amber-300 shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-all"
                            title="انقر لتكبير صورة المنتج"
                          />
                        ) : (
                          <div className="w-11 h-11 mx-auto bg-amber-100 border border-amber-200/80 rounded-2xl flex items-center justify-center text-amber-900 font-black text-sm shadow-2xs group-hover:bg-amber-200 transition-colors">
                            <ShoppingBag className="w-5 h-5 text-amber-800" />
                          </div>
                        )}
                      </td>

                      {/* Column 2: كود القطعة (Yellow Badge) */}
                      <td className="p-4">
                        <span className="bg-amber-400 text-slate-950 font-mono font-black text-xs px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs inline-block">
                          {p.id}
                        </span>
                      </td>

                      {/* Column 3: اسم المنتج والموديل */}
                      <td className="p-4">
                        <span className="font-black text-sm text-slate-900 block">
                          {p.name}
                        </span>
                      </td>

                      {/* Column 4: المصنعة اليدوية */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-slate-900">
                              {p.manufacturerName}
                            </span>
                            {p.manufacturerCode && (
                              <span className="bg-slate-200 text-slate-700 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border border-slate-300">
                                {p.manufacturerCode}
                              </span>
                            )}
                          </div>
                          {p.governorate && (
                            <span className="text-[11px] text-slate-500 font-medium block flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 inline" />
                              {p.governorate}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 5: اللون والوزن (Stacked) */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-500 font-bold">اللون:</span>
                            <span className="font-extrabold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                              {p.color || 'غير محدد'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-500 font-bold">الوزن:</span>
                            <span className="font-bold text-xs text-slate-700">
                              {p.rawMaterialWeightKg
                                ? `${Math.round(p.rawMaterialWeightKg * 1000)} جم (${p.rawMaterialWeightKg} كجم)`
                                : 'غير محدد'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 6: سعر البيع */}
                      <td className="p-4">
                        <span className="font-black text-sm text-slate-900 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl inline-block">
                          {formatCurrency(p.salePrice)}
                        </span>
                      </td>

                      {/* Column 7: مستحق المصنعة (Simplified) */}
                      <td className="p-4">
                        <span className="font-bold text-xs text-purple-900 bg-purple-50 border border-purple-200/80 px-2.5 py-1 rounded-xl inline-block">
                          {p.workmanshipCost && p.workmanshipCost > 0
                            ? formatCurrency(p.workmanshipCost)
                            : '0 ج.م (تحدد عند البيع)'}
                        </span>
                      </td>

                      {/* Column 8: الحالة الملونة / المخزون */}
                      <td className="p-4">
                        {(() => {
                          const displayStatus = p.status || (isOutOfStock ? 'مباع' : 'متاح');
                          if (displayStatus === 'مباع' || isOutOfStock) {
                            return (
                              <span className="bg-rose-100 text-rose-800 border border-rose-300 font-black px-3 py-1.5 rounded-full text-xs inline-flex items-center gap-1 shadow-2xs">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                🔴 مباع / نفد ({p.stock})
                              </span>
                            );
                          }
                          if (displayStatus === 'محجوز') {
                            return (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 font-black px-3 py-1.5 rounded-full text-xs inline-flex items-center gap-1 shadow-2xs">
                                🟠 محجوز ({p.stock})
                              </span>
                            );
                          }
                          return (
                            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-black px-3 py-1.5 rounded-full text-xs inline-flex items-center gap-1 shadow-2xs">
                              🟢 متاح ({p.stock})
                            </span>
                          );
                        })()}
                      </td>

                      {/* Column 9: أزرار الإجراءات السريعة */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Stock Quick Adjust */}
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              onClick={() => onUpdateStock(p.id, Math.max(0, p.stock - 1))}
                              className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center text-xs font-black shadow-2xs"
                              title="إنقاص القطع 1"
                            >
                              -
                            </button>
                            <span className="font-black text-xs px-1 text-slate-900 min-w-[20px]">
                              {p.stock}
                            </span>
                            <button
                              onClick={() => onUpdateStock(p.id, p.stock + 1)}
                              className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center text-xs font-black shadow-2xs"
                              title="زيادة القطع 1"
                            >
                              +
                            </button>
                          </div>

                          {/* Edit Button */}
                          <button
                            onClick={() => onEditProduct(p)}
                            className="p-2 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 rounded-xl transition-all"
                            title="تعديل بيانات المنتج"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 border border-slate-200 rounded-xl transition-all"
                            title="حذف القطعة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImportProducts={(imported) => {
          if (onImportBulkProducts) {
            onImportBulkProducts(imported);
          }
        }}
      />

      {/* Image Preview Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-700 p-2 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center"
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 left-3 bg-slate-800/80 hover:bg-rose-600 text-white p-2 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImage}
              alt="معاينة صورة المنتج"
              className="w-full h-auto max-h-[75vh] object-contain rounded-2xl"
            />
            <div className="p-3 text-center text-xs font-bold text-amber-300">
              معاينة مكبرة لصورة المنتج
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

