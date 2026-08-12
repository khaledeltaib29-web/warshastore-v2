import React, { useState } from 'react';
import { Manufacturer, Product, Order, AppUser } from '../types';
import { formatCurrency } from '../utils/calculations';
import {
  Users,
  Plus,
  Phone,
  Package,
  DollarSign,
  CreditCard,
  Edit2,
  Trash2,
  Search,
  MapPin,
  Hash,
  FileText,
  Layers,
  CheckCircle2,
  Clock,
  ShoppingBag,
  RefreshCw,
  Filter,
  ArrowUpDown,
  Coins,
  Wallet,
  Building2,
  Sparkles,
} from 'lucide-react';

interface ManufacturersViewProps {
  manufacturers: Manufacturer[];
  products?: Product[];
  orders?: Order[];
  currentUser?: AppUser;
  onOpenNewManufacturer: () => void;
  onOpenPaymentModal: (manufacturerName?: string) => void;
  onOpenStatementModal?: (manufacturer: Manufacturer) => void;
  onEditManufacturer: (manufacturer: Manufacturer) => void;
  onDeleteManufacturer: (id: string) => void;
  onSyncNow?: () => Promise<void>;
}

export const ManufacturersView: React.FC<ManufacturersViewProps> = ({
  manufacturers,
  products = [],
  orders = [],
  currentUser,
  onOpenNewManufacturer,
  onOpenPaymentModal,
  onOpenStatementModal,
  onEditManufacturer,
  onDeleteManufacturer,
  onSyncNow,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyPendingDues, setOnlyPendingDues] = useState(false);
  const [sortByDues, setSortByDues] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Overall KPIs calculations
  const totalManufacturers = manufacturers.length;
  const totalPaidToAll = manufacturers.reduce((sum, m) => sum + (m.paidAmount || 0), 0);
  const totalRemainingDuesAll = manufacturers.reduce(
    (sum, m) => sum + (m.remainingBalance || 0),
    0
  );

  // Filter & Search logic
  let filtered = manufacturers.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      m.name.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      (m.code && m.code.toLowerCase().includes(q)) ||
      (m.address && m.address.toLowerCase().includes(q)) ||
      m.productsList.toLowerCase().includes(q);

    if (onlyPendingDues) {
      return matchesQuery && (m.remainingBalance || 0) > 0;
    }
    return matchesQuery;
  });

  if (sortByDues) {
    filtered = [...filtered].sort(
      (a, b) => (b.remainingBalance || 0) - (a.remainingBalance || 0)
    );
  }

  // Dynamic computation of piece metrics for a given manufacturer
  const getManufacturerMetrics = (m: Manufacturer) => {
    const mName = m.name;

    // 1. Available stock units in catalog for products belonging to this manufacturer
    const mProducts = products.filter((p) => p.manufacturerName === mName);
    const availableUnits = mProducts.reduce((sum, p) => sum + (p.stock || 0), 0);

    // 2. Active orders ('جديد', 'قيد التنفيذ', 'تم الشحن')
    const activeOrders = orders.filter(
      (o) =>
        o.status === 'جديد' ||
        o.status === 'قيد التنفيذ' ||
        o.status === 'تم الشحن'
    );
    let reservedUnits = 0;
    activeOrders.forEach((o) => {
      if (o.items && o.items.length > 0) {
        o.items.forEach((item) => {
          if (item.manufacturerName === mName) {
            reservedUnits += item.quantity || 0;
          }
        });
      } else if (o.manufacturerName === mName) {
        reservedUnits += o.quantity || 0;
      }
    });

    // 3. Delivered orders ('تم التسليم')
    const deliveredOrders = orders.filter((o) => o.status === 'تم التسليم');
    let soldUnits = 0;
    deliveredOrders.forEach((o) => {
      if (o.items && o.items.length > 0) {
        o.items.forEach((item) => {
          if (item.manufacturerName === mName) {
            soldUnits += item.quantity || 0;
          }
        });
      } else if (o.manufacturerName === mName) {
        soldUnits += o.quantity || 0;
      }
    });

    // Total produced units
    const totalUnits = Math.max(
      m.completedUnits || 0,
      availableUnits + reservedUnits + soldUnits
    );

    return {
      availableUnits,
      reservedUnits,
      soldUnits,
      totalUnits,
    };
  };

  const handleLiveRefresh = async (m: Manufacturer) => {
    setRefreshingId(m.id);
    if (onSyncNow) {
      await onSyncNow();
    } else {
      await new Promise((res) => setTimeout(res, 400));
    }
    setRefreshingId(null);
    setToastMessage(`تم تحديث مؤشرات ومستحقات الورشة (${m.name}) لحظياً!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Toast alert feedback */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-amber-400 font-bold text-xs px-4 py-2.5 rounded-2xl shadow-2xl border border-amber-400/30 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          {toastMessage}
        </div>
      )}

      {/* Top Main Navigation Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold border border-purple-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                إدارة مستحقات الورش والمصنعين
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                متابعة حركة القطع، إجمالي المصنيعّة، الدفعات المسددة، والمستحقات المتبقية للجميع.
              </p>
            </div>
          </div>
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenPaymentModal()}
            className="flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-600 active:scale-95 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shadow-purple-700/20"
          >
            <CreditCard className="w-4 h-4" />
            صرف دفعة مالية
          </button>

          <button
            onClick={onOpenNewManufacturer}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-amber-400 font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            تسجيل مصنعة جديدة
          </button>
        </div>
      </div>

      {/* 1. Top KPI Summary Dashboard Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Verified Manufacturers */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-5 border border-slate-800 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 block">المصنعين المعتمِدين</span>
            <strong className="text-2xl font-black text-white">{totalManufacturers} ورشة</strong>
            <span className="text-[11px] text-emerald-400 block font-semibold">جاهزية للتشغيل</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Previously Disbursed Dues */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 block">المبالغ المصروفة سابقاً</span>
            <strong className="text-2xl font-black text-emerald-700">
              {formatCurrency(totalPaidToAll)}
            </strong>
            <span className="text-[11px] text-slate-400 block font-semibold">إجمالي المسدد للورش</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Remaining Dues Pending */}
        <div className="bg-amber-500 text-slate-950 rounded-3xl p-5 border border-amber-400 shadow-md shadow-amber-500/20 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-900 block">المستحقات المتبقية للجميع</span>
            <strong className="text-2xl font-black text-slate-950 tracking-tight">
              {formatCurrency(totalRemainingDuesAll)}
            </strong>
            <span className="text-[11px] text-slate-900/80 block font-bold">معلق واجب السداد</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-inner">
            <Coins className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم المصنعة، الكود (مثل MF001)، رقم الهاتف، العنوان، أو المنتجات..."
            className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setOnlyPendingDues(!onlyPendingDues)}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
              onlyPendingDues
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            المصنعات اللاتي لهن مستحقات فقط
          </button>

          <button
            onClick={() => setSortByDues(!sortByDues)}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
              sortByDues
                ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-300'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            أعلى مستحق أولاً
          </button>
        </div>
      </div>

      {/* 3. Manufacturer Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-black text-base">لا توجد نتائج مطابقة لمصنعين مسجلين</p>
          <p className="text-slate-400 text-xs mt-1">اضغط على "تسجيل مصنعة جديدة" لإدخال بيانات ورشة خياطة أو تطريز جديدة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((m, idx) => {
            const metrics = getManufacturerMetrics(m);
            const mCode = m.code || m.id;
            const isRefreshing = refreshingId === m.id;

            return (
              <div
                key={`${m.id}-${idx}`}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Header with Code, Name, Phone & Address */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-lg text-xs font-black dir-ltr tracking-wider">
                        {mCode}
                      </span>
                      <h3 className="font-extrabold text-base sm:text-lg text-amber-300">
                        {m.name}
                      </h3>
                      {m.payMethod === 'percentage' && (
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-black px-2 py-0.5 rounded-md">
                          نسبة {m.payValue || 60}%
                        </span>
                      )}
                      {m.payMethod === 'fixed' && (
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black px-2 py-0.5 rounded-md">
                          ثابت {m.payValue || 50} ج.م
                        </span>
                      )}
                      {m.payMethod === 'manual' && (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black px-2 py-0.5 rounded-md">
                          إدخال يدوي
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-300 pt-0.5">
                      <a
                        href={`tel:${m.phone}`}
                        className="hover:underline text-slate-200 font-bold flex items-center gap-1 dir-ltr text-right"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {m.phone}
                      </a>
                      {m.address && (
                        <span className="flex items-center gap-1 text-slate-400 text-[11px] truncate">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          {m.address}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Top Card Controls */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleLiveRefresh(m)}
                      disabled={isRefreshing}
                      title="تحديث لحظي لمستحقات وحركة هذه الورشة"
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">تحديث</span>
                    </button>
                    <button
                      onClick={() => onEditManufacturer(m)}
                      title="تعديل البيانات"
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {currentUser?.role === 'super_admin' && (
                      <button
                        onClick={() => onDeleteManufacturer(m.id)}
                        title="حذف الورشة"
                        className="p-2 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Content Area */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Piece Breakdown Counters */}
                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-purple-600" />
                        عدادات حالة القطع بالورشة
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        محدث لحظياً
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 block mb-0.5">
                          الكلي
                        </span>
                        <strong className="text-sm sm:text-base font-black text-slate-900 block">
                          {metrics.totalUnits}
                        </strong>
                      </div>

                      <div className="bg-emerald-50/80 p-2 rounded-xl border border-emerald-200">
                        <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 block mb-0.5">
                          متاح
                        </span>
                        <strong className="text-sm sm:text-base font-black text-emerald-900 block">
                          {metrics.availableUnits}
                        </strong>
                      </div>

                      <div className="bg-amber-50/80 p-2 rounded-xl border border-amber-200">
                        <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 block mb-0.5">
                          محجوز
                        </span>
                        <strong className="text-sm sm:text-base font-black text-amber-900 block">
                          {metrics.reservedUnits}
                        </strong>
                      </div>

                      <div className="bg-blue-50/80 p-2 rounded-xl border border-blue-200">
                        <span className="text-[10px] sm:text-[11px] font-bold text-blue-800 block mb-0.5">
                          مباع
                        </span>
                        <strong className="text-sm sm:text-base font-black text-blue-900 block">
                          {metrics.soldUnits}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Financial Counters Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-500 block mb-1">
                        إجمالي المستحقات
                      </span>
                      <strong className="text-xs sm:text-sm font-extrabold text-slate-900 block truncate">
                        {formatCurrency(m.totalWorkmanshipEarned)}
                      </strong>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-500 block mb-1">
                        تم دفع لها
                      </span>
                      <strong className="text-xs sm:text-sm font-extrabold text-emerald-700 block truncate">
                        {formatCurrency(m.paidAmount)}
                      </strong>
                    </div>

                    <div className="bg-amber-500 text-slate-950 p-3 rounded-2xl shadow-md shadow-amber-500/20 border border-amber-400">
                      <span className="text-[11px] font-black text-slate-900 block mb-1">
                        المتبقي لها / الصافي
                      </span>
                      <strong className="text-xs sm:text-sm font-black tracking-tight block truncate">
                        {formatCurrency(m.remainingBalance)}
                      </strong>
                    </div>
                  </div>

                  {/* Products Tag Pill */}
                  <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-600 font-bold truncate">
                      المنتجات: {m.productsList || 'لم تسند منتجات بعد'}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Buttons Bar */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenPaymentModal(m.name)}
                    className="flex-1 bg-purple-700 hover:bg-purple-600 active:scale-95 text-white text-xs font-black py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <DollarSign className="w-4 h-4" />
                    صرف المستحقات المباشر
                  </button>

                  <button
                    onClick={() => onOpenStatementModal && onOpenStatementModal(m)}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 active:scale-95 text-amber-400 text-xs font-black py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    كشف حساب كامل
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
