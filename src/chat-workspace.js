/* ── FCOS Specialist Agent Network — Chat Workspace (Phase 12C) ─────────────── */
'use strict';

const CHAT_BOT_URL = 'https://chatgpt.com/g/g-69af0fb012108191a5078db17bb26419-fcos-master-agent-builder';
const FCOS_URL     = 'https://www.fcosthinktank.site';
const STORAGE_KEY  = 'cw:windows:v2';

const AGENTS = [
  {
    id:     'symbiote',
    label:  'FCOS Symbiote',
    icon:   '⚡',
    colour: '#d4af37',
    role:   'Orchestrator',
    desc:   'Full platform context, founder memory, orchestration. Your fused AI partner.',
    url:    CHAT_BOT_URL,
    status: 'live',
  },
  {
    id:     'code',
    label:  'Code Assistant',
    icon:   '💻',
    colour: '#3b82f6',
    role:   'Specialist',
    desc:   'Deep coding intelligence — build pipeline, all 267 ops, P1-P8 framework.',
    url:    CHAT_BOT_URL,
    status: 'planned',
  },
  {
    id:     'planner',
    label:  'Build Planner',
    icon:   '📋',
    colour: '#f97316',
    role:   'Specialist',
    desc:   'Architecture decisions, job planning, spec writing, scope management.',
    url:    CHAT_BOT_URL,
    status: 'planned',
  },
  {
    id:     'frontend',
    label:  'Front End',
    icon:   '🎨',
    colour: '#a78bfa',
    role:   'Specialist',
    desc:   'UI/UX, design system, component patterns, FCOS brand language.',
    url:    CHAT_BOT_URL,
    status: 'planned',
  },
  {
    id:     'business',
    label:  'Business Brain',
    icon:   '💼',
    colour: '#10b981',
    role:   'Specialist',
    desc:   'Business model, market analysis, strategy, growth, monetisation.',
    url:    CHAT_BOT_URL,
    status: 'planned',
  },
  {
    id:     'sprint',
    label:  'Sprint Tracker',
    icon:   '🏃',
    colour: '#14b8a6',
    role:   'Specialist',
    desc:   'Tasks, progress, what\'s done, what\'s next. Keep the build moving.',
    url:    CHAT_BOT_URL,
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
  /** @type {Array<{id,title,colour,url,x,y,width,height,minimised}>} */
  windows:         [],
  _selectedAgent:  AGENTS[0],
  _selectedColour: AGENTS[0].colour,
  _lastX:          80,
  _lastY:          80,

  // ── Init ──────────────────────────────────────────────────────────────────
  async init() {
    await this._waitForTauri();
    this._loadState();
    this._renderHub();
    this._renderLauncher();
    this._renderTaskbar();
    this._renderOpenPlatformBtn();
    this._renderUpdateBtn();

    // Restore non-minimised windows from previous session
    const toRestore = this.windows.filter(w => !w.minimised);
    for (const w of toRestore) {
      try {
        await this._invokeOpen(w);
      } catch (e) {
        console.warn('restore window failed, removing:', w.id, e);
        this.windows = this.windows.filter(x => x.id !== w.id);
        this._saveState();
      }
    }

    // Auto-open FCOS Platform on very first launch
    if (this.windows.length === 0) {
      await this.openChat({
        id:      'fcos-platform',
        agentId: 'fcos-platform',
        title:   'FCOS Platform',
        colour:  '#d4af37',
        url:     FCOS_URL,
        width:   1280,
        height:  800,
        x:       40,
        y:       40,
      });
    }
  },

  // Wait for Tauri IPC bridge — polls up to 3s, resolves immediately in browser
  _waitForTauri() {
    if (typeof window.__TAURI__ !== 'undefined') return Promise.resolve();
    return new Promise(resolve => {
      const deadline = Date.now() + 3000;
      const poll = () => {
        if (typeof window.__TAURI__ !== 'undefined' || Date.now() > deadline) {
          resolve();
        } else {
          setTimeout(poll, 50);
        }
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

  // ── Tauri invoke ──────────────────────────────────────────────────────────
  _invoke(cmd, args) {
    if (window.__TAURI__) return window.__TAURI__.core.invoke(cmd, args);
    return Promise.resolve(); // browser preview no-op
  },

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
      id,
      title:     config.title,
      colour:    config.colour,
      url:       config.url ?? CHAT_BOT_URL,
      x, y,
      width:     config.width  ?? DEFAULT_WIN.width,
      height:    config.height ?? DEFAULT_WIN.height,
      minimised: false,
    };

    const idx = this.windows.findIndex(w => w.id === id);
    if (idx >= 0) { this.windows[idx] = entry; } else { this.windows.push(entry); }

    this._saveState();
    try {
      await this._invokeOpen(entry);
    } catch (e) {
      console.error('openChat failed for', id, ':', e);
      // Remove from state if window failed to open
      this.windows = this.windows.filter(w => w.id !== id);
      this._saveState();
    }
    this._renderTaskbar();
  },

  _nextX() {
    const n = this.windows.filter(w => !w.minimised).length;
    return 80 + (n % 10) * 30;
  },
  _nextY() {
    const n = this.windows.filter(w => !w.minimised).length;
    return 80 + (n % 8) * 30;
  },

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
    w.minimised = false;
    this._saveState();
    await this._invokeOpen(w).catch(() => {});
    this._renderTaskbar();
  },

  async removeWindow(id) {
    await this._invokeClose(id).catch(() => {});
    this.windows = this.windows.filter(w => w.id !== id);
    this._saveState();
    this._renderTaskbar();
  },

  // ── DOM: Hub background ───────────────────────────────────────────────────
  _renderHub() {
    if (document.getElementById('cw-hub')) return;
    const hub = document.createElement('div');
    hub.id = 'cw-hub';
    hub.className = 'cw-hub';
    hub.innerHTML = `
      <div class="cw-hub-logo">FCOS Symbiote</div>
      <div class="cw-hub-sub">
        A network of specialist AI agents, orchestrated by your Symbiote.<br>
        Add a specialist with the button below.
      </div>
      <div class="cw-hub-hint">Agent windows open alongside this workspace.</div>
    `;
    document.body.appendChild(hub);
  },

  // ── DOM: Launcher (Add Specialist button) ─────────────────────────────────
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

  // ── DOM: Open Platform button ─────────────────────────────────────────────
  _renderOpenPlatformBtn() {
    if (document.getElementById('cw-open-platform')) return;
    const btn = document.createElement('button');
    btn.id = 'cw-open-platform';
    btn.className = 'cw-open-platform';
    btn.textContent = 'Open FCOS Platform →';
    btn.onclick = () => this.openChat({
      id:     'fcos-platform',
      agentId: 'fcos-platform',
      title:  'FCOS Platform',
      colour: '#d4af37',
      url:    FCOS_URL,
      x: 40, y: 40, width: 1280, height: 800,
    });
    document.body.appendChild(btn);
  },

  // ── DOM: Check for updates button ─────────────────────────────────────────
  _renderUpdateBtn() {
    if (document.getElementById('cw-update-btn')) return;
    if (typeof window.__TAURI__ === 'undefined') return; // browser preview
    const btn = document.createElement('button');
    btn.id = 'cw-update-btn';
    btn.className = 'cw-update-btn';
    btn.textContent = '↑ Check for updates';
    btn.onclick = async () => {
      btn.textContent = 'Checking…';
      btn.disabled = true;
      try {
        const msg = await window.__TAURI__.core.invoke('check_for_updates');
        btn.textContent = msg;
        setTimeout(() => {
          btn.textContent = '↑ Check for updates';
          btn.disabled = false;
        }, 4000);
      } catch (e) {
        btn.textContent = 'Update check failed';
        btn.disabled = false;
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
        <span class="cw-taskbar-tab-label">${this._esc(w.title)}</span>
        <button class="cw-taskbar-tab-close"
                onclick="event.stopPropagation();ChatWorkspace.removeWindow(${JSON.stringify(w.id)})"
                title="Close">✕</button>
      </div>
    `).join('');
  },

  // ── DOM: New Specialist dialog ────────────────────────────────────────────
  showNewChatDialog() {
    this._closeDialog();

    const overlay = document.createElement('div');
    overlay.id = 'cw-overlay';
    overlay.className = 'cw-overlay';
    overlay.onclick = e => { if (e.target === overlay) this._closeDialog(); };

    // Build agent grid — Symbiote spans full width, rest in 3-col grid
    const [orchestrator, ...specialists] = AGENTS;

    const agentCards = [orchestrator, ...specialists].map((a, i) => {
      const isOrch  = a.role === 'Orchestrator';
      const badge   = isOrch
        ? `<span class="cw-role-badge cw-role-badge--orch">Orchestrator</span>`
        : `<span class="cw-role-badge">Specialist</span>`;
      const planned = a.status === 'planned'
        ? `<span class="cw-planned-badge">KB coming</span>`
        : (a.status === 'live' ? `<span class="cw-live-badge">Live</span>` : '');
      const selected = a.id === this._selectedAgent.id ? ' selected' : '';
      const wide     = isOrch ? ' cw-bot-card--wide' : '';
      return `
        <div class="cw-bot-card${selected}${wide}"
             style="--bot-colour:${a.colour}"
             data-agent-id="${a.id}"
             onclick="ChatWorkspace._selectAgent('${a.id}')">
          <div class="cw-bot-card-top">
            <span class="cw-bot-icon">${a.icon}</span>
            <div class="cw-bot-badges">${badge}${planned}</div>
          </div>
          <div class="cw-bot-name">${a.label}</div>
          <div class="cw-bot-desc">${a.desc}</div>
        </div>
      `;
    }).join('');

    overlay.innerHTML = `
      <div class="cw-dialog">
        <div class="cw-dialog-header">
          <span class="cw-dialog-title">Open a specialist agent</span>
          <button class="cw-dialog-close" onclick="ChatWorkspace._closeDialog()">✕</button>
        </div>

        <div class="cw-label">Choose your specialist</div>
        <div class="cw-bot-grid" id="cw-bot-grid">${agentCards}</div>

        <div class="cw-label">Session title</div>
        <input id="cw-title-input" class="cw-title-input"
               placeholder="${this._esc(this._selectedAgent.label)}"
               value="" />

        <div class="cw-label">Agent colour</div>
        <div class="cw-colour-row" id="cw-colour-row">
          ${COLOUR_PRESETS.map(c => `
            <div class="cw-swatch${c === this._selectedColour ? ' selected' : ''}"
                 style="background:${c}"
                 data-colour="${c}"
                 title="${c}"
                 onclick="ChatWorkspace._selectColour('${c}')"></div>
          `).join('')}
          <div class="cw-swatch cw-swatch--custom" title="Custom colour">
            <input type="color" id="cw-colour-custom"
                   value="${this._selectedColour}"
                   oninput="ChatWorkspace._selectColour(this.value)" />
          </div>
        </div>

        <button class="cw-open-btn" onclick="ChatWorkspace._submitDialog()">
          Open Chat →
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => {
      const inp = document.getElementById('cw-title-input');
      if (inp) inp.focus();
    }, 80);
  },

  _selectAgent(agentId) {
    const agent = AGENTS.find(a => a.id === agentId);
    if (!agent) return;
    this._selectedAgent  = agent;
    this._selectedColour = agent.colour;

    document.querySelectorAll('.cw-bot-card').forEach(el => {
      el.classList.toggle('selected', el.dataset.agentId === agentId);
    });

    const inp = document.getElementById('cw-title-input');
    if (inp) inp.placeholder = agent.label;
    this._refreshSwatches(agent.colour);
  },

  _selectColour(hex) {
    this._selectedColour = hex;
    this._refreshSwatches(hex);
  },

  _refreshSwatches(hex) {
    document.querySelectorAll('.cw-swatch:not(.cw-swatch--custom)').forEach(el => {
      el.classList.toggle('selected', el.dataset.colour === hex);
    });
    const custom = document.getElementById('cw-colour-custom');
    if (custom) custom.value = hex;
  },

  async _submitDialog() {
    const inp    = document.getElementById('cw-title-input');
    const title  = inp?.value.trim() || this._selectedAgent.label;
    const colour = this._selectedColour;
    const agent  = this._selectedAgent;

    this._closeDialog();
    await this.openChat({
      agentId: agent.id,
      title,
      colour,
      url: agent.url,
    });
  },

  _closeDialog() {
    const el = document.getElementById('cw-overlay');
    if (el) el.remove();
  },

  // ── Util ──────────────────────────────────────────────────────────────────
  _esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
};

window.ChatWorkspace = ChatWorkspace;
