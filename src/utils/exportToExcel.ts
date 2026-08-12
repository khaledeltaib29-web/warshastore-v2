import * as XLSX from 'xlsx';
import { Order, Product, Manufacturer, Expense, DashboardStats } from '../types';
import { calculateDashboardStats, recalculateManufacturersFromDeliveredOrders, buildSummaryRows } from './calculations';

// Helper to sanitize cell values to ensure no string exceeds Excel's 32,767 character limit
function safeCellValue(val: any): any {
  if (typeof val !== 'string') return val;
  // Replace base64 data URLs with a short placeholder to prevent huge string cells
  if (val.startsWith('data:image/')) {
    return '[صورة مرفقة Base64]';
  }
  if (val.length > 32000) {
    return val.substring(0, 31950) + '... [تم اختصار النص]';
  }
  return val;
}

function sanitizeRow<T extends Record<string, any>>(row: T): T {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    sanitized[key] = safeCellValue(value);
  }
  return sanitized as T;
}

export function exportWarshaStoreToExcel(
  orders: Order[] = [],
  products: Product[] = [],
  manufacturers: Manufacturer[] = [],
  expenses: Expense[] = [],
  stats?: DashboardStats,
  baseCapital: number = 0
) {
  const wb = XLSX.utils.book_new();

  let safeOrders = Array.isArray(orders) ? orders : [];
  if (safeOrders.length === 0 && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('warsha_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          safeOrders = parsed;
        }
      }
    } catch (e) {}
  }
  let safeProducts = Array.isArray(products) && products.length > 0 ? products : [];
  if (safeProducts.length === 0 && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('warsha_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) safeProducts = parsed;
      }
    } catch (e) {}
  }

  let safeManufacturers = Array.isArray(manufacturers) && manufacturers.length > 0 ? manufacturers : [];
  if (safeManufacturers.length === 0 && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('warsha_manufacturers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) safeManufacturers = parsed;
      }
    } catch (e) {}
  }

  let safeExpenses = Array.isArray(expenses) && expenses.length > 0 ? expenses : [];
  if (safeExpenses.length === 0 && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('warsha_expenses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) safeExpenses = parsed;
      }
    } catch (e) {}
  }

  let effectiveBaseCapital = baseCapital || 0;
  if (!effectiveBaseCapital && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('warsha_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.baseCapital === 'number') {
          effectiveBaseCapital = parsed.baseCapital;
        }
      }
    } catch (e) {}
  }

  // Recalculate manufacturers from delivered orders for exact financial consistency
  const deliveredOrders = safeOrders.filter((o) => o.status === 'تم التسليم');
  const freshManufacturers = recalculateManufacturersFromDeliveredOrders(deliveredOrders, safeManufacturers);

  // Single Source of Truth KPI Calculations
  const liveStats = calculateDashboardStats(
    safeOrders,
    safeProducts,
    freshManufacturers,
    safeExpenses,
    effectiveBaseCapital
  );

  // Helper to append sheet with headers & RTL configuration
  const appendSheet = <T extends Record<string, any>>(
    data: T[],
    headers: string[],
    sheetName: string
  ) => {
    const sanitizedData = data.map((row) => sanitizeRow(row));
    const ws = XLSX.utils.json_to_sheet(sanitizedData, { header: headers });
    ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length * 2 + 2, 18) }));
    ws['!views'] = [{ RTL: true }];
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  // 1. الأوردرات (Orders)
  const orderHeaders = [
    'رقم الأوردر',
    'التاريخ',
    'اسم العميل',
    'الهاتف',
    'العنوان التفصيلي',
    'المنتجات والكميات',
    'إجمالي الكمية',
    'الورشة المصنعة',
    'تكلفة الخام للقطعة',
    'تكلفة المصنعية للقطعة',
    'إجمالي الخام',
    'إجمالي المصنعية',
    'الشحن',
    'إجمالي البيع',
    'المبلغ المدفوع',
    'حالة الأوردر',
    'الربح الصافي',
  ];

  const ordersData = safeOrders.map((o) => {
    const productsSummary = o.items && o.items.length > 0
      ? o.items.map((i) => `${i.productName || 'منتج'} (${i.quantity || 1} قطعة)`).join(' + ')
      : (o.productName ? `${o.productName} (${o.quantity || 1} قطعة)` : '—');

    const totalQty = o.items && o.items.length > 0
      ? o.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
      : (o.quantity || 1);

    const mName = o.items && o.items.length > 0
      ? Array.from(new Set(o.items.map((i) => i.manufacturerName).filter(Boolean))).join('، ')
      : (o.manufacturerName || '—');

    const calculatedProfit = o.profit !== undefined
      ? o.profit
      : Math.max(0, (o.totalSale || 0) - (o.totalRawCost || 0) - (o.totalWorkmanshipCost || 0));

    return {
      'رقم الأوردر': o.id || '—',
      'التاريخ': o.date || '—',
      'اسم العميل': o.customerName || '—',
      'الهاتف': o.phone || '—',
      'العنوان التفصيلي': o.address || '—',
      'المنتجات والكميات': productsSummary,
      'إجمالي الكمية': totalQty,
      'الورشة المصنعة': mName,
      'تكلفة الخام للقطعة': o.rawMaterialCostUnit || (o.items && o.items[0]?.rawMaterialCostUnit) || 0,
      'تكلفة المصنعية للقطعة': o.workmanshipCostUnit || (o.items && o.items[0]?.workmanshipCostUnit) || 0,
      'إجمالي الخام': o.totalRawCost || 0,
      'إجمالي المصنعية': o.totalWorkmanshipCost || 0,
      'الشحن': o.shippingCost || 0,
      'إجمالي البيع': o.totalSale || 0,
      'المبلغ المدفوع': o.paidAmount || 0,
      'حالة الأوردر': o.status || 'جديد',
      'الربح الصافي': calculatedProfit,
    };
  });
  appendSheet(ordersData, orderHeaders, 'الأوردرات');

  // 2. المنتجات (Products)
  const productHeaders = [
    'كود المنتج',
    'اسم المنتج',
    'سعر البيع',
    'وزن الخامة (كجم)',
    'سعر كيلو الخامة',
    'تكلفة الخامة',
    'تكلفة المصنعية',
    'إجمالي التكلفة',
    'ربح القطعة',
    'المخزون الحالي',
    'حالة المنتج',
    'اللون',
    'كود المصنعة',
    'رابط صورة المنتج',
    'المصنعة المسؤولة',
  ];

  const productsData = safeProducts.map((p) => ({
    'كود المنتج': p.id || '—',
    'اسم المنتج': p.name || '—',
    'سعر البيع': p.salePrice || 0,
    'وزن الخامة (كجم)': p.rawMaterialWeightKg || 0,
    'سعر كيلو الخامة': p.rawMaterialPricePerKg || 0,
    'تكلفة الخامة': p.rawMaterialCost || 0,
    'تكلفة المصنعية': p.workmanshipCost || 0,
    'إجمالي التكلفة': p.totalCost || 0,
    'ربح القطعة': p.unitProfit || 0,
    'المخزون الحالي': p.stock || 0,
    'حالة المنتج': p.status || (p.stock === 0 ? 'مباع' : 'متاح'),
    'اللون': p.color || 'غير محدد',
    'كود المصنعة': p.manufacturerCode || '—',
    'رابط صورة المنتج': p.imageUrl || '—',
    'المصنعة المسؤولة': p.manufacturerName || '—',
  }));
  appendSheet(productsData, productHeaders, 'المنتجات');

  // 3. المصنعين (Manufacturers)
  const manufacturerHeaders = [
    'كود الورشة',
    'اسم المصنعة/الورشة',
    'الهاتف',
    'العنوان',
    'نظام المحاسبة',
    'قيمة المحاسبة',
    'المنتجات المنفذة',
    'عدد القطع المنفذة',
    'إجمالي المصنعية المستحقة',
    'المبلغ المدفوع',
    'المتبقي والمديونية',
  ];

  const manufacturersData = freshManufacturers.map((m) => {
    const payMethodName = m.payMethod === 'percentage'
      ? 'نسبة مئوية'
      : m.payMethod === 'fixed'
      ? 'دخل ثابت'
      : 'إدخال يدوي';

    const payValStr = m.payMethod === 'percentage'
      ? `${m.payValue || 60}%`
      : m.payMethod === 'fixed'
      ? `${m.payValue || 50} ج.م`
      : 'يدوي';

    return {
      'كود الورشة': m.code || m.id || '—',
      'اسم المصنعة/الورشة': m.name || '—',
      'الهاتف': m.phone || '—',
      'العنوان': m.address || '—',
      'نظام المحاسبة': payMethodName,
      'قيمة المحاسبة': payValStr,
      'المنتجات المنفذة': m.productsList || '—',
      'عدد القطع المنفذة': m.completedUnits || 0,
      'إجمالي المصنعية المستحقة': m.totalWorkmanshipEarned || 0,
      'المبلغ المدفوع': m.paidAmount || 0,
      'المتبقي والمديونية': m.remainingBalance || 0,
    };
  });
  appendSheet(manufacturersData, manufacturerHeaders, 'المصنعين');

  // 4. المصروفات (Expenses)
  const expenseHeaders = [
    'الكود',
    'التاريخ',
    'نوع المصروف',
    'البيان',
    'المبلغ (ج.م)',
  ];

  const expensesData = safeExpenses.map((e) => ({
    'الكود': e.id || '—',
    'التاريخ': e.date || '—',
    'نوع المصروف': e.category || '—',
    'البيان': e.description || '—',
    'المبلغ (ج.م)': e.amount || 0,
  }));
  appendSheet(expensesData, expenseHeaders, 'المصروفات');

  // 5. الملخص الإحصائي (Dashboard Summary) - ALWAYS appended from Single Source of Truth liveStats
  const summaryHeaders = ['البيان', 'القيمة'];
  const summaryRows = buildSummaryRows(liveStats);
  const summaryData = summaryRows.slice(1).map((row) => ({
    'البيان': row[0],
    'القيمة': row[1],
  }));
  appendSheet(summaryData, summaryHeaders, 'ملخص الحسابات');

  // Download XLSX file
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `WarshaStore_Export_${dateStr}.xlsx`);
}

