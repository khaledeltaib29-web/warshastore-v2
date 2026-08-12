import React from 'react';
import { Manufacturer, Order, Product } from '../types';
import { formatCurrency } from '../utils/calculations';
import { X, FileText, Phone, MapPin, Hash, DollarSign, Layers, CheckCircle2, Clock, Printer } from 'lucide-react';

interface ManufacturerStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  manufacturer: Manufacturer | null;
  orders: Order[];
  products: Product[];
  onOpenPaymentModal: (manufacturerName: string) => void;
}

export const ManufacturerStatementModal: React.FC<ManufacturerStatementModalProps> = ({
  isOpen,
  onClose,
  manufacturer,
  orders,
  products,
  onOpenPaymentModal,
}) => {
  if (!isOpen || !manufacturer) return null;

  const mName = manufacturer.name;

  // Filter products for this manufacturer
  const mProducts = products.filter((p) => p.manufacturerName === mName);
  const availableUnits = mProducts.reduce((sum, p) => sum + (p.stock || 0), 0);

  // Filter orders related to this manufacturer
  const mOrders = orders.filter((o) => {
    if (o.status === 'ملغي') return false;
    if (o.items && o.items.length > 0) {
      return o.items.some((item) => item.manufacturerName === mName);
    }
    return o.manufacturerName === mName;
  });

  // Calculate piece status
  let reservedUnits = 0;
  let soldUnits = 0;

  mOrders.forEach((o) => {
    const isDelivered = o.status === 'تم التسليم';
    const isActive = o.status === 'جديد' || o.status === 'قيد التنفيذ' || o.status === 'تم الشحن';

    if (o.items && o.items.length > 0) {
      o.items.forEach((item) => {
        if (item.manufacturerName === mName) {
          if (isDelivered) soldUnits += item.quantity || 0;
          if (isActive) reservedUnits += item.quantity || 0;
        }
      });
    } else if (o.manufacturerName === mName) {
      if (isDelivered) soldUnits += o.quantity || 0;
      if (isActive) reservedUnits += o.quantity || 0;
    }
  });

  const totalUnits = Math.max(
    manufacturer.completedUnits || 0,
    availableUnits + reservedUnits + soldUnits
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md text-[11px] font-black dir-ltr">
                  {manufacturer.code || manufacturer.id}
                </span>
                <h3 className="font-extrabold text-lg sm:text-xl text-white">
                  كشف حساب تفصيلي: {manufacturer.name}
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-300 mt-1">
                <a
                  href={`tel:${manufacturer.phone}`}
                  className="hover:underline flex items-center gap-1 dir-ltr text-right"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {manufacturer.phone}
                </a>
                {manufacturer.address && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    {manufacturer.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              طباعة / تصدير
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
          {/* Summary KPIs Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Financial Dues Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-2xl p-4 border border-slate-800 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  الموقف المالي والمستحقات
                </span>
                <span className="text-[11px] text-slate-400">تحديث أوتوماتيكي</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mt-3">
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-slate-400 block mb-0.5">إجمالي المصنعية</span>
                  <strong className="text-sm sm:text-base font-black text-white">
                    {formatCurrency(manufacturer.totalWorkmanshipEarned)}
                  </strong>
                </div>

                <div className="bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-800/50">
                  <span className="text-[11px] text-emerald-300 block mb-0.5">تم الدفع</span>
                  <strong className="text-sm sm:text-base font-black text-emerald-400">
                    {formatCurrency(manufacturer.paidAmount)}
                  </strong>
                </div>

                <div className="bg-amber-950/80 p-2.5 rounded-xl border border-amber-700/60">
                  <span className="text-[11px] text-amber-300 block mb-0.5">المتبقي للمعلق</span>
                  <strong className="text-sm sm:text-base font-black text-amber-400">
                    {formatCurrency(manufacturer.remainingBalance)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Pieces Breakdown Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Layers className="w-4 h-4 text-purple-600" />
                  حركة وتوزيع القطع بالورشة
                </span>
                <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">
                  الكلي: {totalUnits} قطعة
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mt-3">
                <div className="bg-emerald-50 border border-emerald-200/80 p-2.5 rounded-xl">
                  <span className="text-[11px] text-emerald-700 font-bold block mb-0.5">متاح بالمخزون</span>
                  <strong className="text-base font-black text-emerald-900">{availableUnits}</strong>
                  <span className="text-[10px] text-emerald-600 block">جاهزة للبيع</span>
                </div>

                <div className="bg-amber-50 border border-amber-200/80 p-2.5 rounded-xl">
                  <span className="text-[11px] text-amber-700 font-bold block mb-0.5">محجوز بأوردرات</span>
                  <strong className="text-base font-black text-amber-900">{reservedUnits}</strong>
                  <span className="text-[10px] text-amber-600 block">قيد الشحن والتنفيذ</span>
                </div>

                <div className="bg-blue-50 border border-blue-200/80 p-2.5 rounded-xl">
                  <span className="text-[11px] text-blue-700 font-bold block mb-0.5">مباع ومسلم</span>
                  <strong className="text-base font-black text-blue-900">{soldUnits}</strong>
                  <span className="text-[10px] text-blue-600 block">تم الاستلام</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Orders & Production History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                سجل الأوردرات والمنتجات المنفذة ({mOrders.length})
              </h4>
              <button
                onClick={() => {
                  onClose();
                  onOpenPaymentModal(manufacturer.name);
                }}
                className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1"
              >
                <DollarSign className="w-3.5 h-3.5" />
                صرف دفعة لهذه الورشة
              </button>
            </div>

            {mOrders.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500 font-bold">
                لا توجد أوردرات مسجلة لهذه الورشة حتى الآن.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-white text-[11px]">
                    <tr>
                      <th className="p-3 font-bold">رقم الأوردر</th>
                      <th className="p-3 font-bold">التاريخ</th>
                      <th className="p-3 font-bold">العميل</th>
                      <th className="p-3 font-bold">المنتج / البيان</th>
                      <th className="p-3 font-bold text-center">الكمية</th>
                      <th className="p-3 font-bold">مصنعية القطعة</th>
                      <th className="p-3 font-bold">إجمالي المصنعية</th>
                      <th className="p-3 font-bold text-center">حالة الأوردر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {mOrders.map((o) => {
                      const itemsForM = o.items && o.items.length > 0
                        ? o.items.filter((i) => i.manufacturerName === mName)
                        : [{ productName: o.productName, quantity: o.quantity || 1, workmanshipCostUnit: o.workmanshipCostUnit || 0 }];

                      const totalQty = itemsForM.reduce((sum, i) => sum + (i.quantity || 0), 0);
                      const totalWorkmanship = itemsForM.reduce((sum, i) => sum + ((i.quantity || 0) * (i.workmanshipCostUnit || 0)), 0);

                      return (
                        <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-black text-purple-700">{o.id}</td>
                          <td className="p-3 text-slate-500 dir-ltr text-right">{o.date}</td>
                          <td className="p-3 font-bold text-slate-900">{o.customerName}</td>
                          <td className="p-3">
                            {itemsForM.map((i, idx) => (
                              <div key={idx} className="font-bold text-slate-800">
                                {i.productName}
                              </div>
                            ))}
                          </td>
                          <td className="p-3 text-center font-extrabold text-slate-900">{totalQty} قطعة</td>
                          <td className="p-3 text-slate-700">
                            {formatCurrency(itemsForM[0]?.workmanshipCostUnit || 0)}
                          </td>
                          <td className="p-3 font-black text-amber-800">
                            {formatCurrency(totalWorkmanship || o.totalWorkmanshipCost)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                o.status === 'تم التسليم'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : o.status === 'تم الشحن'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {o.status === 'تم التسليم' ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs px-6 py-2.5 rounded-xl transition-colors"
          >
            إغلاق كشف الحساب
          </button>
        </div>
      </div>
    </div>
  );
};
