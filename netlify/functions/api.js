const crypto = require('crypto');
let connectLambda;
let getStore;
try {
  ({ connectLambda, getStore } = require('@netlify/blobs'));
} catch (error) {
  connectLambda = null;
  getStore = null;
}

const STORE_NAME = process.env.BLOB_STORE || 'noriskfx-admin';
const DB_KEY = 'database.json';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ||;
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_NETLIFY_ENV';
const JWT_EXPIRES_SECONDS = Number(process.env.JWT_EXPIRES_SECONDS || 60 * 60 * 8);

const siteDefaults = {
  copy: {
    heroEyebrow: { ar: 'منصة أدوات وتعلّم للمتداول العصري', en: 'Tools and learning platform for modern traders' },
    heroHeadline: { ar: 'تداول بذكاء.<br><span>ابنِ قراراتك على وعي</span><br>وأدوات احترافية.', en: 'Trade smarter.<br><span>Build decisions with clarity</span><br>and professional tools.' },
    heroLead: { ar: 'من مؤشرات TradingView الذكية إلى الأتمتة على MT4/MT5، التعليم العملي، تحليل السوق، وإدارة المخاطر. No Risk FX يقدّم لك تجربة متكاملة بتصميم احترافي وسهولة استخدام على كل الأجهزة.', en: 'From smart TradingView indicators to MT4/MT5 automation, practical education, market analysis and risk management. No Risk FX delivers an integrated experience with a professional design and smooth usability across devices.' },
    weeklyTitle: { ar: 'الأجندة الاقتصادية للأسبوع الحالي.', en: 'This week’s economic calendar.' },
    weeklyLead: { ar: 'تابع أهم أحداث الأسبوع من Tradays، وسجّلها من لوحة الأدمن ليظهر الجدول مباشرة على الموقع بدون iframe مكسور.', en: 'Track the week’s key events from Tradays, then publish them from the admin so they appear on-site without a broken iframe.' },
    weeklyNote: { ar: 'تابع الأسبوع، حضّر السيناريوهات، وتذكّر أن الخبر ليس توصية دخول أو خروج.', en: 'Track the week, prepare scenarios, and remember that news is not an entry or exit recommendation.' }
  },
  stats: {
    support: { value: '24/7', label: { ar: 'دعم وقنوات تواصل', en: 'Support channels' } },
    services: { value: '6+', label: { ar: 'خدمات متخصصة', en: 'Specialized services' } },
    partners: { value: '12', label: { ar: 'شريك ومنصة', en: 'Partners & platforms' } },
    trust: { value: '100%', label: { ar: 'محتوى توعوي', en: 'Educational focus' } }
  },
  widgets: {
    tradaysUrl: 'https://www.tradays.com/en/economic-calendar',
    tradaysSourceUrl: 'https://www.tradays.com/en/widget',
    tickerLocale: 'en',
    tickerSymbols: [
      { proName: 'OANDA:XAUUSD', title: 'Gold' },
      { proName: 'FX:EURUSD', title: 'EUR/USD' },
      { proName: 'FX:GBPUSD', title: 'GBP/USD' },
      { proName: 'FX:USDJPY', title: 'USD/JPY' },
      { proName: 'TVC:DXY', title: 'DXY' },
      { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
      { proName: 'NASDAQ:NDX', title: 'Nasdaq 100' },
      { proName: 'TVC:USOIL', title: 'US Oil' }
    ]
  }
};

const adminSeed = {
  leads: [
    { id: 'lead-sample-1', name: 'Sample Lead', service: 'Academy', source: 'WhatsApp', status: 'New', priority: 'Warm', note: 'Asked about beginner path and risk management.' },
    { id: 'lead-sample-2', name: 'Broker Inquiry', service: 'Partners', source: 'Instagram', status: 'Follow-up', priority: 'Hot', note: 'Needs co-branded campaign explanation.' }
  ],
  posts: [
    { id: 'post-sample-1', type: 'Market Update', title: 'Gold weekly awareness update', status: 'Draft', body: 'Educational technical summary with support/resistance and risk disclaimer.' }
  ],
  events: [
    { id: 'event-usd-1', date: new Date().toISOString().slice(0, 10), time: '15:30', currency: 'USD', title: 'Economic data watch', impact: 'High', previous: '—', forecast: '—', actual: '—', note: 'Add this week’s Tradays events here from the admin panel.' },
    { id: 'event-eur-1', date: new Date().toISOString().slice(0, 10), time: '12:00', currency: 'EUR', title: 'Eurozone calendar watch', impact: 'Medium', previous: '—', forecast: '—', actual: '—', note: 'Educational awareness only.' }
  ],
  partners: [
    { id: 'partner-fp', name: 'FP Markets', tone: 'Corporate blue / platform-first', note: 'Use as style inspiration only. Keep No Risk FX primary.' },
    { id: 'partner-or', name: 'One Royal', tone: 'Premium black / purple / yellow', note: 'Cinematic educational style, no partner contact info unless requested.' },
    { id: 'partner-tickmill', name: 'Tickmill', tone: 'Dark red / market objects', note: 'Bold headlines, risk disclaimer at bottom.' }
  ],
  checks: [
    { id: 'risk', text: 'Risk disclaimer موجود عند ذكر التداول/الذهب/الكريبتو.', done: true },
    { id: 'no-hype', text: 'لا يوجد وعود أرباح أو عبارات hype ممنوعة.', done: true },
    { id: 'logo', text: 'No Risk FX logo محفوظ بدون تعديل.', done: true },
    { id: 'contact', text: 'Contact info مطابق: Instagram, Telegram, website, WhatsApp.', done: true },
    { id: 'partner', text: 'أي broker post co-branded مع No Risk FX.', done: false }
  ]
};

const memoryFallback = global.__NORISKFX_MEMORY_DB || (global.__NORISKFX_MEMORY_DB = null);

function id() {
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function now() { return new Date().toISOString(); }
function clone(value) { return JSON.parse(JSON.stringify(value || {})); }
function mergeConfig(base, override) {
  const cleanOverride = clone(override);
  return {
    ...clone(base),
    ...cleanOverride,
    copy: { ...(base.copy || {}), ...(cleanOverride.copy || {}) },
    stats: { ...(base.stats || {}), ...(cleanOverride.stats || {}) },
    widgets: { ...(base.widgets || {}), ...(cleanOverride.widgets || {}) }
  };
}
function defaultDb() {
  return { site_config: clone(siteDefaults), admin_state: clone(adminSeed), updated_at: now(), version: 17 };
}
function sanitizeSiteConfig(input = {}) {
  const cfg = mergeConfig(siteDefaults, input || {});
  cfg.widgets.tickerSymbols = Array.isArray(cfg.widgets.tickerSymbols)
    ? cfg.widgets.tickerSymbols
      .filter((item) => item && typeof item.proName === 'string')
      .map((item) => ({ proName: item.proName.trim(), title: String(item.title || item.proName).trim() }))
      .filter((item) => item.proName)
      .slice(0, 30)
    : siteDefaults.widgets.tickerSymbols;
  return cfg;
}
function sanitizeAdminState(input = {}) {
  const withArrays = { ...clone(adminSeed), ...clone(input) };
  ['leads', 'posts', 'events', 'partners', 'checks'].forEach((key) => {
    if (!Array.isArray(withArrays[key])) withArrays[key] = [];
    withArrays[key] = withArrays[key].slice(0, 500).map((item) => ({ ...item, id: item.id || id() }));
  });
  return withArrays;
}
function json(statusCode, data, headers = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers
    },
    body: JSON.stringify(data)
  };
}
function parseBody(event) {
  if (!event.body) return {};
  try {
    const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
    return JSON.parse(body || '{}');
  } catch (error) {
    return {};
  }
}
function safeCompare(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
function base64url(value) {
  return Buffer.from(value).toString('base64url');
}
function signToken(payload) {
  const body = base64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + JWT_EXPIRES_SECONDS }));
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function verifyToken(token) {
  if (!token || !token.includes('.')) throw new Error('Missing token');
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url');
  if (!safeCompare(sig, expected)) throw new Error('Invalid token');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Expired token');
  return payload;
}
function auth(event) {
  const header = event.headers.authorization || event.headers.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return verifyToken(token);
}
function publicEvents(adminState) {
  return sanitizeAdminState(adminState).events
    .map((event) => ({
      date: String(event.date || '').slice(0, 10),
      time: String(event.time || ''),
      currency: String(event.currency || ''),
      title: String(event.title || ''),
      impact: String(event.impact || ''),
      previous: String(event.previous || ''),
      forecast: String(event.forecast || ''),
      actual: String(event.actual || ''),
      note: String(event.note || '')
    }))
    .filter((event) => event.date || event.title || event.currency)
    .slice(0, 100);
}
async function readDb(event) {
  let db = null;
  if (getStore) {
    try {
      if (connectLambda) connectLambda(event);
      const store = getStore({ name: STORE_NAME, consistency: 'strong' });
      db = await store.get(DB_KEY, { type: 'json' });
    } catch (error) {
      db = null;
    }
  }
  if (!db) db = global.__NORISKFX_MEMORY_DB || defaultDb();
  db.site_config = sanitizeSiteConfig(db.site_config || siteDefaults);
  db.admin_state = sanitizeAdminState(db.admin_state || adminSeed);
  return db;
}
async function writeDb(event, db) {
  const next = { ...db, updated_at: now(), version: 17 };
  if (getStore) {
    if (connectLambda) connectLambda(event);
    const store = getStore({ name: STORE_NAME, consistency: 'strong' });
    await store.setJSON(DB_KEY, next);
  }
  global.__NORISKFX_MEMORY_DB = next;
  return next;
}
function routePath(event) {
  let p = event.path || '/';
  p = p.replace(/^\/\.netlify\/functions\/api\/?/, '/');
  p = p.replace(/^\/api\/?/, '/');
  if (!p.startsWith('/')) p = '/' + p;
  return p.replace(/\/+$/, '') || '/';
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  const method = event.httpMethod || 'GET';
  const path = routePath(event);

  try {
    if (method === 'GET' && path === '/health') {
      return json(200, { ok: true, service: 'No Risk FX Netlify API', storage: getStore ? 'netlify-blobs' : 'memory-fallback', time: now() });
    }

    if (method === 'POST' && path === '/auth/login') {
      const body = parseBody(event);
      const username = String(body.username || ADMIN_USER).trim();
      const password = String(body.password || body.pin || '');
      if (username !== ADMIN_USER || !safeCompare(password, ADMIN_PASSWORD)) return json(401, { error: 'Invalid credentials' });
      const token = signToken({ sub: 'admin', username: ADMIN_USER, role: 'admin' });
      return json(200, { token, user: { username: ADMIN_USER, role: 'admin' } });
    }

    if (method === 'GET' && path === '/site-config') {
      const db = await readDb(event);
      return json(200, sanitizeSiteConfig(db.site_config));
    }

    if (method === 'GET' && path === '/public/weekly-events') {
      const db = await readDb(event);
      return json(200, { events: publicEvents(db.admin_state), source: db.site_config.widgets?.tradaysSourceUrl || siteDefaults.widgets.tradaysSourceUrl, updatedAt: db.updated_at });
    }

    if (path.startsWith('/admin')) auth(event);

    if (method === 'GET' && path === '/admin/state') {
      const db = await readDb(event);
      return json(200, sanitizeAdminState(db.admin_state));
    }

    if (method === 'PUT' && path === '/admin/state') {
      const db = await readDb(event);
      db.admin_state = sanitizeAdminState(parseBody(event));
      await writeDb(event, db);
      return json(200, db.admin_state);
    }

    if (method === 'PUT' && path === '/admin/site-config') {
      const db = await readDb(event);
      db.site_config = sanitizeSiteConfig(parseBody(event));
      await writeDb(event, db);
      return json(200, db.site_config);
    }

    if (method === 'GET' && path === '/admin/export') {
      const db = await readDb(event);
      return json(200, { exportedAt: now(), siteConfig: db.site_config, adminState: db.admin_state });
    }

    if (method === 'POST' && path === '/admin/import') {
      const payload = parseBody(event);
      const db = await readDb(event);
      if (payload.siteConfig) db.site_config = sanitizeSiteConfig(payload.siteConfig);
      if (payload.adminState) db.admin_state = sanitizeAdminState(payload.adminState);
      if (!payload.siteConfig && !payload.adminState) db.admin_state = sanitizeAdminState(payload);
      await writeDb(event, db);
      return json(200, { ok: true, siteConfig: db.site_config, adminState: db.admin_state });
    }

    return json(404, { error: 'Not found', path });
  } catch (error) {
    const status = /token|expired|invalid/i.test(error.message || '') ? 401 : 500;
    return json(status, { error: status === 401 ? 'Unauthorized' : 'Server error', detail: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};
