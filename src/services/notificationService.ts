import { SystemNotification, ScheduledReminder, AppUser } from '../types';

/**
 * Validates whether a given system notification should be delivered/displayed to the specified user.
 * Guarantees strict privacy & targeted delivery for Manufacturer users and Admins.
 */
export function isNotificationForUser(
  notification: SystemNotification,
  currentUser: AppUser | null
): boolean {
  if (!currentUser) return false;

  const isSuperAdminOnly = currentUser.role === 'super_admin';
  const isDeputyAdmin = currentUser.role === 'deputy_admin';
  const isDataEntry = currentUser.role === 'data_entry';
  const isManufacturer = currentUser.role === 'manufacturer';

  // 1. Secret Audit Notifications (strictly for Super Admin / General Manager ONLY)
  if (notification.type === 'admin_audit') {
    return isSuperAdminOnly;
  }

  // 2. Admin-only notifications
  if (notification.forAdminOnly) {
    // If explicitly targeted to deputy_admin role (e.g. Data Entry modifications), both Super Admin and Deputy Admin receive it
    if (notification.targetRole === 'deputy_admin') {
      return isSuperAdminOnly || isDeputyAdmin;
    }
    return isSuperAdminOnly;
  }

  // 2. Prevent manufacturer users from ever receiving admin-only or internal audit or expense notifications
  if (isManufacturer && (notification.forAdminOnly || (notification.type as string) === 'admin_audit' || notification.type === 'expense')) {
    return false;
  }

  // 3. Direct recipient / user check
  const recipient = notification.recipientId || notification.targetUserId;
  if (recipient) {
    return recipient === currentUser.id;
  }

  // 4. Global notifications
  if (notification.isGlobal === true) {
    return true;
  }

  // 5. Super Admin receives all operational notifications
  if (isSuperAdminOnly) {
    return true;
  }

  // 6. Deputy Admin receives operational notifications (except secret audit logs)
  if (isDeputyAdmin) {
    if (notification.targetRole) {
      return notification.targetRole === 'deputy_admin' || notification.targetRole === 'super_admin';
    }
    return true;
  }

  // 7. Rules for Manufacturer users
  if (isManufacturer) {
    const mName = (currentUser.manufacturerName || currentUser.name || '').trim().toLowerCase();
    const mCode = (currentUser.username || currentUser.id || '').trim().toLowerCase();

    if (notification.targetManufacturerName && mName) {
      const targetName = notification.targetManufacturerName.trim().toLowerCase();
      if (targetName === mName || targetName.includes(mName) || mName.includes(targetName)) {
        return true;
      }
    }

    if (notification.targetManufacturerCode && mCode) {
      const targetCode = notification.targetManufacturerCode.trim().toLowerCase();
      if (targetCode === mCode || targetCode.includes(mCode)) {
        return true;
      }
    }

    if (notification.targetRole === 'manufacturer') {
      if (!notification.targetManufacturerName && !notification.targetManufacturerCode) {
        return true;
      }
    }

    return false;
  }

  // 8. Default for employee / other roles
  if (notification.targetRole) return notification.targetRole === currentUser.role;

  return false;
}

/**
 * Function to check whether notification should be shown for current user.
 * Implements strict condition for targeted user, global state, and manufacturer-admin privacy isolation.
 */
export function shouldShowNotification(
  notification: SystemNotification,
  currentUser: AppUser | null
): boolean {
  if (!currentUser) return false;

  // Prevent manufacturer users from receiving admin-only notifications
  if (currentUser.role === 'manufacturer' && (notification.forAdminOnly || notification.type === 'admin_audit' || notification.type === 'expense')) {
    return false;
  }

  if (notification.targetUserId === currentUser.id || notification.recipientId === currentUser.id || notification.isGlobal === true) {
    return isNotificationForUser(notification, currentUser);
  }

  return isNotificationForUser(notification, currentUser);
}

/**
 * Validates whether a scheduled reminder should be displayed to the specified user.
 */
export function isReminderForUser(
  reminder: ScheduledReminder,
  currentUser: AppUser | null
): boolean {
  if (!currentUser) return false;

  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.role === 'deputy_admin';
  const isManufacturer = currentUser.role === 'manufacturer';

  if (reminder.forAdminOnly) {
    return isSuperAdmin;
  }

  if (isSuperAdmin) {
    return true;
  }

  if (isManufacturer) {
    if (reminder.targetUserId && reminder.targetUserId === currentUser.id) {
      return true;
    }

    const mName = (currentUser.manufacturerName || currentUser.name || '').trim().toLowerCase();
    if (reminder.targetManufacturerName && mName) {
      const target = reminder.targetManufacturerName.trim().toLowerCase();
      if (target === mName || target.includes(mName) || mName.includes(target)) {
        return true;
      }
    }

    if (reminder.targetId && mName) {
      const target = reminder.targetId.trim().toLowerCase();
      if (target === mName || target.includes(mName) || mName.includes(target)) {
        return true;
      }
    }

    return false;
  }

  if (reminder.targetUserId) return reminder.targetUserId === currentUser.id;
  if (reminder.targetRole) return reminder.targetRole === currentUser.role;

  return true;
}
