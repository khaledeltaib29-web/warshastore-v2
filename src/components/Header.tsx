import React from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Plus,
  Layers,
  Sparkles,
  CloudCheck,
  CloudOff,
  Download,
  Bell,
  UserCheck,
  ShieldCheck,
  KeyRound,
  LogOut,
  Users,
  Radio,
} from 'lucide-react';
import { AppUser } from '../types';

interface HeaderProps {
  sheetConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt?: string;
  unreadNotificationsCount?: number;
  currentUser?: AppUser;
  onSync: () => void;
  onExportExcel: () => void;
  onOpenNewOrder: () => void;
  onOpenNotifications?: () => void;
  onOpenLoginModal?: () => void;
  onChangePasswordModal?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sheetConnected,
  isSyncing,
  lastSyncedAt,
  unreadNotificationsCount = 0,
  currentUser,
  onSync,
  onExportExcel,
  onOpenNewOrder,
  onOpenNotifications,
  onOpenLoginModal,
  onChangePasswordModal,
  onLogout,
}) => {
  const isManufacturerRole = currentUser?.role === 'manufacturer';

  const getRoleBadgeLabel = (role?: AppUser['role']) => {
    switch (role) {
      case 'super_admin':
        return '👑 المدير العام';
      case 'deputy_admin':
        return '⭐ النائب العام';
      case 'accountant':
        return '📊 مسؤول العمليات (مخصص)';
      case 'manufacturer':
        return '🏭 ورشة مصنعة';
      default:
        return 'مستخدم';
    }
  };

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between gap-2">
        {/* Brand & Mobile-first Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-xl shadow-lg shadow-amber-500/20 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                ورشة في كل بيت
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                النظام الشامل
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              {sheetConnected ? (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CloudCheck className="w-3.5 h-3.5" />
                  Google Sheets متصل
                  {lastSyncedAt && ` (${lastSyncedAt})`}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400">
                  <CloudOff className="w-3.5 h-3.5" />
                  حفظ محلي (جاهز للربط بـ Sheets)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons & User Account Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* User Account Switcher & Change Password Button */}
          {currentUser && (
            <div className="flex items-center gap-1">
              {onOpenLoginModal && (
                <button
                  onClick={onOpenLoginModal}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all text-xs font-bold"
                  title="تسجيل الدخول / تبديل الحساب"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-slate-100 font-black truncate max-w-[100px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold">
                      {getRoleBadgeLabel(currentUser.role)}
                    </span>
                  </div>
                </button>
              )}

              {onChangePasswordModal && (
                <button
                  onClick={onChangePasswordModal}
                  className="p-2 bg-slate-800 hover:bg-amber-500/20 text-amber-400 rounded-xl border border-slate-700 transition-colors"
                  title="تغيير كلمة المرور الخاصة بحسابك"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 active:scale-95 text-rose-300 rounded-xl border border-rose-800 transition-all text-xs font-bold shadow-xs"
              title="تسجيل الخروج من النظام"
            >
              <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="hidden sm:inline">تسجيل خروج</span>
            </button>
          )}

          {/* Notification Center Bell Button */}
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 sm:px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
              title="مركز الإشعارات والتنبيهات"
            >
              <div className="relative">
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-slate-900 animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </div>
              <span className="hidden md:inline text-xs font-bold text-slate-200">الإشعارات</span>
            </button>
          )}

          {/* Prominent Data Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs sm:text-sm font-bold px-2.5 sm:px-3.5 py-2 rounded-xl transition-all shadow-md shadow-blue-600/20 ${
              isSyncing ? 'opacity-70 cursor-wait' : ''
            }`}
            title="مزامنة البيانات فوراً مع Google Sheets"
          >
            <RefreshCw className={`w-4 h-4 text-amber-300 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">مزامنة البيانات</span>
          </button>

          {/* Admin-only buttons */}
          {!isManufacturerRole && (
            <>
              {/* Quick Add Order Button */}
              <button
                onClick={onOpenNewOrder}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20"
                title="إضافة أوردر جديد"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">أوردر جديد</span>
              </button>

              {/* Export XLSX Button - Strictly restricted to General Manager (super_admin) and Deputy General (deputy_admin) */}
              {(currentUser?.role === 'super_admin' || currentUser?.role === 'deputy_admin') && (
                <button
                  onClick={onExportExcel}
                  className="hidden lg:flex items-center gap-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-2 rounded-xl border border-emerald-800/60 transition-all cursor-pointer"
                  title="تصدير ملف إكسيل XLSX"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>تصدير Excel</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

