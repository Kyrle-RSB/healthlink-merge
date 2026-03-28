// ============================================================
// App — frontend logic for the hackathon boilerplate
// ============================================================

// ---------- State ----------

let currentRole = 'admin';

// ---------- Navigation ----------

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const page = btn.dataset.page;
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');

    if (page === 'dashboard') loadDashboard();
    if (page === 'records') loadRecords();
  });
});

// ---------- Role Switcher ----------

document.querySelectorAll('.role-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.role-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentRole = btn.dataset.role;
    updateRoleViews();
  });
});

function updateRoleViews() {
  // Update dashboard views
  document.querySelectorAll('.role-view').forEach((v) => v.classList.remove('active'));
  const dashView = document.getElementById(`dashboard-${currentRole}`);
  if (dashView) dashView.classList.add('active');

  // Show/hide elements based on role
  const newRecordBtn = document.getElementById('btn-new-record');
  if (newRecordBtn) {
    newRecordBtn.style.display = currentRole === 'user' ? 'none' : 'inline-flex';
  }
}

// ---------- Reading Level Toggle ----------

document.querySelectorAll('.rl-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const container = btn.closest('.card');
    container.querySelectorAll('.rl-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const level = btn.dataset.level;
    container.querySelectorAll('.reading-level-content').forEach((c) => c.classList.remove('active'));
    const target = container.querySelector(`#user-summary-${level}`);
    if (target) target.classList.add('active');
  });
});

// ---------- Dashboard ----------

async function loadDashboard() {
  const healthCard = document.getElementById('health-card');
  const result = await api.health();

  if (result.ok) {
    const d = result.data;
    healthCard.innerHTML = `
      <p><strong>Status:</strong> ${d.status}</p>
      <p><strong>App:</strong> ${d.app}</p>
      <p><strong>Environment:</strong> ${d.environment}</p>
      <p><strong>Demo Mode:</strong> ${d.demoMode ? 'Active' : 'Disabled'}</p>
      <p><strong>Database:</strong> ${d.db}</p>
    `;

    document.getElementById('stat-status').textContent = d.status === 'ok' ? '✓ OK' : '✗ Down';
    document.getElementById('stat-db').textContent = d.db === 'connected' ? '✓ Up' : '✗ Down';

    if (!d.demoMode) {
      document.getElementById('demo-badge').style.display = 'none';
    }
  } else {
    healthCard.innerHTML = `<p class="loading">Failed to load health status: ${result.error}</p>`;
  }

  // Load record count
  const allRecords = await api.listRecords(1000, 0);
  if (allRecords.ok && Array.isArray(allRecords.data)) {
    document.getElementById('stat-records').textContent = allRecords.data.length;
  }
}

// ---------- Records ----------

async function loadRecords() {
  const container = document.getElementById('records-list');
  container.innerHTML = '<p class="loading">Loading records...</p>';

  const result = await api.listRecords();

  if (!result.ok) {
    container.innerHTML = `<p>Error loading records: ${result.error}</p>`;
    return;
  }

  const records = result.data || [];

  if (records.length === 0) {
    container.innerHTML = '<p>No records found. Create one to get started.</p>';
    return;
  }

  container.innerHTML = records
    .map(
      (r) => `
    <div class="card">
      <h3>${escapeHtml(r.title)}</h3>
      <span class="category">${escapeHtml(r.category)}</span>
      <p style="margin-top: 0.5rem;">${escapeHtml(r.content)}</p>
      <p class="meta">ID: ${r.id} · Created: ${new Date(r.created_at).toLocaleDateString()}</p>
    </div>
  `
    )
    .join('');
}

// New Record form toggle
document.getElementById('btn-new-record').addEventListener('click', () => {
  const form = document.getElementById('new-record-form');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('btn-cancel-record').addEventListener('click', () => {
  document.getElementById('new-record-form').style.display = 'none';
});

// Save new record
document.getElementById('btn-save-record').addEventListener('click', async () => {
  const title = document.getElementById('record-title').value.trim();
  const category = document.getElementById('record-category').value;
  const content = document.getElementById('record-content').value.trim();

  if (!title || !content) {
    alert('Title and content are required.');
    return;
  }

  const btn = document.getElementById('btn-save-record');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const result = await api.createRecord({ title, category, content });

  btn.disabled = false;
  btn.textContent = 'Save';

  if (result.ok) {
    document.getElementById('new-record-form').style.display = 'none';
    document.getElementById('record-title').value = '';
    document.getElementById('record-content').value = '';
    loadRecords();
  } else {
    alert(`Error: ${result.error}`);
  }
});

// ---------- Ask AI ----------

document.getElementById('btn-ask').addEventListener('click', async () => {
  const question = document.getElementById('ai-question').value.trim();
  if (!question) return;

  const btn = document.getElementById('btn-ask');
  const responseCard = document.getElementById('ai-response');
  const answerDiv = document.getElementById('ai-answer');

  btn.disabled = true;
  btn.textContent = 'Thinking...';
  responseCard.style.display = 'block';
  answerDiv.innerHTML = '<p class="loading">Processing your question...</p>';

  // Placeholder — wire to /api/ask endpoint when ready
  setTimeout(() => {
    answerDiv.innerHTML = `
      <p>This is where the AI response would appear. To enable:</p>
      <ol style="margin: 0.5rem 0 0 1.5rem; color: var(--text-muted);">
        <li>Add your OpenAI API key to .dev.vars</li>
        <li>Wire up a POST /api/ask endpoint using the agent pipeline</li>
        <li>Connect this button to that endpoint</li>
      </ol>
      <p style="margin-top: 0.5rem; color: var(--text-muted);">
        See src/agent/steps.ts for the retrieval + AI pipeline template.
      </p>
    `;
    btn.disabled = false;
    btn.textContent = 'Ask';
  }, 500);
});

// ---------- Voice Transcription ----------

document.getElementById('btn-transcribe').addEventListener('click', async () => {
  const fileInput = document.getElementById('audio-file');
  const file = fileInput.files[0];

  if (!file) {
    alert('Please select an audio file first.');
    return;
  }

  const btn = document.getElementById('btn-transcribe');
  const resultCard = document.getElementById('transcription-result');
  const textDiv = document.getElementById('transcription-text');
  const metaDiv = document.getElementById('transcription-meta');
  const confBadge = document.getElementById('transcription-confidence');

  btn.disabled = true;
  btn.textContent = 'Transcribing...';
  resultCard.style.display = 'block';
  textDiv.innerHTML = '<p class="loading">Processing audio...</p>';

  const result = await api.transcribe(file);

  btn.disabled = false;
  btn.textContent = 'Transcribe';

  if (result.ok) {
    const d = result.data;
    textDiv.textContent = d.transcript || 'No speech detected.';
    metaDiv.textContent = `Duration: ${d.duration?.toFixed(1)}s · Model: ${d.model} · Words: ${d.words?.length || 0}`;

    const conf = Math.round((d.confidence || 0) * 100);
    confBadge.textContent = `${conf}%`;
    confBadge.className = `confidence-badge ${conf >= 80 ? 'confidence-high' : conf >= 60 ? 'confidence-medium' : 'confidence-low'}`;
  } else {
    textDiv.innerHTML = `<p>Error: ${escapeHtml(result.error || 'Transcription failed. Is DEEPGRAM_API_KEY configured?')}</p>`;
    confBadge.textContent = '';
  }
});

// ---------- Parallel Guide Lightbox ----------

const parallelOverlay = document.getElementById('parallel-overlay');

document.getElementById('btn-parallel-guide').addEventListener('click', () => {
  parallelOverlay.classList.add('active');
});

document.getElementById('btn-close-parallel').addEventListener('click', () => {
  parallelOverlay.classList.remove('active');
});

parallelOverlay.addEventListener('click', (e) => {
  if (e.target === parallelOverlay) {
    parallelOverlay.classList.remove('active');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && parallelOverlay.classList.contains('active')) {
    parallelOverlay.classList.remove('active');
  }
});

// ---------- Utilities ----------

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Init ----------

loadDashboard();
updateRoleViews();
