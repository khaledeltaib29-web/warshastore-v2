import { Order, Product, Manufacturer, Expense, DashboardStats, OrderSplitMode } from '../types';

export interface OrderCalculationResult {
  totalSale: number;
  subtotalAfterDiscount: number;
  totalAmountDue: number;
  companyShare: number;
  manufacturerShare: number;
  surplusProfit: number;
  profit: number;
}

export function computeOrderShares(
  totalSale: number,
  shippingCost: number,
  discount: number = 0,
  paidAmount: number,
  splitMode: OrderSplitMode,
  companyPercent: number = 40,
  manufacturerPercent: number = 60,
  fixedCompanyAmount: number = 0,
  manualCompanyShare: number = 0,
  manualManufacturerShare: number = 0,
  orderExpenses: number = 0
): OrderCalculationResult {
  const validDiscount = Math.max(0, discount || 0);
  const subtotalAfterDiscount = Math.max(0, totalSale - validDiscount);
  const totalAmountDue = subtotalAfterDiscount + (shippingCost || 0);

  let companyShare = 0;
  let manufacturerShare = 0;

  // The base for company & manufacturer share split is the subtotal after discount
  const baseAmount = subtotalAfterDiscount;

  if (splitMode === 'percentage') {
    const totalPct = (companyPercent || 0) + (manufacturerPercent || 0);
    const validCompPct = totalPct > 0 ? (companyPercent / totalPct) : 0.4;
    companyShare = Math.round(baseAmount * validCompPct);
    manufacturerShare = Math.max(0, baseAmount - companyShare);
  } else if (splitMode === 'fixed') {
    companyShare = fixedCompanyAmount;
    manufacturerShare = Math.max(0, baseAmount - companyShare);
  } else if (splitMode === 'manual') {
    companyShare = manualCompanyShare;
    manufacturerShare = manualManufacturerShare;
  }

  // Calculate surplus collection / overpayment (زيادة التحصيل)
  // Expected amount from customer = totalAmountDue + orderExpenses
  const expectedTotal = totalAmountDue + orderExpenses;
  const surplusProfit = paidAmount > expectedTotal ? (paidAmount - expectedTotal) : 0;

  // Net Company Profit from Order = Company Share + Surplus Collection - Order Expenses
  const profit = Math.max(0, companyShare + surplusProfit - orderExpenses);

  return {
    totalSale,
    subtotalAfterDiscount,
    totalAmountDue,
    companyShare,
    manufacturerShare,
    surplusProfit,
    profit,
  };
}

export function calculateDashboardStats(
  orders: Order[],
  products: Product[],
  manufacturers: Manufacturer[],
  expenses: Expense[],
  baseCapital: number = 0
): DashboardStats {
  // Valid non-cancelled orders
  const validOrders = orders.filter((o) => o.status !== 'ملغي');
  
  // Delivered orders
  const deliveredOrders = orders.filter((o) => o.status === 'تم التسليم');

  // Active / In-progress orders ('جديد', 'قيد التنفيذ', 'تم الشحن')
  const activeOrders = orders.filter((o) => o.status === 'جديد' || o.status === 'قيد التنفيذ' || o.status === 'تم الشحن');

  // Cancelled / Returned orders ('ملغي')
  const cancelledOrders = orders.filter((o) => o.status === 'ملغي');

  // 1. Estimated Company Profits from current inventory stock (40% of sale price for items in stock)
  const estimatedCompanyProfits = products.reduce(
    (sum, p) => sum + (p.stock || 0) * (p.salePrice || 0) * 0.40,
    0
  );

  // 1. Total Sales (Delivered vs All)
  const totalDeliveredSales = deliveredOrders.reduce((sum, o) => sum + (o.subtotalAfterDiscount ?? o.totalSale ?? 0), 0);
  const totalSalesAllOrders = validOrders.reduce((sum, o) => sum + (o.subtotalAfterDiscount ?? o.totalSale ?? 0), 0);

  // Delivered orders company cash collected
  const deliveredCompanyShares = deliveredOrders.reduce((sum, o) => sum + (o.companyShare || 0), 0);
  const deliveredSurplus = deliveredOrders.reduce((sum, o) => sum + (o.surplusProfit || 0), 0);

  // Costs & Shares: STRICTLY from delivered orders ('تم التسليم')
  const totalRawCost = deliveredOrders.reduce((sum, o) => sum + (o.totalRawCost || 0), 0);
  const totalWorkmanshipCost = deliveredOrders.reduce((sum, o) => sum + (o.totalWorkmanshipCost || 0), 0);
  const totalShippingCost = deliveredOrders.reduce((sum, o) => sum + (o.shippingCost || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Shares & Surplus Collection: STRICTLY from delivered orders ('تم التسليم')
  const totalCompanyShares = deliveredOrders.reduce((sum, o) => sum + (o.companyShare || 0), 0);
  const totalManufacturerShares = deliveredOrders.reduce((sum, o) => sum + (o.manufacturerShare || 0), 0);
  const totalSurplusProfits = deliveredOrders.reduce((sum, o) => sum + (o.surplusProfit || 0), 0);

  // Net Profit: Company Shares + Surplus Collection - Total Expenses
  const netProfit = totalCompanyShares + totalSurplusProfits - totalExpenses;

  // Unpaid Manufacturer Dues:
  // Dynamically recalculate manufacturer dues from delivered orders if manufacturers array needs refreshing
  const updatedManufacturers = recalculateManufacturersFromDeliveredOrders(deliveredOrders, manufacturers);
  const totalManufacturerDues = updatedManufacturers.reduce(
    (sum, m) => sum + Math.max(0, (m.remainingBalance || 0)),
    0
  );

  // Current Liquidity Formula:
  // = رأس المال المكتوب يدوياً + أرباح/تحصيلات الأوردرات المسلمة + زيادة التحصيل - المصروفات - مستحقات المصنعين المعلقة
  const currentLiquidity =
    (baseCapital || 0) +
    deliveredCompanyShares +
    deliveredSurplus -
    totalExpenses -
    totalManufacturerDues;

  // Inventory Status Units Calculation
  const availableStockUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);

  // Helper to count item units in an order array
  const countOrderUnits = (orderList: Order[]) => {
    return orderList.reduce((sum, o) => {
      if (o.items && o.items.length > 0) {
        return sum + o.items.reduce((iSum, item) => iSum + (item.quantity || 0), 0);
      }
      return sum + (o.quantity || 0);
    }, 0);
  };

  const reservedStockUnits = countOrderUnits(activeOrders);
  const soldStockUnits = countOrderUnits(deliveredOrders);

  return {
    currentLiquidity,
    estimatedCompanyProfits,
    totalDeliveredSales,
    totalSalesAllOrders,
    totalRawCost,
    totalWorkmanshipCost,
    totalShippingCost,
    totalExpenses,
    totalCompanyShares,
    totalManufacturerShares,
    totalSurplusProfits,
    netProfit,
    totalManufacturerDues,
    availableStockUnits,
    reservedStockUnits,
    soldStockUnits,
    totalOrdersCount: orders.length,
    activeOrdersCount: activeOrders.length,
    deliveredOrdersCount: deliveredOrders.length,
    cancelledOrdersCount: cancelledOrders.length,
  };
}

// Helper to recalculate manufacturer earnings & dues strictly from delivered orders ('تم التسليم')
export function recalculateManufacturersFromDeliveredOrders(
  deliveredOrders: Order[],
  manufacturers: Manufacturer[]
): Manufacturer[] {
  const earnedMap: Record<string, { units: number; earned: number }> = {};

  deliveredOrders.forEach((o) => {
    const totalOrderEarned = o.manufacturerShare ?? o.totalWorkmanshipCost ?? 0;

    if (o.items && o.items.length > 0) {
      const totalItemsSale = o.items.reduce(
        (s, i) => s + (i.salePrice || 0) * (i.quantity || 1),
        0
      );

      o.items.forEach((item) => {
        const mName = item.manufacturerName || o.manufacturerName;
        if (mName) {
          if (!earnedMap[mName]) {
            earnedMap[mName] = { units: 0, earned: 0 };
          }
          const itemUnits = item.quantity || 1;
          earnedMap[mName].units += itemUnits;

          if (item.workmanshipCostUnit && item.workmanshipCostUnit > 0) {
            earnedMap[mName].earned += item.workmanshipCostUnit * itemUnits;
          } else if (totalOrderEarned > 0 && totalItemsSale > 0) {
            const itemRatio = ((item.salePrice || 0) * itemUnits) / totalItemsSale;
            earnedMap[mName].earned += Math.round(totalOrderEarned * itemRatio);
          }
        }
      });
    } else if (o.manufacturerName) {
      const mName = o.manufacturerName;
      if (!earnedMap[mName]) {
        earnedMap[mName] = { units: 0, earned: 0 };
      }
      earnedMap[mName].units += o.quantity || 1;
      earnedMap[mName].earned += totalOrderEarned;
    }
  });

  return manufacturers.map((m) => {
    // If the manufacturer uses direct manual entry ('manual'), keep their manually specified dues, payments and remaining balance intact!
    if (m.payMethod === 'manual') {
      const remainingBalance = Math.max(0, (m.totalWorkmanshipEarned || 0) - (m.paidAmount || 0));
      return {
        ...m,
        remainingBalance,
      };
    }

    const stats = earnedMap[m.name] || { units: 0, earned: 0 };
    const completedUnits = stats.units;

    let totalWorkmanshipEarned = stats.earned;
    if (m.payMethod === 'fixed' && m.payValue !== undefined && m.payValue > 0) {
      totalWorkmanshipEarned = completedUnits * m.payValue;
    } else if (m.payMethod === 'percentage' && m.payValue !== undefined && m.payValue > 0 && stats.earned === 0 && completedUnits > 0) {
      totalWorkmanshipEarned = Math.round((stats.earned || 0));
    }

    // Preserve base earned if delivered orders exist or keep manual base if present
    if (totalWorkmanshipEarned === 0 && m.totalWorkmanshipEarned > 0 && completedUnits === 0) {
      totalWorkmanshipEarned = m.totalWorkmanshipEarned;
    }

    const paidAmount = m.paidAmount || 0;
    const remainingBalance = Math.max(0, totalWorkmanshipEarned - paidAmount);

    return {
      ...m,
      completedUnits,
      totalWorkmanshipEarned,
      paidAmount,
      remainingBalance,
    };
  });
}

// Format numbers in Egyptian Pounds format (ج.م)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 1,
  }).format(amount || 0);
}

// Build standard summary rows array for Excel exports and Google Sheets Webhooks
export function buildSummaryRows(stats: DashboardStats): (string | number)[][] {
  return [
    ['البيان', 'القيمة'],
    ['السيولة المالية المتاحة', stats.currentLiquidity || 0],
    ['إجمالي المبيعات (المسلمة)', stats.totalDeliveredSales || 0],
    ['إجمالي كافة المبيعات', stats.totalSalesAllOrders || 0],
    ['إجمالي تكلفة الخامات', stats.totalRawCost || 0],
    ['إجمالي المصنعية', stats.totalWorkmanshipCost || 0],
    ['إجمالي الشحن', stats.totalShippingCost || 0],
    ['إجمالي زيادة التحصيل', stats.totalSurplusProfits || 0],
    ['إجمالي المصروفات العمومية', stats.totalExpenses || 0],
    ['صافي الربح الفعلي', stats.netProfit || 0],
    ['إجمالي مستحقات المصنعين المتبقية', stats.totalManufacturerDues || 0],
    ['قطع متاحة بالمخزون', stats.availableStockUnits || 0],
    ['قطع محجوزة', stats.reservedStockUnits || 0],
    ['قطع مباعة', stats.soldStockUnits || 0],
    ['إجمالي الأوردرات', stats.totalOrdersCount || 0],
    ['الأوردرات النشطة', stats.activeOrdersCount || 0],
    ['الأوردرات المسلمة', stats.deliveredOrdersCount || 0],
    ['الأوردرات الملغاة', stats.cancelledOrdersCount || 0],
  ];
}

