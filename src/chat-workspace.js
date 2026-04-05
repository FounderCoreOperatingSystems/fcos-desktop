/* ── FCOS Symbiote Desktop — Chat Workspace ─────────────────────────────────── */
'use strict';

const CHAT_BOT_URL = 'https://chatgpt.com/g/g-69af0fb012108191a5078db17bb26419-fcos-master-agent-builder';
const FCOS_URL     = 'https://www.fcosthinktank.site/products/';
const STORAGE_KEY  = 'cw:windows:v4';
const APP_VERSION  = '1.0.13';

const FCOS_BUILD_URL  = 'https://chatgpt.com/g/g-69d19d899fd081918138517c4f13d9d3-fcos-build';
const FCOS_BRAINZ_URL = 'https://chatgpt.com/g/g-69d1532825148191bddb2435d94256a5-fcos-brainz';
const IMG_BASE        = 'https://api.fcosthinktank.uk/products/landing';

const AGENTS = [
  {
    id:     'symbiote',
    label:  'FCOS Symbiote',
    icon:   '⚡',
    colour: '#d4af37',
    role:   'Orchestrator',
    desc:   'Full platform context, founder memory, orchestration. Your fused AI partner.',
    url:    CHAT_BOT_URL,
    image:  `${IMG_BASE}/main-symbiote.jpg`,
    status: 'live',
  },
  {
    id:     'code',
    label:  'FCOS Build',
    icon:   '💻',
    colour: '#22c55e',
    role:   'Specialist',
    desc:   'Deep coding intelligence — build pipeline, all 267 ops, P1-P8 framework.',
    url:    FCOS_BUILD_URL,
    image:  `${IMG_BASE}/build-symbiote.jpg`,
    status: 'live',
  },
  {
    id:     'planner',
    label:  'FCOS Brainz',
    icon:   '🧠',
    colour: '#f97316',
    role:   'Specialist',
    desc:   'Knowledge pack management, strategic intelligence, FCOS architecture.',
    url:    FCOS_BRAINZ_URL,
    image:  `${IMG_BASE}/brainz-symbiote.jpg`,
    status: 'live',
  },
  {
    id:     'frontend',
    label:  'Front End',
    icon:   '🎨',
    colour: '#a855f7',
    role:   'Specialist',
    desc:   'UI/UX, design system, component patterns, FCOS brand language.',
    url:    CHAT_BOT_URL,
    image:  `${IMG_BASE}/gaming-symbiote.jpg`,
    status: 'planned',
  },
  {
    id:     'business',
    label:  'Business Brain',
    icon:   '💼',
    colour: '#eab308',
    role:   'Specialist',
    desc:   'Business model, market analysis, strategy, growth, monetisation.',
    url:    CHAT_BOT_URL,
    image:  `${IMG_BASE}/finance-symbiote.jpg`,
    status: 'planned',
  },
  {
    id:     'sprint',
    label:  'Sprint Tracker',
    icon:   '🏃',
    colour: '#facc15',
    role:   'Specialist',
    desc:   'Tasks, progress, what\'s done, what\'s next. Keep the build moving.',
    url:    CHAT_BOT_URL,
    image:  `${IMG_BASE}/thinktank-symbiote.jpg`,
    status: 'planned',
  },
  {
    id:     'custom',
    label:  'Custom',
    icon:   '✨',
    colour: '#ef4444',
    role:   'Specialist',
    desc:   'Your own specialist — name it, colour it, purpose it.',
    url:    CHAT_BOT_URL,
    image:  null,
    status: 'custom',
  },
];

const COLOUR_PRESETS = [
  '#d4af37', '#3b82f6', '#f97316', '#a78bfa',
  '#10b981', '#14b8a6', '#ec4899', '#ef4444', '#f5f0e8',
];

const DEFAULT_WIN = { width: 480, height: 700 };

// ── ChatWorkspace ─────────────────────────────────────────────────────────────
const ChatWorkspace = {
  windows:         [],
  _selectedAgent:  AGENTS[0],
  _selectedColour: AGENTS[0].colour,
  _lastX:          80,
  _lastY:          80,
  _ipcPath:        'none',

  // ── IPC — call invoke INLINE on its parent object, never extract ──────────
  _hasTauri() {
    if (window.__TAURI__?.core?.invoke)    { this._ipcPath = 'tauri.core'; return true; }
    if (window.__TAURI_INTERNALS__?.invoke) { this._ipcPath = 'internals'; return true; }
    if (window.__TAURI__?.invoke)           { this._ipcPath = 'tauri.v1';  return true; }
    return false;
  },

  async _invoke(cmd, args) {
    const path =
      window.__TAURI__?.core?.invoke    ? 'tauri.core' :
      window.__TAURI_INTERNALS__?.invoke ? 'internals' :
      window.__TAURI__?.invoke           ? 'tauri.v1' : null;

    console.log('[FCOS] invoke:', cmd, '| path:', path || 'NONE');

    try {
      if (window.__TAURI__?.core?.invoke) {
        return await window.__TAURI__.core.invoke(cmd, args);
      }
      if (window.__TAURI_INTERNALS__?.invoke) {
        return await window.__TAURI_INTERNALS__.invoke(cmd, args);
      }
      if (window.__TAURI__?.invoke) {
        return await window.__TAURI__.invoke(cmd, args);
      }
    } catch (e) {
      const msg = typeof e === 'string' ? e : (e?.message || JSON.stringify(e));
      console.error('[FCOS] IPC error:', cmd, msg);
      this._toast('IPC error: ' + msg, true);
      throw e;
    }
    // No IPC available
    console.warn('[FCOS] No Tauri IPC — browser mode. cmd:', cmd);
  },

  // ── Init ──────────────────────────────────────────────────────────────────
  async init() {
    // Poll for Tauri IPC — it may not be injected immediately
    await this._waitForTauri();

    const available = this._hasTauri();
    console.log('[FCOS] IPC path:', this._ipcPath,
      '| __TAURI__:', typeof window.__TAURI__,
      '| __TAURI_INTERNALS__:', typeof window.__TAURI_INTERNALS__);

    this._loadState();
    this._renderHub(available);
    this._renderLauncher();
    this._renderTaskbar();
    this._renderOpenPlatformBtn();
    this._renderUpdateBtn(available);

    if (!available) {
      this._toast('Tauri IPC not found — running in browser preview mode.', true);
      return;
    }

    // Quick IPC smoke test
    try {
      const greeting = await this._invoke('greet', { name: 'Symbiote' });
      console.log('[FCOS] IPC smoke test OK:', greeting);
    } catch (e) {
      this._toast('IPC smoke test failed: ' + (e?.message || e), true);
    }

    // Restore windows
    const toRestore = this.windows.filter(w => !w.minimised);
    for (const w of toRestore) {
      try { await this._invokeOpen(w); } catch (e) {
        this.windows = this.windows.filter(x => x.id !== w.id);
        this._saveState();
      }
    }

    // Auto-open FCOS Platform on first launch
    if (this.windows.length === 0) {
      await this.openChat({
        id: 'fcos-platform', agentId: 'fcos-platform',
        title: 'FCOS Platform', colour: '#d4af37', url: FCOS_URL,
        width: 1280, height: 800, x: 40, y: 40,
      });
    }
  },

  _waitForTauri() {
    if (this._hasTauri()) return Promise.resolve();
    return new Promise(resolve => {
      const deadline = Date.now() + 3000;
      const poll = () => {
        if (this._hasTauri() || Date.now() > deadline) resolve();
        else setTimeout(poll, 50);
      };
      setTimeout(poll, 50);
    });
  },

  // ── Persistence ───────────────────────────────────────────────────────────
  _loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.windows = raw ? JSON.parse(raw) : [];
    } catch { this.windows = []; }
    const last = this.windows[this.windows.length - 1];
    if (last) { this._lastX = last.x || 80; this._lastY = last.y || 80; }
  },

  _saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.windows)); } catch {}
  },

  // ── Invoke wrappers ───────────────────────────────────────────────────────
  _invokeOpen(w) {
    return this._invoke('open_chat_window', {
      id:     w.id,
      title:  w.title,
      colour: w.colour,
      url:    w.url,
      x:      w.x      ?? this._lastX,
      y:      w.y      ?? this._lastY,
      width:  w.width  ?? DEFAULT_WIN.width,
      height: w.height ?? DEFAULT_WIN.height,
    });
  },

  _invokeClose(id) {
    return this._invoke('close_chat_window', { id });
  },

  // ── Open specialist ───────────────────────────────────────────────────────
  async openChat(config) {
    const id = config.id ?? (config.agentId + '-' + Date.now());
    const x  = config.x ?? this._nextX();
    const y  = config.y ?? this._nextY();
    this._lastX = x; this._lastY = y;

    const entry = {
      id, title: config.title, colour: config.colour,
      url: config.url ?? CHAT_BOT_URL,
      x, y,
      width: config.width ?? DEFAULT_WIN.width,
      height: config.height ?? DEFAULT_WIN.height,
      minimised: false,
    };

    const idx = this.windows.findIndex(w => w.id === id);
    if (idx >= 0) this.windows[idx] = entry; else this.windows.push(entry);
    this._saveState();

    try {
      await this._invokeOpen(entry);
    } catch (e) {
      this._toast('Window failed: ' + (e?.message || e || 'unknown'), true);
      this.windows = this.windows.filter(w => w.id !== id);
      this._saveState();
    }
    this._renderTaskbar();
  },

  _nextX() { return 80 + (this.windows.filter(w => !w.minimised).length % 10) * 30; },
  _nextY() { return 80 + (this.windows.filter(w => !w.minimised).length % 8) * 30; },

  // ── Minimise / Restore ────────────────────────────────────────────────────
  async minimise(id) {
    const w = this.windows.find(w => w.id === id);
    if (w) { w.minimised = true; this._saveState(); }
    await this._invokeClose(id).catch(() => {});
    this._renderTaskbar();
  },

  async restore(id) {
    const w = this.windows.find(w => w.id === id);
    if (!w) return;
    w.minimised = false; this._saveState();
    await this._invokeOpen(w).catch(() => {});
    this._renderTaskbar();
  },

  async removeWindow(id) {
    await this._invokeClose(id).catch(() => {});
    this.windows = this.windows.filter(w => w.id !== id);
    this._saveState();
    this._renderTaskbar();
  },

  // ── DOM: Hub ──────────────────────────────────────────────────────────────
  _renderHub(ipcAvailable) {
    if (document.getElementById('cw-hub')) return;
    const hub = document.createElement('div');
    hub.id = 'cw-hub';
    hub.className = 'cw-hub';

    const status = ipcAvailable
      ? `<span class="cw-status cw-status--ok">IPC: ${this._ipcPath}</span>`
      : `<span class="cw-status cw-status--err">IPC: not detected</span>`;

    hub.innerHTML = `
      <div class="cw-hub-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="url(#g1)" stroke-width="2"/>
          <circle cx="24" cy="24" r="8" fill="url(#g1)"/>
          <circle cx="24" cy="10" r="3" fill="#d4af37"/>
          <circle cx="36" cy="30" r="3" fill="#a78bfa"/>
          <circle cx="12" cy="30" r="3" fill="#3b82f6"/>
          <line x1="24" y1="16" x2="24" y2="18" stroke="#d4af37" stroke-width="1.5"/>
          <line x1="30" y1="27" x2="31.5" y2="28" stroke="#a78bfa" stroke-width="1.5"/>
          <line x1="18" y1="27" x2="16.5" y2="28" stroke="#3b82f6" stroke-width="1.5"/>
          <defs><linearGradient id="g1" x1="0" y1="0" x2="48" y2="48"><stop stop-color="#d4af37"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs>
        </svg>
      </div>
      <div class="cw-hub-logo">FCOS Symbiote</div>
      <div class="cw-hub-tagline">Founder Core Operating Systems</div>
      <div class="cw-hub-sub">
        A network of specialist AI agents, orchestrated by your Symbiote.
      </div>
      <div class="cw-hub-actions">
        <button class="cw-hub-btn cw-hub-btn--primary" onclick="ChatWorkspace.openChat({id:'fcos-platform',agentId:'fcos-platform',title:'FCOS Platform',colour:'#d4af37',url:'${FCOS_URL}',width:1280,height:800,x:40,y:40})">
          Open Platform
        </button>
        <button class="cw-hub-btn cw-hub-btn--secondary" onclick="ChatWorkspace.showNewChatDialog()">
          Launch Agent
        </button>
      </div>
      <div class="cw-hub-footer">
        ${status}
        <span class="cw-version">v${APP_VERSION}</span>
      </div>
    `;
    document.body.appendChild(hub);
  },

  // ── DOM: Launcher FAB ─────────────────────────────────────────────────────
  _renderLauncher() {
    if (document.getElementById('cw-launcher')) return;
    const btn = document.createElement('button');
    btn.id = 'cw-launcher';
    btn.className = 'cw-launcher';
    btn.title = 'Add specialist agent';
    btn.innerHTML = '<span class="cw-launcher-icon">+</span>';
    btn.onclick = () => this.showNewChatDialog();
    document.body.appendChild(btn);
  },

  // ── DOM: Open Platform pill ───────────────────────────────────────────────
  _renderOpenPlatformBtn() {
    // Handled by hub actions now
  },

  // ── DOM: Update button ────────────────────────────────────────────────────
  _renderUpdateBtn(ipcAvailable) {
    if (document.getElementById('cw-update-btn')) return;
    if (!ipcAvailable) return;
    const btn = document.createElement('button');
    btn.id = 'cw-update-btn';
    btn.className = 'cw-update-btn';
    btn.textContent = 'Check for updates';
    btn.onclick = async () => {
      btn.textContent = 'Checking…';
      btn.disabled = true;
      try {
        const msg = await this._invoke('check_for_updates');
        btn.textContent = msg || 'Up to date';
        setTimeout(() => { btn.textContent = 'Check for updates'; btn.disabled = false; }, 4000);
      } catch (e) {
        btn.textContent = 'Update failed';
        setTimeout(() => { btn.textContent = 'Check for updates'; btn.disabled = false; }, 3000);
      }
    };
    document.body.appendChild(btn);
  },

  // ── DOM: Taskbar ──────────────────────────────────────────────────────────
  _renderTaskbar() {
    let bar = document.getElementById('cw-taskbar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'cw-taskbar';
      bar.className = 'cw-taskbar';
      document.body.appendChild(bar);
    }

    const minimised = this.windows.filter(w => w.minimised);
    if (minimised.length === 0) {
      bar.innerHTML = '<span class="cw-taskbar-empty">No minimised agents</span>';
      return;
    }

    bar.innerHTML = minimised.map(w => `
      <div class="cw-taskbar-tab"
           style="--tab-colour:${this._esc(w.colour)}"
           onclick="ChatWorkspace.restore(${JSON.stringify(w.id)})">
        <span class="cw-taskbar-tab-dot" style="background:${this._esc(w.colour)}"></span>
        <span class="cw-taskbar-tab-label">${this._esc(w.title)}</span>
        <button class="cw-taskbar-tab-close"
                onclick="event.stopPropagation();ChatWorkspace.removeWindow(${JSON.stringify(w.id)})"
                title="Close">✕</button>
      </div>
    `).join('');
  },

  // ── DOM: Agent picker dialog ──────────────────────────────────────────────
  showNewChatDialog() {
    this._closeDialog();

    const overlay = document.createElement('div');
    overlay.id = 'cw-overlay';
    overlay.className = 'cw-overlay';
    overlay.onclick = e => { if (e.target === overlay) this._closeDialog(); };

    const agentCards = AGENTS.map(a => {
      const isOrch = a.role === 'Orchestrator';
      const badge = isOrch
        ? '<span class="cw-badge cw-badge--orch">Orchestrator</span>'
        : '<span class="cw-badge">Specialist</span>';
      const statusBadge = a.status === 'live'
        ? '<span class="cw-badge cw-badge--live">LIVE</span>'
        : (a.status === 'planned' ? '<span class="cw-badge cw-badge--soon">KB coming</span>' : '');
      const selected = a.id === this._selectedAgent.id ? ' selected' : '';
      const wide = isOrch ? ' cw-agent--wide' : '';
      const imgHtml = a.image
        ? `<img src="${a.image}" alt="${a.label}" class="cw-agent-img" onerror="this.style.display='none'">`
        : `<span class="cw-agent-icon">${a.icon}</span>`;
      return `
        <div class="cw-agent${selected}${wide}"
             style="--agent-colour:${a.colour}"
             data-agent-id="${a.id}"
             onclick="ChatWorkspace._selectAgent('${a.id}')">
          <div class="cw-agent-head">
            ${imgHtml}
            <div class="cw-agent-badges">${badge}${statusBadge}</div>
          </div>
          <div class="cw-agent-name">${a.label}</div>
          <div class="cw-agent-desc">${a.desc}</div>
        </div>
      `;
    }).join('');

    overlay.innerHTML = `
      <div class="cw-dialog">
        <div class="cw-dialog-header">
          <span class="cw-dialog-title">Launch Agent</span>
          <button class="cw-dialog-close" onclick="ChatWorkspace._closeDialog()">✕</button>
        </div>

        <div class="cw-label">Choose your specialist</div>
        <div class="cw-agent-grid">${agentCards}</div>

        <div class="cw-label">Session title</div>
        <input id="cw-title-input" class="cw-input"
               placeholder="${this._esc(this._selectedAgent.label)}" value="" />

        <div class="cw-label">Agent colour</div>
        <div class="cw-colour-row">
          ${COLOUR_PRESETS.map(c => `
            <div class="cw-swatch${c === this._selectedColour ? ' selected' : ''}"
                 style="background:${c}" data-colour="${c}"
                 onclick="ChatWorkspace._selectColour('${c}')"></div>
          `).join('')}
          <div class="cw-swatch cw-swatch--custom">
            <input type="color" value="${this._selectedColour}"
                   oninput="ChatWorkspace._selectColour(this.value)" />
          </div>
        </div>

        <button class="cw-btn-primary" onclick="ChatWorkspace._submitDialog()">
          Open Chat Window
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('cw-title-input')?.focus(), 80);
  },

  _selectAgent(agentId) {
    const agent = AGENTS.find(a => a.id === agentId);
    if (!agent) return;
    this._selectedAgent = agent;
    this._selectedColour = agent.colour;
    document.querySelectorAll('.cw-agent').forEach(el =>
      el.classList.toggle('selected', el.dataset.agentId === agentId));
    const inp = document.getElementById('cw-title-input');
    if (inp) inp.placeholder = agent.label;
    this._refreshSwatches(agent.colour);
  },

  _selectColour(hex) {
    this._selectedColour = hex;
    this._refreshSwatches(hex);
  },

  _refreshSwatches(hex) {
    document.querySelectorAll('.cw-swatch:not(.cw-swatch--custom)').forEach(el =>
      el.classList.toggle('selected', el.dataset.colour === hex));
  },

  async _submitDialog() {
    const inp = document.getElementById('cw-title-input');
    const title = inp?.value.trim() || this._selectedAgent.label;
    const agent = this._selectedAgent;
    this._closeDialog();
    await this.openChat({ agentId: agent.id, title, colour: this._selectedColour, url: agent.url });
  },

  _closeDialog() {
    document.getElementById('cw-overlay')?.remove();
  },

  // ── Util ──────────────────────────────────────────────────────────────────
  _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  _toast(msg, isError) {
    let c = document.getElementById('cw-toasts');
    if (!c) {
      c = document.createElement('div');
      c.id = 'cw-toasts';
      c.style.cssText = 'position:fixed;top:16px;right:16px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
      document.body.appendChild(c);
    }
    const el = document.createElement('div');
    el.className = 'cw-toast' + (isError ? ' cw-toast--err' : '');
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => el.remove(), 6000);
  },
};

window.ChatWorkspace = ChatWorkspace;
