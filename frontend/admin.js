// ============================================================
// CarePoint Admin Dashboard — Frontend Logic
// ============================================================

let adminData = { patients: [], facilities: [], problems: [], sessions: [], staff: [], snapshot: null };

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  const page = location.hash.slice(1) || 'dashboard';
  showPage(page);
});

// ---- API ----
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  return res.json();
}

// ---- Navigation ----
function setupNav() {
  window.addEventListener('hashchange', () => showPage(location.hash.slice(1) || 'dashboard'));

  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    const sb = document.getElementById('sidebar');
    if (window.innerWidth < 768) {
      sb.classList.toggle('mobile-open');
    } else {
      sb.classList.toggle('collapsed');
      localStorage.setItem('sidebar-collapsed', sb.classList.contains('collapsed'));
    }
  });

  if (localStorage.getItem('sidebar-collapsed') === 'true') {
    document.getElementById('sidebar').classList.add('collapsed');
  }
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  const el = document.getElementById('page-' + page);
  if (el) el.style.display = 'block';

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');

  // Load data for the page
  const loaders = {
    dashboard: loadDashboard,
    patients: loadPatients,
    problems: loadProblems,
    encounters: loadEncounters,
    facilities: loadFacilities,
    staff: loadStaff,
    sessions: loadSessions,
    analytics: loadAnalytics,
    integrations: loadIntegrations,
    meetings: loadMeetings,
  };
  if (loaders[page]) loaders[page]();
}

// ---- Dashboard ----
async function loadDashboard() {
  const [snap, patients, problems] = await Promise.all([
    api('/api/system/snapshot'),
    api('/api/patients'),
    api('/api/problems'),
  ]);

  if (snap.ok) adminData.snapshot = snap.data;
  if (patients.ok) adminData.patients = patients.data;
  if (problems.ok) adminData.problems = problems.data;

  renderDashMetrics(snap.data, patients.data, problems.data);
  renderFacilityBars(snap.data?.facilities || []);
  renderRecentSessions(snap.data?.sessions?.recent || []);
  renderPatientCards(patients.data || []);
}

function renderDashMetrics(snap, patients, problems) {
  const facs = snap?.facilities || [];
  const accepting = facs.filter(f => f.accepting).length;
  const maxER = facs.filter(f => f.type?.includes('hospital')).sort((a, b) => b.load_pct - a.load_pct)[0];
  const erColor = maxER && maxER.load_pct >= 80 ? 'red' : maxER && maxER.load_pct >= 50 ? 'yellow' : 'green';

  document.getElementById('dash-metrics').innerHTML = `
    <div class="metric-card metric-blue">
      <div class="metric-label">Total Patients</div>
      <div class="metric-value">${patients?.length || 0}</div>
      <div class="metric-sub">Synthetic personas</div>
    </div>
    <div class="metric-card metric-green">
      <div class="metric-label">Active Facilities</div>
      <div class="metric-value">${facs.length}</div>
      <div class="metric-sub">${accepting} accepting patients</div>
    </div>
    <div class="metric-card metric-${erColor}">
      <div class="metric-label">ER Load (Peak)</div>
      <div class="metric-value">${maxER ? maxER.load_pct + '%' : '--'}</div>
      <div class="metric-sub">${maxER ? esc(maxER.name.replace(' (MOCK)', '')) : ''}</div>
    </div>
    <div class="metric-card metric-purple">
      <div class="metric-label">Medical Problems</div>
      <div class="metric-value">${problems?.length || 0}</div>
      <div class="metric-sub">Across ${new Set((problems||[]).map(p=>p.recommended_destination)).size} destinations</div>
    </div>
  `;
}

function renderFacilityBars(facilities) {
  if (!facilities.length) { document.getElementById('dash-facility-bars').innerHTML = '<div class="empty">No facilities</div>'; return; }
  document.getElementById('dash-facility-bars').innerHTML = facilities.map(f => {
    const cls = f.load_pct < 50 ? 'low' : f.load_pct < 80 ? 'med' : 'high';
    return `<div class="load-bar-row">
      <span class="lb-name">${esc(f.name.replace(' (MOCK)', ''))}</span>
      <div class="lb-track"><div class="lb-fill ${cls}" style="width:${Math.min(f.load_pct,100)}%"></div></div>
      <span class="lb-pct">${f.load_pct}%</span>
      <span class="lb-wait">${f.wait_minutes}m wait</span>
    </div>`;
  }).join('');
}

function renderRecentSessions(sessions) {
  const el = document.getElementById('dash-recent-sessions');
  if (!sessions.length) { el.innerHTML = '<div class="empty">No routing sessions yet. Run a demo scenario from the Patient View.</div>'; return; }
  el.innerHTML = sessions.map(s => `
    <div class="session-feed-item">
      <span class="sf-complaint">${esc(s.complaint || '')}</span>
      <span class="sf-confidence">${s.confidence ? Math.round(s.confidence * 100) + '%' : ''}</span>
      <span class="badge badge-${s.destination || 'clinic'}">${s.destination || '?'}</span>
    </div>
  `).join('');
}

function renderPatientCards(patients) {
  const el = document.getElementById('dash-patients');
  if (!patients.length) { el.innerHTML = '<div class="empty">No patients</div>'; return; }
  el.innerHTML = patients.map(p => {
    const barriers = p.has_family_doctor === false ? ['no doctor'] : [];
    if (p.has_insurance === false) barriers.push('no insurance');
    return `<div class="patient-card" onclick="location.hash='patients';setTimeout(()=>showPatientDetail('${p.id}'),100)">
      <div class="pc-name">${esc(p.name)}</div>
      <div class="pc-meta">${p.age}yo ${p.gender} | ${p.language}</div>
      <div class="pc-conditions">${esc(p.conditions_summary || '')}</div>
      ${barriers.length ? `<div class="pc-barriers">${barriers.map(b => `<span class="barrier-tag">${esc(b)}</span>`).join('')}</div>` : ''}
    </div>`;
  }).join('');
}

// ---- Patients ----
async function loadPatients() {
  if (!adminData.patients.length) {
    const res = await api('/api/patients');
    if (res.ok) adminData.patients = res.data;
  }
  renderPatientsTable(adminData.patients);
}

function renderPatientsTable(patients) {
  document.getElementById('patient-detail').style.display = 'none';
  document.getElementById('patients-table-wrap').innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th>Name</th><th>Age</th><th>Gender</th><th>Language</th><th>Family Dr</th><th>Insurance</th><th>Conditions</th>
      </tr></thead>
      <tbody>${patients.map(p => `
        <tr class="expandable" onclick="showPatientDetail('${p.id}')">
          <td><strong>${esc(p.name)}</strong></td>
          <td>${p.age}</td>
          <td>${p.gender}</td>
          <td>${p.language}</td>
          <td>${p.has_family_doctor ? '<span style="color:var(--success)">Yes</span>' : '<span style="color:var(--danger)">No</span>'}</td>
          <td>${p.has_insurance ? '<span style="color:var(--success)">Yes</span>' : '<span style="color:var(--danger)">No</span>'}</td>
          <td>${esc(p.conditions_summary || '')}</td>
        </tr>
      `).join('')}</tbody>
    </table>`;
}

async function showPatientDetail(id) {
  const res = await api('/api/patients/' + id);
  if (!res.ok) return;
  const d = res.data;
  const el = document.getElementById('patient-detail');
  el.style.display = 'block';
  el.innerHTML = `
    <div class="card" style="margin-top:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h2 style="font-size:18px;font-weight:700">${esc(d.patient.first_name)} ${esc(d.patient.last_name)}</h2>
        <button class="btn btn-sm btn-outline" onclick="document.getElementById('patient-detail').style.display='none'">Close</button>
      </div>
      <div class="detail-grid">
        <div><div class="detail-label">Demographics</div><div class="detail-value">${d.patient.age}yo ${d.patient.gender} | Language: ${d.patient.language}<br>Phone: ${d.patient.phone || 'N/A'} | Postal: ${d.patient.postal_code || 'N/A'}</div></div>
        <div><div class="detail-label">Access</div><div class="detail-value">Family Doctor: ${d.patient.has_family_doctor ? 'Yes' : '<strong style="color:var(--danger)">No</strong>'}<br>Insurance: ${d.patient.has_insurance ? 'Yes' : '<strong style="color:var(--danger)">No</strong>'}</div></div>
        <div><div class="detail-label">Barriers</div><div class="detail-value">${(d.barriers || []).map(b => `<span class="barrier-tag">${esc(b)}</span>`).join(' ') || 'None'}</div></div>
        <div><div class="detail-label">Conditions Summary</div><div class="detail-value">${esc(d.patient.conditions_summary || 'None')}</div></div>
      </div>
      ${d.conditions.length ? `
        <div class="section-title" style="margin-top:16px">Active Conditions</div>
        <table class="data-table"><thead><tr><th>Code</th><th>Description</th><th>Onset</th><th>Status</th></tr></thead>
        <tbody>${d.conditions.map(c => `<tr><td><code>${esc(c.code)}</code></td><td>${esc(c.description)}</td><td>${c.onset_date || ''}</td><td><span class="badge badge-${c.status === 'active' ? 'active' : 'completed'}">${c.status}</span></td></tr>`).join('')}</tbody></table>
      ` : ''}
      ${d.medications.length ? `
        <div class="section-title" style="margin-top:16px">Current Medications</div>
        <table class="data-table"><thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Since</th></tr></thead>
        <tbody>${d.medications.map(m => `<tr><td>${esc(m.description)}</td><td>${m.dosage || ''}</td><td>${m.frequency || ''}</td><td>${m.start_date || ''}</td></tr>`).join('')}</tbody></table>
      ` : ''}
      ${d.encounters.length ? `
        <div class="section-title" style="margin-top:16px">Recent Encounters</div>
        <table class="data-table"><thead><tr><th>Date</th><th>Type</th><th>Reason</th><th>Provider</th></tr></thead>
        <tbody>${d.encounters.map(e => `<tr><td>${e.encounter_date}</td><td>${esc(e.encounter_type)}</td><td>${esc(e.reason || '')}</td><td>${esc(e.provider_name || '')}</td></tr>`).join('')}</tbody></table>
      ` : ''}
      ${d.observations.length ? `
        <div class="section-title" style="margin-top:16px">Observations</div>
        <table class="data-table"><thead><tr><th>Date</th><th>Observation</th><th>Value</th><th>Unit</th></tr></thead>
        <tbody>${d.observations.map(o => `<tr><td>${o.observation_date || ''}</td><td>${esc(o.description)}</td><td><strong>${o.value || ''}</strong></td><td>${o.unit || ''}</td></tr>`).join('')}</tbody></table>
      ` : ''}
    </div>`;
  el.scrollIntoView({ behavior: 'smooth' });
}

// ---- Problems ----
async function loadProblems() {
  if (!adminData.problems.length) {
    const res = await api('/api/problems');
    if (res.ok) adminData.problems = res.data;
  }
  const dest = document.getElementById('filter-dest')?.value || '';
  const filtered = dest ? adminData.problems.filter(p => p.recommended_destination === dest) : adminData.problems;
  renderProblemsTable(filtered);
}

function renderProblemsTable(problems) {
  document.getElementById('problems-table-wrap').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Title</th><th>ICD-10</th><th>Type</th><th>Sev</th><th>CTAS</th><th>Destination</th></tr></thead>
      <tbody>${problems.map(p => `
        <tr class="expandable" onclick="toggleDetail(this)">
          <td><strong>${esc(p.title)}</strong></td>
          <td><code>${p.icd10_code}</code></td>
          <td><span class="badge badge-${p.type}">${p.type}</span></td>
          <td>${'*'.repeat(p.severity)}</td>
          <td>${p.ctas_level}</td>
          <td><span class="badge badge-${p.recommended_destination}">${p.recommended_destination}</span></td>
        </tr>
        <tr class="detail-row" style="display:none">
          <td colspan="6">
            <div class="detail-grid">
              <div><div class="detail-label">Symptoms</div><div class="detail-value">${parseJSON(p.symptoms).join(', ')}</div></div>
              <div><div class="detail-label">Red Flags</div><div class="detail-value" style="color:var(--danger)">${parseJSON(p.red_flags).join(', ') || 'None'}</div></div>
              <div><div class="detail-label">Wait Tolerance</div><div class="detail-value">${p.typical_wait_tolerance || 'N/A'}</div></div>
              <div><div class="detail-label">Related Conditions</div><div class="detail-value">${parseJSON(p.related_conditions).join(', ') || 'None'}</div></div>
            </div>
          </td>
        </tr>
      `).join('')}</tbody>
    </table>`;
}

// ---- Encounters ----
async function loadEncounters() {
  const res = await api('/api/encounters');
  if (!res.ok) return;
  document.getElementById('encounters-table-wrap').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Date</th><th>Patient</th><th>Type</th><th>Reason</th><th>Provider</th><th>Status</th></tr></thead>
      <tbody>${res.data.map(e => `
        <tr>
          <td>${e.encounter_date}</td>
          <td>${e.patient_id}</td>
          <td>${esc(e.encounter_type)}</td>
          <td>${esc(e.reason || '')}</td>
          <td>${esc(e.provider_name || '')}</td>
          <td><span class="badge badge-${e.status === 'completed' ? 'completed' : 'active'}">${e.status}</span></td>
        </tr>
      `).join('')}</tbody>
    </table>`;
}

// ---- Facilities ----
async function loadFacilities() {
  const [facRes, staffRes] = await Promise.all([api('/api/facilities'), api('/api/staff')]);
  const facilities = facRes.ok ? facRes.data : [];
  const staff = staffRes.ok ? staffRes.data : [];
  adminData.staff = staff;

  document.getElementById('facilities-grid').innerHTML = facilities.map(f => {
    const load = f.capacity_total ? Math.round((f.capacity_current / f.capacity_total) * 100) : 0;
    const cls = load < 50 ? 'low' : load < 80 ? 'med' : 'high';
    const facStaff = staff.filter(s => s.facility_id === f.id);
    const services = parseJSON(f.services).slice(0, 6);
    return `<div class="facility-card">
      <div class="fc-header">
        <span class="fc-name">${esc(f.name.replace(' (MOCK)', ''))}</span>
        <span class="badge badge-${f.type.includes('hospital') ? 'er' : f.type === 'urgent_care' ? 'urgent_care' : f.type === 'telehealth' ? 'virtual' : f.type === 'pharmacy' ? 'pharmacy' : f.type === 'mental_health_crisis' ? 'mental_health_crisis' : 'clinic'}">${f.type.replace(/_/g, ' ')}</span>
      </div>
      <div class="fc-address">${esc(f.address || 'Virtual')} | ${f.hours}</div>
      <div class="fc-load">
        <div class="fc-load-track"><div class="fc-load-fill ${cls}" style="width:${load}%;background:var(--${cls === 'low' ? 'success' : cls === 'med' ? 'warning' : 'danger'})"></div></div>
        <div class="fc-load-label"><span>${load}% capacity</span><span>${f.wait_minutes}m wait</span></div>
      </div>
      <div class="fc-services">${services.map(s => `<span class="service-tag">${s.replace(/_/g, ' ')}</span>`).join('')}</div>
      <div class="fc-footer">
        <span>${facStaff.length} staff${facStaff.filter(s => s.on_duty).length ? ` (${facStaff.filter(s => s.on_duty).length} on duty)` : ''}</span>
        <span>${f.accepting_patients ? '<span style="color:var(--success)">Accepting</span>' : '<span style="color:var(--danger)">Full</span>'}</span>
      </div>
    </div>`;
  }).join('');
}

// ---- Staff ----
async function loadStaff() {
  const [staffRes, facRes] = await Promise.all([api('/api/staff'), api('/api/facilities')]);
  const staff = staffRes.ok ? staffRes.data : [];
  const facs = facRes.ok ? facRes.data : [];
  const facMap = Object.fromEntries(facs.map(f => [f.id, f.name.replace(' (MOCK)', '')]));

  document.getElementById('staff-table-wrap').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Facility</th><th>On Duty</th><th>Skills</th></tr></thead>
      <tbody>${staff.map(s => `
        <tr>
          <td><strong>${esc(s.first_name)} ${esc(s.last_name.replace(' (MOCK)', ''))}</strong></td>
          <td>${esc(s.role)}</td>
          <td>${esc(s.department)}</td>
          <td>${esc(facMap[s.facility_id] || s.facility_id)}</td>
          <td>${s.on_duty ? '<span style="color:var(--success)">On Duty</span>' : '<span style="color:var(--text-muted)">Off</span>'}</td>
          <td>${parseJSON(s.skills).slice(0, 3).map(sk => `<span class="service-tag">${sk.replace(/_/g, ' ')}</span>`).join(' ')}</td>
        </tr>
      `).join('')}</tbody>
    </table>`;
}

// ---- Sessions ----
async function loadSessions() {
  const res = await api('/api/sessions');
  if (!res.ok) return;
  const sessions = res.data || [];
  adminData.sessions = sessions;

  document.getElementById('sessions-table-wrap').innerHTML = sessions.length ? `
    <table class="data-table">
      <thead><tr><th>Time</th><th>Patient</th><th>Complaint</th><th>Destination</th><th>Confidence</th><th>Sentiment</th><th>Status</th></tr></thead>
      <tbody>${sessions.map(s => `
        <tr class="expandable" onclick="toggleDetail(this)">
          <td>${new Date(s.created_at).toLocaleTimeString()}</td>
          <td>${s.patient_id || 'Anonymous'}</td>
          <td>${esc((s.initial_complaint || '').slice(0, 60))}</td>
          <td>${s.recommended_destination ? `<span class="badge badge-${s.recommended_destination}">${s.recommended_destination}</span>` : ''}</td>
          <td>${s.confidence_score ? Math.round(s.confidence_score * 100) + '%' : ''}</td>
          <td>${s.sentiment || ''}</td>
          <td><span class="badge badge-${s.status}">${s.status}</span></td>
        </tr>
        <tr class="detail-row" style="display:none">
          <td colspan="7">
            ${s.conversation_log ? renderConvoLog(s.conversation_log) : '<div class="empty">No conversation log</div>'}
            ${s.rerouted_from ? `<div style="margin-top:8px"><span class="badge badge-rerouted">Rerouted</span> ${esc(s.reroute_reason || '')}</div>` : ''}
          </td>
        </tr>
      `).join('')}</tbody>
    </table>` : '<div class="empty">No routing sessions yet. Run a demo from the Patient View.</div>';
}

function renderConvoLog(logJson) {
  try {
    const msgs = typeof logJson === 'string' ? JSON.parse(logJson) : logJson;
    if (!msgs.length) return '<div class="empty">Empty conversation</div>';
    return `<div class="convo-log">${msgs.map(m => `
      <div class="convo-msg convo-${m.role}">
        <div class="convo-role">${m.role}</div>
        ${esc(m.content)}
      </div>
    `).join('')}</div>`;
  } catch { return '<div class="empty">Could not parse conversation</div>'; }
}

// ---- Analytics ----
async function loadAnalytics() {
  const res = await api('/api/analytics');
  if (!res.ok) { document.getElementById('analytics-metrics').innerHTML = '<div class="empty">No data yet</div>'; return; }
  const d = res.data;

  document.getElementById('analytics-metrics').innerHTML = `
    <div class="metric-card metric-green">
      <div class="metric-label">ER Diversion Rate</div>
      <div class="metric-value">${d.diversion_rate}%</div>
      <div class="metric-sub">Target: 30%+</div>
    </div>
    <div class="metric-card metric-blue">
      <div class="metric-label">Total Sessions</div>
      <div class="metric-value">${d.total_sessions}</div>
      <div class="metric-sub">${d.active_sessions} active</div>
    </div>
    <div class="metric-card metric-purple">
      <div class="metric-label">Avg Confidence</div>
      <div class="metric-value">${d.avg_confidence}%</div>
      <div class="metric-sub">Across all routing decisions</div>
    </div>
    <div class="metric-card metric-yellow">
      <div class="metric-label">Reroutes</div>
      <div class="metric-value">${d.reroute_count}</div>
      <div class="metric-sub">${d.reroute_rate || 0}% reroute rate</div>
    </div>
  `;

  // Confidence distribution (if available)
  if (d.confidence_distribution) {
    const confHtml = Object.entries(d.confidence_distribution).map(([bucket, count]) => {
      const maxConf = Math.max(...Object.values(d.confidence_distribution).map(Number), 1);
      const color = bucket.includes('90') ? 'var(--success)' : bucket.includes('70') ? 'var(--primary)' : bucket.includes('50') ? 'var(--warning)' : 'var(--danger)';
      return `<div class="bar-chart-item"><span class="bc-label">${bucket}</span><div class="bc-track"><div class="bc-fill" style="width:${(Number(count)/maxConf)*100}%;background:${color}"><span>${count}</span></div></div></div>`;
    }).join('');
    document.getElementById('analytics-destinations').innerHTML = `
      <div class="section-title" style="margin-top:0">Confidence Distribution</div>
      ${confHtml}
      <div class="section-title" style="margin-top:16px">Routing by Destination</div>
    ` + document.getElementById('analytics-destinations').innerHTML.replace(/<div class="section-title"[^>]*>Routing by Destination<\/div>/, '');
  }

  // Destination distribution
  const maxCount = Math.max(...Object.values(d.destination_distribution).map(Number), 1);
  const destColors = { er: 'var(--danger)', urgent_care: '#ea580c', clinic: 'var(--success)', virtual: 'var(--info)', pharmacy: 'var(--purple)', self_care: '#71717a', mental_health_crisis: 'var(--pink)' };
  document.getElementById('analytics-destinations').innerHTML = `
    <div class="section-title" style="margin-top:0">Routing by Destination</div>
    ${Object.entries(d.destination_distribution).map(([dest, count]) => `
      <div class="bar-chart-item">
        <span class="bc-label">${dest.replace(/_/g, ' ')}</span>
        <div class="bc-track"><div class="bc-fill" style="width:${(count / maxCount) * 100}%;background:${destColors[dest] || 'var(--primary)'}"><span>${count}</span></div></div>
      </div>
    `).join('')}
  `;

  // Sentiment distribution
  const maxSent = Math.max(...Object.values(d.sentiment_distribution).map(Number), 1);
  document.getElementById('analytics-sentiment').innerHTML = `
    <div class="section-title" style="margin-top:0">Sentiment Distribution</div>
    ${Object.entries(d.sentiment_distribution).map(([sent, count]) => `
      <div class="bar-chart-item">
        <span class="bc-label">${sent}</span>
        <div class="bc-track"><div class="bc-fill" style="width:${(count / maxSent) * 100}%;background:var(--primary)"><span>${count}</span></div></div>
      </div>
    `).join('')}

    <div class="section-title" style="margin-top:20px">How CarePoint Compares</div>
    <table class="data-table" style="font-size:12px">
      <thead><tr><th></th><th>CarePoint</th><th>811 HealthLink</th><th>MyChart</th><th>OceanMD</th></tr></thead>
      <tbody>
        <tr><td><strong>Who uses it</strong></td><td style="color:var(--success)">Any patient</td><td>Any patient</td><td>Existing patients only</td><td>Providers only</td></tr>
        <tr><td><strong>Wait to access</strong></td><td style="color:var(--success)">Instant</td><td>30-60 min phone wait</td><td>Login required</td><td>N/A (provider tool)</td></tr>
        <tr><td><strong>Shows what's available NOW</strong></td><td style="color:var(--success)">Yes — real-time loads</td><td>No</td><td>No</td><td>No</td></tr>
        <tr><td><strong>Routes to specific facility</strong></td><td style="color:var(--success)">Yes — with wait time</td><td>General advice only</td><td>No</td><td>Referral tracking</td></tr>
        <tr><td><strong>Dynamic rerouting</strong></td><td style="color:var(--success)">Yes</td><td>No</td><td>No</td><td>No</td></tr>
        <tr><td><strong>Patient context-aware</strong></td><td style="color:var(--success)">Yes — history, barriers</td><td>Phone nurse assessment</td><td>Yes — patient portal</td><td>Referral context</td></tr>
        <tr><td><strong>Multilingual</strong></td><td style="color:var(--success)">Yes</td><td>Translation line</td><td>English only</td><td>English only</td></tr>
      </tbody>
    </table>
  `;
}

// ---- Helpers ----
function toggleDetail(row) {
  const detail = row.nextElementSibling;
  if (detail && detail.classList.contains('detail-row')) {
    detail.style.display = detail.style.display === 'none' ? 'table-row' : 'none';
  }
}

function parseJSON(str) {
  try { return JSON.parse(str || '[]'); } catch { return []; }
}

function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ---- Integrations ----

let intConfigs = {};

async function loadIntegrations() {
  const res = await api('/api/integrations');
  const configs = res.ok ? res.data : [];
  intConfigs = Object.fromEntries(configs.map(c => [c.provider, c]));
  renderIntegrations();
}

function renderIntegrations() {
  document.getElementById('integrations-grid').innerHTML = `
    ${renderOpenAICard()}
    ${renderZoomCard()}
    ${renderRingCentralCard()}
  `;
}

function renderOpenAICard() {
  const c = intConfigs.openai;
  const hasKey = c && c.config && c.config !== '{}';
  return `<div class="integration-card">
    <div class="ic-header">
      <div class="ic-icon" style="background:#10a37f20;color:#10a37f">🤖</div>
      <span class="ic-name">OpenAI</span>
      ${hasKey ? '<span class="badge badge-active" style="margin-left:auto">Connected</span>' : ''}
    </div>
    <div class="ic-desc">GPT models for AI Assistant, routing decisions, and query answering.</div>
    <details class="int-setup" ${!hasKey ? 'open' : ''}>
      <summary>Setup Instructions</summary>
      <ol class="setup-steps">
        <li>Go to <a href="https://platform.openai.com/" target="_blank">platform.openai.com</a> and sign in</li>
        <li>Navigate to <a href="https://platform.openai.com/api-keys" target="_blank">API Keys</a> and create a new secret key</li>
        <li>Copy your API key (starts with <code>sk-...</code>)</li>
        <li>Ensure credits are loaded at <a href="https://platform.openai.com/settings/organization/billing/overview" target="_blank">Billing</a></li>
        <li>Paste your key below, select a model, and click Test then Save</li>
      </ol>
    </details>
    <div style="margin-top:12px">
      <label class="form-label">API Key</label>
      <input type="password" id="int-openai-key" class="form-input" placeholder="${hasKey ? '••••••••••••••••' : 'sk-...'}" value="">
      <label class="form-label" style="margin-top:8px">Model</label>
      <select id="int-openai-model" class="form-input">
        <option value="gpt-4o-mini" ${c?.model === 'gpt-4o-mini' ? 'selected' : ''}>gpt-4o-mini — $0.15/$0.60 per 1M tokens</option>
        <option value="gpt-4.1-nano" ${c?.model === 'gpt-4.1-nano' ? 'selected' : ''}>gpt-4.1-nano — $0.10/$0.40 per 1M tokens</option>
        <option value="gpt-4.1-mini" ${c?.model === 'gpt-4.1-mini' ? 'selected' : ''}>gpt-4.1-mini — $0.40/$1.60 per 1M tokens</option>
        <option value="gpt-4o" ${c?.model === 'gpt-4o' ? 'selected' : ''}>gpt-4o — $2.50/$10.00 per 1M tokens</option>
        <option value="gpt-4.1" ${c?.model === 'gpt-4.1' ? 'selected' : ''}>gpt-4.1 — $2.00/$8.00 per 1M tokens</option>
      </select>
      <div style="margin-top:10px;display:flex;gap:6px">
        <button class="btn btn-sm btn-primary" onclick="saveIntegration('openai')">Save</button>
        <button class="btn btn-sm btn-outline" onclick="testIntegration('openai')">Test Connection</button>
        ${hasKey ? '<button class="btn btn-sm" style="color:var(--danger)" onclick="removeIntegration(\'openai\')">Remove</button>' : ''}
      </div>
      <div class="int-note">API key is encrypted with AES-256 before storage.</div>
    </div>
  </div>`;
}

function renderZoomCard() {
  const c = intConfigs.zoom;
  const configured = c && c.config && c.config !== '{}';
  return `<div class="integration-card">
    <div class="ic-header">
      <div class="ic-icon" style="background:#2d8cff20;color:#2d8cff">📹</div>
      <span class="ic-name">Zoom</span>
      ${configured ? '<span class="badge badge-active" style="margin-left:auto">Configured</span>' : ''}
    </div>
    <div class="ic-desc">Video meetings for live patient consultations and care coordination.</div>
    <details class="int-setup" ${!configured ? 'open' : ''}>
      <summary>Setup Instructions — Server-to-Server OAuth</summary>
      <ol class="setup-steps">
        <li>Go to <a href="https://marketplace.zoom.us/" target="_blank">marketplace.zoom.us</a> and sign in</li>
        <li>Click "Develop" then "Build App"</li>
        <li>Select <strong>Server-to-Server OAuth</strong> app type</li>
        <li>Copy your <strong>Account ID</strong>, <strong>Client ID</strong>, and <strong>Client Secret</strong></li>
        <li>Under Scopes, add: <code>meeting:write:admin</code> and <code>meeting:read:admin</code></li>
        <li>Activate the app, then paste credentials below</li>
      </ol>
    </details>
    <div style="margin-top:12px">
      <label class="form-label">Account ID</label>
      <input type="text" id="int-zoom-account" class="form-input" placeholder="Account ID" value="">
      <label class="form-label" style="margin-top:8px">Client ID</label>
      <input type="text" id="int-zoom-client" class="form-input" placeholder="Client ID" value="">
      <label class="form-label" style="margin-top:8px">Client Secret</label>
      <input type="password" id="int-zoom-secret" class="form-input" placeholder="${configured ? '••••••••••••••••' : 'Client Secret'}">
      <label class="form-label" style="margin-top:8px">
        <input type="checkbox" id="int-zoom-active" ${c?.is_active ? 'checked' : ''}> Active
      </label>
      <div style="margin-top:10px;display:flex;gap:6px">
        <button class="btn btn-sm btn-primary" onclick="saveIntegration('zoom')">Save</button>
        ${configured ? '<button class="btn btn-sm" style="color:var(--danger)" onclick="removeIntegration(\'zoom\')">Remove</button>' : ''}
      </div>
      <div class="int-note">Credentials are encrypted with AES-256 before storage.</div>
    </div>
  </div>`;
}

function renderRingCentralCard() {
  const c = intConfigs.ringcentral;
  const configured = c && c.config && c.config !== '{}';
  const webhookUrl = window.location.origin + '/api/webhooks/ringcentral';
  return `<div class="integration-card">
    <div class="ic-header">
      <div class="ic-icon" style="background:#f4762120;color:#f47621">📞</div>
      <span class="ic-name">RingCentral</span>
      ${configured ? '<span class="badge badge-active" style="margin-left:auto">Configured</span>' : ''}
    </div>
    <div class="ic-desc">Phone/video integration for patient intake calls and provider communication.</div>
    <details class="int-setup" ${!configured ? 'open' : ''}>
      <summary>Setup Instructions</summary>
      <ol class="setup-steps">
        <li>Go to <a href="https://developers.ringcentral.com/" target="_blank">developers.ringcentral.com</a> and create a new app</li>
        <li>Select <strong>REST API App</strong> type</li>
        <li>Set permissions: <strong>Video</strong> (Read, Write), <strong>Meetings</strong></li>
        <li>Set OAuth Redirect URI to: <code>${esc(webhookUrl)}</code></li>
        <li>Copy <strong>Client ID</strong> and <strong>Client Secret</strong></li>
        <li>For server-to-server: generate JWT credential in app settings</li>
      </ol>
    </details>
    <div style="margin-top:12px">
      <label class="form-label">Client ID</label>
      <input type="text" id="int-rc-client" class="form-input" placeholder="Client ID" value="">
      <label class="form-label" style="margin-top:8px">Client Secret</label>
      <input type="password" id="int-rc-secret" class="form-input" placeholder="${configured ? '••••••••••••••••' : 'Client Secret'}">
      <label class="form-label" style="margin-top:8px">JWT Token (optional)</label>
      <input type="password" id="int-rc-jwt" class="form-input" placeholder="${configured ? '••••••••••••••••' : 'JWT Token for server-to-server'}">
      <label class="form-label" style="margin-top:8px">Account ID</label>
      <input type="text" id="int-rc-account" class="form-input" placeholder="Account ID" value="">
      <label class="form-label" style="margin-top:8px">Webhook URL</label>
      <div style="display:flex;gap:6px">
        <input type="text" class="form-input" value="${esc(webhookUrl)}" readonly style="background:var(--surface-hover);color:var(--text-muted)">
        <button class="btn btn-sm" onclick="navigator.clipboard.writeText('${esc(webhookUrl)}');this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',1500)">Copy</button>
      </div>
      <label class="form-label" style="margin-top:8px">
        <input type="checkbox" id="int-rc-active" ${c?.is_active ? 'checked' : ''}> Active
      </label>
      <div style="margin-top:10px;display:flex;gap:6px">
        <button class="btn btn-sm btn-primary" onclick="saveIntegration('ringcentral')">Save</button>
        ${configured ? '<button class="btn btn-sm" style="color:var(--danger)" onclick="removeIntegration(\'ringcentral\')">Remove</button>' : ''}
      </div>
      <div class="int-note">Credentials are encrypted with AES-256 before storage.</div>
    </div>
  </div>`;
}

async function saveIntegration(provider) {
  let config, model;

  if (provider === 'openai') {
    const key = document.getElementById('int-openai-key').value.trim();
    model = document.getElementById('int-openai-model').value;
    if (!key && !intConfigs.openai) { alert('API key is required'); return; }
    config = key ? { api_key: key } : undefined;
  } else if (provider === 'zoom') {
    const account = document.getElementById('int-zoom-account').value.trim();
    const client = document.getElementById('int-zoom-client').value.trim();
    const secret = document.getElementById('int-zoom-secret').value.trim();
    const active = document.getElementById('int-zoom-active').checked;
    if (!account || !client) { alert('Account ID and Client ID are required'); return; }
    config = { account_id: account, client_id: client };
    if (secret) config.client_secret = secret;
    var is_active = active ? 1 : 0;
  } else if (provider === 'ringcentral') {
    const client = document.getElementById('int-rc-client').value.trim();
    const secret = document.getElementById('int-rc-secret').value.trim();
    const jwt = document.getElementById('int-rc-jwt').value.trim();
    const account = document.getElementById('int-rc-account').value.trim();
    const active = document.getElementById('int-rc-active').checked;
    if (!client) { alert('Client ID is required'); return; }
    config = { client_id: client, account_id: account };
    if (secret) config.client_secret = secret;
    if (jwt) config.jwt_token = jwt;
    var is_active = active ? 1 : 0;
  }

  const body = { config };
  if (model) body.model = model;
  if (typeof is_active !== 'undefined') body.is_active = is_active;

  const res = await api('/api/integrations/' + provider, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  if (res.ok) {
    alert(provider.charAt(0).toUpperCase() + provider.slice(1) + ' configuration saved and encrypted.');
    loadIntegrations();
  } else {
    alert('Error: ' + (res.error || 'Failed to save'));
  }
}

async function removeIntegration(provider) {
  if (!confirm('Remove ' + provider + ' configuration? This cannot be undone.')) return;
  const res = await api('/api/integrations/' + provider, { method: 'DELETE' });
  if (res.ok) {
    alert('Configuration removed.');
    loadIntegrations();
  }
}

async function testIntegration(provider) {
  const btn = event.target;
  btn.textContent = 'Testing...';
  btn.disabled = true;
  const res = await api('/api/integrations/' + provider + '/test', { method: 'POST' });
  btn.disabled = false;
  if (res.ok && res.data?.ok) {
    btn.textContent = 'Connected!';
    btn.style.color = 'var(--success)';
    setTimeout(() => { btn.textContent = 'Test Connection'; btn.style.color = ''; }, 3000);
    alert('Connection successful! Model: ' + (res.data.model || 'N/A') + ', Latency: ' + res.data.latency_ms + 'ms');
  } else {
    btn.textContent = 'Failed';
    btn.style.color = 'var(--danger)';
    setTimeout(() => { btn.textContent = 'Test Connection'; btn.style.color = ''; }, 3000);
    alert('Connection failed: ' + (res.data?.error || res.error || 'Unknown error'));
  }
}

// ---- Meetings ----
async function loadMeetings() {
  const res = await api('/api/meetings');
  const meetings = res.ok ? res.data : [];

  if (!meetings.length) {
    document.getElementById('meetings-table-wrap').innerHTML = '<div class="empty">No meetings yet. Create one to get started.</div>';
    return;
  }

  document.getElementById('meetings-table-wrap').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Title</th><th>Provider</th><th>Scheduled</th><th>Duration</th><th>Status</th><th>Join URL</th></tr></thead>
      <tbody>${meetings.map(m => `
        <tr>
          <td><strong>${esc(m.title)}</strong></td>
          <td><span class="badge badge-${m.provider === 'zoom' ? 'virtual' : 'clinic'}">${m.provider}</span></td>
          <td>${m.scheduled_at ? new Date(m.scheduled_at).toLocaleString() : 'Not scheduled'}</td>
          <td>${m.duration_minutes ? m.duration_minutes + ' min' : '-'}</td>
          <td><span class="badge badge-${m.status === 'started' ? 'active' : m.status === 'ended' ? 'completed' : 'clinic'}">${m.status}</span></td>
          <td>${m.join_url ? `<a href="${esc(m.join_url)}" target="_blank" style="color:var(--primary)">Join</a>` : '-'}</td>
        </tr>
      `).join('')}</tbody>
    </table>`;
}

function showNewMeetingForm() {
  document.getElementById('new-meeting-form').style.display = 'block';
}

async function createMeeting() {
  const title = document.getElementById('mtg-title').value.trim();
  if (!title) { alert('Title is required'); return; }

  const res = await api('/api/meetings', {
    method: 'POST',
    body: JSON.stringify({
      title,
      provider: document.getElementById('mtg-provider').value,
      scheduled_at: document.getElementById('mtg-datetime').value || undefined,
      duration_minutes: parseInt(document.getElementById('mtg-duration').value) || 30,
    }),
  });

  if (res.ok) {
    document.getElementById('new-meeting-form').style.display = 'none';
    loadMeetings();
  } else {
    alert('Error: ' + (res.error || 'Failed to create meeting'));
  }
}
