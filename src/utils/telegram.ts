import { StoreSettings } from '../types';

export async function sendTelegramNotification(
  settings: StoreSettings,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!settings.telegramEnabled) {
    return { success: false, error: 'إشعارات التليجرام غير مفعلة في الإعدادات.' };
  }

  const token = settings.telegramBotToken?.trim();
  const chatId = settings.telegramChatId?.trim();

  if (!token || !chatId) {
    return { success: false, error: 'يرجى إدخال توكن البوت ومعرف الشات (Chat ID) في الإعدادات.' };
  }

  const safeMessage = (message || '').length > 4000 ? message.substring(0, 3950) + '...' : message;

  try {
    // Try sending via backend server endpoint first to bypass any potential CORS restrictions
    const response = await fetch('/api/telegram/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        chatId,
        message: safeMessage,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ok) {
        return { success: true };
      }
    }

    // Direct fallback if backend proxy is unavailable
    const directUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const directRes = await fetch(directUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const directData = await directRes.json();
    if (directData.ok) {
      return { success: true };
    } else {
      return {
        success: false,
        error: directData.description || 'فشل إرسال الرسالة إلى التليجرام.',
      };
    }
  } catch (err: any) {
    console.error('Telegram API Error:', err);
    return {
      success: false,
      error: err.message || 'حدث خطأ أثناء الاتصال بسيرفرات التليجرام.',
    };
  }
}

export function formatManufacturerPaymentTelegramMessage(
  manufacturerName: string,
  code: string,
  amount: number,
  remainingBalance: number,
  date: string,
  notes: string
): string {
  return `🔔 *تنبيه صرف مستحقات مالية - WarshaStore*
━━━━━━━━━━━━━━━━━━━━
👤 *المصنعة / الورشة:* ${manufacturerName} (${code || 'MF'})
💰 *المبلغ المصروف:* ${amount.toLocaleString('ar-EG')} ج.م
📊 *المستحقات المتبقية:* ${remainingBalance.toLocaleString('ar-EG')} ج.م
📅 *تاريخ العملية:* ${date}
📝 *البيان / الملاحظات:* ${notes || 'دفعة تحت الحساب'}
━━━━━━━━━━━━━━━━━━━━
✅ *تم توثيق الدفعة وتحديث كشف حساب الورشة بنجاح.*`;
}

export function formatNewOrderTelegramMessage(
  orderId: string,
  customerName: string,
  totalAmount: number,
  itemsCount: number
): string {
  return `🛍️ *أوردر جديد - WarshaStore*
━━━━━━━━━━━━━━━━━━━━
🆔 *رقم الأوردر:* ${orderId}
👤 *اسم العميل:* ${customerName}
📦 *عدد القطع/المنتجات:* ${itemsCount}
💵 *إجمالي قيمة الأوردر:* ${totalAmount.toLocaleString('ar-EG')} ج.م
━━━━━━━━━━━━━━━━━━━━
⚡ تم تسجيل الطلب بنجاح وتخصيص الخامات والمصنعية.`;
}

export function formatNewProductTelegramMessage(
  productName: string,
  code: string,
  stock: number,
  salePrice: number,
  manufacturerName: string
): string {
  return `📦 *إضافة منتج جديد للمخزون - WarshaStore*
━━━━━━━━━━━━━━━━━━━━
🏷️ *اسم المنتج:* ${productName} (${code})
🏭 *الورشة المصنعة:* ${manufacturerName}
📊 *الكمية المتاحة:* ${stock} قطعة
💰 *سعر البيع:* ${salePrice.toLocaleString('ar-EG')} ج.م
━━━━━━━━━━━━━━━━━━━━
✨ المنتج جاهز للبيع والأوردرات.`;
}

export function formatLowStockTelegramMessage(
  productName: string,
  code: string,
  currentStock: number,
  threshold: number,
  manufacturerName: string
): string {
  return `⚠️ *تنبيه نقص مخزون حرج - WarshaStore*
━━━━━━━━━━━━━━━━━━━━
📦 *اسم المنتج:* ${productName} (${code})
🏭 *الورشة المصنعة:* ${manufacturerName}
📊 *المخزون الحالي:* ${currentStock} قطعة
📉 *الحد الأدنى للتنبيه:* ${threshold} قطعة
━━━━━━━━━━━━━━━━━━━━
🏭 *يرجى التواصل مع الورشة لبدء تصنيع تشغيلة ودفعات جديدة فوراً.*`;
}
