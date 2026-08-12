import React, { useState } from 'react';
import { AppUser, AuditLog, Manufacturer, UserRole } from '../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Edit,
  KeyRound,
  Lock,
  User,
  Building2,
  History,
  CheckCircle2,
  X,
  Search,
  Filter,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';

interface UserManagementViewProps {
  users: AppUser[];
  auditLogs: AuditLog[];
  manufacturers: Manufacturer[];
  currentUser: AppUser;
  onAddUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => void;
  onEditUser: (userId: string, updated: Partial<AppUser>) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  auditLogs,
  manufacturers,
  currentUser,
  onAddUser,
  onEditUser,
  onDeleteUser,
}) => {
  const [activeTab, setActiveTab] = useState<'users_list' | 'audit_logs'>('users_list');

  // New User Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('accountant');
  const [newManufacturerName, setNewManufacturerName] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Password Reset / Edit User State
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('accountant');
  const [editManufacturerName, setEditManufacturerName] = useState('');

  // Audit Logs Filter
  const [auditSearch, setAuditSearch] = useState('');

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isDeputyAdmin = currentUser?.role === 'deputy_admin';

  if (!isSuperAdmin && !isDeputyAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900">غير مسموح بالوصول</h3>
        <p className="text-sm text-slate-600">
          لوحة إدارة المستخدمين والصلاحيات المتقدمة خاصة بالقيادة الإدارية والمدير العام.
        </p>
      </div>
    );
  }

  const visibleUsers = users.filter((u) => {
    if (!isSuperAdmin) {
      return u.role !== 'super_admin' && !u.isProtected;
    }
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newUsername.trim() || !newName.trim()) {
      setFormError('يرجى كتابة اسم المستخدم والاسم الثلاثي.');
      return;
    }

    // Check duplicate username
    if (users.some((u) => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      setFormError('اسم المستخدم هذا موجود بالفعل، اختر اسم مستخدم آخر.');
      return;
    }

    let targetRole = newRole;
    if (!isSuperAdmin && targetRole === 'super_admin') {
      targetRole = 'accountant';
    }

    if (targetRole === 'manufacturer' && !newManufacturerName.trim()) {
      setFormError('يرجى تحديد الورشة المصنعة المرتبطة بهذا الحساب.');
      return;
    }

    onAddUser({
      username: newUsername.trim(),
      password: newPassword.trim() || '123',
      name: newName.trim(),
      role: targetRole,
      manufacturerName: targetRole === 'manufacturer' ? newManufacturerName.trim() : undefined,
    });

    setFormSuccess('تم إنشاء حساب المستخدم وتحديد الصلاحيات بنجاح!');
    setTimeout(() => {
      setFormSuccess('');
      setShowAddModal(false);
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewRole('accountant');
      setNewManufacturerName('');
    }, 1200);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    onEditUser(editingUser.id, {
      name: editName.trim(),
      password: editPassword.trim() || editingUser.password,
      role: editingUser.isProtected ? 'super_admin' : editRole,
      manufacturerName: editRole === 'manufacturer' ? editManufacturerName.trim() : undefined,
    });

    setEditingUser(null);
  };

  const openEditModal = (u: AppUser) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditPassword(u.password || '');
    setEditRole(u.role);
    setEditManufacturerName(u.manufacturerName || '');
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-full border border-amber-300 shadow-2xs">
            👑 المدير العام
          </span>
        );
      case 'deputy_admin':
        return (
          <span className="bg-purple-700 text-white font-black text-xs px-2.5 py-1 rounded-full">
            ⭐ النائب العام
          </span>
        );
      case 'accountant':
        return (
          <span className="bg-blue-600 text-white font-black text-xs px-2.5 py-1 rounded-full">
            📊 مسؤول العمليات (دور مخصص)
          </span>
        );
      case 'manufacturer':
        return (
          <span className="bg-emerald-600 text-white font-black text-xs px-2.5 py-1 rounded-full">
            🏭 ورشة مصنعة
          </span>
        );
    }
  };

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.actorName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.targetType.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* View Header & Stats Bar */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">
              لوحة تحكم إدارة المستخدمين والرقابة
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                حصرياً للعميد والمدير العام
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              إنشاء وتحديث حسابات المستخدمين، تعيين الصلاحيات، ومراقبة سجل العمليات المباشر
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl transition-all shadow-md active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          إضافة مستخدم جديد
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('users_list')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${
            activeTab === 'users_list'
              ? 'bg-slate-900 text-amber-400 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          حسابات المستخدمين ({visibleUsers.length})
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${
              activeTab === 'audit_logs'
                ? 'bg-purple-900 text-amber-300 shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            سجل الرقابة والتتبع المباشر ({auditLogs.length})
          </button>
        )}
      </div>

      {/* TAB 1: USERS LIST */}
      {(activeTab === 'users_list' || !isSuperAdmin) && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleUsers.map((u, idx) => {
              const isSuper = u.role === 'super_admin';
              const isMe = u.id === currentUser.id;
              const canDeputyEdit = isDeputyAdmin ? u.role === 'manufacturer' : true;

              return (
                <div
                  key={`${u.id}-${idx}`}
                  className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 ${
                    isSuper
                      ? 'bg-gradient-to-br from-amber-50 via-white to-amber-50/50 border-amber-300 shadow-xs'
                      : 'bg-white border-slate-200 shadow-xs hover:shadow-md'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 font-black text-sm flex items-center justify-center">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                            {u.name}
                            {isMe && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">
                                أنت
                              </span>
                            )}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-mono">@{u.username}</p>
                        </div>
                      </div>

                      {getRoleBadge(u.role)}
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-600 font-bold">
                        <span>كلمة السر:</span>
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                          {u.password || '••••••'}
                        </span>
                      </div>

                      {u.manufacturerName && (
                        <div className="flex items-center justify-between text-slate-600 font-bold pt-1 border-t border-slate-200/60">
                          <span>الورشة المرتبطة:</span>
                          <span className="text-emerald-700 font-black">
                            {u.manufacturerName}
                          </span>
                        </div>
                      )}
                    </div>

                    {u.isProtected && (
                      <div className="p-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        حساب المدير العام محمي تماماً ضد الحذف أو تغيير الدور.
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {canDeputyEdit ? (
                      <button
                        onClick={() => openEditModal(u)}
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        تعديل / تغيير كلمة السر
                      </button>
                    ) : (
                      <span className="flex-1 py-1.5 bg-slate-100 text-slate-400 font-bold text-[11px] rounded-xl text-center">
                        محمي للمدير العام فقط
                      </span>
                    )}

                    {isSuperAdmin && (
                      <button
                        onClick={() => {
                          if (u.isProtected) return;
                          if (confirm(`هل أنت تأكد من حذف حساب (${u.name}) بشكل نهائي؟`)) {
                            onDeleteUser(u.id);
                          }
                        }}
                        disabled={u.isProtected}
                        className={`py-1.5 px-3 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 ${
                          u.isProtected
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'
                        }`}
                        title={u.isProtected ? 'محمي من الحذف' : 'حذف الحساب'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-purple-600" />
                سجل المراقبة والرقابة الإدارية المباشر
              </h3>
              <p className="text-xs text-slate-500">
                تسجيل آلي لجميع عمليات الحذف والتعديل التي يتم إجراؤها بواسطة النائب العام أو المستخدمين.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="بحث في السجل..."
                className="w-full pr-9 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <History className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs font-bold">لا توجد عمليات مسجلة متطابقة مع البحث حالياً</p>
              </div>
            ) : (
              filteredLogs.map((log, idx) => (
                <div
                  key={`${log.id}-${idx}`}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 transition-all flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl text-white font-bold shrink-0 mt-0.5 ${
                        log.action === 'delete'
                          ? 'bg-rose-600'
                          : log.action === 'edit'
                          ? 'bg-amber-600'
                          : 'bg-emerald-600'
                      }`}
                    >
                      {log.action === 'delete' ? 'حذف' : log.action === 'edit' ? 'تعديل' : 'إضافة'}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900">{log.actorName}</span>
                        {getRoleBadge(log.actorRole)}
                        <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {log.targetType}
                        </span>
                      </div>

                      <p className="text-slate-700 font-semibold leading-relaxed whitespace-pre-line">
                        {log.details}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-bold shrink-0 font-mono">
                    {log.timestamp}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Add New User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                إنشاء حساب مستخدم جديد
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-4 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {formSuccess}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">الاسم الثلاثي / الاسم التجاري</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: أحمد مصطفى أو ورشة الياسمين"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">اسم المستخدم (Login)</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="مثال: deputy2"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">كلمة المرور</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="123"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">الدور والصلاحيات</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {isSuperAdmin && (
                    <option value="super_admin">👑 المدير العام (Super Admin) - صلاحيات مطلقة واعتماد إداري</option>
                  )}
                  <option value="deputy_admin">⭐ النائب العام (Deputy Admin) - إدارة كاملة مع حجب Google Sheets وحظر إدارة المستخدمين</option>
                  <option value="data_entry">📝 مدخل بيانات / مسؤول عمليات (إدخال أوردرات ومنتجات - منع حذف الورش - حظر مالي)</option>
                  <option value="accountant">📊 محاسب (أوردرات، منتجات، مستحقات ومصروفات)</option>
                  <option value="manufacturer">🏭 ورشة مصنعة (واجهة الورشة المخصصة)</option>
                </select>
              </div>

              {newRole === 'manufacturer' && (
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">
                    الورشة المصنعة المرتبطة بهذا الحساب
                  </label>
                  <select
                    value={newManufacturerName}
                    onChange={(e) => setNewManufacturerName(e.target.value)}
                    className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl font-black text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- اختر الورشة المصنعة --</option>
                    {manufacturers.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.code || m.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-all shadow-md mt-2"
              >
                اعتماد وتفعيل الحساب
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit User / Change Password */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-400" />
                تعديل بيانات الحساب ({editingUser.username})
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">الاسم الثلاثي</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">تحديث كلمة المرور</label>
                <input
                  type="text"
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {!editingUser.isProtected && (
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">الدور والصلاحية</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {isSuperAdmin && (
                      <option value="super_admin">👑 المدير العام (Super Admin) - صلاحيات مطلقة واعتماد إداري</option>
                    )}
                    <option value="deputy_admin">⭐ النائب العام (Deputy Admin) - إدارة كاملة مع حجب Google Sheets وحظر إدارة المستخدمين</option>
                    <option value="data_entry">📝 مدخل بيانات / مسؤول عمليات (إدخال أوردرات ومنتجات - منع حذف الورش - حظر مالي)</option>
                    <option value="accountant">📊 محاسب (أوردرات، منتجات، مستحقات ومصروفات)</option>
                    <option value="manufacturer">🏭 ورشة مصنعة (واجهة الورشة المخصصة)</option>
                  </select>
                </div>
              )}

              {editRole === 'manufacturer' && (
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">الورشة المرتبطة</label>
                  <select
                    value={editManufacturerName}
                    onChange={(e) => setEditManufacturerName(e.target.value)}
                    className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl font-black text-emerald-950"
                  >
                    <option value="">-- اختر الورشة --</option>
                    {manufacturers.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black rounded-xl transition-all shadow-md mt-2"
              >
                حفظ التعديلات
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
