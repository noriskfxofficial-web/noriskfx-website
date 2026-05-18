(() => {
  const KEY = 'noriskfx_site_config_v1';
  const DEFAULTS = {
    copy: {
      heroEyebrow: {
        ar: 'منصة أدوات وتعلّم للمتداول العصري',
        en: 'Tools and learning platform for modern traders'
      },
      heroHeadline: {
        ar: 'تداول بذكاء.<br><span>ابنِ قراراتك على وعي</span><br>وأدوات احترافية.',
        en: 'Trade smarter.<br><span>Build decisions with clarity</span><br>and professional tools.'
      },
      heroLead: {
        ar: 'من مؤشرات TradingView الذكية إلى الأتمتة على MT4/MT5، التعليم العملي، تحليل السوق، وإدارة المخاطر. No Risk FX يقدّم لك تجربة متكاملة بتصميم احترافي وسهولة استخدام على كل الأجهزة.',
        en: 'From smart TradingView indicators to MT4/MT5 automation, practical education, market analysis and risk management. No Risk FX delivers an integrated experience with a professional design and smooth usability across devices.'
      },
      weeklyTitle: {
        ar: 'الأجندة الاقتصادية للأسبوع الحالي.',
        en: 'This week’s economic calendar.'
      },
      weeklyLead: {
        ar: 'تابع أهم أحداث الأسبوع من Tradays، وسجّلها من لوحة الأدمن ليظهر الجدول مباشرة على الموقع بدون iframe مكسور.',
        en: 'Track the week’s key events from Tradays, then publish them from the admin so they appear on-site without a broken iframe.'
      },
      weeklyNote: {
        ar: 'تابع الأسبوع، حضّر السيناريوهات، وتذكّر أن الخبر ليس توصية دخول أو خروج.',
        en: 'Track the week, prepare scenarios, and remember that news is not an entry or exit recommendation.'
      }
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

  window.NoRiskFXSiteConfigDefaults = DEFAULTS;

  const clone = (value) => JSON.parse(JSON.stringify(value || {}));
  const safeJson = (value, fallback) => {
    try { return JSON.parse(value) || fallback; } catch (e) { return fallback; }
  };
  const mergeConfig = (base, override) => ({
    ...clone(base),
    ...clone(override),
    copy: { ...(base.copy || {}), ...(override.copy || {}) },
    stats: { ...(base.stats || {}), ...(override.stats || {}) },
    widgets: { ...(base.widgets || {}), ...(override.widgets || {}) }
  });

  const loadLocalConfig = () => mergeConfig(DEFAULTS, safeJson(localStorage.getItem(KEY), {}));

  async function loadConfig() {
    try {
      const response = await fetch('/api/site-config', { cache: 'no-store' });
      if (!response.ok) throw new Error('Backend not available');
      const config = mergeConfig(DEFAULTS, await response.json());
      window.NoRiskFXBackendMode = 'api';
      try { localStorage.setItem(KEY, JSON.stringify(config, null, 2)); } catch (e) {}
      return config;
    } catch (error) {
      window.NoRiskFXBackendMode = 'static';
      return loadLocalConfig();
    }
  }

  const currentLang = () => document.documentElement.lang === 'en' ? 'en' : 'ar';

  const applyCopy = (config) => {
    const lang = currentLang();
    document.querySelectorAll('[data-site-copy]').forEach((el) => {
      const key = el.getAttribute('data-site-copy');
      const item = config.copy?.[key];
      if (!item) return;
      const ar = item.ar || '';
      const en = item.en || ar;
      el.setAttribute('data-ar', ar);
      el.setAttribute('data-en', en);
      if (el.hasAttribute('data-site-html')) el.innerHTML = lang === 'en' ? en : ar;
      else el.textContent = lang === 'en' ? en : ar;
    });
  };

  const applyStats = (config) => {
    const lang = currentLang();
    document.querySelectorAll('[data-site-stat]').forEach((card) => {
      const key = card.getAttribute('data-site-stat');
      const item = config.stats?.[key];
      if (!item) return;
      const valueEl = card.querySelector('[data-count]');
      const labelEl = card.querySelector('[data-ar][data-en]');
      if (valueEl) {
        valueEl.setAttribute('data-count', item.value || '');
        valueEl.textContent = item.value || '';
      }
      if (labelEl) {
        const ar = item.label?.ar || '';
        const en = item.label?.en || ar;
        labelEl.setAttribute('data-ar', ar);
        labelEl.setAttribute('data-en', en);
        labelEl.textContent = lang === 'en' ? en : ar;
      }
    });
  };

  const renderTradingViewTicker = (config) => {
    const holder = document.querySelector('[data-tradingview-ticker]');
    if (!holder) return;
    holder.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
    const symbols = (config.widgets?.tickerSymbols || DEFAULTS.widgets.tickerSymbols)
      .filter((item) => item && item.proName)
      .map((item) => ({ proName: item.proName, title: item.title || item.proName }));
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.text = JSON.stringify({
      symbols,
      showSymbolLogo: true,
      colorTheme: 'dark',
      isTransparent: true,
      displayMode: 'regular',
      locale: config.widgets?.tickerLocale || currentLang()
    });
    holder.appendChild(script);
  };

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));

  const renderWeeklyEvents = async () => {
    const holder = document.querySelector('[data-weekly-events]');
    if (!holder) return;
    try {
      const response = await fetch('/api/public/weekly-events', { cache: 'no-store' });
      if (!response.ok) throw new Error('No weekly events API');
      const data = await response.json();
      const events = Array.isArray(data.events) ? data.events : [];
      if (!events.length) throw new Error('No events');
      holder.innerHTML = `<div class="weekly-events-table">
        <div class="weekly-row weekly-head"><b>الوقت</b><b>العملة</b><b>الحدث</b><b>الأهمية</b><b>سابق</b><b>تقدير</b><b>فعلي</b></div>
        ${events.map((item) => `<div class="weekly-row">
          <span>${escapeHtml([item.date, item.time].filter(Boolean).join(' • '))}</span>
          <strong>${escapeHtml(item.currency || '—')}</strong>
          <span>${escapeHtml(item.title || '—')}</span>
          <i>${escapeHtml(item.impact || '—')}</i>
          <span>${escapeHtml(item.previous || '—')}</span>
          <span>${escapeHtml(item.forecast || '—')}</span>
          <span>${escapeHtml(item.actual || '—')}</span>
        </div>`).join('')}
      </div>`;
    } catch (error) {
      holder.innerHTML = `<div class="weekly-events-empty">
        <strong>أضف أخبار الأسبوع من لوحة الأدمن</strong>
        <p>افتح Tradays، انسخ أهم أحداث الأسبوع، ثم أدخلها من تبويب Calendar داخل لوحة الإدارة.</p>
      </div>`;
    }
  };

  const applyTradays = (config) => {
    const sourceLink = document.querySelector('[data-site-tradays-link]');
    const openLink = document.querySelector('[data-tradays-open]');
    const url = config.widgets?.tradaysUrl || DEFAULTS.widgets.tradaysUrl;
    if (sourceLink) sourceLink.setAttribute('href', config.widgets?.tradaysSourceUrl || DEFAULTS.widgets.tradaysSourceUrl);
    if (openLink) openLink.setAttribute('href', url);
    renderWeeklyEvents();
  };

  async function applyConfig() {
    const config = await loadConfig();
    window.NoRiskFXCurrentSiteConfig = config;
    applyCopy(config);
    applyStats(config);
    applyTradays(config);
    renderTradingViewTicker(config);
    document.dispatchEvent(new CustomEvent('noriskfx:site-config-applied', { detail: config }));
    return config;
  }

  window.NoRiskFXLoadSiteConfig = loadConfig;
  window.NoRiskFXApplySiteConfig = applyConfig;
  window.NoRiskFXSaveLocalSiteConfig = (config) => localStorage.setItem(KEY, JSON.stringify(config, null, 2));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyConfig);
  else applyConfig();
})();
