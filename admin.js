(() => {
  const KEY = 'noriskfx_admin_state_v1';
  const TOKEN_KEY = 'noriskfx_admin_token_v2';
  const STATIC_AUTH = 'noriskfx_admin_static_auth_v2';
  const ACCESS_CODE = 'NFX-2026';

  const seed = {
    leads: [
      { id: cryptoId(), name: 'Sample Lead', service: 'Academy', source: 'WhatsApp', status: 'New', priority: 'Warm', note: 'Asked about beginner path and risk management.' },
      { id: cryptoId(), name: 'Broker Inquiry', service: 'Partners', source: 'Instagram', status: 'Follow-up', priority: 'Hot', note: 'Needs co-branded campaign explanation.' }
    ],
    posts: [
      { id: cryptoId(), type: 'Market Update', title: 'Gold weekly awareness update', status: 'Draft', body: 'Educational technical summary with support/resistance and risk disclaimer.' }
    ],
    events: [
      { id: cryptoId(), date: new Date().toISOString().slice(0, 10), time: '15:30', currency: 'USD', title: 'Economic data watch', impact: 'High', previous: '—', forecast: '—', actual: '—', note: 'Prepare weekly calendar post from Tradays.' }
    ],
    partners: [
      { id: cryptoId(), name: 'FP Markets', tone: 'Corporate blue / platform-first', note: 'Use as style inspiration only. Keep No Risk FX primary.' },
      { id: cryptoId(), name: 'One Royal', tone: 'Premium black / purple / yellow', note: 'Cinematic educational style, no partner contact info unless requested.' },
      { id: cryptoId(), name: 'Tickmill', tone: 'Dark red / market objects', note: 'Bold headlines, risk disclaimer at bottom.' }
    ],
    checks: [
      { id: 'risk', text: 'Risk disclaimer موجود عند ذكر التداول/الذهب/الكريبتو.', done: true },
      { id: 'no-hype', text: 'لا يوجد وعود أرباح أو عبارات hype ممنوعة.', done: true },
      { id: 'logo', text: 'No Risk FX logo محفوظ بدون تعديل.', done: true },
      { id: 'contact', text: 'Contact info مطابق: Instagram, Telegram, website, WhatsApp.', done: true },
      { id: 'partner', text: 'أي broker post co-branded مع No Risk FX.', done: false }
    ]
  };

  let state = clone(seed);
  let activeType = null;
  let activeId = null;
  let apiMode = 'unknown';
  let saveTimer = null;

  const login = document.querySelector('[data-login]');
  const form = document.querySelector('[data-login-form]');
  const error = document.querySelector('[data-login-error]');
  const sideCard = document.querySelector('.admin-side-card');
  const dateEl = document.querySelector('[data-admin-date]');
  const dialog = document.querySelector('[data-dialog]');
  const dialogTitle = document.querySelector('[data-dialog-title]');
  const fields = document.querySelector('[data-dialog-fields]');
  const dialogForm = document.querySelector('[data-dialog-form]');

  const schemas = {
    lead: { label: 'Lead', list: 'leads', fields: [['name', 'Name'], ['service', 'Service'], ['source', 'Source'], ['status', 'Status'], ['priority', 'Priority'], ['note', 'Note', 'textarea']] },
    post: { label: 'Content', list: 'posts', fields: [['type', 'Type'], ['title', 'Title'], ['status', 'Status'], ['body', 'Body', 'textarea']] },
    event: { label: 'Calendar event', list: 'events', fields: [['date', 'Date', 'date'], ['time', 'Time'], ['currency', 'Currency'], ['title', 'Event title'], ['impact', 'Impact'], ['previous', 'Previous'], ['forecast', 'Forecast'], ['actual', 'Actual'], ['note', 'Note', 'textarea']] },
    partner: { label: 'Partner note', list: 'partners', fields: [['name', 'Partner'], ['tone', 'Visual tone'], ['note', 'Notes', 'textarea']] }
  };

  function cryptoId() {
    try { return crypto.randomUUID(); } catch (e) { return 'id-' + Math.random().toString(16).slice(2) + Date.now(); }
  }
  function clone(value) { return JSON.parse(JSON.stringify(value || {})); }
  function loadLocalState() {
    try { return JSON.parse(localStorage.getItem(KEY)) || clone(seed); } catch (e) { return clone(seed); }
  }
  function saveLocalState() { localStorage.setItem(KEY, JSON.stringify(state, null, 2)); }
  function getToken() { return sessionStorage.getItem(TOKEN_KEY); }
  function setToken(token) { sessionStorage.setItem(TOKEN_KEY, token); }
  function removeToken() { sessionStorage.removeItem(TOKEN_KEY); }
  function isStaticAuthed() { return sessionStorage.getItem(STATIC_AUTH) === 'true'; }
  function setStaticAuthed(value) { value ? sessionStorage.setItem(STATIC_AUTH, 'true') : sessionStorage.removeItem(STATIC_AUTH); }
  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  }
  function badgeClass(value = '') {
    const v = value.toLowerCase();
    if (v.includes('hot') || v.includes('high')) return 'badge hot';
    if (v.includes('warm') || v.includes('follow') || v.includes('medium')) return 'badge warn';
    return 'badge';
  }

  async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(path, { ...options, headers, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  async function loadState() {
    if (getToken()) {
      try {
        const remote = await api('/api/admin/state');
        apiMode = 'api';
        updateModeCard();
        state = normalizeState(remote);
        return;
      } catch (e) {
        removeToken();
      }
    }
    apiMode = isStaticAuthed() ? 'static' : 'locked';
    state = normalizeState(loadLocalState());
    updateModeCard();
  }

  function normalizeState(input = {}) {
    const next = { ...clone(seed), ...clone(input) };
    ['leads', 'posts', 'events', 'partners', 'checks'].forEach((key) => {
      if (!Array.isArray(next[key])) next[key] = [];
      next[key] = next[key].map((item) => ({ ...item, id: item.id || cryptoId() }));
    });
    return next;
  }

  async function persistState() {
    if (getToken()) {
      await api('/api/admin/state', { method: 'PUT', body: JSON.stringify(state) });
      apiMode = 'api';
    } else {
      saveLocalState();
      apiMode = isStaticAuthed() ? 'static' : 'locked';
    }
    updateModeCard();
  }

  function persistSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => persistState().catch((e) => alert('Save failed: ' + e.message)), 150);
  }

  function updateModeCard() {
    if (!sideCard) return;
    if (apiMode === 'api') {
      sideCard.innerHTML = '<b>Backend connected</b><p>التعديلات محفوظة بقاعدة بيانات Netlify Blobs وبتظهر لكل الزوار بعد refresh.</p>';
      sideCard.classList.add('backend-live');
    } else if (apiMode === 'static') {
      sideCard.innerHTML = '<b>Static fallback</b><p>الـ backend غير شغّال. التعديلات محفوظة محلياً على هذا المتصفح فقط.</p>';
      sideCard.classList.remove('backend-live');
    } else {
      sideCard.innerHTML = '<b>Admin locked</b><p>سجّل دخول لتفعيل لوحة الإدارة. عند تشغيل backend تتحول الحفظ لقاعدة البيانات.</p>';
      sideCard.classList.remove('backend-live');
    }
  }

  function refreshAuth() {
    const authed = Boolean(getToken()) || isStaticAuthed();
    login?.classList.toggle('is-hidden', authed);
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (error) error.textContent = '';
    const pin = String(new FormData(form).get('pin') || '');
    try {
      const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: 'admin', pin }) });
      setToken(result.token);
      setStaticAuthed(false);
      await loadState();
      refreshAuth();
      render(false);
      document.dispatchEvent(new CustomEvent('noriskfx:admin-auth-changed'));
      return;
    } catch (backendError) {
      if (pin === ACCESS_CODE) {
        removeToken();
        setStaticAuthed(true);
        await loadState();
        refreshAuth();
        render(false);
        document.dispatchEvent(new CustomEvent('noriskfx:admin-auth-changed'));
        return;
      }
      if (error) error.textContent = 'Wrong access code or backend is unavailable.';
    }
  });

  document.querySelector('[data-lock]')?.addEventListener('click', () => {
    removeToken();
    setStaticAuthed(false);
    apiMode = 'locked';
    refreshAuth();
    updateModeCard();
  });

  if (dateEl) dateEl.textContent = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date());

  function render(persist = true) {
    renderMetrics();
    renderLeads();
    renderPosts();
    renderEvents();
    renderPartners();
    renderChecklist();
    if (persist) persistSoon();
  }

  function renderMetrics() {
    const done = state.checks.filter((c) => c.done).length;
    const score = Math.round((done / Math.max(state.checks.length, 1)) * 100);
    setMetric('leads', state.leads.length);
    setMetric('posts', state.posts.length);
    setMetric('events', state.events.length);
    setMetric('score', score + '%');
  }
  function setMetric(name, value) {
    const el = document.querySelector(`[data-metric="${name}"]`);
    if (el) el.textContent = value;
  }
  function renderLeads() {
    const el = document.querySelector('[data-leads-table]');
    if (!el) return;
    if (!state.leads.length) { el.innerHTML = '<div class="empty-state">No leads yet.</div>'; return; }
    el.innerHTML = `<div class="table-row head"><b>Name</b><b>Service</b><b>Source</b><b>Status</b><b></b></div>` + state.leads.map((item) => `
      <div class="table-row">
        <strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.service)}</span><span>${escapeHtml(item.source)}</span>
        <span><i class="${badgeClass(item.priority)}">${escapeHtml(item.status)} • ${escapeHtml(item.priority)}</i></span>
        <div class="row-actions"><button class="icon-btn" data-edit="lead" data-id="${item.id}">✎</button><button class="icon-btn" data-delete="lead" data-id="${item.id}">×</button></div>
      </div>`).join('');
  }
  function renderPosts() {
    const el = document.querySelector('[data-post-list]');
    if (!el) return;
    el.innerHTML = state.posts.length ? state.posts.map((item) => `
      <article class="content-item">
        <strong>${escapeHtml(item.title)} <i class="${badgeClass(item.status)}">${escapeHtml(item.status)}</i></strong>
        <p>${escapeHtml(item.type)} — ${escapeHtml(item.body)}</p>
        <div class="row-actions"><button class="icon-btn" data-edit="post" data-id="${item.id}">✎</button><button class="icon-btn" data-delete="post" data-id="${item.id}">×</button></div>
      </article>`).join('') : '<div class="empty-state">No content drafts yet.</div>';
  }
  function renderEvents() {
    const el = document.querySelector('[data-events-table]');
    if (!el) return;
    if (!state.events.length) { el.innerHTML = '<div class="empty-state">No events yet.</div>'; return; }
    el.innerHTML = `<div class="table-row head calendar-head"><b>Date</b><b>Time</b><b>Currency</b><b>Event</b><b>Impact</b><b></b></div>` + state.events.map((item) => `
      <div class="table-row calendar-row"><strong>${escapeHtml(item.date)}</strong><span>${escapeHtml(item.time || '—')}</span><span>${escapeHtml(item.currency)}</span><span>${escapeHtml(item.title)}</span><span><i class="${badgeClass(item.impact)}">${escapeHtml(item.impact)}</i></span><div class="row-actions"><button class="icon-btn" data-edit="event" data-id="${item.id}">✎</button><button class="icon-btn" data-delete="event" data-id="${item.id}">×</button></div></div>`).join('');
  }
  function renderPartners() {
    const el = document.querySelector('[data-partner-list]');
    if (!el) return;
    el.innerHTML = state.partners.length ? state.partners.map((item) => `
      <article class="partner-note glass"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.tone)}</small><p>${escapeHtml(item.note)}</p><div class="row-actions"><button class="icon-btn" data-edit="partner" data-id="${item.id}">✎</button><button class="icon-btn" data-delete="partner" data-id="${item.id}">×</button></div></article>`).join('') : '<div class="empty-state">No partner notes yet.</div>';
  }
  function renderChecklist() {
    const el = document.querySelector('[data-checklist]');
    if (!el) return;
    el.innerHTML = state.checks.map((item) => `<label class="check-item"><input type="checkbox" data-check="${item.id}" ${item.done ? 'checked' : ''}><span>${escapeHtml(item.text)}</span></label>`).join('');
  }

  function openDialog(type, itemId = null) {
    activeType = type;
    activeId = itemId;
    const schema = schemas[type];
    if (!schema) return;
    const existing = itemId ? state[schema.list].find((x) => x.id === itemId) : {};
    if (dialogTitle) dialogTitle.textContent = (itemId ? 'Edit ' : 'Add ') + schema.label;
    if (fields) fields.innerHTML = `<div class="field-grid">${schema.fields.map(([name, label, kind]) => {
      const value = escapeHtml(existing?.[name] || '');
      const input = kind === 'textarea' ? `<textarea name="${name}" rows="4">${value}</textarea>` : `<input type="${kind || 'text'}" name="${name}" value="${value}">`;
      return `<label class="${kind === 'textarea' ? 'full' : ''}">${label}${input}</label>`;
    }).join('')}</div>`;
    dialog?.showModal();
  }

  document.addEventListener('click', (event) => {
    const open = event.target.closest('[data-open-modal]');
    const edit = event.target.closest('[data-edit]');
    const del = event.target.closest('[data-delete]');
    if (open) openDialog(open.dataset.openModal);
    if (edit) openDialog(edit.dataset.edit, edit.dataset.id);
    if (del) {
      const schema = schemas[del.dataset.delete];
      if (!schema) return;
      state[schema.list] = state[schema.list].filter((x) => x.id !== del.dataset.id);
      render();
    }
  });

  dialogForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!activeType) return;
    const schema = schemas[activeType];
    const data = Object.fromEntries(new FormData(dialogForm).entries());
    if (activeId) {
      state[schema.list] = state[schema.list].map((item) => item.id === activeId ? { ...item, ...data } : item);
    } else {
      state[schema.list].unshift({ id: cryptoId(), ...data });
    }
    dialog?.close();
    render();
  });

  document.addEventListener('change', (event) => {
    const check = event.target.closest('[data-check]');
    if (check) {
      state.checks = state.checks.map((item) => item.id === check.dataset.check ? { ...item, done: check.checked } : item);
      render();
    }
  });

  document.querySelector('[data-reset-checks]')?.addEventListener('click', () => {
    state.checks = state.checks.map((item) => ({ ...item, done: false }));
    render();
  });

  document.querySelector('[data-export]')?.addEventListener('click', async () => {
    try {
      let payload;
      if (getToken()) payload = await api('/api/admin/export');
      else payload = { exportedAt: new Date().toISOString(), adminState: state, siteConfig: window.NoRiskFXCurrentSiteConfig || window.NoRiskFXSiteConfigDefaults };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `noriskfx-admin-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
  });

  document.querySelector('[data-import]')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (getToken()) {
        await api('/api/admin/import', { method: 'POST', body: JSON.stringify(payload.adminState || payload.siteConfig ? payload : { adminState: payload }) });
        await loadState();
        await window.NoRiskFXApplySiteConfig?.();
      } else {
        state = normalizeState(payload.adminState || payload);
        saveLocalState();
      }
      render(false);
      alert('Import completed.');
    } catch (e) {
      alert('Invalid JSON file: ' + e.message);
    }
  });

  document.querySelectorAll('.admin-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav a').forEach((item) => item.classList.remove('active'));
      link.classList.add('active');
    });
  });

  window.NoRiskFXAdminAPI = { api, getToken, loadState, persistState, mode: () => apiMode };

  (async function init() {
    await loadState();
    refreshAuth();
    render(false);
  })();
})();

(() => {
  const KEY = 'noriskfx_site_config_v1';
  const defaults = window.NoRiskFXSiteConfigDefaults || {};
  const form = document.querySelector('[data-site-editor]');
  if (!form) return;

  const clone = (value) => JSON.parse(JSON.stringify(value || {}));
  const mergeConfig = (base, override) => ({
    ...clone(base),
    ...clone(override),
    copy: { ...(base.copy || {}), ...(override.copy || {}) },
    stats: { ...(base.stats || {}), ...(override.stats || {}) },
    widgets: { ...(base.widgets || {}), ...(override.widgets || {}) }
  });
  const splitSymbols = (text = '') => String(text).split('\n').map((line) => {
    const [proName, title] = line.split('|').map((part) => part.trim());
    return proName ? { proName, title: title || proName } : null;
  }).filter(Boolean);
  const joinSymbols = (symbols = []) => symbols.map((item) => `${item.proName} | ${item.title || item.proName}`).join('\n');
  const setField = (name, value = '') => { const field = form.elements[name]; if (field) field.value = value || ''; };

  async function loadConfig() {
    if (window.NoRiskFXLoadSiteConfig) return mergeConfig(defaults, await window.NoRiskFXLoadSiteConfig());
    try { return mergeConfig(defaults, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return clone(defaults); }
  }

  async function saveConfig(config) {
    const adminApi = window.NoRiskFXAdminAPI;
    if (adminApi?.getToken?.()) {
      await adminApi.api('/api/admin/site-config', { method: 'PUT', body: JSON.stringify(config) });
    } else {
      localStorage.setItem(KEY, JSON.stringify(config, null, 2));
    }
    await window.NoRiskFXApplySiteConfig?.();
  }

  async function hydrate() {
    const cfg = await loadConfig();
    setField('heroEyebrowAr', cfg.copy?.heroEyebrow?.ar);
    setField('heroEyebrowEn', cfg.copy?.heroEyebrow?.en);
    setField('heroHeadlineAr', cfg.copy?.heroHeadline?.ar);
    setField('heroHeadlineEn', cfg.copy?.heroHeadline?.en);
    setField('heroLeadAr', cfg.copy?.heroLead?.ar);
    setField('heroLeadEn', cfg.copy?.heroLead?.en);
    setField('statSupportValue', cfg.stats?.support?.value);
    setField('statSupportAr', cfg.stats?.support?.label?.ar);
    setField('statServicesValue', cfg.stats?.services?.value);
    setField('statServicesAr', cfg.stats?.services?.label?.ar);
    setField('statPartnersValue', cfg.stats?.partners?.value);
    setField('statPartnersAr', cfg.stats?.partners?.label?.ar);
    setField('statTrustValue', cfg.stats?.trust?.value);
    setField('statTrustAr', cfg.stats?.trust?.label?.ar);
    setField('weeklyTitleAr', cfg.copy?.weeklyTitle?.ar);
    setField('weeklyLeadAr', cfg.copy?.weeklyLead?.ar);
    setField('weeklyNoteAr', cfg.copy?.weeklyNote?.ar);
    setField('tradaysUrl', cfg.widgets?.tradaysUrl);
    setField('tickerSymbols', joinSymbols(cfg.widgets?.tickerSymbols));
  }

  async function buildConfig() {
    const fd = new FormData(form);
    const base = await loadConfig();
    return mergeConfig(base, {
      copy: {
        heroEyebrow: { ar: fd.get('heroEyebrowAr') || '', en: fd.get('heroEyebrowEn') || '' },
        heroHeadline: { ar: fd.get('heroHeadlineAr') || '', en: fd.get('heroHeadlineEn') || '' },
        heroLead: { ar: fd.get('heroLeadAr') || '', en: fd.get('heroLeadEn') || '' },
        weeklyTitle: { ar: fd.get('weeklyTitleAr') || '', en: base.copy?.weeklyTitle?.en || defaults.copy?.weeklyTitle?.en || '' },
        weeklyLead: { ar: fd.get('weeklyLeadAr') || '', en: base.copy?.weeklyLead?.en || defaults.copy?.weeklyLead?.en || '' },
        weeklyNote: { ar: fd.get('weeklyNoteAr') || '', en: base.copy?.weeklyNote?.en || defaults.copy?.weeklyNote?.en || '' }
      },
      stats: {
        support: { value: fd.get('statSupportValue') || '', label: { ar: fd.get('statSupportAr') || '', en: base.stats?.support?.label?.en || defaults.stats?.support?.label?.en || '' } },
        services: { value: fd.get('statServicesValue') || '', label: { ar: fd.get('statServicesAr') || '', en: base.stats?.services?.label?.en || defaults.stats?.services?.label?.en || '' } },
        partners: { value: fd.get('statPartnersValue') || '', label: { ar: fd.get('statPartnersAr') || '', en: base.stats?.partners?.label?.en || defaults.stats?.partners?.label?.en || '' } },
        trust: { value: fd.get('statTrustValue') || '', label: { ar: fd.get('statTrustAr') || '', en: base.stats?.trust?.label?.en || defaults.stats?.trust?.label?.en || '' } }
      },
      widgets: {
        tradaysUrl: fd.get('tradaysUrl') || defaults.widgets?.tradaysUrl || '',
        tradaysSourceUrl: defaults.widgets?.tradaysSourceUrl || 'https://www.tradays.com/en/widget',
        tickerSymbols: splitSymbols(fd.get('tickerSymbols') || '')
      }
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await saveConfig(await buildConfig());
      await hydrate();
      alert(window.NoRiskFXAdminAPI?.getToken?.() ? 'Website changes saved to backend database.' : 'Website changes saved locally. Login with the Netlify backend to publish for all visitors.');
    } catch (e) {
      alert('Website save failed: ' + e.message);
    }
  });

  document.querySelector('[data-site-reset]')?.addEventListener('click', async () => {
    try {
      await saveConfig(defaults);
      await hydrate();
    } catch (e) {
      localStorage.removeItem(KEY);
      await hydrate();
      await window.NoRiskFXApplySiteConfig?.();
    }
  });

  document.querySelector('[data-site-export]')?.addEventListener('click', async () => {
    const blob = new Blob([JSON.stringify(await loadConfig(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noriskfx-website-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.querySelector('[data-site-import]')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await saveConfig(mergeConfig(defaults, JSON.parse(await file.text())));
      await hydrate();
    } catch (e) {
      alert('Invalid website JSON file: ' + e.message);
    }
  });

  document.addEventListener('noriskfx:admin-auth-changed', hydrate);
  setTimeout(hydrate, 250);
})();
