import React from 'react';
import {
  Users,
  X,
  Radio,
  Clock,
  Globe,
  Monitor,
  ShieldCheck,
  UserCheck,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { AppUser, UserRole } from '../types';

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

interface ActiveUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSessions: ActiveUserSession[];
  currentUser?: AppUser;
}

export const ActiveUsersModal: React.FC<ActiveUsersModalProps> = ({
  isOpen,
  onClose,
  activeSessions,
  currentUser,
}) => {
  if (!isOpen) return null;

  const canAccess =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'deputy_admin' ||
    currentUser?.role === 'accountant';

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md">
            👑 المدير العام
          </span>
        );
      case 'deputy_admin':
        return (
          <span className="bg-purple-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md">
            ⭐ النائب العام
          </span>
        );
      case 'accountant':
        return (
          <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md">
            📊 مسؤول العمليات
          </span>
        );
      case 'manufacturer':
        return (
          <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md">
            🏭 ورشة مصنعة
          </span>
        );
      default:
        return (
          <span className="bg-slate-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md">
            مستخدم
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center relative">
              <Users className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">المستخدمين المتصلين الآن</h3>
                <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                  مباشر ({activeSessions.length})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                شاشة التتبع الفوري والجلسات النشطة بالنظام في الوقت الحالي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {!canAccess ? (
          <div className="p-8 text-center space-y-3">
            <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">غير مصرح بالوصول</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              هذه الشاشة متاحة فقط للمدير العام، النائب العام، ومسؤول العمليات.
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
            {/* Top Status Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 text-emerald-900 font-bold">
                <Radio className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>المزامنة والتتبع الفوري شغالين باستمرار بدون أي تأخير</span>
              </div>
              <span className="text-[11px] font-extrabold bg-emerald-600 text-white px-2.5 py-1 rounded-xl">
                {activeSessions.length} جلسة نشطة
              </span>
            </div>

            {/* Active Sessions List */}
            {activeSessions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <UserCheck className="w-12 h-12 mx-auto text-slate-300" />
                <p className="font-bold text-sm">لا يوجد مستخدمين متصلين الآن</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSessions.map((session, idx) => {
                  const isCurrent = session.userId === currentUser?.id;
                  return (
                    <div
                      key={`${session.id}-${idx}`}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Left info */}
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-11 h-11 rounded-2xl bg-slate-900 text-amber-400 font-black text-lg flex items-center justify-center shrink-0">
                            {session.name ? session.name.charAt(0) : '👤'}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-sm text-slate-900">{session.name}</h4>
                            <span className="text-xs font-mono text-slate-500 font-semibold">
                              (@{session.username})
                            </span>
                            {getRoleBadge(session.role)}
                            {isCurrent && (
                              <span className="bg-amber-200 text-amber-900 font-black text-[10px] px-2 py-0.5 rounded-md">
                                أنت الآن
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                            <span className="flex items-center gap-1 font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                              <Globe className="w-3.5 h-3.5 text-blue-600" />
                              {session.ipAddress}
                            </span>

                            <span className="flex items-center gap-1 text-slate-500">
                              <Monitor className="w-3.5 h-3.5 text-slate-400" />
                              {session.deviceInfo}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right info: Timing */}
                      <div className="sm:text-left text-xs space-y-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0">
                        <div className="flex items-center sm:justify-end gap-1 text-slate-600 font-extrabold">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>وقت الدخول: {session.loginTime}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-semibold">
                          آخر ظهور: {session.lastActive}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            <span>يتم الحديث تلقائياً ولحظياً</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
