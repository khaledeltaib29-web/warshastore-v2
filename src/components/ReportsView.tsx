import React, { useState } from 'react';
import { Order, Product, Manufacturer, Expense, AppUser } from '../types';
import { formatCurrency } from '../utils/calculations';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Boxes,
  Hammer,
  Receipt,
  PiggyBank,
  PackageCheck,
  Users,
  Filter,
  Lock,
} from 'lucide-react';

interface ReportsViewProps {
  orders: Order[];
  products: Product[];
  manufacturers: Manufacturer[];
  expenses: Expense[];
  currentUser?: AppUser;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  orders,
  products,
  manufacturers,
  expenses,
  currentUser,
}) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');

  if (currentUser?.role === 'accountant' || currentUser?.role === 'manufacturer' || currentUser?.role === 'data_entry') {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-xl mx-auto my-12 space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">غير مصرح بالوصول للتقارير المالية</h2>
        <p className="text-sm text-slate-600 font-extrabold leading-relaxed">
          طبقاً لقواعد الصلاحيات المحددة، فإن تقارير الأرباح وتكاليف الخامات والتحليلات المالية المتقدمة حصرية فقط بـ (المدير العام) و (النائب العام).
        </p>
      </div>
    );
  }

  // Helper date filtering
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

  const isMatchingPeriod = (dateStr: string) => {
    if (period === 'all') return true;
    if (period === 'today') return dateStr === todayStr;
    if (period === 'month') return dateStr.startsWith(currentMonthStr);
    if (period === 'week') {
      const d = new Date(dateStr).getTime();
      const now = new Date().getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      return now - d <= sevenDays;
    }
    return true;
  };

  const filteredOrders = orders.filter(
    (o) => o.status !== 'ملغي' && isMatchingPeriod(o.date)
  );
  const filteredExpenses = expenses.filter((e) => isMatchingPeriod(e.date));

  // Calculations for filtered period
  const totalSales = filteredOrders.reduce((s, o) => s + o.totalSale, 0);
  const totalRaw = filteredOrders.reduce((s, o) => s + o.totalRawCost, 0);
  const totalWorkmanship = filteredOrders.reduce((s, o) => s + o.totalWorkmanshipCost, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const totalCosts = totalRaw + totalWorkmanship + totalExpenses;
  const netProfit = totalSales - totalCosts;

  // Specific Today & Month Calculations for prompt requirement
  const todayOrders = orders.filter((o) => o.status !== 'ملغي' && o.date === todayStr);
  const todayExpenses = expenses.filter((e) => e.date === todayStr);
  const todayProfit =
    todayOrders.reduce((s, o) => s + o.profit, 0) -
    todayExpenses.reduce((s, e) => s + e.amount, 0);

  const monthOrders = orders.filter(
    (o) => o.status !== 'ملغي' && o.date.startsWith(currentMonthStr)
  );
  const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonthStr));
  const monthProfit =
    monthOrders.reduce((s, o) => s + o.profit, 0) -
    monthExpenses.reduce((s, e) => s + e.amount, 0);

  // Per product profit analysis
  const productAnalysis = products.map((p) => {
    const productOrders = filteredOrders.filter((o) => o.productId === p.id);
    const totalQty = productOrders.reduce((s, o) => s + o.quantity, 0);
    const totalProductSales = productOrders.reduce((s, o) => s + o.totalSale, 0);
    const totalProductCost = productOrders.reduce(
      (s, o) => s + o.totalRawCost + o.totalWorkmanshipCost,
      0
    );
    const productProfit = totalProductSales - totalProductCost;

    return {
      product: p,
      totalQty,
      totalProductSales,
      totalProductCost,
      productProfit,
    };
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            تقارير الأرباح وتحليل المبيعات
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تحليل دقيق لأرباح المنتجات، تكاليف الخام والمصنعية، ومستحقات الورش.
          </p>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === 'today'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            اليوم
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === 'week'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            آخر 7 أيام
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === 'month'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            هذا الشهر
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === 'all'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل
          </button>
        </div>
      </div>

      {/* Overview Cards (Today & Month Net Profits) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white rounded-2xl p-4 shadow-md">
          <span className="text-xs text-emerald-100 font-bold block">أرباح اليوم</span>
          <p className="text-2xl font-black mt-1">{formatCurrency(todayProfit)}</p>
          <span className="text-[11px] text-emerald-200 mt-1 block">
            عدد أوردرات اليوم: {todayOrders.length}
          </span>
        </div>

        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-2xl p-4 shadow-md">
          <span className="text-xs text-blue-100 font-bold block">أرباح الشهر الحالي</span>
          <p className="text-2xl font-black mt-1">{formatCurrency(monthProfit)}</p>
          <span className="text-[11px] text-blue-200 mt-1 block">
            عدد أوردرات الشهر: {monthOrders.length}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-bold block">
            إجمالي المبيعات (الفترة المختارة)
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(totalSales)}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-bold block">
            صافي الربح (الفترة المختارة)
          </span>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {formatCurrency(netProfit)}
          </p>
        </div>
      </div>

      {/* Cost & Expenses Breakdown */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-amber-600" />
          تفاصيل التكاليف للفترة المختارة
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block">تكلفة الخامات:</span>
            <strong className="text-slate-900 text-base font-bold block mt-1">
              {formatCurrency(totalRaw)}
            </strong>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block">تكلفة المصنعية:</span>
            <strong className="text-purple-700 text-base font-bold block mt-1">
              {formatCurrency(totalWorkmanship)}
            </strong>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block">المصروفات العامة:</span>
            <strong className="text-rose-700 text-base font-bold block mt-1">
              {formatCurrency(totalExpenses)}
            </strong>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80">
            <span className="text-amber-900 font-bold block">إجمالي التكاليف:</span>
            <strong className="text-amber-950 text-base font-black block mt-1">
              {formatCurrency(totalCosts)}
            </strong>
          </div>
        </div>
      </div>

      {/* Per Product Profits Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-3 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-blue-600" />
            أرباح كل منتج (تحليل ربحية الأصناف)
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {productAnalysis.map(({ product, totalQty, totalProductSales, productProfit }) => (
            <div
              key={product.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <strong className="text-sm font-extrabold text-slate-900 block">
                  {product.name} ({product.id})
                </strong>
                <span className="text-slate-500">
                  سعر البيع: {product.salePrice}ج | ربح القطعة: {product.unitProfit}ج | المباع: {totalQty} قطعة
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">مبيعات المنتج</span>
                  <strong className="text-slate-900 font-bold text-sm">
                    {formatCurrency(totalProductSales)}
                  </strong>
                </div>
                <div className="text-right bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <span className="text-emerald-800 font-bold block text-[11px]">أرباح المنتج</span>
                  <strong className="text-emerald-700 font-black text-sm">
                    {formatCurrency(productProfit)}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per Manufacturer Dues Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-4 sm:p-5 space-y-3">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          مستحقات كل مصنعة وورشة
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {manufacturers.map((m) => (
            <div
              key={m.id}
              className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <strong className="text-sm font-extrabold text-slate-900">{m.name}</strong>
                <span className="text-slate-500 font-medium">{m.completedUnits} قطعة منفذة</span>
              </div>

              <div className="grid grid-cols-3 gap-1 text-center bg-white p-2 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">إجمالي المستحق</span>
                  <strong className="text-purple-700 font-bold">{formatCurrency(m.totalWorkmanshipEarned)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">المدفوع</span>
                  <strong className="text-emerald-700 font-bold">{formatCurrency(m.paidAmount)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">المتبقي</span>
                  <strong className="text-orange-600 font-black">{formatCurrency(m.remainingBalance)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
