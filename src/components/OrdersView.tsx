import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { formatCurrency } from '../utils/calculations';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Phone,
  MapPin,
  Calendar,
  User,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  ChevronDown,
  DollarSign,
  Tag,
} from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  onOpenNewOrder: () => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onOpenNewOrder,
  onEditOrder,
  onDeleteOrder,
  onUpdateStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('الكل');

  const statusOptions: OrderStatus[] = ['جديد', 'قيد التنفيذ', 'تم الشحن', 'تم التسليم', 'ملغي'];

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === 'الكل' || order.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Header & Mobile Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-amber-600" />
            إدارة الأوردرات ({orders.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            عرض وتتبع أوردرات العملاء والتكاليف والأرباح التلقائية.
          </p>
        </div>

        <button
          onClick={onOpenNewOrder}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm px-4 py-3 sm:py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20"
        >
          <Plus className="w-5 h-5" />
          إضافة أوردر جديد
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالعميل، الرقم، أو باسم المنتج..."
            className="w-full pr-11 pl-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
          />
        </div>

        {/* Status Filter Tabs (Scrollable on Mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedStatus('الكل')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedStatus === 'الكل'
                ? 'bg-slate-900 text-amber-400 shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            الكل ({orders.length})
          </button>
          {statusOptions.map((st) => {
            const count = orders.filter((o) => o.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedStatus === st
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{st}</span>
                <span className="opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List (Mobile Cards Layout) */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-bold text-base">لا توجد أوردرات مطابقة للبحث</p>
          <p className="text-slate-400 text-xs mt-1">جرب تغيير حالة الفلتر أو إضافة أوردر جديد.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, idx) => (
            <div
              key={`${order.id}-${idx}`}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Order Card Header */}
              <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg">
                    {order.id}
                  </span>
                  <span className="text-xs text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {order.date}
                  </span>
                </div>

                {/* Status Selector Dropdown */}
                <div className="flex items-center gap-2">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      onUpdateStatus(order.id, e.target.value as OrderStatus)
                    }
                    className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border focus:outline-none cursor-pointer ${
                      order.status === 'تم التسليم'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : order.status === 'جديد'
                        ? 'bg-amber-950 text-amber-300 border-amber-700'
                        : order.status === 'قيد التنفيذ'
                        ? 'bg-blue-950 text-blue-300 border-blue-700'
                        : order.status === 'تم الشحن'
                        ? 'bg-purple-950 text-purple-300 border-purple-700'
                        : 'bg-rose-950 text-rose-300 border-rose-700'
                    }`}
                  >
                    {statusOptions.map((st) => (
                      <option key={st} value={st} className="bg-slate-900 text-white">
                        {st}
                      </option>
                    ))}
                  </select>

                  {/* Edit / Delete Buttons */}
                  <button
                    onClick={() => onEditOrder(order)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="تعديل الأوردر"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteOrder(order.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/80 text-rose-300 hover:text-rose-200 transition-colors"
                    title="حذف الأوردر"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Order Body Details */}
              <div className="p-4 sm:p-5 space-y-4">
                {/* Customer & Delivery Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block mb-0.5">اسم العميل:</span>
                    <strong className="text-slate-900 text-sm font-bold flex items-center gap-1">
                      <User className="w-4 h-4 text-amber-600" />
                      {order.customerName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-0.5">الهاتف:</span>
                    <a
                      href={`tel:${order.phone}`}
                      className="text-amber-700 font-bold flex items-center gap-1 hover:underline dir-ltr text-right"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {order.phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-0.5">عنوان التسليم:</span>
                    <span className="text-slate-700 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {order.address}
                    </span>
                  </div>
                </div>

                {/* Item Details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-medium block">تفاصيل المنتجات والورش:</span>
                    {order.items && order.items.length > 0 ? (
                      <div className="space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex flex-wrap items-center gap-1.5 text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <span className="font-extrabold text-slate-900 text-sm">{item.productName}</span>
                            <span className="font-mono text-[11px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                              {item.productId}
                            </span>
                            <span className="text-[11px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md font-bold">
                              الكمية: {item.quantity} | السعر: {formatCurrency(item.salePrice)}
                            </span>
                            <span className="text-[11px] text-slate-600 font-bold">
                              (ورشة: {item.manufacturerName})
                            </span>
                            {item.color && (
                              <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                                {item.color}
                              </span>
                            )}
                            {item.governorate && (
                              <span className="text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-bold">
                                📍 {item.governorate}
                              </span>
                            )}
                            {item.weightKg && (
                              <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                                ⚖️ {Math.round(item.weightKg * 1000)}جم
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-base">
                          {order.productName}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                          الكمية: {order.quantity} قطع
                        </span>
                        <span className="text-xs text-slate-500">
                          (ورشة: {order.manufacturerName})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-right bg-amber-50/60 border border-amber-200/60 p-2.5 rounded-xl min-w-[140px] shrink-0">
                    <span className="text-[11px] text-amber-800 font-bold block">إجمالي المنتجات</span>
                    <span className="text-lg font-black text-amber-900">
                      {formatCurrency(order.totalSale)}
                    </span>
                    {(order.discount || 0) > 0 && (
                      <span className="text-[11px] text-amber-700 block font-semibold">
                        خصم: -{formatCurrency(order.discount!)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Financial Breakdown Grid (Company share, Manufacturer share, Shipping, Paid, Profit & Surplus) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-b border-slate-100 pb-1.5">
                    <span className="flex items-center gap-1">
                      <span>طريقة التوزيع:</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md text-[10px] font-black">
                        {order.splitMode === 'percentage'
                          ? `نسبة مئوية (${order.companyPercent ?? 40}% شركة / ${order.manufacturerPercent ?? 60}% مصنعة)`
                          : order.splitMode === 'fixed'
                          ? 'مبلغ ثابت للشركة'
                          : 'إدخال يدوي'}
                      </span>
                    </span>
                    <span className="text-slate-400">
                      المطلوب الكلي: {formatCurrency(order.totalAmountDue || (order.totalSale + order.shippingCost))}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                      <span className="text-blue-700 block text-[11px] font-bold">مستحق الشركة</span>
                      <strong className="text-blue-900 font-extrabold text-sm">
                        {formatCurrency(order.companyShare ?? Math.round(order.totalSale * 0.4))}
                      </strong>
                    </div>

                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                      <span className="text-amber-700 block text-[11px] font-bold">مستحق المصنعة</span>
                      <strong className="text-amber-900 font-extrabold text-sm">
                        {formatCurrency(order.manufacturerShare ?? Math.round(order.totalSale * 0.6))}
                      </strong>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-slate-500 block text-[11px]">الشحن</span>
                      <strong className="text-slate-800 font-bold text-sm">
                        {formatCurrency(order.shippingCost)}
                      </strong>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-slate-500 block text-[11px]">مدفوع العميل</span>
                      <strong className="text-slate-900 font-extrabold text-sm">
                        {formatCurrency(order.paidAmount)}
                      </strong>
                    </div>

                    <div className="col-span-2 sm:col-span-1 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-emerald-800 font-bold block text-[11px]">ربح الشركة الصافي</span>
                      <strong className="text-emerald-700 font-black text-base">
                        {formatCurrency(order.profit)}
                      </strong>
                    </div>
                  </div>

                  {/* Overpayment Surplus Banner */}
                  {(order.surplusProfit || 0) > 0 && (
                    <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-100/70 border border-emerald-300 rounded-xl text-emerald-900 text-xs">
                      <span className="font-extrabold flex items-center gap-1">
                        ✨ فرق الربح / الزيادة المضافة للشركة:
                      </span>
                      <strong className="font-black text-emerald-800">
                        +{formatCurrency(order.surplusProfit)}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
