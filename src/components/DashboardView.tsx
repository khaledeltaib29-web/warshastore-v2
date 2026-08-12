import React, { useState } from 'react';
import { DashboardStats, Order, AppUser, StoreSettings } from '../types';
import { formatCurrency } from '../utils/calculations';
import {
  TrendingUp,
  Boxes,
  Hammer,
  Truck,
  Receipt,
  PiggyBank,
  Users,
  ShoppingBag,
  PlusCircle,
  PackagePlus,
  FileText,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
  Package,
  Layers,
  ArrowUpRight,
  Edit3,
  X,
  Coins,
  RefreshCw,
  Lock,
  ShieldAlert,
  FileSpreadsheet,
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats;
  recentOrders: Order[];
  baseCapital?: number;
  currentUser?: AppUser;
  productsCount?: number;
  manufacturersCount?: number;
  settings?: StoreSettings;
  onUpdateBaseCapital?: (newCapital: number) => void;
  onOpenNewOrder: () => void;
  onOpenNewProduct: () => void;
  onOpenNewExpense: () => void;
  onOpenPaymentModal: () => void;
  onNavigateToOrders: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentOrders,
  baseCapital = 0,
  currentUser,
  productsCount = 0,
  manufacturersCount = 0,
  settings,
  onUpdateBaseCapital,
  onOpenNewOrder,
  onOpenNewProduct,
  onOpenNewExpense,
  onOpenPaymentModal,
  onNavigateToOrders,
  onSync,
  isSyncing = false,
}) => {
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState(false);
  const [capitalInput, setCapitalInput] = useState<string>(baseCapital.toString());

  const isCustomRole = currentUser?.role === 'data_entry' || currentUser?.role === 'accountant';

  const handleSaveCapital = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Math.max(0, parseFloat(capitalInput) || 0);
    if (onUpdateBaseCapital) {
      onUpdateBaseCapital(val);
    }
    setIsCapitalModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Welcome Banner & Mobile Actions */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-amber-400">
              لوحة تحكم WarshaStore
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              متابعة السيولة النقدية، مبيعات الأوردرات المسلمة، صافي الأرباح، ومخزون الورش لحظياً.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            {onSync && (
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/30"
                title="مزامنة وحفظ البيانات فوراً في Google Sheets"
              >
                <RefreshCw className={`w-4 h-4 text-amber-300 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>مزامنة البيانات</span>
              </button>
            )}
            <button
              onClick={onOpenNewOrder}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/30"
            >
              <PlusCircle className="w-4 h-4" />
              أوردر جديد
            </button>
            <button
              onClick={onOpenNewProduct}
              className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition-all shadow-md shadow-amber-600/30"
            >
              <PackagePlus className="w-4 h-4" />
              منتج جديد
            </button>
            <button
              onClick={onOpenNewExpense}
              className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-100 font-bold text-xs sm:text-sm px-3 py-2.5 rounded-xl transition-all border border-slate-600"
            >
              <FileText className="w-4 h-4" />
              مصروف
            </button>
            <button
              onClick={onOpenPaymentModal}
              className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 active:scale-95 text-amber-300 font-bold text-xs sm:text-sm px-3 py-2.5 rounded-xl transition-all border border-slate-600"
            >
              <Users className="w-4 h-4" />
              دفعة مصنعة
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Active Google Sheets & Discovered Tabs Indicator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400">ملف Google Sheets المربوط الفعلي:</span>
              <a
                href={
                  settings?.spreadsheetUrl ||
                  `https://docs.google.com/spreadsheets/d/${settings?.spreadsheetId || '151eu2TB6sLniseLqSzE5RZDvV7NACYemOp-8FkFEqYM'}/edit`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 font-black text-sm hover:underline flex items-center gap-1"
              >
                {settings?.spreadsheetTitle || 'WarshaStore Database - بيانات ورشة ستور'}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400">التبويبات المكتشفة المربوطة بالمزامنة:</span>
              {(
                settings?.discoveredTabs || [
                  'الأوردرات',
                  'المنتجات',
                  'المصنعين',
                  'المصروفات',
                  'ملخص الحسابات',
                ]
              ).map((tab, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {tab}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {settings?.lastSyncedAt && (
            <span className="text-[11px] text-slate-400 font-medium bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              آخر مزامنة: {settings.lastSyncedAt}
            </span>
          )}
          {onSync && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="text-xs font-bold px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl transition-all flex items-center gap-1 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              مزامنة الآن
            </button>
          )}
        </div>
      </div>

      {/* Custom Role Security Notice & Operational Summary */}
      {isCustomRole ? (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl flex items-center gap-3 text-amber-950 text-xs font-extrabold shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-950 flex items-center gap-2">
                لوحة التشغيل (خاصة بمدخل البيانات ومسؤول العمليات)
              </h3>
              <p className="text-slate-700 font-bold mt-0.5">
                طبقاً للقيود الأمنية، يُحظر الاطلاع على أرباح الشركة أو السيولة الحالية. يمكنك متابعة حركة التشغيل، المنتجات، المصنعين، وحالات الأوردرات فقط.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block">عدد المنتجات</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{productsCount} منتج</p>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">مسجلة بالمخزون</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block">إجمالي الشحن</span>
              <p className="text-2xl font-black text-blue-600 mt-1">{formatCurrency(stats.totalShippingCost)}</p>
              <span className="text-[11px] text-blue-700 font-medium mt-1 block">شحنات المحافظات</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block">المصنعين / الورش</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{manufacturersCount} ورشة</p>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">نشطة بالنظام</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block">المستحقات المعلقة</span>
              <p className="text-2xl font-black text-purple-600 mt-1">{formatCurrency(stats.totalManufacturerDues)}</p>
              <span className="text-[11px] text-purple-700 font-medium mt-1 block">مستحقات المصنعين</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block">الموجود (المتاح)</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{stats.availableStockUnits} قطعة</p>
              <span className="text-[11px] text-emerald-700 font-bold mt-1 block">جاهزة للطلب</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block">المحجوز</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{stats.reservedStockUnits} قطعة</p>
              <span className="text-[11px] text-amber-700 font-bold mt-1 block">قيد التنفيذ والشحن</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block">المستلم (تم التسليم)</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{stats.deliveredOrdersCount} أوردر</p>
              <span className="text-[11px] text-emerald-800 font-bold mt-1 block">مكتمل بنجاح</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block">الملغي</span>
              <p className="text-2xl font-black text-rose-600 mt-1">{stats.cancelledOrdersCount} أوردر</p>
              <span className="text-[11px] text-rose-700 font-bold mt-1 block">مرتجع أو ملغي</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Hero Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. السيولة الحالية (السيولة الكلية) */}
            <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 text-white rounded-2xl p-5 shadow-xl border border-blue-800/50 flex flex-col justify-between relative group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-300 uppercase tracking-wider">
                  السيولة الحالية المتاحة
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCapitalInput((baseCapital || 0).toString());
                      setIsCapitalModalOpen(true);
                    }}
                    className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 p-2 rounded-xl transition-all border border-blue-500/30 flex items-center gap-1 text-[11px] font-bold"
                    title="تحديد أو تعديل رأس المال الحقيقي"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">تعديل رأس المال</span>
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-blue-300 tracking-tight">
                  {formatCurrency(stats.currentLiquidity)}
                </p>
                <p className="text-[11px] text-slate-300 font-medium mt-1.5 leading-relaxed">
                  = رأس المال ({formatCurrency(baseCapital)}) + التحصيلات والزيادات - المصروفات - مستحقات المصنعين المعلقة
                </p>
              </div>
            </div>

            {/* 2. إجمالي المبيعات المسلمة */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">إجمالي المبيعات (المسلمة)</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(stats.totalDeliveredSales)}
                </p>
                <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                  من {stats.deliveredOrdersCount} أوردر تم تسليمه للعميل
                </span>
              </div>
            </div>

            {/* 3. صافي الربح */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-lg shadow-emerald-600/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-100">صافي الربح الفعلي</span>
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center">
                  <PiggyBank className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {formatCurrency(stats.netProfit)}
                </p>
                <span className="text-[11px] text-emerald-100 font-medium mt-1 block">
                  = أرباح الشركة + زيادة التحصيل - المصروفات
                </span>
              </div>
            </div>

            {/* 4. مستحقات المصنعين غير المصروفة */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">مستحقات المصنعين المعلقة</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black text-amber-600 tracking-tight">
                  {formatCurrency(stats.totalManufacturerDues)}
                </p>
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                  إجمالي المبالغ المستحقة للورش غير المصروفة
                </span>
              </div>
            </div>
          </div>

          {/* 5. Estimated Company Profits Banner Card */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 rounded-2xl p-4 sm:p-5 shadow-lg border border-amber-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-950/20 text-slate-950 flex items-center justify-center shrink-0 border border-slate-950/20">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base sm:text-lg text-slate-950">
                    الأرباح التقريبية (من المنتجات بالمخزون)
                  </h3>
                  <span className="bg-slate-950 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-md">
                    40% من قيمة البيع
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900/90 mt-0.5">
                  إجمالي أرباح الشركة المقدرة بناءً على جميع القطع المتاحة حالياً بالمخزون ({stats.availableStockUnits} قطعة)
                </p>
              </div>
            </div>

            <div className="bg-slate-950 text-white px-5 py-3 rounded-2xl text-left border border-amber-400/30 shrink-0 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
              <span className="text-[11px] text-amber-300 font-extrabold block">إجمالي الأرباح التقريبية</span>
              <strong className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                {formatCurrency(stats.estimatedCompanyProfits)}
              </strong>
            </div>
          </div>
        </>
      )}

      {/* Secondary Operational Widgets Grid: Inventory & Order Movement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inventory Status Widget (حالة المخزون) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <h3 className="font-black text-slate-900 text-sm">حالة المخزون الفعلي بالقطع</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">تحديث أوتوماتيكي</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
              <span className="text-emerald-700 text-xs font-bold block mb-1">قطع متاحة</span>
              <strong className="text-xl font-black text-emerald-900">
                {stats.availableStockUnits}
              </strong>
              <span className="text-[10px] text-emerald-600 block mt-0.5">جاهزة للبيع</span>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
              <span className="text-amber-700 text-xs font-bold block mb-1">قطع محجوزة</span>
              <strong className="text-xl font-black text-amber-900">
                {stats.reservedStockUnits}
              </strong>
              <span className="text-[10px] text-amber-600 block mt-0.5">في أوردرات نشطة</span>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl">
              <span className="text-blue-700 text-xs font-bold block mb-1">قطع مباعة</span>
              <strong className="text-xl font-black text-blue-900">
                {stats.soldStockUnits}
              </strong>
              <span className="text-[10px] text-blue-600 block mt-0.5">تم تسليمها</span>
            </div>
          </div>
        </div>

        {/* Order Movement Widget (حركة الأوردرات) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
              <h3 className="font-black text-slate-900 text-sm">إحصائيات حركة الأوردرات</h3>
            </div>
            <span className="text-xs font-bold text-slate-600">
              إجمالي الأوردرات: {stats.totalOrdersCount}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl">
              <span className="text-blue-700 text-xs font-bold block mb-1">أوردرات نشطة</span>
              <strong className="text-xl font-black text-blue-900">
                {stats.activeOrdersCount}
              </strong>
              <span className="text-[10px] text-blue-600 block mt-0.5">جديد / تنفيذ / شحن</span>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
              <span className="text-emerald-700 text-xs font-bold block mb-1">أوردرات مسلمة</span>
              <strong className="text-xl font-black text-emerald-900">
                {stats.deliveredOrdersCount}
              </strong>
              <span className="text-[10px] text-emerald-600 block mt-0.5">تم الاستلام والتحصيل</span>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl">
              <span className="text-rose-700 text-xs font-bold block mb-1">أوردرات ملغاة</span>
              <strong className="text-xl font-black text-rose-900">
                {stats.cancelledOrdersCount}
              </strong>
              <span className="text-[10px] text-rose-600 block mt-0.5">مرتجعات أو ملغاة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Extra Financial Details Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500 font-bold block mb-1">إجمالي كافة المبيعات المسجلة</span>
          <strong className="text-slate-900 text-base font-extrabold">
            {formatCurrency(stats.totalSalesAllOrders)}
          </strong>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500 font-bold block mb-1">إجمالي الشحن المحصل</span>
          <strong className="text-slate-900 text-base font-extrabold">
            {formatCurrency(stats.totalShippingCost)}
          </strong>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500 font-bold block mb-1">إجمالي المصروفات العمومية</span>
          <strong className="text-rose-600 text-base font-extrabold">
            -{formatCurrency(stats.totalExpenses)}
          </strong>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500 font-bold block mb-1">إجمالي زيادة التحصيل</span>
          <strong className="text-emerald-700 text-base font-extrabold">
            +{formatCurrency(stats.totalSurplusProfits)}
          </strong>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-extrabold text-slate-900">آخر الأوردرات المسجلة</h3>
          </div>
          <button
            onClick={onNavigateToOrders}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors"
          >
            عرض كافة الأوردرات
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              لا يوجد أوردرات مسجلة بعد. اضغط على "أوردر جديد" لإضافة أول أوردر!
            </div>
          ) : (
            recentOrders.slice(0, 5).map((order, idx) => (
              <div
                key={`${order.id}-${idx}`}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {order.id.replace('ORD-', '#')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{order.customerName}</span>
                      <span className="text-xs text-slate-500">({order.phone})</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'تم التسليم'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'جديد'
                            ? 'bg-amber-100 text-amber-800'
                            : order.status === 'قيد التنفيذ'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'تم الشحن'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      المنتج: <strong className="text-slate-800">{order.productName}</strong> ({order.items?.length || 1} منتجات) | الورشة: {order.manufacturerName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">إجمالي البيع</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {formatCurrency(order.subtotalAfterDiscount ?? order.totalSale)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-emerald-600 font-semibold block">ربح الشركة</span>
                    <span className="font-black text-emerald-700 text-sm">
                      {formatCurrency(order.companyShare + (order.surplusProfit || 0))}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Real Base Capital Modal */}
      {isCapitalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    تحديد رأس المال الحقيقي للمشروع
                  </h3>
                  <p className="text-xs text-slate-500">
                    بداية حساب السيولة النقدية المتاحة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCapitalModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCapital} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-800 block">
                  رأس المال الحقيقي المدخل يدوياً (ج.م):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={capitalInput}
                    onChange={(e) => setCapitalInput(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left dir-ltr"
                    required
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    ج.م
                  </span>
                </div>
                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 leading-relaxed">
                  <p className="font-bold mb-1">💡 طريقة حساب السيولة الحالية:</p>
                  <p>
                    تبدأ السيولة من رأس المال الذي تقوم بإدخاله هنا (المبلغ الافتراضي الحالي: <strong>0 ج.م</strong>)، ثم يُضاف إليها تحصيلات الأوردرات المسلمة والزيادات، وتُخصم منها المصروفات ومستحقات الورش المتبقية.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCapitalModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30"
                >
                  حفظ رأس المال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

