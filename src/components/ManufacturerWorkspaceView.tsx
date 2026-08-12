import React, { useState } from 'react';
import {
  Announcement,
  AppUser,
  Manufacturer,
  ManufacturerPayment,
  Order,
  Product,
  SystemNotification,
} from '../types';
import {
  Building2,
  PackageCheck,
  ShoppingBag,
  Coins,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Megaphone,
  Bell,
  Sparkles,
  Search,
  Wallet,
  Receipt,
  Layers,
  Eye,
  X,
  Image as ImageIcon,
} from 'lucide-react';

interface ManufacturerWorkspaceViewProps {
  currentUser: AppUser;
  products: Product[];
  orders: Order[];
  manufacturers: Manufacturer[];
  payments: ManufacturerPayment[];
  announcements: Announcement[];
  notifications: SystemNotification[];
}

export const ManufacturerWorkspaceView: React.FC<ManufacturerWorkspaceViewProps> = ({
  currentUser,
  products,
  orders,
  manufacturers,
  payments,
  announcements,
  notifications,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'financials' | 'announcements'>(
    'products'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Flexible workshop matching helper
  const isMyWorkshopMatch = (nameToCheck?: string, codeToCheck?: string) => {
    if (!nameToCheck && !codeToCheck) return false;
    const targetName = (nameToCheck || '').trim().toLowerCase();
    const targetCode = (codeToCheck || '').trim().toLowerCase();
    const wName = (currentUser.manufacturerName || '').trim().toLowerCase();
    const uName = currentUser.name.trim().toLowerCase();
    const userName = currentUser.username.trim().toLowerCase();

    if (wName && (targetName === wName || targetName.includes(wName) || wName.includes(targetName))) return true;
    if (uName && (targetName === uName || targetName.includes(uName) || uName.includes(targetName))) return true;
    if (userName && (targetName === userName || targetName.includes(userName) || userName.includes(targetName))) return true;

    if (targetCode && wName && (targetCode === wName || targetCode.includes(wName))) return true;
    if (targetCode && uName && (targetCode === uName || targetCode.includes(uName))) return true;

    return false;
  };

  const workshopName = currentUser.manufacturerName || currentUser.name;

  // Filter products assigned ONLY to this workshop
  const myProducts = products.filter((p) => isMyWorkshopMatch(p.manufacturerName, p.manufacturerCode));

  // Filter orders containing items belonging to this workshop
  const myOrders = orders.filter((o) => {
    if (o.items && o.items.length > 0) {
      return o.items.some((item) => isMyWorkshopMatch(item.manufacturerName));
    }
    return isMyWorkshopMatch(o.manufacturerName);
  });

  // Payments received
  const myPayments = payments.filter((p) => isMyWorkshopMatch(p.manufacturerName));

  // Find assigned manufacturer object or compute dynamically from delivered orders
  const currentMfgObj = manufacturers.find(
    (m) => isMyWorkshopMatch(m.name) || isMyWorkshopMatch(m.code)
  );

  const deliveredOrders = myOrders.filter((o) => o.status === 'تم التسليم');

  const calcTotalWorkmanshipEarned = deliveredOrders.reduce((sum, o) => {
    if (o.items && o.items.length > 0) {
      const workshopItems = o.items.filter((item) => isMyWorkshopMatch(item.manufacturerName));
      return sum + workshopItems.reduce((iSum, item) => iSum + (item.workmanshipCostUnit * item.quantity), 0);
    }
    return sum + (o.totalWorkmanshipCost || 0);
  }, 0);

  const calcPaidAmount = myPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const calcRemainingBalance = Math.max(0, calcTotalWorkmanshipEarned - calcPaidAmount);

  const currentMfg = {
    id: currentMfgObj?.id || 'mfg-default',
    name: workshopName,
    phone: currentMfgObj?.phone || '',
    productsList: currentMfgObj?.productsList || '',
    completedUnits: currentMfgObj?.completedUnits || 0,
    totalWorkmanshipEarned: currentMfgObj?.totalWorkmanshipEarned || calcTotalWorkmanshipEarned,
    paidAmount: currentMfgObj?.paidAmount || calcPaidAmount,
    remainingBalance: currentMfgObj?.remainingBalance ?? calcRemainingBalance,
  };

  // Calculate real-time stats for this workshop
  const totalCompletedUnits = myProducts.reduce((sum, p) => sum + (p.stock || 0), 0);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-emerald-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black">{workshopName}</h2>
              <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                واجهة الورشة المصنعة
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              متابعة المنتجات المسندة، طلبات التشغيل، المستحقات المالية والسيولة، والإعلانات
            </p>
          </div>
        </div>

        {/* Quick Balance Pills */}
        <div className="flex items-center gap-3 bg-emerald-950/80 border border-emerald-800/80 p-3 rounded-2xl">
          <div className="text-center px-2">
            <span className="block text-[10px] text-slate-300 font-bold">المستحق لكم</span>
            <span className="text-base font-black text-amber-400">
              {currentMfg.totalWorkmanshipEarned.toLocaleString('ar-EG')} ج.م
            </span>
          </div>
          <div className="h-8 w-px bg-emerald-800"></div>
          <div className="text-center px-2">
            <span className="block text-[10px] text-slate-300 font-bold">المستلم فعلياً</span>
            <span className="text-base font-black text-emerald-400">
              {currentMfg.paidAmount.toLocaleString('ar-EG')} ج.م
            </span>
          </div>
          <div className="h-8 w-px bg-emerald-800"></div>
          <div className="text-center px-2">
            <span className="block text-[10px] text-slate-300 font-bold">المتبقي</span>
            <span className="text-base font-black text-white">
              {currentMfg.remainingBalance.toLocaleString('ar-EG')} ج.م
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'products'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          منتجات الورشة ({myProducts.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          طلبات التشغيل والأوردرات ({myOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('financials')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'financials'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          الحسابات والمدفوعات ({myPayments.length})
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'announcements'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          الإعلانات العامة ({announcements.length})
        </button>
      </div>

      {/* TAB 1: WORKSHOP PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myProducts.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
                <PackageCheck className="w-10 h-10 mx-auto opacity-30 text-emerald-600" />
                <p className="text-sm font-bold">لا توجد منتجات أو أكواد مسندة إلى هذه الورشة حالياً.</p>
              </div>
            ) : (
              myProducts.map((p, idx) => {
                const displayStatus = p.status || (p.stock === 0 ? 'مباع' : 'متاح');
                return (
                  <div
                    key={`${p.id}-${idx}`}
                    className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          onClick={() => setSelectedImage(p.imageUrl || null)}
                          className="w-14 h-14 object-cover rounded-2xl border-2 border-emerald-400 shadow-xs cursor-pointer hover:scale-105 transition-transform shrink-0"
                          title="انقر لتكبير صورة المنتج"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          <ImageIcon className="w-6 h-6 opacity-40" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                            كود: {p.id}
                          </span>

                          {displayStatus === 'مباع' || p.stock === 0 ? (
                            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                              🔴 مباع
                            </span>
                          ) : displayStatus === 'محجوز' ? (
                            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                              🟠 محجوز
                            </span>
                          ) : (
                            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              🟢 متاح
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-black text-slate-900 mt-1 truncate">{p.name}</h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                        <span className="block text-[10px] text-slate-400">المخزون المتاح</span>
                        <span className="text-slate-900 font-black">
                          {p.stock} قطعة
                        </span>
                      </div>

                      <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-100">
                        <span className="block text-[10px] text-emerald-700">تكلفة المصنعية للقطعة</span>
                        <span className="text-emerald-950 font-black">
                          {p.workmanshipCost.toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WORKSHOP ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900">
            أوردرات المبيعات وسجل الطلبات الخاصة بمنتجات الورشة
          </h3>

          <div className="space-y-3">
            {myOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs font-bold">لا توجد أوردرات جارية أو سابقة لهذه الورشة</p>
              </div>
            ) : (
              myOrders.map((o, idx) => (
                <div
                  key={`${o.id}-${idx}`}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                        #{o.id}
                      </span>
                      <span className="font-bold text-slate-900">{o.customerName}</span>
                      <span className="text-slate-400 font-mono">({o.date})</span>
                    </div>

                    <div className="text-slate-600 font-semibold">
                      المنتجات:
                      {o.items && o.items.length > 0
                        ? o.items
                            .filter(
                              (i) =>
                                i.manufacturerName.trim().toLowerCase() ===
                                workshopName.trim().toLowerCase()
                            )
                            .map((i) => `${i.productName} (${i.quantity} قطعة)`)
                            .join(' ، ')
                        : `${o.productName} (${o.quantity} قطعة)`}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                      إجمالي المصنعية: {o.totalWorkmanshipCost.toLocaleString('ar-EG')} ج.م
                    </span>

                    <span
                      className={`font-black px-3 py-1.5 rounded-xl ${
                        o.status === 'تم التسليم'
                          ? 'bg-emerald-100 text-emerald-800'
                          : o.status === 'ملغي'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FINANCIALS & PAYMENTS */}
      {activeTab === 'financials' && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900">
            سجل المدفوعات والمستحقات المالية التي تم استلامها من الشركة
          </h3>

          <div className="space-y-2.5">
            {myPayments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Receipt className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs font-bold">لا توجد دفعة مسجلة حالياً</p>
              </div>
            ) : (
              myPayments.map((p, idx) => (
                <div
                  key={`${p.id}-${idx}`}
                  className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs font-bold"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-600 text-white rounded-xl">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-slate-900 font-black">
                        دفعة نقدية: {p.amount.toLocaleString('ar-EG')} ج.م
                      </span>
                      <span className="text-[11px] text-slate-500">{p.notes || 'تسوية حساب'}</span>
                    </div>
                  </div>

                  <span className="font-mono text-slate-500 text-[11px]">{p.date}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-3">
          {announcements.map((ann, idx) => (
            <div
              key={`${ann.id}-${idx}`}
              className={`p-4 rounded-2xl border ${
                ann.priority === 'urgent'
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900">{ann.title}</h4>
                <span className="text-[10px] text-slate-400 font-bold">{ann.createdAt}</span>
              </div>
              <p className="text-xs text-slate-700 font-semibold mt-2 whitespace-pre-line leading-relaxed">
                {ann.content}
              </p>
              <div className="mt-2 text-[10px] text-slate-500 font-bold">
                المرسل: {ann.authorName}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Lightbox Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-2xl max-h-[90vh] bg-slate-900 rounded-3xl p-3 border border-slate-800 shadow-2xl overflow-hidden flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImage}
              alt="صورة المنتج المكبرة"
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
