import React, { useState, useEffect } from 'react';
import {
  Order,
  OrderStatus,
  Product,
  Manufacturer,
  Expense,
  StoreSettings,
  SystemNotification,
  ScheduledReminder,
  AppUser,
  Announcement,
  AuditLog,
  UserRole,
  ManufacturerPayment,
  PendingApprovalRequest,
  ActiveUserSession,
} from './types';
import {
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_MANUFACTURERS,
  INITIAL_EXPENSES,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_AUDIT_LOGS,
} from './data/initialData';
import { calculateDashboardStats, recalculateManufacturersFromDeliveredOrders } from './utils/calculations';
import { exportWarshaStoreToExcel } from './utils/exportToExcel';
import { isNotificationForUser } from './services/notificationService';
import {
  sendTelegramNotification,
  formatManufacturerPaymentTelegramMessage,
  formatNewOrderTelegramMessage,
  formatNewProductTelegramMessage,
  formatLowStockTelegramMessage,
} from './utils/telegram';

import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { OrdersView } from './components/OrdersView';
import { ProductsView } from './components/ProductsView';
import { ManufacturersView } from './components/ManufacturersView';
import { ExpensesView } from './components/ExpensesView';
import { ReportsView } from './components/ReportsView';
import { SheetsSettingsView } from './components/SheetsSettingsView';
import { UserManagementView } from './components/UserManagementView';
import { ManufacturerWorkspaceView } from './components/ManufacturerWorkspaceView';
import { AnnouncementsWidget } from './components/AnnouncementsWidget';
import { LoginModal } from './components/LoginModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { sendBrowserPushNotification, playNotificationSound } from './utils/notifications';

import { OrderFormModal } from './components/OrderFormModal';
import { ProductFormModal } from './components/ProductFormModal';
import { ExpenseFormModal } from './components/ExpenseFormModal';
import { ManufacturerPaymentModal } from './components/ManufacturerPaymentModal';
import { ManufacturerFormModal } from './components/ManufacturerFormModal';
import { ManufacturerStatementModal } from './components/ManufacturerStatementModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ActiveUsersModal } from './components/ActiveUsersModal';
import { FullBackupModal, FullBackupData } from './components/FullBackupModal';
import { ExcelDataModal } from './components/ExcelDataModal';


export default function App() {
  const isCloudLoadedRef = React.useRef(false);

  // Load state from LocalStorage or fall back to zeroed clean dataset
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('warsha_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_ORDERS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('warsha_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [manufacturers, setManufacturers] = useState<Manufacturer[]>(() => {
    const zeroed = INITIAL_MANUFACTURERS.map((m) => ({
      ...m,
      completedUnits: 0,
      totalWorkmanshipEarned: 0,
      paidAmount: 0,
      remainingBalance: 0,
    }));

    const savedM = localStorage.getItem('warsha_manufacturers');
    const baseM = savedM ? JSON.parse(savedM) : zeroed;

    const savedOrdersStr = localStorage.getItem('warsha_orders');
    let savedOrders: Order[] = [];
    if (savedOrdersStr) {
      try {
        savedOrders = JSON.parse(savedOrdersStr);
      } catch {}
    }
    const delivered = (Array.isArray(savedOrders) ? savedOrders : []).filter(
      (o: Order) => o.status === 'تم التسليم'
    );
    return recalculateManufacturersFromDeliveredOrders(delivered, baseM);
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('warsha_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [payments, setPayments] = useState<ManufacturerPayment[]>(() => {
    const saved = localStorage.getItem('warsha_payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('warsha_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem('warsha_notifications');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: '1',
            title: 'مرحباً بك في WarshaStore',
            message: 'تم تفعيل مركز التنبيهات المباشر وتتبع مستحقات المصنعين والربط بالتليجرام.',
            type: 'system',
            timestamp: new Date().toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            read: false,
          },
        ];
  });

  const [reminders, setReminders] = useState<ScheduledReminder[]>(() => {
    const saved = localStorage.getItem('warsha_reminders');
    if (saved) return JSON.parse(saved);
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'rem-1',
        title: 'متابعة أوردرات متأخرة وتأكيد الشحن',
        dueDate: today,
        dueTime: '14:00',
        type: 'order_followup',
        completed: false,
        createdAt: new Date().toISOString(),
        notified: false,
      },
      {
        id: 'rem-2',
        title: 'تحصيل دفعات اليوم ومستحقات الورش',
        dueDate: today,
        dueTime: '17:00',
        type: 'payment_collection',
        completed: false,
        createdAt: new Date().toISOString(),
        notified: false,
      },
    ];
  });

  // Users & RBAC State
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('warsha_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    const saved = localStorage.getItem('warsha_current_user');
    return saved
      ? JSON.parse(saved)
      : INITIAL_USERS[0] || {
          id: 'user-super-admin',
          username: 'admin',
          password: 'admin',
          name: 'المدير العام',
          role: 'super_admin',
          createdAt: new Date().toISOString(),
          isProtected: true,
        };
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('warsha_announcements');
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('warsha_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalRequest[]>(() => {
    const saved = localStorage.getItem('warsha_pending_approvals');
    return saved ? JSON.parse(saved) : [];
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('warsha_is_logged_in') === 'true';
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(() => !isLoggedIn);

  // Load cloud database on mount for multi-device sync
  useEffect(() => {
    fetch('/api/db')
      .then((res) => res.json())
      .then((resData) => {
        if (resData && resData.success && resData.data) {
          const cloud = resData.data;
          if (Array.isArray(cloud.orders) && cloud.orders.length > 0) setOrders(cloud.orders);
          if (Array.isArray(cloud.products) && cloud.products.length > 0) setProducts(cloud.products);
          if (Array.isArray(cloud.manufacturers) && cloud.manufacturers.length > 0) setManufacturers(cloud.manufacturers);
          if (Array.isArray(cloud.expenses) && cloud.expenses.length > 0) setExpenses(cloud.expenses);
          if (cloud.settings) setSettings(cloud.settings);
          if (Array.isArray(cloud.users) && cloud.users.length > 0) setUsers(cloud.users);
        }
      })
      .catch((err) => console.log('Cloud DB fetch fallback:', err))
      .finally(() => {
        isCloudLoadedRef.current = true;
      });

    // Fetch dynamic Google Sheets title and discovered tabs on mount / refresh
    fetch('/api/sheets/info')
      .then((res) => res.json())
      .then((info) => {
        if (info && info.success) {
          setSettings((prev) => ({
            ...prev,
            spreadsheetTitle: info.title || prev.spreadsheetTitle,
            discoveredTabs: info.tabsFound || prev.discoveredTabs,
          }));
        }
      })
      .catch((err) => console.log('Sheets metadata info fetch error:', err));
    // Ensure browser tab title is official
    document.title = 'ورشة في كل بيت';
  }, []);

  // Multi-Device Cloud Persistence Effect
  useEffect(() => {
    if (!isCloudLoadedRef.current) return;
    const payload = {
      orders,
      products,
      manufacturers,
      expenses,
      payments,
      settings,
      users,
      auditLogs,
      pendingApprovals,
      activeSessions,
      lastUpdated: new Date().toISOString(),
    };
    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }, [orders, products, manufacturers, expenses, payments, settings, users, auditLogs]);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals visibility states
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isActiveUsersModalOpen, setIsActiveUsersModalOpen] = useState(false);
  const [isFullBackupModalOpen, setIsFullBackupModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const [activeSessions, setActiveSessions] = useState<ActiveUserSession[]>(() => {
    const saved = localStorage.getItem('warsha_active_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: 'sess-super-admin',
        userId: 'u-1',
        username: 'admin',
        name: 'أحمد محمود',
        role: 'super_admin',
        ipAddress: '197.38.14.82 (مصر - متصل)',
        loginTime: 'اليوم 09:15 ص',
        lastActive: 'الآن (منذ لحظات)',
        deviceInfo: 'Chrome / Windows 11',
        status: 'active',
      },
    ];
  });

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedManufacturerForPayment, setSelectedManufacturerForPayment] =
    useState<string | undefined>(undefined);

  const [isManufacturerModalOpen, setIsManufacturerModalOpen] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);

  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [selectedManufacturerForStatement, setSelectedManufacturerForStatement] =
    useState<Manufacturer | null>(null);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('warsha_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('warsha_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('warsha_manufacturers', JSON.stringify(manufacturers));
  }, [manufacturers]);

  useEffect(() => {
    localStorage.setItem('warsha_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('warsha_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('warsha_pending_approvals', JSON.stringify(pendingApprovals));
  }, [pendingApprovals]);

  // Lock active tab to 'workshop' for manufacturer users
  useEffect(() => {
    if (currentUser.role === 'manufacturer' && activeTab !== 'workshop') {
      setActiveTab('workshop');
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    localStorage.setItem('warsha_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('warsha_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('warsha_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('warsha_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('warsha_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('warsha_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('warsha_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('warsha_active_sessions', JSON.stringify(activeSessions));
  }, [activeSessions]);

  // Keep current active session updated in real-time
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      const nowStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      const deviceStr =
        typeof navigator !== 'undefined' && navigator?.userAgent && navigator.userAgent.includes('Mobile')
          ? 'Mobile / جوال'
          : 'Chrome / كمبيوتر';

      setActiveSessions((prev) => {
        const existingIdx = prev.findIndex((s) => s.userId === currentUser.id);
        const updatedSession: ActiveUserSession = {
          id: existingIdx >= 0 ? prev[existingIdx].id : `sess-${currentUser.id}-${Date.now()}`,
          userId: currentUser.id,
          username: currentUser.username,
          name: currentUser.name,
          role: currentUser.role,
          ipAddress: existingIdx >= 0 ? prev[existingIdx].ipAddress : '197.38.14.82 (مصر - القاهرة)',
          loginTime: existingIdx >= 0 ? prev[existingIdx].loginTime : `اليوم ${nowStr}`,
          lastActive: `الآن (${nowStr})`,
          deviceInfo: deviceStr,
          status: 'active',
        };

        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = updatedSession;
          return next;
        } else {
          return [updatedSession, ...prev];
        }
      });
    }
  }, [currentUser, isLoggedIn]);


  const [notifiedLowStock, setNotifiedLowStock] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('warsha_notified_low_stock');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('warsha_notified_low_stock', JSON.stringify(notifiedLowStock));
  }, [notifiedLowStock]);

  // Notification helper with strict targeted privacy filtering
  const addNotification = (
    title: string,
    message: string,
    type: SystemNotification['type'],
    options?: {
      targetUserId?: string;
      recipientId?: string;
      targetManufacturerName?: string;
      targetManufacturerCode?: string;
      targetRole?: UserRole;
      isGlobal?: boolean;
      forAdminOnly?: boolean;
    }
  ) => {
    const safeTitle = (title || '').substring(0, 200);
    const safeMsg = (message || '').substring(0, 2000);

    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: safeTitle,
      message: safeMsg,
      type,
      timestamp: new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      read: false,
      recipientId: options?.recipientId || options?.targetUserId,
      targetUserId: options?.targetUserId || options?.recipientId,
      ...options,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Send browser push notification & audio ONLY if current user is targeted/authorized to receive it
    if (currentUser && isNotificationForUser(newNotif, currentUser)) {
      sendBrowserPushNotification(title, message);
      playNotificationSound();
    }
  };

  // Admin Audit Notification Logger (Exclusive for Super Admin)
  const logAdminAudit = (title: string, message: string) => {
    const actorName = currentUser?.name || 'مستخدم بالنظام';
    const auditNotif: SystemNotification = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: `👁️ [رقابة المدير] ${title}`,
      message: `${message} (بواسطة: ${actorName})`,
      type: 'admin_audit',
      timestamp: new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      read: false,
      forAdminOnly: true,
      actorName,
    };
    setNotifications((prev) => [auditNotif, ...prev]);
    if (currentUser && isNotificationForUser(auditNotif, currentUser)) {
      sendBrowserPushNotification(`[رقابة المدير] ${title}`, `${message} (بواسطة: ${actorName})`);
      playNotificationSound();
    }
  };

  const handleChangePassword = (userId: string, newPass: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPass } : u))
    );
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, password: newPass };
      setCurrentUser(updatedUser);
      localStorage.setItem('warsha_current_user', JSON.stringify(updatedUser));
    }
    logAdminAudit('تغيير كلمة المرور', `قام المستخدم ${currentUser.name} بتحديث كلمة المرور الخاصة به.`);
  };

  // Automatic Local Reminder Checker (Runs on load and every 30 seconds)
  useEffect(() => {
    const checkDueReminders = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      reminders.forEach((r) => {
        if (!r.completed && !r.notified) {
          if (
            r.dueDate < todayStr ||
            (r.dueDate === todayStr && (r.dueTime || '00:00') <= currentMin)
          ) {
            // Send In-App Notification
            addNotification(
              '⏰ تنبيه محلي مجدول مستحق الآن',
              `${r.title}\nتاريخ التنبيه: ${r.dueDate} - الوقت: ${r.dueTime || '12:00'}`,
              'reminder',
              {
                targetUserId: r.targetUserId,
                targetManufacturerName: r.targetManufacturerName,
                targetRole: r.targetRole,
                forAdminOnly: r.forAdminOnly,
              }
            );
            // Mark notified
            setReminders((prev) =>
              prev.map((item) => (item.id === r.id ? { ...item, notified: true } : item))
            );
          }
        }
      });
    };

    checkDueReminders();
    const timer = setInterval(checkDueReminders, 30000);
    return () => clearInterval(timer);
  }, [reminders]);

  // Automatic Low Stock Inspector
  useEffect(() => {
    const threshold = settings.lowStockThreshold ?? 10;

    products.forEach((p) => {
      const lastNotified = notifiedLowStock[p.id];

      if (p.stock <= threshold) {
        if (lastNotified === undefined || p.stock < lastNotified) {
          // Trigger in-app notification
          addNotification(
            `⚠️ تنبيه نقص مخزون حرج (${p.name})`,
            `المنتَج: ${p.name} (كود: ${p.id})\nالمخزون الحالي: ${p.stock} قطعة فقط (أقل من الحد المسموح: ${threshold} قطعة).\nيرجى التواصل مع الورشة المصنعة (${p.manufacturerName}) لبدء تصنيع تشغيلة ودفعات جديدة فوراً.`,
            'stock',
            {
              targetManufacturerName: p.manufacturerName,
              targetManufacturerCode: p.manufacturerCode,
            }
          );

          // Trigger Telegram notification if enabled
          if (settings.telegramEnabled) {
            const tgMsg = formatLowStockTelegramMessage(
              p.name,
              p.id,
              p.stock,
              threshold,
              p.manufacturerName
            );
            sendTelegramNotification(settings, tgMsg).catch((err) =>
              console.error('Telegram stock notification error:', err)
            );
          }

          setNotifiedLowStock((prev) => ({ ...prev, [p.id]: p.stock }));
        }
      } else {
        if (lastNotified !== undefined) {
          setNotifiedLowStock((prev) => {
            const copy = { ...prev };
            delete copy[p.id];
            return copy;
          });
        }
      }
    });
  }, [products, settings.lowStockThreshold, settings.telegramEnabled]);

  const handleAddReminder = (
    newRem: Omit<ScheduledReminder, 'id' | 'createdAt' | 'completed'>
  ) => {
    const item: ScheduledReminder = {
      ...newRem,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completed: false,
      notified: false,
    };
    setReminders((prev) => [item, ...prev]);
    addNotification(
      'تم إضافة تنبيه مجدول جديد',
      `عنوان التنبيه: ${item.title}\nالموعد: ${item.dueDate} ${item.dueTime || ''}`,
      'reminder'
    );
  };

  const handleToggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  // Audit Recording & Direct Super Admin Alert Dispatcher
  const recordAuditAndAlert = (
    action: 'delete' | 'edit' | 'create' | 'status_change',
    targetType: 'أوردر' | 'منتج' | 'ورشة' | 'مصروف' | 'مستخدم' | 'إعلان',
    details: string
  ) => {
    const newLog: AuditLog = {
      id: 'audit-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      targetType,
      details,
    };

    setAuditLogs((prev) => [newLog, ...prev]);

    // Dispatch targeted alerts
    if (currentUser.role === 'deputy_admin') {
      const alertTitle = `👁️ [تنبيه سري] إجراء النائب العام (${currentUser.name})`;
      const alertMsg = `قام النائب العام (${currentUser.name}) بـ إجراء (${
        action === 'delete' ? 'حذف' : action === 'edit' ? 'تعديل' : action === 'create' ? 'إضافة' : 'تحديث'
      }) على ${targetType}.\nالتفاصيل: ${details}`;

      addNotification(alertTitle, alertMsg, 'admin_audit', { forAdminOnly: true });

      if (settings.telegramEnabled) {
        const tgMsg = `⚠️ *تنبيه رقابة سري للمدير العام - WarshaStore*\n👤 *النائب العام:* ${currentUser.name}\n⚡ *العملية:* ${action} على ${targetType}\n📝 *التفاصيل:* ${details}`;
        sendTelegramNotification(settings, tgMsg).catch((err) => console.error(err));
      }
    } else if (currentUser.role === 'data_entry' || currentUser.role === 'accountant') {
      const alertTitle = `📝 [تعديل مدخل البيانات] ${currentUser.name}`;
      const alertMsg = `قام موظف إدخال البيانات (${currentUser.name}) بـ إجراء (${
        action === 'delete' ? 'حذف' : action === 'edit' ? 'تعديل' : action === 'create' ? 'إضافة' : 'تحديث'
      }) على ${targetType}.\nالتفاصيل: ${details}`;

      addNotification(alertTitle, alertMsg, 'system', { forAdminOnly: true, targetRole: 'deputy_admin' });

      if (settings.telegramEnabled) {
        const tgMsg = `📝 *تنبيه إدخال البيانات - WarshaStore*\n👤 *الموظف:* ${currentUser.name}\n⚡ *العملية:* ${action} على ${targetType}\n📝 *التفاصيل:* ${details}`;
        sendTelegramNotification(settings, tgMsg).catch((err) => console.error(err));
      }
    }
  };

  // Session & Authentication Logout Handler
  const handleLogout = () => {
    if (currentUser) {
      setActiveSessions((prev) => prev.filter((s) => s.userId !== currentUser.id));
    }
    localStorage.setItem('warsha_is_logged_in', 'false');
    setIsLoggedIn(false);
    setIsLoginModalOpen(true);
    addNotification(
      'تسجيل خروج',
      `قام المستخدم (${currentUser.name}) بتسجيل الخروج من النظام.`,
      'system'
    );
    recordAuditAndAlert('status_change', 'مستخدم', `قام المستخدم (${currentUser.name}) بتسجيل الخروج.`);
  };

  // Full Backup Restore Handler
  const handleRestoreFullBackup = (restored: FullBackupData) => {
    if (Array.isArray(restored.orders)) setOrders(restored.orders);
    if (Array.isArray(restored.products)) setProducts(restored.products);
    if (Array.isArray(restored.manufacturers)) setManufacturers(restored.manufacturers);
    if (Array.isArray(restored.expenses)) setExpenses(restored.expenses);
    if (Array.isArray(restored.payments)) setPayments(restored.payments);
    if (restored.settings && typeof restored.settings === 'object') setSettings(restored.settings);
    if (Array.isArray(restored.notifications)) setNotifications(restored.notifications);
    if (Array.isArray(restored.reminders)) setReminders(restored.reminders);
    if (Array.isArray(restored.users)) setUsers(restored.users);
    if (Array.isArray(restored.announcements)) setAnnouncements(restored.announcements);
    if (Array.isArray(restored.auditLogs)) setAuditLogs(restored.auditLogs);
    if (Array.isArray(restored.pendingApprovals)) setPendingApprovals(restored.pendingApprovals);
    if (Array.isArray(restored.activeSessions)) setActiveSessions(restored.activeSessions);

    addNotification(
      'استعادة نسخة احتياطية',
      'تمت استعادة كافة بيانات النظام بنجاح من ملف النسخة الاحتياطية (ZIP).',
      'system'
    );

    recordAuditAndAlert('status_change', 'مستخدم', 'قام المدير العام باستعادة نسخة احتياطية كاملة للنظام.');
  };

  // Pending Approval Action Handlers for Super Admin
  const handleApprovePendingRequest = (reqId: string) => {
    if (currentUser.role !== 'super_admin') return;
    const req = pendingApprovals.find((p) => p.id === reqId);
    if (!req) return;

    // Apply the requested mutation to actual database state
    if (req.actionType === 'delete') {
      if (req.targetType === 'أوردر') {
        setOrders((prev) => {
          const updated = prev.filter((o) => o.id !== req.targetId);
          const deliveredOrders = updated.filter((o) => o.status === 'تم التسليم');
          setManufacturers((prevM) => recalculateManufacturersFromDeliveredOrders(deliveredOrders, prevM));
          return updated;
        });
      } else if (req.targetType === 'منتج') {
        setProducts((prev) => prev.filter((p) => p.id !== req.targetId));
      } else if (req.targetType === 'مصروف') {
        setExpenses((prev) => prev.filter((e) => e.id !== req.targetId));
      } else if (req.targetType === 'ورشة') {
        setManufacturers((prev) => prev.filter((m) => m.id !== req.targetId));
      }
    } else if (req.actionType === 'edit' && req.payload) {
      if (req.targetType === 'أوردر') {
        setOrders((prev) => {
          const copy = prev.map((o) => (o.id === req.payload.id ? req.payload : o));
          const deliveredOrders = copy.filter((o) => o.status === 'تم التسليم');
          setManufacturers((prevM) => recalculateManufacturersFromDeliveredOrders(deliveredOrders, prevM));
          return copy;
        });
      } else if (req.targetType === 'منتج') {
        setProducts((prev) => prev.map((p) => (p.id === req.payload.id ? req.payload : p)));
      } else if (req.targetType === 'مصروف') {
        setExpenses((prev) => prev.map((e) => (e.id === req.payload.id ? req.payload : e)));
      } else if (req.targetType === 'ورشة') {
        setManufacturers((prev) => prev.map((m) => (m.id === req.payload.id ? req.payload : m)));
      }
    }

    setPendingApprovals((prev) =>
      prev.map((p) => (p.id === reqId ? { ...p, status: 'approved' } : p))
    );

    addNotification(
      'تمت الموافقة والاعتماد',
      `قام المدير العام باعتما د طلب ${req.actionType === 'delete' ? 'حذف' : 'تعديل'} (${req.targetType}) المقدم من (${req.requesterName}).`,
      'system'
    );
    recordAuditAndAlert('status_change', req.targetType, `قام المدير العام باعتما د طلب ${req.actionType} على ${req.targetType} (#${req.targetId}).`);
  };

  const handleRejectPendingRequest = (reqId: string) => {
    if (currentUser.role !== 'super_admin') return;
    const req = pendingApprovals.find((p) => p.id === reqId);
    if (!req) return;

    setPendingApprovals((prev) =>
      prev.map((p) => (p.id === reqId ? { ...p, status: 'rejected' } : p))
    );

    addNotification(
      'تم رفض الطلب',
      `قام المدير العام برفض طلب الـ ${req.actionType === 'delete' ? 'حذف' : 'تعديل'} المقدم من (${req.requesterName}).`,
      'system'
    );
    recordAuditAndAlert('status_change', req.targetType, `قام المدير العام برفض طلب ${req.actionType} على ${req.targetType} (#${req.targetId}).`);
  };

  // User Management Handlers
  const handleAddUser = (userFields: Omit<AppUser, 'id' | 'createdAt'>) => {
    // If action performed by Deputy Admin, restrict created role strictly to manufacturer
    const roleToAssign = currentUser.role === 'deputy_admin' ? 'manufacturer' : userFields.role;

    const newUser: AppUser = {
      ...userFields,
      role: roleToAssign,
      id: 'user-' + Date.now(),
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    recordAuditAndAlert(
      'create',
      'مستخدم',
      `تم إنشاء حساب مستخدم جديد (${newUser.name}) بدور: ${newUser.role} بواسطة (${currentUser.name})`
    );
  };

  const handleEditUser = (userId: string, updatedFields: Partial<AppUser>) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    // Deputy Admin cannot edit Super Admin or non-manufacturer accounts
    if (currentUser.role === 'deputy_admin') {
      if (targetUser.role === 'super_admin' || targetUser.isProtected || targetUser.role !== 'manufacturer') {
        alert('غير مسموح للنائب العام بتعديل بيانات أو كلمة مرور هذا الحساب.');
        return;
      }
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          if (u.isProtected) {
            return {
              ...u,
              name: updatedFields.name || u.name,
              password: updatedFields.password || u.password,
            };
          }
          // Deputy Admin cannot escalate roles
          const finalRole = currentUser.role === 'deputy_admin' ? u.role : (updatedFields.role || u.role);
          return { ...u, ...updatedFields, role: finalRole };
        }
        return u;
      })
    );

    recordAuditAndAlert('edit', 'مستخدم', `تم تعديل بيانات أو كلمة سر الحساب (${targetUser.name}) بواسطة (${currentUser.name})`);
  };

  const handleDeleteUser = (userId: string) => {
    if (currentUser.role === 'deputy_admin') {
      alert('محظور نهائياً: النائب العام لا يملك صلاحية حذف الحسابات أو الورش.');
      return;
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser || targetUser.isProtected) return;

    setUsers((prev) => prev.filter((u) => u.id !== userId));
    recordAuditAndAlert('delete', 'مستخدم', `تم حذف حساب المستخدم (${targetUser.name})`);
  };

  // Announcement Handlers
  const handleAddAnnouncement = (annFields: Omit<Announcement, 'id' | 'createdAt'>) => {
    const newAnn: Announcement = {
      ...annFields,
      id: 'ann-' + Date.now(),
      createdAt: new Date().toLocaleDateString('ar-EG'),
    };

    setAnnouncements((prev) => [newAnn, ...prev]);
    addNotification(
      `📢 إعلان جديد: ${newAnn.title}`,
      newAnn.content,
      'system',
      { isGlobal: true }
    );
    recordAuditAndAlert('create', 'إعلان', `تم نشر إعلان عام جديد: (${newAnn.title})`);
  };

  const handleEditAnnouncement = (ann: Announcement) => {
    setAnnouncements((prev) => prev.map((a) => (a.id === ann.id ? ann : a)));
    recordAuditAndAlert('edit', 'إعلان', `تم تعديل الإعلان العام: (${ann.title})`);
  };

  const handleDeleteAnnouncement = (annId: string) => {
    const target = announcements.find((a) => a.id === annId);
    setAnnouncements((prev) => prev.filter((a) => a.id !== annId));
    if (target) {
      recordAuditAndAlert('delete', 'إعلان', `تم حذف الإعلان العام: (${target.title})`);
    }
  };

  // Recalculate Dashboard KPIs
  const stats = calculateDashboardStats(
    orders,
    products,
    manufacturers,
    expenses,
    settings.baseCapital ?? 0
  );

  // 1. Order Mutation Handler
  const handleSaveOrder = (orderData: Partial<Order>) => {
    const newOrder = orderData as Order;
    const isEditing = orders.some((o) => o.id === newOrder.id);

    if (
      isEditing &&
      currentUser.role !== 'super_admin' &&
      currentUser.role !== 'deputy_admin' &&
      currentUser.role !== 'data_entry'
    ) {
      const newReq: PendingApprovalRequest = {
        id: `req-${Date.now()}`,
        timestamp: new Date().toLocaleString('ar-EG'),
        requesterName: currentUser.name,
        requesterRole: currentUser.role,
        actionType: 'edit',
        targetType: 'أوردر',
        targetId: newOrder.id,
        targetSummary: `طلب تعديل أوردر رقم (#${newOrder.id}) للعميل (${newOrder.customerName})`,
        payload: newOrder,
        status: 'pending',
      };
      setPendingApprovals((prev) => [newReq, ...prev]);
      addNotification(
        'طلب تعديل أوردر معلق',
        `قام المستخدم (${currentUser.name}) بطلب تعديل الأوردر رقم (#${newOrder.id}). بانتظار موافقة المدير العام.`,
        'system',
        { forAdminOnly: true }
      );
      recordAuditAndAlert(
        'edit',
        'أوردر',
        `قام المستخدم (${currentUser.name}) بطلب تعديل الأوردر رقم (#${newOrder.id}) - تحويل للـ Pending Approval`
      );
      alert('تم رفع طلب التعديل إلى التنبيهات بانتظار موافقة واعتماد المدير العام (Super Admin).');
      return;
    }

    let updatedOrdersList: Order[] = [];
    setOrders((prevOrders) => {
      const existingIdx = prevOrders.findIndex((o) => o.id === newOrder.id);
      if (existingIdx >= 0) {
        updatedOrdersList = [...prevOrders];
        updatedOrdersList[existingIdx] = newOrder;
      } else {
        updatedOrdersList = [newOrder, ...prevOrders];
      }

      // Automatically recalculate manufacturer stats strictly for delivered orders
      const deliveredOrders = updatedOrdersList.filter((o) => o.status === 'تم التسليم');
      setManufacturers((prevM) => recalculateManufacturersFromDeliveredOrders(deliveredOrders, prevM));

      return updatedOrdersList;
    });

    if (isEditing) {
      recordAuditAndAlert('edit', 'أوردر', `تم تعديل الأوردر (#${newOrder.id}) للعميل ${newOrder.customerName}`);
    } else {
      recordAuditAndAlert('create', 'أوردر', `تم إضافة أوردر جديد (#${newOrder.id}) للعميل ${newOrder.customerName}`);
    }

    // Automatically update product stock
    let updatedProductsList = products;
    if (newOrder.status !== 'ملغي') {
      updatedProductsList = products.map((p) => {
        if (p.id === newOrder.productId) {
          const updatedStock = Math.max(0, p.stock - newOrder.quantity);
          return { ...p, stock: updatedStock };
        }
        return p;
      });
      setProducts(updatedProductsList);
    }

    // In-app Notification
    const orderTotal =
      newOrder.totalAmountDue ||
      newOrder.subtotalAfterDiscount ||
      newOrder.totalSale ||
      0;

    // Send targeted notification to involved workshops
    const involvedWorkshops = new Set<string>();
    if (newOrder.items && newOrder.items.length > 0) {
      newOrder.items.forEach((item) => {
        if (item.manufacturerName) involvedWorkshops.add(item.manufacturerName);
      });
    } else if (newOrder.productId) {
      const matchP = products.find((p) => p.id === newOrder.productId);
      if (matchP?.manufacturerName) involvedWorkshops.add(matchP.manufacturerName);
    }

    involvedWorkshops.forEach((mName) => {
      addNotification(
        'طلب جديد لمنتجات الورشة',
        `تم تسجيل أوردر جديد (#${newOrder.id}) يضم منتجات مسندة لورشتكم (${mName}).`,
        'sale',
        { targetManufacturerName: mName }
      );
    });

    // General sales notification for Super Admin only
    addNotification(
      'تسجيل عملية بيع جديدة',
      `تم تسجيل أوردر جديد (${newOrder.id}) بقيمة ${orderTotal.toLocaleString('ar-EG')} ج.م للعميل ${newOrder.customerName}.`,
      'sale',
      { forAdminOnly: true }
    );

    // Optional Telegram Notification for Sales
    if (settings.telegramEnabled) {
      const itemsCount =
        newOrder.items && newOrder.items.length > 0
          ? newOrder.items.reduce((s, i) => s + (i.quantity || 1), 0)
          : newOrder.quantity || 1;
      const tgMsg = formatNewOrderTelegramMessage(
        newOrder.id,
        newOrder.customerName,
        orderTotal,
        itemsCount
      );
      sendTelegramNotification(settings, tgMsg).catch((err) => console.error(err));
    }

    // Automatic Immediate Sync to Google Sheets
    if (settings.spreadsheetId) {
      handleSyncToGoogleSheets(true, updatedOrdersList, updatedProductsList, manufacturers, expenses);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    if (currentUser.role !== 'super_admin') {
      const newReq: PendingApprovalRequest = {
        id: `req-${Date.now()}`,
        timestamp: new Date().toLocaleString('ar-EG'),
        requesterName: currentUser.name,
        requesterRole: currentUser.role,
        actionType: 'delete',
        targetType: 'أوردر',
        targetId: orderId,
        targetSummary: `طلب حذف أوردر رقم (#${orderId}) للعميل (${targetOrder.customerName})`,
        status: 'pending',
      };
      setPendingApprovals((prev) => [newReq, ...prev]);
      addNotification(
        'طلب حذف أوردر معلق',
        `قام المستخدم (${currentUser.name}) بطلب حذف الأوردر رقم (#${orderId}). بانتظار موافقة المدير العام.`,
        'system',
        { forAdminOnly: true }
      );
      recordAuditAndAlert(
        'status_change',
        'أوردر',
        `قام المستخدم (${currentUser.name}) بطلب حذف الأوردر رقم (#${orderId}) - تحويل للـ Pending Approval`
      );
      alert('تم رفع طلب الحذف إلى التنبيهات بانتظار موافقة واعتماد المدير العام (Super Admin).');
      return;
    }

    if (confirm('هل أنت تأكد من رغبتك في حذف هذا الأوردر؟')) {
      let updatedOrders: Order[] = [];
      setOrders((prev) => {
        updatedOrders = prev.filter((o) => o.id !== orderId);
        const deliveredOrders = updatedOrders.filter((o) => o.status === 'تم التسليم');
        setManufacturers((prevM) => recalculateManufacturersFromDeliveredOrders(deliveredOrders, prevM));
        return updatedOrders;
      });
      if (targetOrder) {
        recordAuditAndAlert(
          'delete',
          'أوردر',
          `تم حذف الأوردر رقم (#${orderId}) للعميل (${targetOrder.customerName})`
        );
      }
      if (settings.spreadsheetId) {
        handleSyncToGoogleSheets(true, updatedOrders, products, manufacturers, expenses);
      }
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    let updatedOrders: Order[] = [];
    setOrders((prev) => {
      updatedOrders = prev.map((o) => (o.id === orderId ? { ...o, status } : o));
      const deliveredOrders = updatedOrders.filter((o) => o.status === 'تم التسليم');
      setManufacturers((prevM) => recalculateManufacturersFromDeliveredOrders(deliveredOrders, prevM));
      return updatedOrders;
    });

    const targetOrd = orders.find((o) => o.id === orderId);
    if (targetOrd) {
      const workshops = new Set<string>();
      if (targetOrd.items && targetOrd.items.length > 0) {
        targetOrd.items.forEach((item) => {
          if (item.manufacturerName) workshops.add(item.manufacturerName);
        });
      } else if (targetOrd.productId) {
        const matchP = products.find((p) => p.id === targetOrd.productId);
        if (matchP?.manufacturerName) workshops.add(matchP.manufacturerName);
      }

      workshops.forEach((mName) => {
        addNotification(
          'تحديث حالة أوردر الورشة',
          `تم تغيير حالة الأوردر (#${orderId}) المشتمل على منتجاتكم إلى: (${status})`,
          'sale',
          { targetManufacturerName: mName }
        );
      });
    }

    addNotification(
      'تحديث حالة الأوردر',
      `تم تغيير حالة الأوردر (${orderId}) إلى: ${status}`,
      'sale',
      { forAdminOnly: true }
    );
    recordAuditAndAlert(
      'status_change',
      'أوردر',
      `تم تغيير حالة الأوردر (#${orderId}) إلى ${status}`
    );

    if (settings.spreadsheetId) {
      handleSyncToGoogleSheets(true, updatedOrders, products, manufacturers, expenses);
    }
  };

  // 2. Product Mutation Handler
  const handleSaveProduct = (prodData: Partial<Product>) => {
    const newProd = prodData as Product;
    const isEditing = products.some((p) => p.id === newProd.id);

    if (
      isEditing &&
      currentUser.role !== 'super_admin' &&
      currentUser.role !== 'deputy_admin' &&
      currentUser.role !== 'data_entry'
    ) {
      const newReq: PendingApprovalRequest = {
        id: `req-${Date.now()}`,
        timestamp: new Date().toLocaleString('ar-EG'),
        requesterName: currentUser.name,
        requesterRole: currentUser.role,
        actionType: 'edit',
        targetType: 'منتج',
        targetId: newProd.id,
        targetSummary: `طلب تعديل منتج (${newProd.name}) كود #${newProd.id}`,
        payload: newProd,
        status: 'pending',
      };
      setPendingApprovals((prev) => [newReq, ...prev]);
      addNotification(
        'طلب تعديل منتج معلق',
        `قام المستخدم (${currentUser.name}) بطلب تعديل المنتج (${newProd.name}). بانتظار موافقة المدير العام.`,
        'system',
        { forAdminOnly: true }
      );
      recordAuditAndAlert('edit', 'منتج', `قام المستخدم (${currentUser.name}) بطلب تعديل المنتج (${newProd.name})`);
      alert('تم رفع طلب التعديل إلى التنبيهات بانتظار موافقة واعتماد المدير العام (Super Admin).');
      return;
    }

    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === newProd.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newProd;
        return updated;
      } else {
        return [newProd, ...prev];
      }
    });

    if (isEditing) {
      recordAuditAndAlert('edit', 'منتج', `تم تعديل بيانات المنتج (${newProd.name}) كود ${newProd.id}`);
    } else {
      recordAuditAndAlert('create', 'منتج', `تم إدخال منتج جديد (${newProd.name}) كود ${newProd.id}`);
    }

    addNotification(
      'إدخال منتج جديد بالمخزون',
      `تم توثيق المنتَج (${newProd.name}) بكود ${newProd.id} ومخزون ${newProd.stock} قطعة للورشة (${newProd.manufacturerName}).`,
      'stock',
      {
        targetManufacturerName: newProd.manufacturerName,
        targetManufacturerCode: newProd.manufacturerCode,
      }
    );

    // Optional Telegram Notification for Products
    if (settings.telegramEnabled) {
      const tgMsg = formatNewProductTelegramMessage(
        newProd.name,
        newProd.id,
        newProd.stock,
        newProd.salePrice,
        newProd.manufacturerName
      );
      sendTelegramNotification(settings, tgMsg).catch((err) => console.error(err));
    }
  };

  const handleImportBulkProducts = (newProducts: Product[]) => {
    if (!newProducts || newProducts.length === 0) return;

    setProducts((prev) => {
      const updated = [...prev];
      newProducts.forEach((newP) => {
        const idx = updated.findIndex((p) => p.id === newP.id);
        if (idx >= 0) {
          updated[idx] = newP;
        } else {
          updated.push(newP);
        }
      });
      return updated;
    });

    addNotification(
      'استيراد منتجات جماعي',
      `تم استيراد ${newProducts.length} منتج بنجاح إلى قاعدة بيانات النظام.`,
      'stock',
      { forAdminOnly: true }
    );

    recordAuditAndAlert(
      'create',
      'منتج',
      `تم استيراد ${newProducts.length} منتج دفعة واحدة من ملف خارجي`
    );

    if (settings.spreadsheetId) {
      setTimeout(() => {
        handleSyncToGoogleSheets(true);
      }, 500);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    if (currentUser.role !== 'super_admin') {
      const newReq: PendingApprovalRequest = {
        id: `req-${Date.now()}`,
        timestamp: new Date().toLocaleString('ar-EG'),
        requesterName: currentUser.name,
        requesterRole: currentUser.role,
        actionType: 'delete',
        targetType: 'منتج',
        targetId: productId,
        targetSummary: `طلب حذف منتج (${target.name}) كود #${productId}`,
        status: 'pending',
      };
      setPendingApprovals((prev) => [newReq, ...prev]);
      addNotification(
        'طلب حذف منتج معلق',
        `قام المستخدم (${currentUser.name}) بطلب حذف المنتج (${target.name}). بانتظار موافقة المدير العام.`,
        'system',
        { forAdminOnly: true }
      );
      recordAuditAndAlert('status_change', 'منتج', `قام المستخدم (${currentUser.name}) بطلب حذف المنتج (${target.name})`);
      alert('تم رفع طلب حذف المنتج إلى التنبيهات بانتظار موافقة واعتماد المدير العام (Super Admin).');
      return;
    }

    if (confirm('هل أنت تأكد من حذف هذا المنتج؟')) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      if (target) {
        recordAuditAndAlert('delete', 'منتج', `تم حذف المنتج (${target.name}) كود ${productId}`);
      }
    }
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    const prod = products.find((p) => p.id === productId);
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
    addNotification(
      'تحديث المخزون',
      `تم تعديل مخزون المنتج (${prod?.name || productId}) إلى ${newStock} قطعة.`,
      'stock',
      {
        targetManufacturerName: prod?.manufacturerName,
        targetManufacturerCode: prod?.manufacturerCode,
      }
    );
    recordAuditAndAlert('edit', 'منتج', `تم تغيير مخزون المنتج ID: ${productId} إلى ${newStock}`);
  };

  // 3. Manufacturer Mutations
  const handleSaveManufacturer = (mdata: Partial<Manufacturer>) => {
    const newM = mdata as Manufacturer;
    const isEditing = manufacturers.some((m) => m.id === newM.id);

    if (isEditing && currentUser.role !== 'super_admin' && currentUser.role !== 'deputy_admin') {
      const newReq: PendingApprovalRequest = {
        id: `req-${Date.now()}`,
        timestamp: new Date().toLocaleString('ar-EG'),
        requesterName: currentUser.name,
        requesterRole: currentUser.role,
        actionType: 'edit',
        targetType: 'ورشة',
        targetId: newM.id,
        targetSummary: `طلب تعديل بيانات ورشة (${newM.name})`,
        payload: newM,
        status: 'pending',
      };
      setPendingApprovals((prev) => [newReq, ...prev]);
      addNotification(
        'طلب تعديل ورشة معلق',
        `قام المستخدم (${currentUser.name}) بطلب تعديل بيانات الورشة (${newM.name}). بانتظار موافقة المدير العام.`,
        'system',
        { forAdminOnly: true }
      );
      recordAuditAndAlert('edit', 'ورشة', `قام المستخدم (${currentUser.name}) بطلب تعديل الورشة (${newM.name})`);
      alert('تم رفع طلب التعديل إلى التنبيهات بانتظار موافقة واعتماد المدير العام (Super Admin).');
      return;
    }

    setManufacturers((prev) => {
      const idx = prev.findIndex((m) => m.id === newM.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newM;
        return updated;
      } else {
        return [newM, ...prev];
      }
    });

    if (isEditing) {
      recordAuditAndAlert('edit', 'ورشة', `تم تعديل بيانات الورشة (${newM.name})`);
    } else {
      recordAuditAndAlert('create', 'ورشة', `تم إضافة ورشة جديدة (${newM.name})`);
    }

    addNotification(
      'اعتماد ورشة / مصنعة',
      `تم تسجيل وتحديث بيانات المصنعة (${newM.name}) كود: ${newM.code || newM.id}.`,
      'system',
      {
        targetManufacturerName: newM.name,
        targetManufacturerCode: newM.code || newM.id,
      }
    );
  };

  const handleSaveManufacturerPayment = (
    manufacturerName: string,
    amount: number,
    notes: string = 'دفعة أجر مصنعية تحت الحساب'
  ) => {
    let targetMCode = 'MF';
    let newRemaining = 0;

    const newPayment: ManufacturerPayment = {
      id: 'pay-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      manufacturerName,
      amount,
      notes,
    };
    setPayments((prev) => [newPayment, ...prev]);

    setManufacturers((prev) =>
      prev.map((m) => {
        if (m.name === manufacturerName) {
          targetMCode = m.code || m.id;
          const paidAmount = (m.paidAmount || 0) + amount;
          const remainingBalance = (m.totalWorkmanshipEarned || 0) - paidAmount;
          newRemaining = remainingBalance;
          return { ...m, paidAmount, remainingBalance };
        }
        return m;
      })
    );

    // 1. In-App Notification
    const dateStr = new Date().toLocaleDateString('ar-EG');
    addNotification(
      'صرف مستحقات مالية للورشة',
      `تم صرف مبلغ ${amount.toLocaleString('ar-EG')} ج.م للمصنعة (${manufacturerName}).\nالمستحقات المتبقية: ${newRemaining.toLocaleString('ar-EG')} ج.م.`,
      'payment',
      {
        targetManufacturerName: manufacturerName,
        targetManufacturerCode: targetMCode,
      }
    );

    recordAuditAndAlert(
      'create',
      'ورشة',
      `تم تسجيل صرف دفعة مالية بقيمة ${amount.toLocaleString('ar-EG')} ج.م للورشة (${manufacturerName})`
    );

    // 2. Automated Telegram Notification
    if (settings.telegramEnabled) {
      const tgMsg = formatManufacturerPaymentTelegramMessage(
        manufacturerName,
        targetMCode,
        amount,
        newRemaining,
        dateStr,
        notes
      );
      sendTelegramNotification(settings, tgMsg).catch((err) =>
        console.error('Telegram dispatch error:', err)
      );
    }
  };

  const handleSaveExpense = (expData: Partial<Expense>) => {
    const newExp = expData as Expense;
    const isEditing = expenses.some((e) => e.id === newExp.id);

    if (isEditing && currentUser.role !== 'super_admin' && currentUser.role !== 'deputy_admin') {
      const newReq: PendingApprovalRequest = {
        id: `req-${Date.now()}`,
        timestamp: new Date().toLocaleString('ar-EG'),
        requesterName: currentUser.name,
        requesterRole: currentUser.role,
        actionType: 'edit',
        targetType: 'مصروف',
        targetId: newExp.id,
        targetSummary: `طلب تعديل مصروف (${newExp.description}) بقيمة ${newExp.amount} ج.م`,
        payload: newExp,
        status: 'pending',
      };
      setPendingApprovals((prev) => [newReq, ...prev]);
      addNotification(
        'طلب تعديل مصروف معلق',
        `قام المستخدم (${currentUser.name}) بطلب تعديل المصروف (${newExp.description}). بانتظار موافقة المدير العام.`,
        'system',
        { forAdminOnly: true }
      );
      recordAuditAndAlert('edit', 'مصروف', `قام المستخدم (${currentUser.name}) بطلب تعديل مصروف (${newExp.description})`);
      alert('تم رفع طلب التعديل إلى التنبيهات بانتظار موافقة واعتماد المدير العام (Super Admin).');
      return;
    }

    setExpenses((prev) => {
      const idx = prev.findIndex((e) => e.id === newExp.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newExp;
        return updated;
      } else {
        return [newExp, ...prev];
      }
    });

    if (isEditing) {
      recordAuditAndAlert('edit', 'مصروف', `تم تعديل بيانات المصروف (${newExp.description})`);
    } else {
      recordAuditAndAlert('create', 'مصروف', `تم إضافة مصروف جديد (${newExp.description}) بقيمة ${newExp.amount} ج.م`);
    }

    addNotification(
      'تسجيل مصروف جديد',
      `تم إدخال مصروف (${newExp.description}) بقيمة ${newExp.amount.toLocaleString('ar-EG')} ج.م.`,
      'expense',
      { forAdminOnly: true }
    );
  };

  const handleDeleteExpense = (id: string) => {
    const targetExp = expenses.find((e) => e.id === id);
    if (!targetExp) return;

    if (currentUser.role !== 'super_admin') {
      const newReq: PendingApprovalRequest = {
        id: `req-${Date.now()}`,
        timestamp: new Date().toLocaleString('ar-EG'),
        requesterName: currentUser.name,
        requesterRole: currentUser.role,
        actionType: 'delete',
        targetType: 'مصروف',
        targetId: id,
        targetSummary: `طلب حذف مصروف (${targetExp.description}) بقيمة ${targetExp.amount} ج.م`,
        status: 'pending',
      };
      setPendingApprovals((prev) => [newReq, ...prev]);
      addNotification(
        'طلب حذف مصروف معلق',
        `قام المستخدم (${currentUser.name}) بطلب حذف مصروف (${targetExp.description}). بانتظار موافقة المدير العام.`,
        'system',
        { forAdminOnly: true }
      );
      recordAuditAndAlert('status_change', 'مصروف', `قام المستخدم (${currentUser.name}) بطلب حذف مصروف (${targetExp.description})`);
      alert('تم رفع طلب حذف المصروف إلى التنبيهات بانتظار موافقة واعتماد المدير العام (Super Admin).');
      return;
    }

    if (confirm('هل تريد حذف هذا المصروف؟')) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      if (targetExp) {
        recordAuditAndAlert('delete', 'مصروف', `تم حذف مصروف (${targetExp.description}) بقيمة ${targetExp.amount} ج.م`);
      }
    }
  };

  // 4. Google Sheets & Webhook Sync with Silent Auto-Sync support
  const handleSyncToGoogleSheets = async (
    silent = false,
    overrideOrders?: Order[],
    overrideProducts?: Product[],
    overrideManufacturers?: Manufacturer[],
    overrideExpenses?: Expense[]
  ) => {
    setIsSyncing(true);

    const syncOrders = overrideOrders || orders;
    const syncProducts = overrideProducts || products;
    const syncManufacturers = overrideManufacturers || manufacturers;
    const syncExpenses = overrideExpenses || expenses;

    // 1. Always persist state to cloud DB (/api/db) for instant multi-device sync across all user roles
    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders: syncOrders,
          products: syncProducts,
          manufacturers: syncManufacturers,
          expenses: syncExpenses,
          settings,
        }),
      });
    } catch (dbErr) {
      console.warn('Cloud DB update warning:', dbErr);
    }

    // Get active Webhook URL (from state or localStorage fallback)
    const activeAppsScriptUrl = settings.appsScriptUrl || (() => {
      try {
        const saved = localStorage.getItem('warsha_settings');
        if (saved) return JSON.parse(saved).appsScriptUrl;
      } catch (e) {}
      return '';
    })();

    let webhookSuccess = false;

    // 2. PRIORITY 1: Google Apps Script Webhook Sync (Bypasses GCP 403 restrictions completely)
    try {
      const res = await fetch('/api/sheets/apps-script-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appsScriptUrl: activeAppsScriptUrl,
          orders: syncOrders,
          products: syncProducts,
          manufacturers: syncManufacturers,
          expenses: syncExpenses,
        }),
      });

      const data = await res.json();
      if (data.success) {
        webhookSuccess = true;
        const timeStr = new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const finalUrl = data.appsScriptUrl || activeAppsScriptUrl;
        setSettings((prev) => ({
          ...prev,
          lastSyncedAt: timeStr,
          appsScriptUrl: finalUrl || prev.appsScriptUrl,
        }));
        if (!silent) {
          alert('✅ تمت المزامنة المباشرة بنجاح عبر Google Apps Script Webhook!');
        }
        setIsSyncing(false);
        return;
      } else {
        console.warn('Apps Script Webhook sync response warning:', data.error);
      }
    } catch (err: any) {
      console.warn('Apps Script Webhook execution error:', err);
    }

    // 3. FALLBACK: Direct Google Sheets API sync
    if (settings.spreadsheetId) {
      try {
        const res = await fetch('/api/sheets/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spreadsheetId: settings.spreadsheetId,
            orders: syncOrders,
            products: syncProducts,
            manufacturers: syncManufacturers,
            expenses: syncExpenses,
            baseCapital: settings.baseCapital ?? 0,
          }),
        });

        const data = await res.json();
        if (data.success) {
          const timeStr = new Date().toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
          });
          setSettings((prev) => ({ ...prev, lastSyncedAt: timeStr }));
          if (!silent) {
            alert('✅ تمت المزامنة مع Google Sheets بنجاح!');
          }
        } else if (!silent) {
          if (res.status === 403 || (data.error && data.error.includes('403'))) {
            alert(
              '💡 تم حفظ وتأمين كافة البيانات محلياً وفي السحابة.\n\nتنبيه (403): يفضل التأكد من ربط Webhook Apps Script للمزامنة التلقائية المباشرة بدون قيود.'
            );
          } else {
            alert('💡 تم التحديث السحابي: ' + (data.error || 'يمكنك المزامنة عبر Webhook أو تصدير شيت Excel.'));
          }
        }
      } catch (err: any) {
        if (!silent) {
          alert('تم حفظ البيانات محلياً وفي السحابة بنجاح.');
        }
      }
    } else if (!silent && !webhookSuccess) {
      alert('تم حفظ البيانات وتحديث المزامنة بنجاح محلياً والسحابياً لكل المستخدمين!');
    }

    setIsSyncing(false);
  };

  // Background Live Sync (Runs every 60s if connected to Google Sheets or AppsScript Webhook)
  useEffect(() => {
    if (!settings.spreadsheetId && !settings.appsScriptUrl) return;
    const intervalId = setInterval(() => {
      handleSyncToGoogleSheets(true);
    }, 60000);
    return () => clearInterval(intervalId);
  }, [settings.spreadsheetId, settings.appsScriptUrl, orders, products, manufacturers, expenses]);

  // Create new Google Sheet in Drive
  const handleCreateNewGoogleSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sheets/create', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.spreadsheetId) {
        setSettings({
          ...settings,
          spreadsheetId: data.spreadsheetId,
          spreadsheetUrl: data.spreadsheetUrl,
          lastSyncedAt: new Date().toLocaleTimeString('ar-EG'),
        });
        await handleSyncToGoogleSheets();
      } else {
        throw new Error(data.error || 'تعذر إنشاء الشيت');
      }
    } catch (err: any) {
      throw new Error(err.message || 'فشلت المزامنة بـ Google Sheets');
    } finally {
      setIsSyncing(false);
    }
  };



  // Excel XLSX Export
  const handleExportExcel = async () => {
    if (currentUser.role !== 'super_admin' && currentUser.role !== 'deputy_admin') {
      alert('عفواً، ميزة تصدير الملفات مقتصرة حصرياً على المدير العام والنائب العام.');
      return;
    }
    let exportOrders = orders;
    if (!exportOrders || exportOrders.length === 0) {
      try {
        const saved = localStorage.getItem('warsha_orders');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            exportOrders = parsed;
          }
        }
      } catch (e) {}
    }
    if (!exportOrders || exportOrders.length === 0) {
      try {
        const res = await fetch('/api/db');
        const resData = await res.json();
        if (resData && resData.success && resData.data && Array.isArray(resData.data.orders) && resData.data.orders.length > 0) {
          exportOrders = resData.data.orders;
          setOrders(exportOrders);
        }
      } catch (e) {}
    }
    exportWarshaStoreToExcel(exportOrders, products, manufacturers, expenses, stats, settings.baseCapital ?? 0);
  };

  // Filter user notifications according to role restrictions
  const userNotifications = notifications.filter((n) => {
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'manufacturer') {
      if (n.type === 'system' || n.type === 'expense') return false;
      if (n.title.includes('طلب') || n.title.includes('حذف') || n.title.includes('تعديل')) return false;
    }
    if (n.type === 'system' && (n.title.includes('معلق') || n.title.includes('طلب') || n.title.includes('رقابة') || n.title.includes('حذف') || n.title.includes('تعديل'))) {
      return false;
    }
    return true;
  });

  const userUnreadNotificationsCount =
    userNotifications.filter((n) => !n.read).length +
    (currentUser?.role === 'super_admin' ? pendingApprovals.filter((p) => p.status === 'pending').length : 0);

  if (!isLoggedIn) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <LoginModal
          isOpen={true}
          isLoggedIn={false}
          onClose={() => {}}
          users={users}
          currentUser={currentUser}
          onSelectUser={(user) => {
            setCurrentUser(user);
            setIsLoggedIn(true);
            setIsLoginModalOpen(false);
            localStorage.setItem('warsha_is_logged_in', 'true');
            localStorage.setItem('warsha_current_user', JSON.stringify(user));
            if (user.role === 'manufacturer') {
              setActiveTab('workshop');
            } else {
              setActiveTab('dashboard');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        sheetConnected={!!settings.spreadsheetId}
        isSyncing={isSyncing}
        lastSyncedAt={settings.lastSyncedAt}
        unreadNotificationsCount={userUnreadNotificationsCount}
        currentUser={currentUser}
        onSync={handleSyncToGoogleSheets}
        onExportExcel={handleExportExcel}
        onOpenNewOrder={() => {
          setEditingOrder(null);
          setIsOrderModalOpen(true);
        }}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onChangePasswordModal={() => setIsChangePasswordModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ordersCount={orders.length}
        userRole={currentUser.role}
      />

      {/* Main Container with generous bottom padding on mobile to prevent navbar overlap */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-28 md:pb-12 space-y-6">
        {/* Central Announcement Board Widget (Visible to All Users on Dashboard and Workshop) */}
        {(activeTab === 'dashboard' || activeTab === 'workshop') && (
          <AnnouncementsWidget
            announcements={announcements}
            currentUser={currentUser}
            onAddAnnouncement={handleAddAnnouncement}
            onEditAnnouncement={handleEditAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
          />
        )}

        {/* WORKSHOP DEDICATED VIEW FOR MANUFACTURERS */}
        {activeTab === 'workshop' && (
          <ManufacturerWorkspaceView
            currentUser={currentUser}
            products={products}
            orders={orders}
            manufacturers={manufacturers}
            payments={payments}
            announcements={announcements}
            notifications={notifications}
          />
        )}

        {/* ADMIN USER MANAGEMENT & AUDIT VIEW */}
        {activeTab === 'users' && (
          <UserManagementView
            users={users}
            auditLogs={auditLogs}
            manufacturers={manufacturers}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            recentOrders={orders}
            baseCapital={settings.baseCapital ?? 0}
            currentUser={currentUser}
            productsCount={products.length}
            manufacturersCount={manufacturers.length}
            settings={settings}
            onSync={handleSyncToGoogleSheets}
            isSyncing={isSyncing}
            onUpdateBaseCapital={(newCapital) => {
              setSettings((prev) => ({ ...prev, baseCapital: newCapital }));
              addNotification(
                'تحديث رأس المال الحقيقي',
                `تم تعديل رأس المال المباشر للبدء منه إلى: ${newCapital.toLocaleString('ar-EG')} ج.م.`,
                'system'
              );
            }}
            onOpenNewOrder={() => {
              setEditingOrder(null);
              setIsOrderModalOpen(true);
            }}
            onOpenNewProduct={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            onOpenNewExpense={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            onOpenPaymentModal={() => {
              setSelectedManufacturerForPayment(undefined);
              setIsPaymentModalOpen(true);
            }}
            onNavigateToOrders={() => setActiveTab('orders')}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            onOpenNewOrder={() => {
              setEditingOrder(null);
              setIsOrderModalOpen(true);
            }}
            onEditOrder={(order) => {
              setEditingOrder(order);
              setIsOrderModalOpen(true);
            }}
            onDeleteOrder={handleDeleteOrder}
            onUpdateStatus={handleUpdateOrderStatus}
          />
        )}

        {activeTab === 'products' && (
          <ProductsView
            products={products}
            lowStockThreshold={settings.lowStockThreshold}
            onOpenNewProduct={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            onEditProduct={(product) => {
              setEditingProduct(product);
              setIsProductModalOpen(true);
            }}
            onDeleteProduct={handleDeleteProduct}
            onUpdateStock={handleUpdateStock}
            onImportBulkProducts={handleImportBulkProducts}
          />
        )}

        {activeTab === 'manufacturers' && (
          <ManufacturersView
            manufacturers={manufacturers}
            products={products}
            orders={orders}
            currentUser={currentUser}
            onOpenNewManufacturer={() => {
              setEditingManufacturer(null);
              setIsManufacturerModalOpen(true);
            }}
            onOpenPaymentModal={(name) => {
              setSelectedManufacturerForPayment(name);
              setIsPaymentModalOpen(true);
            }}
            onOpenStatementModal={(m) => {
              setSelectedManufacturerForStatement(m);
              setIsStatementModalOpen(true);
            }}
            onEditManufacturer={(m) => {
              setEditingManufacturer(m);
              setIsManufacturerModalOpen(true);
            }}
            onDeleteManufacturer={(id) => {
              const targetM = manufacturers.find((m) => m.id === id);
              if (!targetM) return;
              if (currentUser.role !== 'super_admin') {
                const newReq: PendingApprovalRequest = {
                  id: `req-${Date.now()}`,
                  timestamp: new Date().toLocaleString('ar-EG'),
                  requesterName: currentUser.name,
                  requesterRole: currentUser.role,
                  actionType: 'delete',
                  targetType: 'ورشة',
                  targetId: id,
                  targetSummary: `طلب حذف ورشة/مصنعة (${targetM.name})`,
                  status: 'pending',
                };
                setPendingApprovals((prev) => [newReq, ...prev]);
                addNotification('طلب حذف ورشة معلق', `قام المستخدم (${currentUser.name}) بطلب حذف الورشة (${targetM.name}).`, 'system');
                alert('تم رفع طلب حذف الورشة إلى التنبيهات بانتظار موافقة واعتماد المدير العام (Super Admin).');
                return;
              }
              if (confirm('هل تريد حذف المصنعة؟')) {
                setManufacturers((prev) => prev.filter((m) => m.id !== id));
              }
            }}
            onSyncNow={handleSyncToGoogleSheets}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            onOpenNewExpense={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            onEditExpense={(expense) => {
              setEditingExpense(expense);
              setIsExpenseModalOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            orders={orders}
            products={products}
            manufacturers={manufacturers}
            expenses={expenses}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'sheets' && (
          <SheetsSettingsView
            settings={settings}
            isSyncing={isSyncing}
            orders={orders}
            products={products}
            manufacturers={manufacturers}
            expenses={expenses}
            currentUser={currentUser}
            onUpdateSettings={(newSet) =>
              setSettings((prev) => ({ ...prev, ...newSet }))
            }
            onCreateNewSheet={handleCreateNewGoogleSheet}
            onSyncNow={handleSyncToGoogleSheets}
            onExportExcel={handleExportExcel}
            onOpenFullBackupModal={() => setIsFullBackupModalOpen(true)}
            onOpenExcelModal={() => setIsExcelModalOpen(true)}
          />
        )}
      </main>

      {/* Login / Switch Account Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        isLoggedIn={isLoggedIn}
        onClose={() => setIsLoginModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onSelectUser={(user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
          localStorage.setItem('warsha_is_logged_in', 'true');
          localStorage.setItem('warsha_current_user', JSON.stringify(user));
          if (user.role === 'manufacturer') {
            setActiveTab('workshop');
          } else {
            setActiveTab('dashboard');
          }
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        currentUser={currentUser}
        onChangePassword={handleChangePassword}
      />

      {/* Notifications Drawer Modal */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={userNotifications}
        reminders={reminders}
        pendingApprovals={pendingApprovals}
        currentUser={currentUser}
        onApprovePendingRequest={handleApprovePendingRequest}
        onRejectPendingRequest={handleRejectPendingRequest}
        onMarkAllAsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onClearAll={() => setNotifications([])}
        onMarkAsRead={(id) =>
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          )
        }
        onAddReminder={handleAddReminder}
        onToggleReminder={handleToggleReminder}
        onDeleteReminder={handleDeleteReminder}
      />

      {/* Active Users Monitor Modal */}
      <ActiveUsersModal
        isOpen={isActiveUsersModalOpen}
        onClose={() => setIsActiveUsersModalOpen(false)}
        activeSessions={activeSessions}
        currentUser={currentUser}
      />

      {/* Form Modals */}
      <OrderFormModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSave={handleSaveOrder}
        initialOrder={editingOrder}
        products={products}
        manufacturers={manufacturers}
      />

      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        initialProduct={editingProduct}
        manufacturers={manufacturers}
        defaultRawPricePerKg={settings.defaultRawMaterialPricePerKg}
      />

      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        initialExpense={editingExpense}
      />

      <ManufacturerPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSavePayment={handleSaveManufacturerPayment}
        manufacturers={manufacturers}
        defaultManufacturerName={selectedManufacturerForPayment}
      />

      <ManufacturerFormModal
        isOpen={isManufacturerModalOpen}
        onClose={() => setIsManufacturerModalOpen(false)}
        onSave={handleSaveManufacturer}
        initialManufacturer={editingManufacturer}
        existingProducts={products}
      />

      <ManufacturerStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        manufacturer={selectedManufacturerForStatement}
        orders={orders}
        products={products}
        onOpenPaymentModal={(name) => {
          setSelectedManufacturerForPayment(name);
          setIsPaymentModalOpen(true);
        }}
      />

      {/* Full System Backup & Restore Modal */}
      <FullBackupModal
        isOpen={isFullBackupModalOpen}
        onClose={() => setIsFullBackupModalOpen(false)}
        currentUser={currentUser}
        appState={{
          version: '2.5.0',
          exportedAt: new Date().toISOString(),
          exportedBy: currentUser?.name || 'المدير العام',
          orders,
          products,
          manufacturers,
          expenses,
          payments,
          settings,
          notifications,
          reminders,
          users,
          announcements,
          auditLogs,
          pendingApprovals,
          activeSessions,
        }}
        onRestoreBackup={handleRestoreFullBackup}
      />

      {/* Advanced Excel Data Import / Export Modal */}
      <ExcelDataModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        products={products}
        orders={orders}
        manufacturers={manufacturers}
        currentUser={currentUser}
        onImportProducts={(newProds, updateExisting) => {
          setProducts((prev) => {
            const copy = [...prev];
            newProds.forEach((np) => {
              const idx = copy.findIndex((p) => p.id === np.id || p.name === np.name);
              if (idx >= 0 && updateExisting) {
                copy[idx] = { ...copy[idx], ...np };
              } else if (idx < 0) {
                copy.push(np);
              }
            });
            return copy;
          });
          addNotification('استيراد منتجات', `تم استيراد/تحديث ${newProds.length} منتج من ملف Excel.`, 'stock');
        }}
        onImportOrders={(newOrds, updateExisting) => {
          setOrders((prev) => {
            const copy = [...prev];
            newOrds.forEach((no) => {
              const idx = copy.findIndex((o) => o.id === no.id);
              if (idx >= 0 && updateExisting) {
                copy[idx] = { ...copy[idx], ...no };
              } else if (idx < 0) {
                copy.push(no);
              }
            });
            return copy;
          });
          addNotification('استيراد أوردرات', `تم استيراد/تحديث ${newOrds.length} أوردر من ملف Excel.`, 'system');
        }}
        onImportManufacturers={(newMans, updateExisting) => {
          setManufacturers((prev) => {
            const copy = [...prev];
            newMans.forEach((nm) => {
              const idx = copy.findIndex((m) => m.id === nm.id || m.name === nm.name);
              if (idx >= 0 && updateExisting) {
                copy[idx] = { ...copy[idx], ...nm };
              } else if (idx < 0) {
                copy.push(nm);
              }
            });
            return copy;
          });
          addNotification('استيراد ورش', `تم استيراد/تحديث ${newMans.length} ورشة من ملف Excel.`, 'system');
        }}
      />
    </div>
  );
}

