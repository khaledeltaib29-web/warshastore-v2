// Browser Push Notification Helper

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Browser does not support desktop notifications.');
    return 'denied';
  }
  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

export function sendBrowserPushNotification(title: string, body: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const safeTitle = (title || '').substring(0, 200);
      const safeBody = (body || '').substring(0, 1000);
      new Notification(safeTitle, {
        body: safeBody,
        icon: '/icon.png',
        badge: '/icon.png',
        tag: 'warshastore-notification',
      });
    }
  } catch (err) {
    console.warn('Push notification error:', err);
  }
}

export function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Audio playback muted or blocked by browser policy
  }
}

