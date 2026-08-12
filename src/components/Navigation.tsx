import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  PackageCheck,
  Users,
  Receipt,
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { UserRole } from '../types';

export type TabType =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'manufacturers'
  | 'expenses'
  | 'reports'
  | 'sheets'
  | 'users'
  | 'workshop';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  ordersCount: number;
  userRole?: UserRole;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  ordersCount,
  userRole = 'super_admin',
}) => {
  const isSuperAdmin = userRole === 'super_admin';
  const isManufacturer = userRole === 'manufacturer';

  let tabs: { id: TabType; label: string; icon: any; badge?: number | null }[] = [];

  if (userRole === 'manufacturer') {
    tabs = [
      { id: 'workshop' as TabType, label: 'واجهة الورشة المصنعة', icon: Building2 },
    ];
  } else if (userRole === 'data_entry') {
    // Data Entry / Operations Officer: Orders, Products, Manufacturers
    tabs = [
      { id: 'dashboard' as TabType, label: 'الرئيسية التشغيلية', icon: LayoutDashboard },
      {
        id: 'orders' as TabType,
        label: 'إدخال الأوردرات',
        icon: ShoppingBag,
        badge: ordersCount > 0 ? ordersCount : null,
      },
      { id: 'products' as TabType, label: 'إدارة المنتجات', icon: PackageCheck },
      { id: 'manufacturers' as TabType, label: 'المصنعين والمستحقات', icon: Users },
    ];
  } else if (userRole === 'accountant') {
    // Accountant: Orders, Products, Manufacturers, Expenses
    tabs = [
      { id: 'dashboard' as TabType, label: 'الرئيسية', icon: LayoutDashboard },
      {
        id: 'orders' as TabType,
        label: 'الأوردرات',
        icon: ShoppingBag,
        badge: ordersCount > 0 ? ordersCount : null,
      },
      { id: 'products' as TabType, label: 'إدارة المنتجات', icon: PackageCheck },
      { id: 'manufacturers' as TabType, label: 'مستحقات الورش', icon: Users },
      { id: 'expenses' as TabType, label: 'المصروفات', icon: Receipt },
    ];
  } else if (userRole === 'deputy_admin') {
    // Deputy General: Operational control & manufacturer user account control
    tabs = [
      { id: 'dashboard' as TabType, label: 'الرئيسية', icon: LayoutDashboard },
      {
        id: 'orders' as TabType,
        label: 'الأوردرات',
        icon: ShoppingBag,
        badge: ordersCount > 0 ? ordersCount : null,
      },
      { id: 'products' as TabType, label: 'المنتجات والأسعار', icon: PackageCheck },
      { id: 'manufacturers' as TabType, label: 'المصنعين والمستحقات', icon: Users },
      { id: 'expenses' as TabType, label: 'المصروفات', icon: Receipt },
      { id: 'reports' as TabType, label: 'التقارير والأرباح', icon: BarChart3 },
      { id: 'users' as TabType, label: 'إدارة حسابات الورش', icon: ShieldCheck },
    ];
  } else {
    // Super Admin (المدير العام): Absolute control
    tabs = [
      { id: 'dashboard' as TabType, label: 'الرئيسية', icon: LayoutDashboard },
      {
        id: 'orders' as TabType,
        label: 'الأوردرات',
        icon: ShoppingBag,
        badge: ordersCount > 0 ? ordersCount : null,
      },
      { id: 'products' as TabType, label: 'المنتجات', icon: PackageCheck },
      { id: 'manufacturers' as TabType, label: 'المصنعين', icon: Users },
      { id: 'expenses' as TabType, label: 'المصروفات', icon: Receipt },
      { id: 'reports' as TabType, label: 'التقارير', icon: BarChart3 },
      { id: 'sheets' as TabType, label: 'Google Sheets', icon: FileSpreadsheet },
      { id: 'users' as TabType, label: 'إدارة المستخدمين والصلاحيات', icon: ShieldCheck },
    ];
  }

  return (
    <>
      {/* Desktop / Tablet Top Navigation Bar */}
      <nav className="hidden md:block bg-white border-b border-slate-200 sticky top-[61px] z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Fixed Navigation Bar (Mobile-First Touch Design) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md text-slate-300 border-t border-slate-800 z-40 shadow-2xl pb-safe">
        <div className="flex items-center justify-around overflow-x-auto px-1.5 py-1 gap-1 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all min-w-[62px] shrink-0 min-h-[52px] relative ${
                  isActive
                    ? 'text-amber-400 bg-slate-800 font-black shadow-inner border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 active:bg-slate-800/50'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-amber-400' : ''}`} />
                  {tab.badge && (
                    <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 text-[10px] min-w-4 h-4 px-1 flex items-center justify-center rounded-full font-black">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 whitespace-nowrap font-bold">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

