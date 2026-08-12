export type OrderStatus = 'جديد' | 'قيد التنفيذ' | 'تم الشحن' | 'تم التسليم' | 'ملغي';
export type OrderSplitMode = 'percentage' | 'fixed' | 'manual';

export interface OrderItem {
  productId: string; // كود المنتج
  productName: string; // اسم المنتج
  quantity: number; // الكمية
  salePrice: number; // سعر البيع للقطعة
  rawMaterialCostUnit: number; // تكلفة الخام للقطعة
  workmanshipCostUnit: number; // تكلفة المصنعية للقطعة
  manufacturerName: string; // الورشة المصنعة
  color?: string; // اللون
  governorate?: string; // المحافظة
  weightKg?: number; // الوزن بالكجم
}

export interface Product {
  id: string; // كود المنتج (مثل A001, S010)
  name: string; // اسم/وصف المنتج (مثل: شنطة)
  salePrice: number; // سعر البيع
  rawMaterialWeightKg: number; // وزن الخامة (كجم)
  rawMaterialPricePerKg: number; // سعر كيلو الخامة
  rawMaterialCost: number; // تكلفة الخامة (الوزن * سعر الكيلو)
  workmanshipCost: number; // تكلفة المصنعية
  totalCost: number; // إجمالي تكلفة المنتج
  unitProfit: number; // ربح القطعة
  stock: number; // المخزون المتاح
  manufacturerName: string; // المصنعة المسؤولة
  color?: string; // اللون (مثل: فوشيا)
  governorate?: string; // المحافظة (مثل: الإسكندرية)
  manufacturerCode?: string; // كود المصنعة (مثل: MF001)
  imageUrl?: string; // صورة المنتج (رابط أو صورة محملة)
  status?: 'متاح' | 'مباع' | 'محجوز'; // حالة المنتج (متاح / مباع / محجوز)
}

export interface Order {
  id: string; // رقم الأوردر
  date: string; // التاريخ (YYYY-MM-DD)
  customerName: string; // اسم العميل
  phone: string; // الهاتف
  address: string; // العنوان
  items?: OrderItem[]; // سلة المنتجات داخل الأوردر

  // Backward-compatibility single-item getters
  productId?: string;
  productName?: string;
  quantity?: number;
  salePrice?: number;
  manufacturerName?: string;
  rawMaterialCostUnit?: number;
  workmanshipCostUnit?: number;

  shippingCost: number; // قيمة الشحن
  discount?: number; // الخصم الاختياري
  paidAmount: number; // المبلغ الفعلي المدفوع من العميل
  orderExpenses?: number; // مصروفات مرتبطة بالأوردر
  status: OrderStatus; // حالة الأوردر

  totalSale: number; // إجمالي قيمة المنتجات قبل الخصم
  subtotalAfterDiscount?: number; // إجمالي المنتجات بعد الخصم
  totalRawCost: number; // إجمالي تكلفة الخام
  totalWorkmanshipCost: number; // إجمالي المصنعية

  // Distribution & Surplus Engine
  splitMode?: OrderSplitMode; // 'percentage' | 'fixed' | 'manual'
  companyPercent?: number; // نسبة الشركة (افتراضي 40)
  manufacturerPercent?: number; // نسبة المصنعة (افتراضي 60)
  companyShare?: number; // مستحق الشركة المحسوب
  manufacturerShare?: number; // مستحق المصنعة المحسوب
  totalAmountDue?: number; // إجمالي المطلوب من العميل (المنتجات بعد الخصم + الشحن)
  surplusProfit?: number; // حقل زيادة التحصيل (فرق الربح الزائد عند زيادة الدفع)
  profit: number; // صافي ربح الشركة للأوردر
}

export interface Manufacturer {
  id: string;
  code?: string; // كود المصنعة (مثل MF001)
  name: string; // اسم المصنعة / الورشة
  phone: string; // الهاتف
  address?: string; // المنطقة / العنوان
  productsList: string; // المنتجات التي تصنعها
  completedUnits: number; // عدد القطع المنفذة
  totalWorkmanshipEarned: number; // إجمالي المصنعية المستحقة
  paidAmount: number; // المبلغ المدفوع لها
  remainingBalance: number; // المتبقي
  // النظام المالي الجديد للمصنعين: أ) نسبة مئوية ب) دخل ثابت ج) إدخال يدوي
  payMethod?: 'percentage' | 'fixed' | 'manual';
  payValue?: number; // قيمة النسبة المئوية (مثل 60%) أو الدخل الثابت (مثل 50 ج.م/قطعة)
}

export interface Expense {
  id: string;
  date: string;
  category: string; // نوع المصروف
  description: string; // البيان
  amount: number; // المبلغ
  orderId?: string; // أوردر مرتبطة إن وجد
}

export interface StoreSettings {
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetTitle?: string; // اسم ملف Google Sheets الفعلي
  discoveredTabs?: string[]; // قائمة التبويبات المكتشفة النشطة
  defaultRawMaterialPricePerKg: number;
  defaultCompanyPercent: number; // نسبة الشركة الافتراضية (40%)
  defaultManufacturerPercent: number; // نسبة المصنعة الافتراضية (60%)
  baseCapital?: number; // رأس المال الأساسي (السيولة المبدئية)
  autoUpdateStock: boolean;
  lowStockThreshold?: number; // حد تنبيه نقص المخزون (مثلاً 10 قطع)
  lastSyncedAt?: string;
  telegramBotToken?: string; // توكن بوت التليجرام
  telegramChatId?: string; // معرف الشات أو الجروب
  telegramEnabled?: boolean; // تفعيل إشعارات التليجرام
  appsScriptUrl?: string; // رابط Webhook الخفيف لـ Google Apps Script بدون GCP Project
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'sale' | 'stock' | 'payment' | 'expense' | 'system' | 'reminder' | 'admin_audit';
  timestamp: string;
  read: boolean;
  targetUserId?: string;
  recipientId?: string; // معرف المستلم التراديشي الموجه له الإشعار
  targetManufacturerName?: string; // اسم الورشة الموجه لها الإشعار
  targetManufacturerCode?: string; // كود الورشة الموجه لها الإشعار
  targetRole?: UserRole;
  isGlobal?: boolean; // إشعار عام لجميع المستخدمين (مثل الإعلانات)
  forAdminOnly?: boolean; // إشعار خاص وحصري للمدير العام فقط
  actorName?: string;
}

export interface ScheduledReminder {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  type: 'order_followup' | 'payment_collection' | 'custom';
  targetId?: string; // ID of order or manufacturer name
  targetUserId?: string; // معرف المستلم المحدد
  targetManufacturerName?: string; // اسم الورشة المحددة
  targetRole?: UserRole;
  forAdminOnly?: boolean;
  completed: boolean;
  createdAt: string;
  notified?: boolean;
}

export interface DashboardStats {
  currentLiquidity: number; // السيولة الحالية
  estimatedCompanyProfits: number; // الأرباح التقريبية للمخزون (40% من قيمة المبيعات المتوقعة)
  totalDeliveredSales: number; // إجمالي مبيعات الأوردرات المسلمة
  totalSalesAllOrders: number; // إجمالي كافة المبيعات
  totalRawCost: number; // إجمالي تكلفة الخامات
  totalWorkmanshipCost: number; // إجمالي المصنعية
  totalShippingCost: number; // إجمالي الشحن
  totalExpenses: number; // إجمالي المصروفات
  totalCompanyShares: number; // إجمالي مستحق الشركة
  totalManufacturerShares: number; // إجمالي مستحق المصنعين
  totalSurplusProfits: number; // إجمالي زيادة التحصيل
  netProfit: number; // صافي الربح
  totalManufacturerDues: number; // مستحقات المصنعين غير المصروفة

  // Inventory Status
  availableStockUnits: number; // قطع متاحة
  reservedStockUnits: number; // قطع محجوزة (في أوردرات جارية)
  soldStockUnits: number; // قطع مباعة (في أوردرات مسلمة)

  // Orders Movement
  totalOrdersCount: number; // إجمالي الأوردرات
  activeOrdersCount: number; // أوردرات جارية
  deliveredOrdersCount: number; // أوردرات مسلمة
  cancelledOrdersCount: number; // أوردرات مرتجعة / ملغية
}

export interface ManufacturerPayment {
  id: string;
  date: string;
  manufacturerName: string;
  amount: number;
  notes: string;
}

export type UserRole = 'super_admin' | 'deputy_admin' | 'data_entry' | 'accountant' | 'manufacturer';

export interface PendingApprovalRequest {
  id: string;
  timestamp: string;
  requesterName: string;
  requesterRole: UserRole;
  actionType: 'edit' | 'delete';
  targetType: 'أوردر' | 'منتج' | 'ورشة' | 'مصروف' | 'مستخدم' | 'بيانات مالية';
  targetId: string;
  targetSummary: string;
  payload?: any;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
}

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  manufacturerName?: string; // الورشة المرتبطة بالمستخدم (إذا كان دوره مصنعة)
  createdAt: string;
  isProtected?: boolean; // حساب المدير العام المحمي من الحذف أو التعديل
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
  priority: 'normal' | 'urgent';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: 'delete' | 'edit' | 'create' | 'status_change';
  targetType: 'أوردر' | 'منتج' | 'ورشة' | 'مصروف' | 'مستخدم' | 'إعلان';
  details: string;
}

export interface ActiveUserSession {
  id: string;
  userId: string;
  username: string;
  name: string;
  role: UserRole;
  ipAddress: string;
  loginTime: string;
  lastActive: string;
  deviceInfo: string;
  status: 'active' | 'idle';
}
