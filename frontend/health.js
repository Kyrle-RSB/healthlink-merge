// ============================================================
// Feature Health Diagnostic — Frontend Logic
// ============================================================

let allResults = [];
let registry = [];
let currentFilter = 'all';
let currentCategory = 'all';
let expandedKey = null;

const CATEGORY_LABELS = {
  api_core: 'API Core',
  api_carepoint: 'CarePoint API',
  api_ai: 'AI Features',
  api_assistant: 'AI Assistant',
  api_integrations: 'Integrations',
  api_meetings: 'Meetings',
  api_demo: 'Demo',
  engine: 'Engines',
  database: 'Database',
  frontend: 'Frontend',
  auth: 'Authentication',
  safety: 'Safety',
  storage: 'Storage',
};

const STATUS_ICONS = {
  green: '✓', yellow: '!', red: '✗', grey: '—',
};

const STATUS_LABELS = {
  green: 'Healthy', yellow: 'Warning', red: 'Failing', grey: 'Unchecked',
};

// ---- Run Checks ----

async function runChecks() {
  const btn = document.getElementById('btn-run');
  btn.disabled = true;
  btn.textContent = 'Running...';

  const list = document.getElementById('feature-list');
  list.innerHTML = '<div class="progress-bar"><div class="progress-fill" id="progress" style="width:0%"></div></div><div class="loading">Running health checks on all features...</div>';

  try {
    const res = await fetch('/api/health/features', {
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();

    if (data.ok && data.data) {
      allResults = data.data.results || [];
      registry = data.data.registry || [];
      updateSummary(data.data.summary);
      populateCategoryFilter(data.data.categories || []);
      renderFeatures();
      document.getElementById('last-run').textContent =
        `Last run: ${new Date(data.data.checkedAt).toLocaleTimeString()}`;
    } else {
      list.innerHTML = `<div class="loading" style="color:var(--danger)">Health check failed: ${data.error || 'Unknown error'}</div>`;
    }
  } catch (err) {
    list.innerHTML = `<div class="loading" style="color:var(--danger)">Connection error: ${err.message}</div>`;
  }

  btn.disabled = false;
  btn.textContent = 'Run All Checks';
}

// ---- Summary ----

function updateSummary(summary) {
  document.getElementById('count-total').textContent = summary.total;
  document.getElementById('count-green').textContent = summary.green;
  document.getElementById('count-yellow').textContent = summary.yellow;
  document.getElementById('count-red').textContent = summary.red;
  document.getElementById('count-grey').textContent = summary.grey;
  document.getElementById('health-score').textContent = `${summary.healthScore}%`;

  // Color the score
  const scoreEl = document.getElementById('health-score');
  if (summary.healthScore >= 90) scoreEl.style.color = 'var(--success)';
  else if (summary.healthScore >= 70) scoreEl.style.color = 'var(--warning)';
  else scoreEl.style.color = 'var(--danger)';
}

// ---- Category Filter ----

function populateCategoryFilter(categories) {
  const select = document.getElementById('category-filter');
  // Keep "All Categories" option, remove rest
  while (select.options.length > 1) select.remove(1);
  for (const cat of categories) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = CATEGORY_LABELS[cat] || cat;
    select.appendChild(opt);
  }
}

// ---- Filtering ----

function filterByStatus(status) {
  currentFilter = status;
  // Update active state on summary items
  document.querySelectorAll('.summary-item').forEach(el => {
    el.classList.toggle('active', el.dataset.filter === status);
  });
  applyFilters();
}

function applyFilters() {
  currentCategory = document.getElementById('category-filter').value;
  renderFeatures();
}

// ---- Render Features ----

function renderFeatures() {
  const list = document.getElementById('feature-list');
  const searchTerm = (document.getElementById('search-input').value || '').toLowerCase();

  // Build merged list: registry + results
  const merged = registry.map(feat => {
    const result = allResults.find(r => r.featureKey === feat.key);
    return { ...feat, result };
  });

  // Filter
  const filtered = merged.filter(f => {
    if (currentFilter !== 'all') {
      const status = f.result?.status || 'grey';
      if (status !== currentFilter) return false;
    }
    if (currentCategory !== 'all' && f.category !== currentCategory) return false;
    if (searchTerm) {
      const haystack = `${f.key} ${f.name} ${f.description} ${f.category} ${f.checkTarget} ${f.result?.message || ''}`.toLowerCase();
      if (!haystack.includes(searchTerm)) return false;
    }
    return true;
  });

  // Sort: red → yellow → grey → green
  const sortOrder = { red: 0, yellow: 1, grey: 2, green: 3 };
  filtered.sort((a, b) => {
    const sa = sortOrder[a.result?.status || 'grey'] ?? 2;
    const sb = sortOrder[b.result?.status || 'grey'] ?? 2;
    return sa - sb;
  });

  // Group by category
  const groups = {};
  for (const f of filtered) {
    if (!groups[f.category]) groups[f.category] = [];
    groups[f.category].push(f);
  }

  // Render
  list.innerHTML = '';
  if (filtered.length === 0) {
    list.innerHTML = '<div class="loading">No features match your filters</div>';
    return;
  }

  for (const [cat, features] of Object.entries(groups)) {
    const group = document.createElement('div');
    group.className = 'category-group';

    const header = document.createElement('div');
    header.className = 'category-header';
    const catGreen = features.filter(f => f.result?.status === 'green').length;
    const catTotal = features.length;
    header.textContent = `${CATEGORY_LABELS[cat] || cat} (${catGreen}/${catTotal} healthy)`;
    group.appendChild(header);

    for (const f of features) {
      const status = f.result?.status || 'grey';
      const card = document.createElement('div');
      card.className = `feature-card ${expandedKey === f.key ? 'expanded' : ''}`;
      card.onclick = () => toggleExpand(f.key);

      card.innerHTML = `
        <div class="status-dot status-${status}"></div>
        <div>
          <div class="feature-name">${esc(f.name)}</div>
          <div class="feature-message">${esc(f.result?.message || 'Not checked yet')}</div>
        </div>
        <span class="feature-badge badge-${status}">${STATUS_LABELS[status]}</span>
        <span class="feature-duration">${f.result?.durationMs != null ? f.result.durationMs + 'ms' : '—'}</span>
      `;
      group.appendChild(card);

      // Expanded detail
      if (expandedKey === f.key) {
        const detail = document.createElement('div');
        detail.className = 'feature-detail';
        detail.innerHTML = `
          <div class="detail-row"><span class="detail-label">Key</span><span class="detail-value">${esc(f.key)}</span></div>
          <div class="detail-row"><span class="detail-label">Description</span><span class="detail-value">${esc(f.description)}</span></div>
          <div class="detail-row"><span class="detail-label">Check Type</span><span class="detail-value">${esc(f.checkType)}</span></div>
          <div class="detail-row"><span class="detail-label">Target</span><span class="detail-value"><code>${esc(f.checkTarget)}</code></span></div>
          ${f.result?.details ? `<div class="detail-row"><span class="detail-label">Details</span><span class="detail-value"><code>${esc(JSON.stringify(f.result.details))}</code></span></div>` : ''}
          <div class="detail-actions">
            ${status === 'red' || status === 'yellow' ? `<button class="btn btn-diagnose" onclick="event.stopPropagation(); diagnose('${f.key}')">Diagnose</button>` : ''}
            ${f.checkType === 'route' || f.checkType === 'frontend_asset' ? `<button class="btn btn-sm" onclick="event.stopPropagation(); window.open('${f.checkTarget}', '_blank')">Open</button>` : ''}
          </div>
        `;
        detail.onclick = (e) => e.stopPropagation();
        group.appendChild(detail);
      }
    }

    list.appendChild(group);
  }
}

function toggleExpand(key) {
  expandedKey = expandedKey === key ? null : key;
  renderFeatures();
}

// ---- Diagnose ----

async function diagnose(featureKey) {
  const modal = document.getElementById('diag-modal');
  const body = document.getElementById('diag-body');
  const title = document.getElementById('diag-title');

  const feat = registry.find(f => f.key === featureKey);
  title.textContent = `Diagnosing: ${feat?.name || featureKey}`;
  body.innerHTML = '<div class="loading">Running deep diagnosis...</div>';
  modal.style.display = 'flex';

  try {
    const res = await fetch('/api/health/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featureKey }),
    });
    const data = await res.json();

    if (data.ok && data.data) {
      renderDiagnosis(data.data);
    } else {
      body.innerHTML = `<div class="loading" style="color:var(--danger)">Diagnosis failed: ${data.error || 'Unknown'}</div>`;
    }
  } catch (err) {
    body.innerHTML = `<div class="loading" style="color:var(--danger)">Connection error: ${err.message}</div>`;
  }
}

function renderDiagnosis(diag) {
  const body = document.getElementById('diag-body');

  let html = '';

  // Severity badge
  html += `<div class="diag-severity severity-${diag.severity}">${diag.severity}</div>`;

  // Steps
  for (const step of diag.steps) {
    const icons = { pass: '✓', fail: '✗', warn: '!', info: 'i' };
    html += `
      <div class="diag-step step-${step.status}">
        <div class="diag-icon">${icons[step.status] || '?'}</div>
        <div>
          <div class="diag-label">${esc(step.label)}</div>
          <div class="diag-detail">${esc(step.detail)}</div>
        </div>
      </div>
    `;
  }

  // Suggestions
  if (diag.suggestions && diag.suggestions.length > 0) {
    html += `
      <div class="diag-suggestions">
        <h4>Suggestions</h4>
        <ul>${diag.suggestions.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      </div>
    `;
  }

  html += `<div style="margin-top:12px;font-size:11px;color:var(--text-muted)">Diagnosed at ${new Date(diag.diagnosedAt).toLocaleTimeString()} (${diag.durationMs}ms)</div>`;

  body.innerHTML = html;
}

function closeDiag() {
  document.getElementById('diag-modal').style.display = 'none';
}

// ---- Utilities ----

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
