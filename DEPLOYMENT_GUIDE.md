# 🚀 دليل رفع وتطبيق ونشر نظام WarshaStore (Deployment Guide)

هذا الدليل الفني يوضح خطوة بخطوة كيفية رفع وتطبيق نظام **WarshaStore ERP** على المنصات والسحابات المختلفة (Cloud Run, Render, Vercel, Railway)، وإعداد متغيرات البيئة ومفاتيح Google Sheets المباشرة.

---

## 1. 🏗️ نظرة عامة على بنية التشغيل (Runtime & Architecture)

- **نوع التطبيق**: تطبيق ويب متكامل Full-Stack (React 19 + TypeScript + Express v4 + Vite + Tailwind CSS).
- **المنفذ (Port)**: يعمل النظام على المنفذ الثابت **3000** مع ربط المضيف `0.0.0.0`.
- **أوامر التشغيل والبناء**:
  - البناء للإنتاج: `npm run build`
  - التشغيل لبيئة الإنتاج: `npm run start` (ينفذ `node dist/server.cjs`)
  - بيئة التطوير المحلية: `npm run dev` (ينفذ `tsx server.ts`)

---

## 2. 🔑 متغيرات البيئة المطلوب إعدادها (Environment Variables)

قم بإنشاء ملف `.env` في البيئة أو إضافتها في لوحة التحكم بالاستضافة (Environment Settings):

```env
# المنفذ الافتراضي للتشغيل (يُربط بـ 3000 افتراضياً)
PORT=3000

# بيئة التشغيل (production / development)
NODE_ENV=production

# معرّف مشروع جوجل سيرفيس وربط شيت Google Sheets (اختياري للربط المباشر)
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=

# إعدادات بوت التليجرام للتنبيهات الفورية (اختياري)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

---

## 3. 🌐 خطوات الرفع على استضافة Render (Render.com Deployment)

1. **إنشاء Web Service جديد**:
   - قم بربط مستودع GitHub الخاص بالمشروع على Render.
   - اختر نوع الخدمة: **Web Service**.
2. **إعداد الخيارات**:
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
3. **إضافة متغيرات البيئة**:
   - أضف `NODE_ENV = production`
   - أضف `PORT = 3000`
4. **التشغيل والربط**:
   - اضغط على **Create Web Service**. سيتم بناء وتجميع السيرفر والواجهة في مجلد `dist/` وتشغيل التطبيق برابط HTTPS مجاني ومؤمن.

---

## 4. ⚡ خطوات الرفع على Google Cloud Run أو Vercel

### أ. Google Cloud Run (Containerized Deployment)
- يحتوي المشروع على إعدادات متوافقة كلياً مع Google Cloud Run.
- يتم بناء الحاوية بإنشاء أثر الخادم في `dist/server.cjs` والذي يعمل بكفاءة وسرعة فائقة بدون استهلاك زائد للذاكرة.

### ب. Vercel / Netlify
- للتطبيقات التي تعمل كـ SPA أو Node Serverless:
  - تأكد من تعيين مجلد الإخراج (Output Directory) إلى `dist`.
  - أمر البناء `npm run build`.

---

## 5. 📊 إعداد وتفعيل ربط Google Sheets API

1. **إنشاء مشروع على Google Cloud Console**:
   - انتقل إلى [Google Cloud Console](https://console.cloud.google.com/).
   - أنشئ مشروعاً جديداً باسم `WarshaStore-Sheets`.
2. **تفعيل Google Sheets API & Drive API**:
   - ابحث في المكتبة عن **Google Sheets API** واضغط **Enable**.
   - ابحث عن **Google Drive API** واضغط **Enable**.
3. **إنشاء حساب خدمة (Service Account)**:
   - أنشئ حساب خدمة جديد واحصل على البريد الإلكتروني الخاص به (مثل: `warsha-service@project-id.iam.gserviceaccount.com`).
4. **مشاركة الشيت**:
   - أنشئ ملف Google Sheet ورسخ حقوق التعديل برابِط الشيت للمستخدمين أو قم بمشاركة الشيت مباشرةً مع بريد حساب الخدمة كـ **Editor**.
5. **إدخال ID الشيت في WarshaStore**:
   - من شاشة **إدارة ومزامنة Google Sheets** في التطبيق، انسخ رابط الشيت أو الـ ID واضغط **حفظ الرابط**.

---

## 6. 📦 النسخ الاحتياطي الدوري والصيانة (Backup Practices)

- **النسخ الاحتياطي الفوري (ZIP)**:
  - يُوصى بتنزيل نسخة احتياطية من شاشة النسخ الاحتياطي في بداية ونهاية كل أسبوع، تحتفظ بكافة الجداول والحسابات في أجزاء معزولة.
- **التحديث والاستعادة**:
  - عند الحاجة لنقل البيانات لبيئة استضافة جديدة، استخدم خيار **استيراد واستعادة النظام (Import Backup)** لرفع ملف الـ ZIP واسترجاع كافة الأوردرات والمنتجات والحسابات فورياً.
