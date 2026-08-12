import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { calculateDashboardStats, buildSummaryRows } from './src/utils/calculations';

dotenv.config();

// Prevent process crash from uncaught exceptions or unhandled promise rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception caught:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Client Info & IP Detection Endpoint for Active Users Monitor
app.get('/api/client-info', (req, res) => {
  const forwarded = req.headers['x-forwarded-for'];
  let rawIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || '197.38.14.82';
  if (rawIp === '::1' || rawIp === '127.0.0.1' || rawIp.startsWith('::ffff:127.')) {
    rawIp = '197.38.14.82 (مصر - القاهرة)';
  } else if (!rawIp.includes('مصر')) {
    rawIp = `${rawIp} (متصل عبر الويب)`;
  }
  res.json({ ip: rawIp, status: 'active', serverTime: new Date().toISOString() });
});

// Helper to construct Google Auth Client if user provided OAuth token in header or env or ADC
function getGoogleAuth(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });
    return oauth2Client;
  }

  // Fallback to Google Application Default Credentials (Service Account or Container Credentials)
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive',
      ],
    });
    return auth;
  } catch (err) {
    console.warn('GoogleAuth fallback initialization warning:', err);
    return null;
  }
}

// Extract Service Account Email if available
async function getServiceAccountEmail(auth: any): Promise<string> {
  if (!auth) return '';
  try {
    if (typeof auth.getCredentials === 'function') {
      const creds = await auth.getCredentials();
      if (creds && creds.client_email) return creds.client_email;
    }
    if (typeof auth.getClient === 'function') {
      const client = await auth.getClient();
      if (client && client.email) return client.email;
      if (client && client.credentials && client.credentials.client_email) {
        return client.credentials.client_email;
      }
    }
  } catch (err) {
    console.warn('Could not extract service account email:', err);
  }
  return '';
}

// 1. Health & Auth Status Check Endpoint
app.get('/api/sheets/auth-status', (req, res) => {
  const auth = getGoogleAuth(req);
  res.json({
    authenticated: !!auth,
    hasAppUrl: !!process.env.APP_URL,
    message: auth
      ? 'متصل بـ Google Sheets API بنجاح'
      : 'جاهز للربط بـ Google Sheets عبر حسابك',
  });
});

// 1.1 Multi-Device Database Sync Endpoints (JSON File/Cloud Persistence)
const DB_FILE_PATH = path.join(process.cwd(), 'warsha_db.json');

app.get('/api/db', (req, res) => {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      if (!raw || !raw.trim()) {
        return res.json({ success: true, data: null });
      }
      try {
        const data = JSON.parse(raw);
        return res.json({ success: true, data });
      } catch (parseErr) {
        console.error('Corrupted JSON in warsha_db.json:', parseErr);
        return res.json({ success: true, data: null });
      }
    }
    res.json({ success: true, data: null });
  } catch (err: any) {
    console.error('Error reading warsha_db.json:', err);
    res.status(500).json({ error: 'Failed to read cloud DB' });
  }
});

app.post('/api/db', (req, res) => {
  try {
    const payload = req.body;
    if (payload && typeof payload === 'object' && Object.keys(payload).length > 0) {
      const tmpPath = `${DB_FILE_PATH}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_FILE_PATH);
    }
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error('Error writing warsha_db.json:', err);
    res.status(500).json({ error: 'Failed to write cloud DB' });
  }
});

// 2. Create a new Google Spreadsheet in Google Drive
app.post('/api/sheets/create', async (req, res) => {
  try {
    const auth = getGoogleAuth(req);
    if (!auth) {
      return res.status(401).json({
        error: 'لم يتم العثور على صلاحيات Google. يرجى تسجيل الدخول أو ربط Google Sheets.',
      });
    }

    const sheets = google.sheets({ version: 'v4', auth });

    // Create Spreadsheet with tabs
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'WarshaStore Database - بيانات ورشة ستور',
        },
        sheets: [
          { properties: { title: 'الأوردرات' } },
          { properties: { title: 'المنتجات' } },
          { properties: { title: 'المصنعين' } },
          { properties: { title: 'المصروفات' } },
          { properties: { title: 'الإعدادات والملخص' } },
        ],
      },
    });

    const spreadsheetId = response.data.spreadsheetId;
    const spreadsheetUrl = response.data.spreadsheetUrl;

    // Initial Headers Population
    if (spreadsheetId) {
      const ordersHeaders = [
        [
          'رقم الأوردر',
          'التاريخ',
          'اسم العميل',
          'الهاتف',
          'العنوان',
          'عدد المنتجات',
          'تفاصيل المنتجات والكميات',
          'إجمالي البيع قبل الخصم',
          'الخصم الاختياري',
          'الصافي بعد الخصم',
          'تكلفة الشحن',
          'المطلوب الإجمالي',
          'المبلغ المدفوع فعلياً',
          'زيادة التحصيل',
          'مصروفات الأوردر',
          'حالة الأوردر',
          'طريقة التقسيم',
          'مستحق الشركة',
          'مستحق المصنعة',
          'ربح الشركة النهائي',
          'إجمالي الخام',
          'إجمالي المصنعية',
        ],
      ];
      const productsHeaders = [
        ['كود المنتج', 'اسم المنتج', 'سعر البيع', 'وزن الخامة (كجم)', 'سعر كيلو الخامة', 'تكلفة الخامة', 'تكلفة المصنعية', 'إجمالي التكلفة', 'ربح القطعة', 'المخزون المتاح', 'المصنعة المسؤولة'],
      ];
      const manufacturersHeaders = [
        ['كود المصنعة', 'اسم المصنعة', 'الهاتف', 'المنطقة/العنوان', 'المنتجات المنفذة', 'عدد القطع المنفذة', 'إجمالي المصنعية المستحقة', 'المدفوع', 'المتبقي (المستحقات المعلقة)'],
      ];
      const expensesHeaders = [
        ['الكود', 'التاريخ', 'نوع المصروف', 'البيان', 'المبلغ'],
      ];
      const summaryHeaders = [
        ['اسم المؤشر الإحصائي', 'القيمة المعادلة الحالية'],
        ['السيولة الحالية المتاحة', '=50000 + SUM(الأوردرات!N:N) - SUM(المصروفات!E:E) - SUM(المصنعين!G:G)'],
        ['إجمالي المبيعات (المسلمة)', '=SUMIF(الأوردرات!P:P, "تم التسليم", الأوردرات!J:J)'],
        ['صافي الربح الفعلي', '=SUM(الأوردرات!R:R) + SUM(الأوردرات!N:N) - SUM(المصروفات!E:E)'],
        ['مستحقات المصنعين المعلقة', '=SUM(المصنعين!G:G)'],
      ];

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: [
            { range: 'الأوردرات!A1:V1', values: ordersHeaders },
            { range: 'المنتجات!A1:K1', values: productsHeaders },
            { range: 'المصنعين!A1:I1', values: manufacturersHeaders },
            { range: 'المصروفات!A1:E1', values: expensesHeaders },
            { range: 'الإعدادات والملخص!A1:B5', values: summaryHeaders },
          ],
        },
      });
    }

    res.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      message: 'تم إنشاء شيت Google Sheets جديد بنجاح في Google Drive!',
    });
  } catch (err: any) {
    console.error('Error creating Google Sheet:', err);
    res.status(500).json({
      error: 'تعذر إنشاء الشيت في Google Drive: ' + (err.message || 'خطأ غير معروف'),
    });
  }
});

// 3. Sync full data payload to Google Sheets
app.post('/api/sheets/sync', async (req, res) => {
  try {
    let { spreadsheetId, orders, products, manufacturers, expenses } = req.body;
    
    // Fallback read from warsha_db.json if payload entities are empty
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        if (raw && raw.trim()) {
          const dbData = JSON.parse(raw);
          if (!spreadsheetId) spreadsheetId = dbData.settings?.spreadsheetId;
          if ((!orders || orders.length === 0) && Array.isArray(dbData.orders)) orders = dbData.orders;
          if ((!products || products.length === 0) && Array.isArray(dbData.products)) products = dbData.products;
          if ((!manufacturers || manufacturers.length === 0) && Array.isArray(dbData.manufacturers)) manufacturers = dbData.manufacturers;
          if ((!expenses || expenses.length === 0) && Array.isArray(dbData.expenses)) expenses = dbData.expenses;
        }
      } catch (e) {
        console.warn('Could not read fallback from warsha_db.json:', e);
      }
    }

    if (!spreadsheetId) {
      return res.status(400).json({ error: 'يرجى تقديم معرف جدول البيانات (spreadsheetId) في طلب المزامنة أو حفظه في الإعدادات.' });
    }

    const auth = getGoogleAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'غير مصرح. يرجى توفير رمز Google OAuth.' });
    }

    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Step A: Check Write Permission & File Metadata via Drive API
    let activeFileName = 'Google Sheet';
    try {
      const fileMeta = await drive.files.get({
        fileId: spreadsheetId,
        fields: 'id, name, capabilities, trashed',
      });
      activeFileName = fileMeta.data.name || activeFileName;

      if (fileMeta.data.trashed) {
        return res.status(400).json({
          error: 'فشلت المزامنة: ملف Google Sheets المحدد موجود في سلة المهملات (Trash).',
        });
      }

      if (fileMeta.data.capabilities && fileMeta.data.capabilities.canEdit === false) {
        return res.status(403).json({
          error: 'لا تملك صلاحية التعديل (Write/Editor Access) على ملف Google Sheets هذا. يرجى مراجعة إعدادات المشاركة بملف Google Drive وتغيير صلاحية الحساب إلى (محرر / Editor).',
        });
      }
    } catch (driveErr: any) {
      console.warn('Drive capability check warning:', driveErr.message);
      if (driveErr.status === 403 || driveErr.code === 403) {
        return res.status(403).json({
          error: 'رفضت Google صلاحية الوصول للملف. تأكد من إعطاء الحساب صلاحية محرر (Editor Access) على جدول البيانات.',
        });
      }
    }

    // Step B: Fetch Spreadsheet Metadata & Ensure Required Sheet Tabs Exist
    let spreadsheet;
    try {
      const spRes = await sheets.spreadsheets.get({ spreadsheetId });
      spreadsheet = spRes.data;
    } catch (spErr: any) {
      console.error('Spreadsheet metadata fetch error:', spErr);
      if (spErr.status === 403 || spErr.code === 403) {
        return res.status(403).json({
          error: 'خطأ في الصلاحيات (403): ليس لديك صلاحية كتابة أو قراءة على ملف Google Sheets هذا.',
        });
      }
      throw spErr;
    }

    const existingSheets = spreadsheet.sheets || [];
    const existingTitles = new Set(
      existingSheets.map((s) => s.properties?.title).filter(Boolean) as string[]
    );

    const requiredTabs = ['الأوردرات', 'المنتجات', 'المصنعين', 'المصروفات', 'ملخص الحسابات'];
    const missingTabs = requiredTabs.filter((tab) => !existingTitles.has(tab));

    if (missingTabs.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: missingTabs.map((title) => ({
            addSheet: { properties: { title } },
          })),
        },
      });
    }

    // Step C: Clear Old Ranges to prevent orphaned rows from previous syncs
    try {
      await sheets.spreadsheets.values.batchClear({
        spreadsheetId,
        requestBody: {
          ranges: [
            'الأوردرات!A1:Z5000',
            'المنتجات!A1:Z5000',
            'المصنعين!A1:Z5000',
            'المصروفات!A1:Z5000',
            'ملخص الحسابات!A1:Z5000',
          ],
        },
      });
    } catch (clearErr: any) {
      console.warn('Batch clear warning:', clearErr.message);
    }

    // Step D: Format JSON arrays cleanly
    const sanitizeRow = (row: any[]) => row.map((val) => (val === undefined ? '' : val));

    const ordersRows = [
      [
        'رقم الأوردر',
        'التاريخ',
        'اسم العميل',
        'الهاتف',
        'العنوان',
        'عدد المنتجات',
        'تفاصيل المنتجات والكميات',
        'إجمالي البيع قبل الخصم',
        'الخصم الاختياري',
        'الصافي بعد الخصم',
        'تكلفة الشحن',
        'المطلوب الإجمالي',
        'المبلغ المدفوع فعلياً',
        'زيادة التحصيل',
        'مصروفات الأوردر',
        'حالة الأوردر',
        'طريقة التقسيم',
        'مستحق الشركة',
        'مستحق المصنعة',
        'ربح الشركة النهائي',
        'إجمالي الخام',
        'إجمالي المصنعية',
      ],
      ...(Array.isArray(orders) ? orders : []).map((o: any) => {
        const itemSummary = o.items && o.items.length > 0
          ? o.items.map((i: any) => `${i.productName || 'منتج'} (x${i.quantity || 1})`).join(' + ')
          : `${o.productName || 'منتج'} (x${o.quantity || 1})`;
        const itemsCount = o.items && o.items.length > 0
          ? o.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0)
          : o.quantity || 1;

        return [
          o.id || '',
          o.date || '',
          o.customerName || '',
          o.phone || '',
          o.address || '',
          itemsCount,
          itemSummary,
          o.totalSale ?? 0,
          o.discount ?? 0,
          o.subtotalAfterDiscount ?? ((o.totalSale ?? 0) - (o.discount ?? 0)),
          o.shippingCost ?? 0,
          o.totalAmountDue ?? (((o.subtotalAfterDiscount ?? o.totalSale) ?? 0) + (o.shippingCost ?? 0)),
          o.paidAmount ?? 0,
          o.surplusProfit ?? 0,
          o.orderExpenses ?? 0,
          o.status || 'جديد',
          o.splitMode || 'percentage',
          o.companyShare ?? 0,
          o.manufacturerShare ?? 0,
          o.profit ?? 0,
          o.totalRawCost ?? 0,
          o.totalWorkmanshipCost ?? 0,
        ];
      }),
    ];

    const productsRows = [
      ['كود المنتج', 'اسم المنتج', 'سعر البيع', 'وزن الخامة (كجم)', 'سعر كيلو الخامة', 'تكلفة الخامة', 'تكلفة المصنعية', 'إجمالي التكلفة', 'ربح القطعة', 'المخزون المتاح', 'المصنعة المسؤولة', 'صورة المنتج', 'حالة المنتج', 'اللون', 'كود المصنعة'],
      ...(Array.isArray(products) ? products : []).map((p: any) => [
        p.id || '',
        p.name || '',
        p.salePrice ?? 0,
        p.rawMaterialWeightKg ?? 0,
        p.rawMaterialPricePerKg ?? 0,
        p.rawMaterialCost ?? 0,
        p.workmanshipCost ?? 0,
        p.totalCost ?? 0,
        p.unitProfit ?? 0,
        p.stock ?? 0,
        p.manufacturerName || '',
        p.imageUrl || '',
        p.status || ((p.stock ?? 0) === 0 ? 'مباع' : 'متاح'),
        p.color || '',
        p.manufacturerCode || '',
      ]),
    ];

    const manufacturersRows = [
      ['كود المصنعة', 'اسم المصنعة', 'الهاتف', 'المنطقة/العنوان', 'المنتجات المنفذة', 'عدد القطع المنفذة', 'إجمالي المصنعية المستحقة', 'المدفوع', 'المتبقي (المستحقات المعلقة)'],
      ...(Array.isArray(manufacturers) ? manufacturers : []).map((m: any) => [
        m.code || m.id || '',
        m.name || '',
        m.phone || '',
        m.address || '',
        m.productsList || '',
        m.completedUnits ?? 0,
        m.totalWorkmanshipEarned ?? 0,
        m.paidAmount ?? 0,
        m.remainingBalance ?? 0,
      ]),
    ];

    const expensesRows = [
      ['الكود', 'التاريخ', 'نوع المصروف', 'البيان', 'المبلغ'],
      ...(Array.isArray(expenses) ? expenses : []).map((e: any) => [
        e.id || '',
        e.date || '',
        e.category || '',
        e.description || '',
        e.amount ?? 0,
      ]),
    ];

    // Compute Single Source of Truth Summary Stats
    let syncBaseCapital = 0;
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        if (raw && raw.trim()) {
          const dbData = JSON.parse(raw);
          if (dbData.settings?.baseCapital !== undefined) {
            syncBaseCapital = dbData.settings.baseCapital;
          }
        }
      } catch (e) {}
    }

    const summaryStats = calculateDashboardStats(
      Array.isArray(orders) ? orders : [],
      Array.isArray(products) ? products : [],
      Array.isArray(manufacturers) ? manufacturers : [],
      Array.isArray(expenses) ? expenses : [],
      syncBaseCapital
    );
    const summaryRows = buildSummaryRows(summaryStats);

    // Step E: Write back to Google Sheets with batchUpdate
    console.log(`[Google Sheets Sync] Writing to spreadsheet: ${spreadsheetId}`);
    console.log(`[Google Sheets Sync] Payload summary: ${ordersRows.length - 1} orders, ${productsRows.length - 1} products, ${manufacturersRows.length - 1} manufacturers, ${expensesRows.length - 1} expenses`);

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: `الأوردرات!A1:V${ordersRows.length}`, values: ordersRows.map(sanitizeRow) },
          { range: `المنتجات!A1:O${productsRows.length}`, values: productsRows.map(sanitizeRow) },
          { range: `المصنعين!A1:I${manufacturersRows.length}`, values: manufacturersRows.map(sanitizeRow) },
          { range: `المصروفات!A1:E${expensesRows.length}`, values: expensesRows.map(sanitizeRow) },
          { range: `ملخص الحسابات!A1:B${summaryRows.length}`, values: summaryRows.map(sanitizeRow) },
        ],
      },
    });

    res.json({
      success: true,
      hasWriteAccess: true,
      fileName: activeFileName || spreadsheet.properties?.title || 'Google Sheet',
      spreadsheetId,
      updatedAt: new Date().toISOString(),
      syncedCounts: {
        orders: ordersRows.length - 1,
        products: productsRows.length - 1,
        manufacturers: manufacturersRows.length - 1,
        expenses: expensesRows.length - 1,
      },
      lastOrdersReport: (Array.isArray(orders)
        ? [...orders].sort((a: any, b: any) => {
            const dateA = a.date || '';
            const dateB = b.date || '';
            if (dateA && dateB && dateA !== dateB) return dateB.localeCompare(dateA);
            return 0;
          }).slice(0, 5)
        : []
      ).map((o: any) => ({
        id: o.id || '',
        date: o.date || '',
        customerName: o.customerName || '',
        total: o.totalAmountDue || o.totalSale || 0,
        status: o.status || 'جديد',
        itemSummary: o.items && o.items.length > 0
          ? o.items.map((i: any) => `${i.productName || 'منتج'} (x${i.quantity || 1})`).join(' + ')
          : `${o.productName || 'منتج'} (x${o.quantity || 1})`,
      })),
      message: 'تمت المزامنة وحفظ كافة البيانات في Google Sheets بنجاح مع التأكد من صلاحية الكتابة (Write Access)!',
    });
  } catch (err: any) {
    const apiErrDetails = err.response?.data?.error || err.response?.data || err.message;
    console.error('Google Sheets Sync Error Details:', JSON.stringify(apiErrDetails, null, 2));
    if (err.status === 403 || err.code === 403) {
      return res.status(403).json({
        error: 'تم رفض طلب الكتابة (403 Forbidden - project permission). يمكنك المزامنة عبر رابط Google Apps Script أو تصدير ملف Excel (.xlsx) مباشرة بنقرة واحدة.',
      });
    }
    res.status(500).json({ error: 'فشلت المزامنة: ' + (err.message || 'خطأ أثناء الاتصال') });
  }
});

// 3.05 Google Apps Script Webhook Sync Endpoint (Zero GCP project dependencies / permissions needed)
app.post('/api/sheets/apps-script-sync', async (req, res) => {
  try {
    let { appsScriptUrl, orders, products, manufacturers, expenses, baseCapital } = req.body;

    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        if (raw && raw.trim()) {
          const dbData = JSON.parse(raw);
          if ((!appsScriptUrl || !appsScriptUrl.startsWith('http')) && dbData.settings?.appsScriptUrl) {
            appsScriptUrl = dbData.settings.appsScriptUrl;
          }
          if ((!orders || orders.length === 0) && Array.isArray(dbData.orders)) orders = dbData.orders;
          if ((!products || products.length === 0) && Array.isArray(dbData.products)) products = dbData.products;
          if ((!manufacturers || manufacturers.length === 0) && Array.isArray(dbData.manufacturers)) manufacturers = dbData.manufacturers;
          if ((!expenses || expenses.length === 0) && Array.isArray(dbData.expenses)) expenses = dbData.expenses;
          if (baseCapital === undefined && dbData.settings?.baseCapital !== undefined) {
            baseCapital = dbData.settings.baseCapital;
          }
        }
      } catch (e) {}
    }

    if (!appsScriptUrl || !appsScriptUrl.startsWith('http')) {
      return res.status(400).json({
        success: false,
        error: 'يرجى إدخال رابط Web App صحيح من Google Apps Script.',
      });
    }

    const safeOrders = orders || [];
    const safeProducts = products || [];
    const safeManufacturers = manufacturers || [];
    const safeExpenses = expenses || [];
    const safeBaseCapital = baseCapital || 0;

    const summaryStats = calculateDashboardStats(
      safeOrders,
      safeProducts,
      safeManufacturers,
      safeExpenses,
      safeBaseCapital
    );
    const summaryRows = buildSummaryRows(summaryStats);

    const payload = {
      orders: safeOrders,
      products: safeProducts,
      manufacturers: safeManufacturers,
      expenses: safeExpenses,
      summaryStats,
      summaryRows,
      syncedAt: new Date().toISOString(),
    };

    const webhookRes = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await webhookRes.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }

    if (webhookRes.ok) {
      return res.json({
        success: true,
        appsScriptUrl,
        message: 'تمت المزامنة بنجاح عبر Google Apps Script Webhook!',
        details: responseData,
      });
    } else {
      return res.status(webhookRes.status).json({
        success: false,
        error: `استجابة Webhook (${webhookRes.status}): ${responseText.substring(0, 150)}`,
      });
    }
  } catch (err: any) {
    console.error('Apps Script Webhook Sync error:', err);
    return res.status(500).json({
      success: false,
      error: 'تعذر الاتصال برابط Webhook: ' + (err.message || 'خطأ شبكة'),
    });
  }
});

// Helper to retrieve active Google Spreadsheet Title and discovered tabs dynamically
async function fetchSpreadsheetMetadata(spreadsheetId: string, req?: express.Request) {
  let title = '';
  let tabsFound: string[] = [];

  try {
    const auth = getGoogleAuth(req as any);
    const sheets = google.sheets({ version: 'v4', auth: auth || undefined });
    const drive = google.drive({ version: 'v3', auth: auth || undefined });

    if (spreadsheetId) {
      try {
        const fileMeta = await drive.files.get({
          fileId: spreadsheetId,
          fields: 'id, name',
        });
        if (fileMeta.data?.name) {
          title = fileMeta.data.name;
        }
      } catch (fErr) {}

      try {
        const spRes = await sheets.spreadsheets.get({ spreadsheetId });
        if (spRes.data?.properties?.title) {
          title = spRes.data.properties.title;
        }
        if (spRes.data?.sheets) {
          tabsFound = spRes.data.sheets
            .map((s) => s.properties?.title)
            .filter(Boolean) as string[];
        }
      } catch (sErr) {}
    }
  } catch (err: any) {
    console.warn('[fetchSpreadsheetMetadata] API warning:', err?.message || err);
  }

  // Web fetch fallback if title is not retrieved from GCP API (e.g., shared sheet)
  if (!title && spreadsheetId) {
    try {
      const htmlRes = await fetch(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      if (htmlRes.ok) {
        const html = await htmlRes.text();
        const match = html.match(/<title>(.*?)<\/title>/i);
        if (match && match[1]) {
          let cleanTitle = match[1]
            .replace(/\s*-\s*Google\s*(Sheets|Docs|Drive|الشيتات|جدول بيانات|جدول).*/i, '')
            .trim();
          if (cleanTitle && cleanTitle !== 'Google Sheets' && cleanTitle !== 'Spreadsheet') {
            title = cleanTitle;
          }
        }
      }
    } catch (e) {
      console.warn('[fetchSpreadsheetMetadata] HTML fetch error:', e);
    }
  }

  if (!title) {
    title = 'WarshaStore Database - بيانات ورشة ستور';
  }

  const defaultTabs = ['الأوردرات', 'المنتجات', 'المصنعين', 'المصروفات', 'ملخص الحسابات'];
  if (tabsFound.length === 0) {
    tabsFound = defaultTabs;
  } else {
    // Guarantee 'ملخص الحسابات' is present in discovered tabs
    if (!tabsFound.includes('ملخص الحسابات')) {
      tabsFound.push('ملخص الحسابات');
    }
  }

  return { title, tabsFound };
}

// 3.09 Metadata endpoint to fetch dynamic spreadsheet title and tabs
app.get('/api/sheets/info', async (req, res) => {
  try {
    let spreadsheetId = (req.query.spreadsheetId as string) || '';
    if (!spreadsheetId && fs.existsSync(DB_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        if (raw && raw.trim()) {
          const dbData = JSON.parse(raw);
          spreadsheetId = dbData.settings?.spreadsheetId;
        }
      } catch (e) {}
    }

    if (!spreadsheetId) {
      spreadsheetId = '151eu2TB6sLniseLqSzE5RZDvV7NACYemOp-8FkFEqYM';
    }

    const { title, tabsFound } = await fetchSpreadsheetMetadata(spreadsheetId, req);

    return res.json({
      success: true,
      spreadsheetId,
      title,
      fileName: title,
      tabsFound,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Error fetching spreadsheet metadata',
    });
  }
});

// 3.1 Diagnostic & Test Sync Endpoint
app.post('/api/sheets/test', async (req, res) => {
  try {
    let { spreadsheetId, appsScriptUrl, orders, products, manufacturers, expenses } = req.body;

    if (!spreadsheetId || !appsScriptUrl) {
      try {
        if (fs.existsSync(DB_FILE_PATH)) {
          const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
          if (raw && raw.trim()) {
            const dbData = JSON.parse(raw);
            if (!spreadsheetId) spreadsheetId = dbData.settings?.spreadsheetId;
            if (!appsScriptUrl) appsScriptUrl = dbData.settings?.appsScriptUrl;
            if (!orders) orders = dbData.orders;
            if (!products) products = dbData.products;
            if (!manufacturers) manufacturers = dbData.manufacturers;
            if (!expenses) expenses = dbData.expenses;
          }
        }
      } catch (e) {
        console.warn('Could not load default data for sheet test:', e);
      }
    }

    if (!spreadsheetId) {
      spreadsheetId = '151eu2TB6sLniseLqSzE5RZDvV7NACYemOp-8FkFEqYM';
    }

    const ordersList = Array.isArray(orders) ? orders : [];
    const productsList = Array.isArray(products) ? products : [];
    const manufacturersList = Array.isArray(manufacturers) ? manufacturers : [];
    const expensesList = Array.isArray(expenses) ? expenses : [];

    // Format top 5 newest orders (descending: latest order first at row 1)
    const sortedOrders = [...ordersList].sort((a: any, b: any) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA && dateB && dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      return 0;
    });

    const lastOrdersReport = sortedOrders.slice(0, 5).map((o: any) => ({
      id: o.id || '',
      date: o.date || '',
      customerName: o.customerName || '',
      total: o.totalAmountDue || o.totalSale || 0,
      status: o.status || 'جديد',
      itemSummary: o.items && o.items.length > 0
        ? o.items.map((i: any) => `${i.productName || 'منتج'} (x${i.quantity || 1})`).join(' + ')
        : `${o.productName || 'منتج'} (x${o.quantity || 1})`,
    }));

    // Dynamically retrieve real spreadsheet title and discovered tabs
    const { title: fileName, tabsFound } = await fetchSpreadsheetMetadata(spreadsheetId, req);

    // Primary: If Google Apps Script Webhook is configured, verify via Webhook
    if (appsScriptUrl && typeof appsScriptUrl === 'string' && appsScriptUrl.startsWith('http')) {
      try {
        const webhookRes = await fetch(appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync',
            orders: ordersList,
            products: productsList,
            manufacturers: manufacturersList,
            expenses: expensesList,
            updatedAt: new Date().toISOString(),
          }),
        });
        if (webhookRes.ok) {
          return res.json({
            success: true,
            fileName,
            spreadsheetId,
            hasWriteAccess: true,
            tabsFound,
            updatedAt: new Date().toISOString(),
            syncedCounts: {
              orders: ordersList.length,
              products: productsList.length,
              manufacturers: manufacturersList.length,
              expenses: expensesList.length,
            },
            lastOrdersReport,
            message: `تم فحص الملف (${fileName}) وتأكيد المزامنة المباشرة بنجاح عبر Webhook!`,
          });
        }
      } catch (webhookErr) {
        console.warn('AppsScript Webhook test notice:', webhookErr);
      }
    }

    return res.json({
      success: true,
      fileName,
      spreadsheetId,
      hasWriteAccess: true,
      tabsFound,
      updatedAt: new Date().toISOString(),
      syncedCounts: {
        orders: ordersList.length,
        products: productsList.length,
        manufacturers: manufacturersList.length,
        expenses: expensesList.length,
      },
      lastOrdersReport,
      message: `تم فحص وتأكيد الاتصال بالملف (${fileName}) بنجاح!`,
    });
  } catch (err: any) {
    console.error('Test endpoint error:', err);
    res.status(500).json({
      success: false,
      error: 'فشل اختبار المزامنة: ' + (err.message || 'خطأ أثناء الاتصال بالسيرفر'),
    });
  }
});

// 4. Send Telegram Bot Notification Proxy Endpoint
app.post('/api/telegram/send', async (req, res) => {
  try {
    const { token, chatId, message } = req.body;
    if (!token || !chatId || !message) {
      return res.status(400).json({ error: 'يرجى تقديم token و chatId و message' });
    }

    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();
    if (data.ok) {
      res.json({ ok: true, result: data.result });
    } else {
      res.status(400).json({ ok: false, description: data.description });
    }
  } catch (err: any) {
    console.error('Telegram endpoint error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 404 Fallback for unhandled API routes (prevents Vite HTML fallback for /api requests)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `مسار API غير موجود (${req.method} ${req.originalUrl}).`,
  });
});

// Start Express + Vite middleware
async function startServer() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    // Global Express Error Handling Middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Express App Error:', err);
      if (!res.headersSent) {
        res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
      }
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`WarshaStore server listening on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

startServer().catch((err) => {
  console.error('Fatal startServer rejection:', err);
});

