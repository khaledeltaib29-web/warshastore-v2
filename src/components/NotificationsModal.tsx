import React, { useState } from 'react';
import { SystemNotification, ScheduledReminder, PendingApprovalRequest, AppUser } from '../types';
import { isNotificationForUser, isReminderForUser } from '../services/notificationService';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  ShoppingBag,
  Package,
  DollarSign,
  Send,
  Info,
  Clock,
  Plus,
  Calendar,
  CheckSquare,
  Square,
  AlertCircle,
  Tag,
  ShieldAlert,
  ShieldCheck,
  Check,
  CheckCircle2,
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  reminders: ScheduledReminder[];
  pendingApprovals?: PendingApprovalRequest[];
  currentUser?: AppUser;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onMarkAsRead: (id: string) => void;
  onAddReminder: (reminder: Omit<ScheduledReminder, 'id' | 'createdAt' | 'completed'>) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onApprovePendingRequest?: (reqId: string) => void;
  onRejectPendingRequest?: (reqId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  reminders,
  pendingApprovals = [],
  currentUser,
  onMarkAllAsRead,
  onClearAll,
  onMarkAsRead,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onApprovePendingRequest,
  onRejectPendingRequest,
}) => {
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const pendingRequestsList = pendingApprovals.filter((p) => p.status === 'pending');

  const [activeTab, setActiveTab] = useState<'notifications' | 'reminders' | 'approvals'>(
    isSuperAdmin && pendingRequestsList.length > 0 ? 'approvals' : 'notifications'
  );
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'payment' | 'sale'>('all');

  // Form state for scheduling a new reminder
  const [showAddForm, setShowAddForm] = useState(false);
  const [remTitle, setRemTitle] = useState('');
  const [remDesc, setRemDesc] = useState('');
  const [remDate, setRemDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [remTime, setRemTime] = useState('12:00');
  const [remType, setRemType] = useState<ScheduledReminder['type']>('order_followup');

  if (!isOpen) return null;

  // Role-based notification and privacy filter
  const visibleNotifications = notifications.filter((n) =>
    isNotificationForUser(n, currentUser || null)
  );

  const visibleReminders = reminders.filter((r) =>
    isReminderForUser(r, currentUser || null)
  );

  const unreadCount = visibleNotifications.filter((n) => !n.read).length;
  const pendingRemindersCount = visibleReminders.filter((r) => !r.completed).length;

  const filteredNotifications = visibleNotifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'payment') return n.type === 'payment';
    if (activeFilter === 'sale') return n.type === 'sale';
    return true;
  });

  const getIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'sale':
        return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case 'stock':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'payment':
        return <DollarSign className="w-4 h-4 text-purple-600" />;
      case 'expense':
        return <Send className="w-4 h-4 text-rose-600" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-amber-600" />;
    }
  };

  const getBgColor = (type: SystemNotification['type'], read: boolean) => {
    if (read) return 'bg-white border-slate-200';
    switch (type) {
      case 'payment':
        return 'bg-purple-50/90 border-purple-200';
      case 'sale':
        return 'bg-emerald-50/90 border-emerald-200';
      case 'stock':
        return 'bg-blue-50/90 border-blue-200';
      case 'reminder':
        return 'bg-amber-50/90 border-amber-200';
      default:
        return 'bg-slate-50/90 border-slate-200';
    }
  };

  const handleApplyPreset = (presetType: ScheduledReminder['type'], title: string) => {
    setRemType(presetType);
    setRemTitle(title);
    setShowAddForm(true);
  };

  const handleSubmitReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim()) return;

    onAddReminder({
      title: remTitle.trim(),
      description: remDesc.trim(),
      dueDate: remDate,
      dueTime: remTime,
      type: remType,
    });

    setRemTitle('');
    setRemDesc('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center sm:justify-end p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white w-full sm:max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col my-auto sm:ml-4">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Bell className="w-5 h-5 text-amber-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                مركز الإشعارات والتنبيهات
                {unreadCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[11px] font-black">
                    {unreadCount} جديد
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">تتبع الحركات وجدولة التنبيهات المحلية</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: System Notifications vs Local Scheduled Reminders vs Super Admin Approvals */}
        <div className={`grid ${isSuperAdmin ? 'grid-cols-3' : 'grid-cols-2'} bg-slate-100 p-1 border-b border-slate-200 text-xs font-black shrink-0`}>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('approvals')}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1 relative ${
                activeTab === 'approvals'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                  : 'text-amber-800 bg-amber-100 hover:bg-amber-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>الطلبات والمعاينة</span>
              {pendingRequestsList.length > 0 && (
                <span className="bg-rose-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full animate-pulse">
                  {pendingRequestsList.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'notifications'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>التنبيهات ({notifications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'reminders'
                ? 'bg-purple-900 text-amber-300 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>المجدولة ({pendingRemindersCount})</span>
          </button>
        </div>

        {/* --- TAB 0: SUPER ADMIN APPROVALS --- */}
        {activeTab === 'approvals' && isSuperAdmin && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl text-xs text-amber-900 font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
              <span>طلبات التعديل والحذف الواردة من المستخدمين بانتظار الاعتماد النهائي من المدير العام.</span>
            </div>

            {pendingRequestsList.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-2 opacity-50" />
                <p className="font-bold text-sm text-slate-600">لا توجد طلبات معلقة حالياً</p>
                <p className="text-xs text-slate-400 mt-1">جميع طلبات التعديل والحذف تم البت فيها.</p>
              </div>
            ) : (
              pendingRequestsList.map((req, idx) => (
                <div key={`${req.id}-${idx}`} className="bg-white border-2 border-amber-200 rounded-2xl p-3.5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                      طلب {req.actionType === 'delete' ? 'حذف' : 'تعديل'} ({req.targetType})
                    </span>
                    <span className="text-slate-400 font-semibold dir-ltr">{req.timestamp}</span>
                  </div>

                  <p className="text-xs font-extrabold text-slate-900">
                    {req.targetSummary}
                  </p>

                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl font-bold flex items-center justify-between">
                    <span>مقدم الطلب: <strong className="text-slate-900">{req.requesterName}</strong></span>
                    <span className="text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-md font-black">{req.requesterRole}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => onApprovePendingRequest && onApprovePendingRequest(req.id)}
                      className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 px-3 rounded-xl shadow-xs transition-all"
                    >
                      <Check className="w-4 h-4" />
                      اعتماد وتطبيق
                    </button>
                    <button
                      onClick={() => onRejectPendingRequest && onRejectPendingRequest(req.id)}
                      className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs py-2 px-3 rounded-xl shadow-xs transition-all"
                    >
                      <X className="w-4 h-4" />
                      رفض الطلب
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- TAB 1: SYSTEM NOTIFICATIONS --- */}
        {activeTab === 'notifications' && (
          <>
            {/* Filter Toolbar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-slate-900 text-amber-400'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  الكل ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveFilter('unread')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    activeFilter === 'unread'
                      ? 'bg-purple-700 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  غير مقروء ({unreadCount})
                </button>
                <button
                  onClick={() => setActiveFilter('payment')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    activeFilter === 'payment'
                      ? 'bg-purple-900 text-amber-300'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  الدفعات
                </button>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    title="تحديد الكل كـ مقروء"
                    className="p-1.5 bg-white text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    قراءة الكل
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={onClearAll}
                    title="مسح كافة الإشعارات"
                    className="p-1.5 bg-white text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="p-3 space-y-2 overflow-y-auto flex-1">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Bell className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs font-bold">لا توجد إشعارات حالياً</p>
                </div>
              ) : (
                filteredNotifications.map((n, idx) => (
                  <div
                    key={`${n.id}-${idx}`}
                    onClick={() => onMarkAsRead(n.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all hover:shadow-xs ${getBgColor(
                      n.type,
                      n.read
                    )}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-xl bg-white shadow-2xs border border-slate-100 shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-black text-slate-900 truncate">{n.title}</h4>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" />
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-700 leading-snug whitespace-pre-line">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* --- TAB 2: SCHEDULED LOCAL REMINDERS --- */}
        {activeTab === 'reminders' && (
          <div className="p-3 space-y-3 overflow-y-auto flex-1">
            {/* Quick Presets Buttons */}
            <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-950 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-purple-600" />
                  اختصارات التنبيه السريع:
                </span>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-xs bg-purple-700 hover:bg-purple-600 text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  تنبيه مخصص
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                <button
                  onClick={() =>
                    handleApplyPreset('order_followup', 'متابعة أوردر متأخر وتحديد موعد التسليم')
                  }
                  className="p-2 bg-white text-slate-800 hover:bg-purple-100/70 border border-purple-200 rounded-xl text-right transition-colors"
                >
                  🕒 متابعة أوردر متأخر
                </button>

                <button
                  onClick={() =>
                    handleApplyPreset('payment_collection', 'تحصيل دفعات اليوم ومستحقات الورش')
                  }
                  className="p-2 bg-white text-slate-800 hover:bg-purple-100/70 border border-purple-200 rounded-xl text-right transition-colors"
                >
                  💰 تحصيل دفعات اليوم
                </button>
              </div>
            </div>

            {/* Form for scheduling new reminder */}
            {showAddForm && (
              <form
                onSubmit={handleSubmitReminder}
                className="bg-slate-900 text-white p-3.5 rounded-2xl space-y-2.5 text-xs animate-fadeIn"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-extrabold text-amber-400">جدولة تنبيه جديد داخل النظام</h4>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">عنوان التنبيه / الملاحظة</label>
                  <input
                    type="text"
                    required
                    value={remTitle}
                    onChange={(e) => setRemTitle(e.target.value)}
                    placeholder="مثال: متابعة أوردر العميل أحمد أو تحصيل أجر الخياطة..."
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">تاريخ التنبيه</label>
                    <input
                      type="date"
                      required
                      value={remDate}
                      onChange={(e) => setRemDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">الوقت</label>
                    <input
                      type="time"
                      required
                      value={remTime}
                      onChange={(e) => setRemTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl transition-colors"
                >
                  حفظ الجدولة وإضافة التنبيه
                </button>
              </form>
            )}

            {/* List of Scheduled Reminders */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-700 flex items-center justify-between">
                <span>قائمة المواعيد المجدولة</span>
                <span className="text-[11px] text-slate-400">تظهر لك فور دخول التطبيق</span>
              </h4>

              {visibleReminders.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                  <Clock className="w-6 h-6 mx-auto opacity-30" />
                  <p className="text-xs font-bold">لا توجد تنبيهات مجدولة حالياً</p>
                  <p className="text-[11px]">اضغط على الاختصارات أعلاه لإضافة أول تنبيه.</p>
                </div>
              ) : (
                visibleReminders.map((r, idx) => (
                  <div
                    key={`${r.id}-${idx}`}
                    className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-2 ${
                      r.completed
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-amber-50/80 border-amber-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <button
                        onClick={() => onToggleReminder(r.id)}
                        className="mt-0.5 text-slate-600 hover:text-amber-700 shrink-0"
                      >
                        {r.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <h5
                          className={`text-xs font-black ${
                            r.completed ? 'line-through text-slate-500' : 'text-slate-900'
                          }`}
                        >
                          {r.title}
                        </h5>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-bold">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-purple-600" />
                            {r.dueDate}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {r.dueTime || '12:00'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteReminder(r.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] font-bold text-slate-500 shrink-0">
          تنبيهات WarshaStore متزامنة مع شيت البيانات والتليجرام.
        </div>
      </div>
    </div>
  );
};
