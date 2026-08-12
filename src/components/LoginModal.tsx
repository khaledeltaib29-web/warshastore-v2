import React, { useState } from 'react';
import { AppUser } from '../types';
import {
  UserCheck,
  X,
  Lock,
  User,
  ShieldAlert,
  ShieldCheck,
  Briefcase,
  CheckCircle2,
  LogIn,
  KeyRound,
  Sparkles,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  currentUser: AppUser;
  onSelectUser: (user: AppUser) => void;
  isLoggedIn?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSelectUser,
  isLoggedIn = true,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const found = users.find(
      (u) =>
        u.username.trim().toLowerCase() === usernameInput.trim().toLowerCase() &&
        u.password === passwordInput.trim()
    );

    if (found) {
      onSelectUser(found);
      setSuccessMsg(`تم تسجيل الدخول بنجاح بصلاحية: ${getRoleLabel(found.role)}`);
      setUsernameInput('');
      setPasswordInput('');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 800);
    } else {
      setErrorMsg('اسم المستخدم أو كلمة المرور غير صحيحة. يرجى التأكد وإعادة المحاولة.');
    }
  };

  const getRoleLabel = (role: AppUser['role']) => {
    switch (role) {
      case 'super_admin':
        return 'المدير العام (Super Admin)';
      case 'deputy_admin':
        return 'النائب العام (Deputy Admin)';
      case 'accountant':
        return 'مسؤول العمليات والمنتجات (دور مخصص)';
      case 'manufacturer':
        return 'مصنعة / ورشة إنتاج';
      default:
        return 'مستخدم';
    }
  };

  const getRoleBadge = (role: AppUser['role']) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
            المدير العام
          </span>
        );
      case 'deputy_admin':
        return (
          <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            النائب العام
          </span>
        );
      case 'data_entry':
        return (
          <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            مدخل بيانات / عمليات
          </span>
        );
      case 'accountant':
        return (
          <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            محاسب
          </span>
        );
      case 'manufacturer':
        return (
          <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            ورشة مصنعة
          </span>
        );
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 ${isLoggedIn ? 'bg-slate-950/80 backdrop-blur-xs' : 'bg-slate-950/95 backdrop-blur-md'}`}>
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base">
                {isLoggedIn ? 'تسجيل الدخول / تبديل الحساب' : 'تسجيل الدخول إلى النظام'}
              </h3>
              <p className="text-xs text-slate-400">
                {isLoggedIn ? 'يمكنك التبديل بين الحسابات أو إدخال بيانات جديدة' : 'أدخل بيانات الاعتماد الخاصة بحسابك للوصول إلى النظام'}
              </p>
            </div>
          </div>
          {isLoggedIn && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Current Active Account Card */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm">
                {isLoggedIn && currentUser ? currentUser.name.charAt(0) : '🔒'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-slate-900">
                    {isLoggedIn && currentUser ? currentUser.name : 'الجلسة غير نشطة'}
                  </h4>
                  {isLoggedIn && currentUser && getRoleBadge(currentUser.role)}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isLoggedIn ? 'الحساب النشط حالياً في النظام' : 'اختر حساباً وأدخل كلمة المرور لتسجيل الدخول'}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${isLoggedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {isLoggedIn ? 'نشط' : 'مسجل خروج'}
            </span>
          </div>

          {/* Form Login */}
          <form onSubmit={handleLoginSubmit} className="space-y-3 bg-slate-100/70 p-4 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <LogIn className="w-4 h-4 text-amber-600" />
              تسجيل الدخول بالحساب الرئيسي أو الفرعي
            </h4>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {successMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="أدخل اسم المستخدم الخاص بك"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              تسجيل الدخول
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] font-bold text-slate-500">
          محمي بنظام WarshaStore RBAC - إدارة الصلاحيات المتقدمة.
        </div>
      </div>
    </div>
  );
};
