/* ── FCOS Symbiote Desktop — App Shell ────────────────────────────────────── */
'use strict';

const APP_VERSION = '1.1.3';
const MCP_BASE    = 'https://mcp.fcosthinktank.uk';
const MCP_TOKEN   = 'd3126d53f66c2cf1b2ce6c4dcc5e900026c3e737af43978e';
const IMG_BASE    = 'https://api.fcosthinktank.uk/products/landing';

const AGENTS = [
  { id:'symbiote', label:'FCOS Symbiote', icon:'⚡', colour:'#d4af37', role:'Orchestrator',
    desc:'Full platform context, founder memory, orchestration. Your fused AI partner.',
    url:'https://chatgpt.com/g/g-69af0fb012108191a5078db17bb26419-fcos-master-agent-builder',
    image:`${IMG_BASE}/main-symbiote.jpg`, status:'live' },
  { id:'build', label:'FCOS Build', icon:'💻', colour:'#22c55e', role:'Specialist',
    desc:'Deep coding intelligence — build pipeline, verification, risk-aware delivery.',
    url:'https://chatgpt.com/g/g-69d19d899fd081918138517c4f13d9d3-fcos-build',
    image:`${IMG_BASE}/build-symbiote.jpg`, status:'live' },
  { id:'brainz', label:'FCOS Brainz', icon:'🧠', colour:'#f97316', role:'Specialist',
    desc:'Knowledge pack management, strategic intelligence, FCOS architecture.',
    url:'https://chatgpt.com/g/g-69d1532825148191bddb2435d94256a5-fcos-brainz',
    image:`${IMG_BASE}/brainz-symbiote.jpg`, status:'live' },
  { id:'frontend', label:'Front End', icon:'🎨', colour:'#a855f7', role:'Specialist',
    desc:'UI/UX, design system, component patterns, FCOS brand language.', url:null,
    image:`${IMG_BASE}/gaming-symbiote.jpg`, status:'planned' },
  { id:'business', label:'Business Brain', icon:'💼', colour:'#eab308', role:'Specialist',
    desc:'Business model, market analysis, strategy, growth, monetisation.', url:null,
    image:`${IMG_BASE}/finance-symbiote.jpg`, status:'planned' },
  { id:'marketing', label:'Marketing & Growth', icon:'📣', colour:'#14b8a6', role:'Specialist',
    desc:'Content strategy, SEO, acquisition channels, campaign planning.', url:null,
    image:`${IMG_BASE}/marketing-symbiote.jpg`, status:'planned' },
  { id:'legal', label:'Legal & Compliance', icon:'⚖️', colour:'#1e3a5f', role:'Specialist',
    desc:'Terms, GDPR, contracts, IP protection, regulatory guidance.', url:null,
    image:`${IMG_BASE}/legal-symbiote.jpg`, status:'planned' },
  { id:'sales', label:'Sales & CRM', icon:'🤝', colour:'#ea580c', role:'Specialist',
    desc:'Pipeline management, outreach, proposals, CRM strategy.', url:null,
    image:`${IMG_BASE}/sales-symbiote.jpg`, status:'planned' },
];

const TOOLS = [
  { id:'brainz-tool', label:'Brainz', image:`${IMG_BASE}/brainz-symbiote.jpg`, url:'https://app.fcosthinktank.uk/brainz/', colour:'#f97316' },
  { id:'sprint-tool', label:'Sprint', image:`${IMG_BASE}/thinktank-symbiote.jpg`, url:'https://app.fcosthinktank.uk/sprint/', colour:'#facc15' },
  { id:'synapse-tool', label:'Synapse', image:`${IMG_BASE}/music-symbiote.jpg`, url:'https://app.fcosthinktank.uk/synapse/', colour:'#a78bfa' },
  { id:'store-tool', label:'Store', image:`${IMG_BASE}/social-symbiote.jpg`, url:'https://app.fcosthinktank.uk/store/', colour:'#3b82f6' },
  { id:'media-tool', label:'Media', image:`${IMG_BASE}/media-symbiote.jpg`, url:'https://app.fcosthinktank.uk/media/', colour:'#ec4899' },
];

// ── App ──────────────────────────────────────────────────────────────────────
const App = {
  view: 'dashboard',
  ipc: false,

  // ── IPC ────────────────────────────────────────────────────────────────────
  _hasTauri() {
    return !!(window.__TAURI__?.core?.invoke || window.__TAURI_INTERNALS__?.invoke || window.__TAURI__?.invoke);
  },

  async _invoke(cmd, args) {
    try {
      if (window.__TAURI__?.core?.invoke) return await window.__TAURI__.core.invoke(cmd, args);
      if (window.__TAURI_INTERNALS__?.invoke) return await window.__TAURI_INTERNALS__.invoke(cmd, args);
      if (window.__TAURI__?.invoke) return await window.__TAURI__.invoke(cmd, args);
    } catch (e) {
      console.error('[FCOS] IPC error:', cmd, e);
    }
  },

  // ── Init ───────────────────────────────────────────────────────────────────
  async init() {
    await this._waitForTauri();
    this.ipc = this._hasTauri();
    this._render();
    this._checkHealth();
  },

  _waitForTauri() {
    if (this._hasTauri()) return Promise.resolve();
    return new Promise(r => {
      const end = Date.now() + 2000;
      const poll = () => (this._hasTauri() || Date.now() > end) ? r() : setTimeout(poll, 50);
      setTimeout(poll, 50);
    });
  },

  // ── Navigation ─────────────────────────────────────────────────────────────
  navigate(view) {
    this.view = view;
    this._render();
  },

  // ── Render ─────────────────────────────────────────────────────────────────
  _render() {
    document.body.innerHTML = '';
    const shell = document.createElement('div');
    shell.className = 'app-shell';
    shell.innerHTML = this._sidebarHTML() + this._mainHTML();
    document.body.appendChild(shell);
    this._addToastContainer();

    // Post-render: load webview if tool view
    if (this.view.startsWith('tool:')) {
      const toolId = this.view.split(':')[1];
      const tool = TOOLS.find(t => t.id === toolId);
      if (tool) this._openToolPanel(tool);
    }
    if (this.view === 'health') this._loadHealth();
    if (this.view === 'audit') this._loadAudit();
  },

  _sidebarHTML() {
    const navItem = (id, img, label, badge) => {
      const active = this.view === id ? ' active' : '';
      const b = badge ? `<span class="nav-badge">${badge}</span>` : '';
      const icon = img ? `<img src="${img}" class="nav-img" onerror="this.style.display='none'">` : `<span class="nav-dot" style="background:var(--gold)"></span>`;
      return `<button class="nav-item${active}" onclick="App.navigate('${id}')">
        ${icon}<span class="nav-label">${label}</span>${b}</button>`;
    };

    const toolItems = TOOLS.map(t => {
      const active = this.view === 'tool:' + t.id ? ' active' : '';
      return `<button class="nav-item${active}" onclick="App.navigate('tool:${t.id}')">
        <img src="${t.image}" class="nav-img" onerror="this.style.display='none'"><span class="nav-label">${t.label}</span></button>`;
    }).join('');

    return `<div class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <img src="https://api.fcosthinktank.uk/products/landing/fcos-logo-nav.png" class="sidebar-logo-img" onerror="this.style.display='none'" />
          <div class="sidebar-logo">FCOS Symbiote</div>
        </div>
        <div class="sidebar-sub">Founder OS</div>
      </div>
      <div class="sidebar-nav">
        ${navItem('dashboard', IMG_BASE+'/main-symbiote.jpg', 'Dashboard')}
        ${navItem('agents', IMG_BASE+'/symbiote-hero.jpg', 'Agents', AGENTS.filter(a=>a.status==='live').length)}
        ${navItem('health', null, 'Health')}
        ${navItem('audit', null, 'Audit Log')}
        <div class="nav-section">Tools</div>
        ${toolItems}
      </div>
      <div class="sidebar-footer">
        <span class="sidebar-version">v${APP_VERSION}</span>
        <button class="sidebar-refresh" onclick="location.reload()" title="Refresh app">↻</button>
        ${this.ipc ? '<button class="sidebar-update" id="update-btn" onclick="App.checkUpdate()">Check for updates</button>' : ''}
        <span class="sidebar-status ${this.ipc?'ok':'err'}" id="ipc-status">${this.ipc?'Desktop':'Browser'}</span>
      </div>
    </div>`;
  },

  _mainHTML() {
    switch (this.view) {
      case 'dashboard': return this._dashboardHTML();
      case 'agents':    return this._agentsHTML();
      case 'health':    return this._healthHTML();
      case 'audit':     return this._auditHTML();
      default:
        if (this.view.startsWith('tool:')) return this._toolPanelHTML();
        return this._dashboardHTML();
    }
  },

  // ── Dashboard ──────────────────────────────────────────────────────────────
  _dashboardHTML() {
    const liveAgents = AGENTS.filter(a => a.status === 'live');
    return `<div class="main">
      <div class="main-header"><span class="main-title">Dashboard</span>
        <div class="main-actions">
          <button class="btn btn-gold" onclick="App.navigate('agents')">Launch Agent</button>
        </div>
      </div>
      <div class="main-body">
        <!-- Hero -->
        <div class="dash-hero">
          <div class="dash-hero-avatar-wrap">
            <div class="dash-hero-ring"></div>
            <img src="${IMG_BASE}/main-symbiote.jpg" class="dash-hero-avatar" onerror="this.style.display='none'" />
          </div>
          <div class="dash-hero-text">
            <div class="dash-hero-title">FCOS Symbiote</div>
            <div class="dash-hero-sub">Your AI operating system. A network of specialist agents, orchestrated for founders.</div>
          </div>
        </div>

        <!-- Stats -->
        <div class="dash-grid">
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">Live Agents</span></div>
            <div class="dash-card-value">${liveAgents.length}</div>
            <div class="dash-card-label">${AGENTS.length - liveAgents.length} planned</div>
          </div>
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">MCP Tools</span></div>
            <div class="dash-card-value" id="dash-tools">—</div>
            <div class="dash-card-label" id="dash-tools-label">checking...</div>
          </div>
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">API Health</span></div>
            <div class="dash-card-value" id="dash-health">—</div>
            <div class="dash-card-label" id="dash-health-label">checking...</div>
          </div>
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">Platform</span></div>
            <div class="dash-card-value">${TOOLS.length}</div>
            <div class="dash-card-label">embedded tools</div>
          </div>
        </div>

        <div class="nav-section" style="padding:0 0 12px">Quick Launch</div>
        <div class="agent-grid">
          ${liveAgents.map(a => this._agentCardHTML(a)).join('')}
        </div>
      </div>
    </div>`;
  },

  // ── Agents ─────────────────────────────────────────────────────────────────
  _agentsHTML() {
    return `<div class="main">
      <div class="main-header"><span class="main-title">Agents</span></div>
      <div class="main-body">
        <div class="nav-section" style="padding:0 0 12px">Live</div>
        <div class="agent-grid" style="margin-bottom:24px">
          ${AGENTS.filter(a=>a.status==='live').map(a => this._agentCardHTML(a)).join('')}
        </div>
        <div class="nav-section" style="padding:0 0 12px">Coming Soon</div>
        <div class="agent-grid">
          ${AGENTS.filter(a=>a.status==='planned').map(a => this._agentCardHTML(a)).join('')}
        </div>
      </div>
    </div>`;
  },

  _agentCardHTML(a) {
    const imgHtml = a.image
      ? `<img src="${a.image}" class="agent-card-img" onerror="this.style.display='none'">`
      : `<div class="agent-card-icon">${a.icon}</div>`;
    const onclick = a.url ? `App.openAgent('${a.id}')` : '';
    const cursor = a.url ? '' : 'cursor:default;opacity:0.6;';
    return `<div class="agent-card" style="--agent-colour:${a.colour};${cursor}" onclick="${onclick}">
      <div class="agent-card-head">${imgHtml}<div>
        <div class="agent-card-name">${a.label}</div>
        <div class="agent-card-role">${a.role}</div>
      </div></div>
      <div class="agent-card-desc">${a.desc}</div>
      <span class="agent-card-status ${a.status}">${a.status}</span>
    </div>`;
  },

  openAgent(id) {
    const agent = AGENTS.find(a => a.id === id);
    if (!agent || !agent.url) return;

    if (this.ipc) {
      this._invoke('open_chat_window', {
        id: agent.id, title: agent.label, colour: agent.colour, url: agent.url,
        x: 100, y: 100, width: 480, height: 700,
      });
    } else {
      window.open(agent.url, '_blank');
    }
    this._toast(`${agent.label} opened in browser`);
  },

  // ── Health ─────────────────────────────────────────────────────────────────
  _healthHTML() {
    return `<div class="main">
      <div class="main-header"><span class="main-title">Health</span>
        <div class="main-actions"><button class="btn" onclick="App._loadHealth()">Refresh</button></div>
      </div>
      <div class="main-body">
        <table class="health-table">
          <thead><tr><th>Service</th><th>Status</th><th>Detail</th><th>Latency</th></tr></thead>
          <tbody id="health-body"><tr><td colspan="4" style="color:var(--muted)">Loading...</td></tr></tbody>
        </table>
      </div>
    </div>`;
  },

  async _loadHealth() {
    const checks = [
      { name:'FCOS API', url:'https://api.fcosthinktank.uk/health' },
      { name:'MCP Server', url:`${MCP_BASE}/health` },
      { name:'Website', url:'https://www.fcosthinktank.site/' },
    ];

    const tbody = document.getElementById('health-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    for (const c of checks) {
      const start = Date.now();
      let status = 'down', detail = 'unreachable', ms = '—';
      try {
        const r = await fetch(c.url, { signal: AbortSignal.timeout(8000) });
        ms = (Date.now() - start) + 'ms';
        if (r.ok) {
          status = 'up';
          try { const j = await r.json(); detail = j.status || 'ok'; if(j.tools) detail += ` (${j.tools} tools)`; }
          catch { detail = r.status + ' OK'; }
        } else { detail = r.status + ' ' + r.statusText; }
      } catch(e) { detail = e.message || 'timeout'; }

      tbody.innerHTML += `<tr>
        <td><span class="health-dot ${status}"></span>${c.name}</td>
        <td style="color:${status==='up'?'var(--green)':'var(--red)'}">${status}</td>
        <td>${detail}</td><td>${ms}</td></tr>`;
    }

    // Update dashboard cards if visible
    const dt = document.getElementById('dash-tools');
    const dh = document.getElementById('dash-health');
    if (dt) {
      try {
        const r = await fetch(`${MCP_BASE}/health`);
        const j = await r.json();
        dt.textContent = j.tools || '—';
        document.getElementById('dash-tools-label').textContent = 'available';
      } catch { dt.textContent = '!'; document.getElementById('dash-tools-label').textContent = 'offline'; }
    }
    if (dh) {
      try {
        const r = await fetch('https://api.fcosthinktank.uk/health');
        if (r.ok) { dh.textContent = '✓'; document.getElementById('dash-health-label').textContent = 'online'; }
        else throw 0;
      } catch { dh.textContent = '✗'; document.getElementById('dash-health-label').textContent = 'offline'; }
    }
  },

  async _checkHealth() {
    try {
      const r = await fetch(`${MCP_BASE}/health`, { signal: AbortSignal.timeout(5000) });
      const j = await r.json();
      const dt = document.getElementById('dash-tools');
      if (dt) { dt.textContent = j.tools; document.getElementById('dash-tools-label').textContent = 'available'; }
    } catch {}
    try {
      const r = await fetch('https://api.fcosthinktank.uk/health', { signal: AbortSignal.timeout(5000) });
      const dh = document.getElementById('dash-health');
      if (dh && r.ok) { dh.textContent = '✓'; document.getElementById('dash-health-label').textContent = 'online'; }
    } catch {}
  },

  // ── Audit ──────────────────────────────────────────────────────────────────
  _auditHTML() {
    return `<div class="main">
      <div class="main-header"><span class="main-title">Audit Log</span>
        <div class="main-actions"><button class="btn" onclick="App._loadAudit()">Refresh</button></div>
      </div>
      <div class="main-body" id="audit-body"><div style="color:var(--muted)">Loading...</div></div>
    </div>`;
  },

  async _loadAudit() {
    const body = document.getElementById('audit-body');
    if (!body) return;
    try {
      const r = await fetch(`${MCP_BASE}/api/audit_query`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${MCP_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 30 }),
      });
      const data = await r.json();
      if (!data.entries?.length) { body.innerHTML = '<div style="color:var(--muted)">No audit entries yet.</div>'; return; }
      body.innerHTML = data.entries.map(e => `<div class="audit-entry">
        <div class="audit-entry-head">
          <span class="audit-tool">${e.tool||'—'}</span>
          <span class="audit-time">${e.timestamp ? new Date(e.timestamp).toLocaleString() : '—'}</span>
        </div>
        <div class="audit-detail">
          ${e.actor||'—'} · ${e.approvalStatus||e.decision||'—'} · ${e.summary||''}
        </div>
      </div>`).join('');
    } catch(e) {
      body.innerHTML = `<div style="color:var(--red)">Failed to load audit: ${e.message}</div>`;
    }
  },

  // ── Tool Panel (webview) ───────────────────────────────────────────────────
  _toolPanelHTML() {
    const toolId = this.view.split(':')[1];
    const tool = TOOLS.find(t => t.id === toolId);
    const label = tool ? tool.label : 'Tool';
    return `<div class="main">
      <div class="main-header"><span class="main-title">${label}</span>
        <div class="main-actions">
          <button class="btn" onclick="window.open('${tool?.url||''}','_blank')">Open in Browser</button>
        </div>
      </div>
      <iframe class="webview-panel" id="tool-frame" src="" frameborder="0"></iframe>
    </div>`;
  },

  _openToolPanel(tool) {
    const frame = document.getElementById('tool-frame');
    if (frame) frame.src = tool.url;
  },

  // ── Toast ──────────────────────────────────────────────────────────────────
  _addToastContainer() {
    if (document.getElementById('toast-container')) return;
    const c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'toast-container';
    document.body.appendChild(c);
  },

  async checkUpdate() {
    const btn = document.getElementById('update-btn');
    if (!btn) return;
    btn.textContent = 'Checking...';
    btn.disabled = true;
    try {
      const msg = await this._invoke('check_for_updates');
      btn.textContent = msg || 'Up to date';
      setTimeout(() => { btn.textContent = 'Check for updates'; btn.disabled = false; }, 4000);
    } catch (e) {
      btn.textContent = 'Update failed';
      setTimeout(() => { btn.textContent = 'Check for updates'; btn.disabled = false; }, 3000);
    }
  },

  _toast(msg, isError) {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const el = document.createElement('div');
    el.className = 'toast' + (isError ? ' err' : '');
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  },
};

window.App = App;
