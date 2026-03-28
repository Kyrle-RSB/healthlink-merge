// ============================================================
// CarePoint — Frontend Logic
// ============================================================

const API_BASE = '';
let currentSessionId = null;
let currentPatientId = null;
let currentLanguage = 'en';
let demoRunning = false;
let demoTimeout = null;
let rerouteInterval = null;
let tickInterval = null;
let demoSessionCount = 0;
let demoDiversions = 0;

// ---- Initialization ----

document.addEventListener('DOMContentLoaded', () => {
  loadPatients();
  loadFacilities();
  startDashboardRefresh();
  initPhoneSimulator();
  document.getElementById('phone-toggle')?.addEventListener('click', togglePhoneDrawer);
});

// ---- API Helpers ----

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  return res.json();
}

// ---- Chat ----

async function sendMessage(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  clearWelcome();
  appendBubble('patient', text);
  showTyping(true);

  const clientSentiment = detectSentiment(text);
  updateSentiment(clientSentiment); // Show immediately

  try {
    const result = await api('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        session_id: currentSessionId,
        patient_id: currentPatientId,
        message: text,
        client_sentiment: clientSentiment,
      }),
    });

    showTyping(false);

    if (result.ok && result.data) {
      currentSessionId = result.data.session_id;
      const d = result.data;

      // Track demo metrics
      if (d.decision && d.decision.destination && d.decision.destination !== 'pending_follow_up') {
        demoSessionCount++;
        if (d.decision.destination !== 'er') demoDiversions++;
      }

      // Start reroute polling if eligible
      if (d.decision && d.decision.reroute_eligible && currentSessionId) {
        startReroutePolling(currentSessionId);
      }

      // CarePoint response bubble
      let html = escapeHtml(d.response);
      if (d.decision && d.decision.facility) {
        const f = d.decision.facility;
        html += `<div class="facility-card-inline">
          <div class="fc-name">${escapeHtml(f.name)}</div>
          <div class="fc-detail">${escapeHtml(f.address || '')} | ${escapeHtml(f.hours)}</div>
          <div class="fc-detail">Wait: ~${f.wait_minutes} min | ${escapeHtml(f.phone || '')}</div>
        </div>`;
      }
      appendBubble('carepoint', html, true);

      // Show translation if language is set
      const translation = maybeTranslate(d.response, d.decision);
      if (translation) {
        const langNames = { tl: 'Tagalog', fr: 'Français' };
        appendBubble('carepoint', `<div class="bubble-lang-label">${langNames[currentLanguage] || currentLanguage}</div>${escapeHtml(translation)}`, true);
      }

      // Update dashboard with animation
      if (d.decision) updateDecisionCard(d.decision, true);
      if (d.sentiment) updateSentiment(d.sentiment);
      if (d.dashboard) updateFacilityGrid(d.dashboard.facilities, true);

      // SILA: Update triage gauge when we have a routing decision
      if (d.decision && d.decision.triage_score != null && d.decision.triage_level != null) {
        updateTriageGauge(d.decision.triage_score, d.decision.triage_level);
      }
      // SILA: Update facility map markers
      if (d.dashboard && d.dashboard.facilities) {
        const recId = d.decision && d.decision.facility ? d.decision.facility.id : null;
        updateMapMarkers(d.dashboard.facilities, recId);
      }

      // Start reroute polling if eligible
      if (d.decision && d.decision.reroute_eligible) {
        startReroutePolling(d.session_id);
      }
    } else {
      appendBubble('carepoint', 'I\'m having trouble connecting right now. If this is an emergency, please call 911 immediately. Otherwise, try again in a moment or call 811 for health advice.');
    }
  } catch (err) {
    showTyping(false);
    appendBubble('carepoint', 'I\'m unable to connect right now. Your safety is important:\n\nIf this is an emergency, call 911.\nFor health advice, call 811.\nFor mental health crisis, call 988.\n\nPlease try again in a moment.');
  }
}

function appendBubble(role, content, isHtml = false) {
  const container = document.getElementById('chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble bubble-${role}`;
  bubble.setAttribute('role', 'article');
  bubble.setAttribute('aria-label', role === 'patient' ? 'Patient message' : role === 'carepoint' ? 'CarePoint response' : 'System message');
  if (isHtml) {
    bubble.innerHTML = content;
  } else {
    bubble.textContent = content;
  }
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  // Announce to screen readers
  const announcer = document.getElementById('aria-announcer');
  if (announcer && role === 'carepoint') {
    announcer.textContent = bubble.textContent.slice(0, 200);
  }
}

function clearWelcome() {
  const welcome = document.querySelector('.chat-welcome');
  if (welcome) welcome.remove();
}

function showTyping(show) {
  document.getElementById('typing-indicator').style.display = show ? 'flex' : 'none';
}

// ---- Patient Selector ----

async function loadPatients() {
  const result = await api('/api/patients');
  if (!result.ok) return;

  const select = document.getElementById('patient-select');
  for (const p of result.data) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.age}yo, ${p.conditions_summary || 'healthy'})`;
    select.appendChild(opt);
  }
}

// ---- Dashboard: Facilities ----

async function loadFacilities() {
  const result = await api('/api/system/snapshot');
  if (result.ok && result.data) {
    updateFacilityGrid(result.data.facilities);
    updateSessionFeed(result.data.sessions?.recent || []);
    document.getElementById('stat-active').textContent = result.data.sessions?.active || 0;
    document.getElementById('stat-routed').textContent = result.data.sessions?.completed || 0;
    document.getElementById('stat-diverted').textContent = result.data.sessions?.reroutes || 0;
    // Lazy-init facility map when data is available
    if (result.data.facilities && document.getElementById('facility-map')) {
      updateMapMarkers(result.data.facilities, null);
    }
  }
}

function updateFacilityGrid(facilities, animate = false) {
  if (!facilities) return;
  const grid = document.getElementById('facility-grid');

  if (!animate || grid.children.length === 0 || grid.querySelector('.loading')) {
    // Full rebuild
    grid.innerHTML = '';
    for (const f of facilities) {
      grid.appendChild(createFacilityItem(f));
    }
    return;
  }

  // Animated update: transition existing load bars to new values
  for (const f of facilities) {
    const existing = grid.querySelector(`[data-facility-id="${f.id}"]`);
    if (existing) {
      const fill = existing.querySelector('.facility-load-fill');
      const wait = existing.querySelector('.facility-wait');
      if (fill) {
        const loadClass = f.load_pct < 50 ? 'load-low' : f.load_pct < 80 ? 'load-med' : 'load-high';
        fill.className = `facility-load-fill ${loadClass}`;
        fill.style.width = `${Math.min(f.load_pct, 100)}%`;
      }
      if (wait) wait.textContent = `${f.wait_minutes}m`;
    } else {
      grid.appendChild(createFacilityItem(f));
    }
  }
}

function createFacilityItem(f) {
  const loadClass = f.load_pct < 50 ? 'load-low' : f.load_pct < 80 ? 'load-med' : 'load-high';
  const item = document.createElement('div');
  item.className = 'facility-item';
  item.setAttribute('data-facility-id', f.id);
  item.innerHTML = `
    <span class="facility-name" title="${escapeHtml(f.name)}">${escapeHtml(f.name.replace(' (MOCK)', ''))}</span>
    <div class="facility-load-bar">
      <div class="facility-load-fill ${loadClass}" style="width:${Math.min(f.load_pct, 100)}%"></div>
    </div>
    <span class="facility-wait">${f.wait_minutes}m</span>
  `;
  return item;
}

// ---- Dashboard: Decision Card ----

function updateDecisionCard(decision, animate = false) {
  const card = document.getElementById('decision-card');
  card.style.display = 'block';

  if (animate) {
    card.classList.remove('card-enter');
    void card.offsetWidth; // force reflow
    card.classList.add('card-enter');
  }

  const destLabels = {
    er: 'Emergency Room',
    urgent_care: 'Urgent Care',
    clinic: 'Walk-in Clinic',
    virtual: 'Virtual Care',
    pharmacy: 'Pharmacy',
    self_care: 'Self-Care',
    mental_health_crisis: 'Crisis Care Centre',
  };

  document.getElementById('decision-destination').textContent =
    destLabels[decision.destination] || decision.destination;
  document.getElementById('decision-destination').className =
    `decision-destination dest-${decision.destination}`;

  const conf = Math.round(decision.confidence * 100);
  const bar = document.getElementById('confidence-bar');
  bar.style.width = conf + '%';
  bar.className = 'confidence-bar ' + (conf >= 80 ? 'load-low' : conf >= 50 ? 'load-med' : 'load-high');
  document.getElementById('confidence-label').textContent = `Confidence: ${conf}%`;

  document.getElementById('decision-facility').textContent =
    decision.facility ? `${decision.facility.name} — ${decision.facility.wait_minutes}min wait` : '';

  document.getElementById('decision-reasoning').textContent =
    decision.clinical_reasoning || '';

  const altDiv = document.getElementById('decision-alternatives');
  if (decision.alternatives && decision.alternatives.length > 0) {
    altDiv.innerHTML = '<strong>Alternatives:</strong> ' +
      decision.alternatives.map(a =>
        `${escapeHtml(a.facility_name)} (${a.wait_minutes}m)`
      ).join(', ');
  } else {
    altDiv.innerHTML = '';
  }
}

// ---- Dashboard: Sentiment ----

function updateSentiment(sentiment) {
  const card = document.getElementById('sentiment-card');
  card.style.display = 'block';

  const icons = {
    anxious: '😟 Anxious',
    calm: '😌 Calm',
    distressed: '😰 Distressed',
    confused: '😕 Confused',
    frustrated: '😤 Frustrated',
    neutral: '😐 Neutral',
    urgent: '🚨 Urgent',
    compassionate: '💙 Supported',
    cautious: '⚠️ Cautious',
  };

  document.getElementById('sentiment-display').textContent =
    icons[sentiment] || sentiment;
}

// ---- Dashboard: Session Feed ----

function updateSessionFeed(sessions) {
  const feed = document.getElementById('session-feed');
  if (!sessions || sessions.length === 0) {
    feed.innerHTML = '<div class="text-muted">No sessions yet</div>';
    return;
  }

  feed.innerHTML = '';
  for (const s of sessions) {
    const item = document.createElement('div');
    item.className = 'session-item';
    item.innerHTML = `
      <span class="session-complaint">${escapeHtml(s.complaint || '')}</span>
      <span class="session-dest dest-${s.destination || 'clinic'}">${s.destination || '?'}</span>
    `;
    feed.appendChild(item);
  }
}

// ---- Dashboard Refresh ----

let refreshInterval = null;

function startDashboardRefresh() {
  refreshInterval = setInterval(loadFacilities, 15000);
}

// ---- Reroute Polling ----

function startReroutePolling(sessionId) {
  stopReroutePolling();
  rerouteInterval = setInterval(() => pollForReroute(sessionId), 30000);
}

function stopReroutePolling() {
  if (rerouteInterval) {
    clearInterval(rerouteInterval);
    rerouteInterval = null;
  }
}

async function pollForReroute(sessionId) {
  try {
    const result = await api(`/api/reroute/check/${sessionId}`);
    if (result.ok && result.data && result.data.available) {
      showRerouteNotification(result.data.offer, sessionId);
      stopReroutePolling();
    }
  } catch {
    // Silent fail — polling should not break the UI
  }
}

function showRerouteNotification(offer, sessionId) {
  // Remove any existing notification
  const existing = document.querySelector('.reroute-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = 'reroute-notification';
  notification.innerHTML = `
    <div class="reroute-header">A shorter wait is available</div>
    <div class="reroute-body">
      <strong>${escapeHtml(offer.suggested_facility.name)}</strong> can see you in
      <strong>${offer.suggested_facility.wait_minutes} minutes</strong> —
      ${offer.time_saved} minutes faster than your current wait.
    </div>
    <div class="reroute-actions">
      <button class="btn btn-sm btn-primary" onclick="acceptReroute('${sessionId}')">Switch</button>
      <button class="btn btn-sm" onclick="dismissReroute()">Stay</button>
    </div>
  `;

  document.querySelector('.panel-dashboard .dashboard-scroll').prepend(notification);

  // Also add a chat bubble
  appendBubble('carepoint',
    `Good news — ${escapeHtml(offer.suggested_facility.name)} just opened up with a ${offer.suggested_facility.wait_minutes}-minute wait. ` +
    `That's ${offer.time_saved} minutes faster. Would you like to switch?`
  );
}

async function acceptReroute(sessionId) {
  const result = await api('/api/reroute', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, accept: true }),
  });

  dismissReroute();

  if (result.ok && result.data && result.data.rerouted) {
    appendBubble('carepoint',
      `Done! You've been rerouted to ${escapeHtml(result.data.new_facility.name)}. ` +
      `Expected wait: ~${result.data.new_facility.wait_minutes} minutes.`
    );
    loadFacilities(); // Refresh dashboard
  }
}

function dismissReroute() {
  const notification = document.querySelector('.reroute-notification');
  if (notification) {
    notification.classList.add('reroute-exit');
    setTimeout(() => notification.remove(), 300);
  }
}

// ---- Client-Side Sentiment Detection ----

function detectSentiment(text) {
  const lower = text.toLowerCase();
  if (/want to die|kill myself|suicidal|self.harm/.test(lower)) return 'urgent';
  if (/scared|terrified|afraid|fear|worried|panic|anxious/.test(lower)) return 'anxious';
  if (/desperate|help me|please|can't take|unbearable|terrible|awful/.test(lower)) return 'distressed';
  if (/confused|don't understand|what should|where do|how do/.test(lower)) return 'confused';
  if (/frustrated|angry|ridiculous|unacceptable|waited|hours/.test(lower)) return 'frustrated';
  if (/calm|fine|just wondering|curious|checking/.test(lower)) return 'calm';
  if (text === text.toUpperCase() && text.length > 10) return 'distressed';
  if ((text.match(/!/g) || []).length >= 2) return 'distressed';
  return 'neutral';
}

// ---- Language Toggle ----

function setLanguage(lang) {
  currentLanguage = lang;
}

function selectPatient(id) {
  currentPatientId = id || null;
  currentSessionId = null;
  const container = document.getElementById('chat-messages');
  container.innerHTML = '';
  if (id) appendBubble('system', 'Patient selected. Context will be loaded from their profile.');

  // Show language toggle for non-English patients
  const langSelect = document.getElementById('lang-select');
  if (id === 'SYN-PAT-001') {
    langSelect.style.display = 'inline-block';
    langSelect.value = 'en';
  } else {
    langSelect.style.display = 'none';
    currentLanguage = 'en';
  }

  document.getElementById('decision-card').style.display = 'none';
  document.getElementById('sentiment-card').style.display = 'none';
}

const TRANSLATIONS = {
  tl: {
    clinic_routing: 'Ang iyong mga sintomas ay nagpapahiwatig na kailangan mong magpatingin sa isang klinika. Ang Cool Aid Community Health Centre ay may serbisyo sa pagsasalin at tumatanggap ng mga bagong dating. Maaari ka nilang makita sa loob ng humigit-kumulang 60 minuto — mas mabilis kaysa sa 3-oras na paghihintay sa ER.',
    urgent_care_routing: 'Batay sa iyong inilarawan, kailangan mong magpatingin sa isang urgent care centre. Maaari ka nilang makita nang mas mabilis kaysa sa ER.',
    mental_health_crisis_routing: 'Naririnig kita. Ang Crisis Care Centre ay may mga taong dalubhasa sa eksaktong ito — maaari ka nilang makita nang mabilis.',
    pharmacy_routing: 'Ang isang parmasya ay makakatulong sa iyo sa ito. Hindi na kailangan ng doktor para sa mga menor de edad na isyu.',
    safety_disclaimer: 'Mahalaga: Kung lumala ang iyong mga sintomas, tumawag sa 911 kaagad.',
    facility_info: 'Cool Aid Community Health Centre — 713 Johnson St, Victoria, BC | 8am-6pm M-F | ~60 min na paghihintay',
  },
  fr: {
    clinic_routing: 'Vos symptômes suggèrent que vous devriez consulter dans une clinique. Le Cool Aid Community Health Centre accepte les nouveaux arrivants et offre des services de traduction. Ils peuvent vous voir dans environ 60 minutes — beaucoup plus rapide que les 3 heures d\'attente aux urgences.',
    urgent_care_routing: 'D\'après ce que vous décrivez, vous devriez vous rendre dans un centre de soins urgents. Ils peuvent vous voir plus rapidement qu\'aux urgences.',
    mental_health_crisis_routing: 'Je vous entends. Le Centre de soins de crise a des gens qui se spécialisent exactement dans ce domaine — ils peuvent vous voir rapidement.',
    pharmacy_routing: 'Une pharmacie peut vous aider avec cela. Pas besoin de médecin pour les problèmes mineurs.',
    safety_disclaimer: 'Important : Si vos symptômes s\'aggravent, appelez le 911 immédiatement.',
    facility_info: 'Cool Aid Community Health Centre — 713 Johnson St, Victoria, BC | 8h-18h L-V | ~60 min d\'attente',
  },
};

function maybeTranslate(response, decision) {
  if (currentLanguage === 'en' || !TRANSLATIONS[currentLanguage]) return null;
  const t = TRANSLATIONS[currentLanguage];
  const destKey = decision?.destination + '_routing';
  if (t[destKey]) return t[destKey];
  if (decision?.destination === 'clinic' || decision?.destination === 'community_health') {
    return t.clinic_routing;
  }
  return null;
}

// ---- Impact Metrics ----

function showImpactCard() {
  const card = document.getElementById('impact-card');
  card.style.display = 'block';

  const diversionRate = demoSessionCount > 0 ? Math.round((demoDiversions / demoSessionCount) * 100) : 0;
  const waitSaved = 355; // Maria 120 + Tyler 160 + Robert 75
  const monthlyERVisits = 4800;
  const potentialDiversions = Math.round(monthlyERVisits * 0.30);
  const costPerER = 300;
  const monthlySavings = potentialDiversions * costPerER;

  document.getElementById('impact-content').innerHTML = `
    <div class="impact-highlight">${diversionRate}% ER Diversion Rate</div>
    <div class="impact-stat"><span class="impact-stat-label">Patients routed</span><span class="impact-stat-value">${demoSessionCount}</span></div>
    <div class="impact-stat"><span class="impact-stat-label">Diverted from ER</span><span class="impact-stat-value">${demoDiversions}</span></div>
    <div class="impact-stat"><span class="impact-stat-label">Est. wait time saved</span><span class="impact-stat-value">${waitSaved} min</span></div>
    <div class="impact-stat"><span class="impact-stat-label">Monthly ER visits (Lakeview region)</span><span class="impact-stat-value">${monthlyERVisits.toLocaleString()}</span></div>
    <div class="impact-stat"><span class="impact-stat-label">Potential monthly diversions (30%)</span><span class="impact-stat-value">${potentialDiversions.toLocaleString()}</span></div>
    <div class="impact-stat"><span class="impact-stat-label">Projected monthly savings</span><span class="impact-stat-value">$${monthlySavings.toLocaleString()}</span></div>
    <div class="impact-stat"><span class="impact-stat-label">Avg cost per ER visit</span><span class="impact-stat-value">$1,800</span></div>
    <div class="impact-stat"><span class="impact-stat-label">Avg cost per clinic/UC visit</span><span class="impact-stat-value">$150-$350</span></div>
    <div class="impact-stat"><span class="impact-stat-label">Cost savings per diversion</span><span class="impact-stat-value">$1,450+</span></div>
    <div class="impact-stat"><span class="impact-stat-label">Projected annual savings (region)</span><span class="impact-stat-value">$${(potentialDiversions * 1450 * 12 / 1000000).toFixed(1)}M</span></div>
    <div class="impact-stat"><span class="impact-stat-label">Care outside hospitals</span><span class="impact-stat-value">67%</span></div>
    <div class="impact-stat"><span class="impact-stat-label" style="font-size:10px;font-style:italic">8 of 12 routing destinations are community-based</span><span class="impact-stat-value"></span></div>
  `;

  // Also show journey comparison
  const journeyCard = document.getElementById('journey-card');
  if (journeyCard) journeyCard.style.display = 'block';
}

// ---- Facility Tick Simulator ----

function startTickSimulator() {
  stopTickSimulator();
  tickInterval = setInterval(async () => {
    if (!demoRunning) return;
    await fetch('/api/demo/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'tick' }) }).catch(() => {});
    loadFacilities();
  }, 12000);
}

function stopTickSimulator() {
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
}

// ---- Call Modal ----

function showCallModal() {
  const modal = document.getElementById('call-modal');
  if (modal) {
    modal.style.display = 'flex';
    renderQuickResponses();
  }
}

function closeCallModal() {
  const modal = document.getElementById('call-modal');
  if (modal) modal.style.display = 'none';
  stopLiveTranscription();
}

function toggleRecording() {
  const btn = document.getElementById('btn-record');
  if (isRecording) {
    stopLiveTranscription();
    btn.textContent = 'Start Recording';
  } else {
    startLiveTranscription().then(started => {
      if (started) btn.textContent = 'Stop Recording';
    });
  }
}

// ---- Demo Automation ----

const DEMO_SPEED = 0.7; // Multiplier: 1.0 = normal, 0.5 = fast, 0.7 = presentation pace

const DEMOS = {
  maria: {
    patient_id: 'SYN-PAT-001',
    messages: [
      { delay: 400, text: "I've been having stomach pain for about 3 weeks now. It won't go away, especially after eating." },
      { delay: 3000, text: "No, no fever. Just the pain. I also feel anxious about it." },
      { delay: 3000, text: "I don't have a doctor here. I moved from the Philippines 2 months ago. I don't have insurance yet either." },
    ],
  },
  tyler: {
    patient_id: 'SYN-PAT-006',
    messages: [
      { delay: 400, text: "My heart is racing really fast and I can't breathe properly. I feel like something terrible is about to happen." },
      { delay: 3000, text: "No chest pain. I've had panic attacks before. But this one feels really bad." },
    ],
  },
  robert: {
    patient_id: 'SYN-PAT-002',
    messages: [
      { delay: 500, text: "I have numbness and tingling in both feet. It's been getting worse over the past few weeks." },
      { delay: 4000, text: "I have type 2 diabetes. My last A1C was over 8. I haven't been able to see a doctor since mine retired." },
    ],
    // Trigger REAL facility state changes, then let reroute polling find it
    postAction: async (sessionId) => {
      await sleep(3000);
      if (!demoRunning) return;
      // Actually update facility state in D1 — Saanich wait goes up, Westshore goes down
      await fetch('/api/demo/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'robert_reroute' }) });
      loadFacilities(); // Refresh dashboard to show the change
      // Poll immediately instead of waiting 30s
      await sleep(2000);
      if (!demoRunning) return;
      await pollForReroute(sessionId);
    },
  },

  // ---- SILA Scenarios (6 care levels) ----

  margaret: {
    patient_id: null,
    messages: [
      { delay: 400, text: "I'm having severe chest pain that started about 20 minutes ago. It feels like pressure on my chest and it's spreading to my left arm." },
      { delay: 3000, text: "I have high blood pressure and type 2 diabetes. I'm on Metoprolol and Lisinopril. The pain is an 8 out of 10." },
    ],
  },
  jose: {
    patient_id: null,
    messages: [
      { delay: 400, text: "I twisted my ankle really badly playing soccer. It's swollen up huge and I can't put any weight on it at all." },
      { delay: 3000, text: "I heard a popping sound when it happened. The pain is severe, maybe 7 out of 10. It's turning purple." },
    ],
  },
  tiffany: {
    patient_id: null,
    messages: [
      { delay: 400, text: "I've been having sharp abdominal pain in my lower right side since last night. It's getting worse." },
      { delay: 3000, text: "I've also been nauseous and had a slight fever this morning. The pain is around a 6. It hurts more when I move." },
    ],
  },
  peter: {
    patient_id: null,
    messages: [
      { delay: 400, text: "I've been getting bad headaches almost every day for the past two weeks. Over-the-counter meds aren't helping anymore." },
      { delay: 3000, text: "No vision changes, no neck stiffness. Just persistent throbbing headaches, usually worse in the afternoon." },
    ],
  },
  anna: {
    patient_id: null,
    messages: [
      { delay: 400, text: "I've been having allergic reactions — itchy eyes, runny nose, sneezing constantly. It started when the pollen season began." },
      { delay: 3000, text: "I've tried regular antihistamines but they're not really working. No difficulty breathing, just really uncomfortable." },
    ],
  },
  lee: {
    patient_id: null,
    messages: [
      { delay: 400, text: "I've had a cold for about 4 days. Runny nose, mild sore throat, and a bit of a cough. No fever." },
      { delay: 3000, text: "I just wanted to know if I need to see a doctor or if there's something I can do at home." },
    ],
  },
};

async function playDemo() {
  const scenarioName = document.getElementById('demo-scenario').value;
  if (!scenarioName || !DEMOS[scenarioName]) return;

  resetDemo();
  demoRunning = true;
  startTickSimulator();

  const scenario = DEMOS[scenarioName];

  // Show call modal with transcript + suggestions
  showCallModal();
  showPhoneDrawer();
  playDemoTranscript(scenarioName);

  // Select patient
  document.getElementById('patient-select').value = scenario.patient_id;
  selectPatient(scenario.patient_id);
  // Show Tagalog for Maria
  if (scenarioName === 'maria') {
    document.getElementById('lang-select').value = 'tl';
    setLanguage('tl');
  }

  // Play messages with delays
  for (let i = 0; i < scenario.messages.length; i++) {
    if (!demoRunning) break;
    const msg = scenario.messages[i];
    await sleep(msg.delay);
    if (!demoRunning) break;

    // Auto-type effect
    const input = document.getElementById('chat-input');
    await autoType(input, msg.text, 18 * DEMO_SPEED);
    if (!demoRunning) break;

    await sleep(200 * DEMO_SPEED);
    await sendMessage(null);

    // Wait for response to render
    await sleep(1500 * DEMO_SPEED);
  }

  // Run post-action if defined (e.g., Robert's real reroute)
  if (demoRunning && scenario.postAction && currentSessionId) {
    await scenario.postAction(currentSessionId);
  }

  stopTickSimulator();
  hidePhoneDrawer();
  demoRunning = false;

  // Show impact card after any demo completes
  if (demoSessionCount > 0) showImpactCard();
}

function resetDemo() {
  demoRunning = false;
  if (demoTimeout) clearTimeout(demoTimeout);
  stopReroutePolling();
  stopTickSimulator();
  dismissReroute();
  closeCallModal();
  hidePhoneDrawer();
  // Reset facility state to baseline
  fetch('/api/demo/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'reset' }) }).catch(() => {});
  currentSessionId = null;
  currentPatientId = null;
  document.getElementById('patient-select').value = '';
  document.getElementById('chat-messages').innerHTML = `
    <div class="chat-welcome">
      <div class="welcome-icon">+</div>
      <h3>Welcome to CarePoint</h3>
      <p>Describe your health concern and we'll help you find the right care.</p>
      <p class="text-muted">This is a demo with synthetic data — not real medical advice.</p>
    </div>`;
  document.getElementById('decision-card').style.display = 'none';
  document.getElementById('sentiment-card').style.display = 'none';
  document.getElementById('impact-card').style.display = 'none';
  const jc = document.getElementById('journey-card'); if (jc) jc.style.display = 'none';
  const tgc = document.getElementById('triage-gauge-card'); if (tgc) tgc.style.display = 'none';
  const sn = document.getElementById('sila-notification'); if (sn) sn.style.display = 'none';
  if (silaCountdownInterval) { clearInterval(silaCountdownInterval); silaCountdownInterval = null; }
  document.getElementById('demo-scenario').value = '';
  demoSessionCount = 0;
  demoDiversions = 0;
  currentLanguage = 'en';
  document.getElementById('lang-select').style.display = 'none';
}

async function autoType(element, text, speed) {
  element.value = '';
  for (let i = 0; i < text.length; i++) {
    if (!demoRunning) break;
    element.value += text[i];
    await sleep(speed);
  }
}

function sleep(ms) {
  return new Promise(resolve => {
    demoTimeout = setTimeout(resolve, ms);
  });
}

// ---- Utilities ----

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// SILA Visual Components
// ============================================================

// ---- Triage Gauge ----

function updateTriageGauge(score, level) {
  const card = document.getElementById('triage-gauge-card');
  if (!card) return;
  card.style.display = '';

  const arc = document.getElementById('triage-arc');
  const scoreText = document.getElementById('triage-score-text');
  const labelText = document.getElementById('triage-label-text');
  const badge = document.getElementById('triage-level-badge');
  const routing = document.getElementById('triage-care-routing');

  // Color based on score
  const color = score >= 80 ? 'var(--triage-green)' : score >= 60 ? 'var(--triage-orange)' : score >= 40 ? 'var(--triage-red)' : 'var(--purple)';
  arc.setAttribute('stroke', color);

  // Animate arc
  const circumference = 2 * Math.PI * 90; // ~565
  const target = (score / 100) * circumference;
  arc.setAttribute('stroke-dasharray', target + ' ' + circumference);

  // Animate counter
  let current = 0;
  const timer = setInterval(() => {
    current += 2;
    if (current >= score) { current = score; clearInterval(timer); }
    scoreText.textContent = current;
  }, 20);

  // Level labels
  const levels = { 1: 'Resuscitation', 2: 'Emergent', 3: 'Urgent', 4: 'Less Urgent', 5: 'Non-Urgent' };
  const levelColors = { 1: 'var(--triage-red)', 2: 'var(--triage-orange)', 3: 'var(--triage-yellow)', 4: 'var(--triage-blue)', 5: 'var(--triage-green)' };
  labelText.textContent = 'CTAS Level ' + level;
  badge.textContent = 'Level ' + level + ' — ' + (levels[level] || '');
  badge.style.background = levelColors[level] || 'var(--border)';
  badge.style.color = level <= 2 ? '#fff' : '#000';

  // Care routing info
  const careRouting = {
    1: 'ED Immediate — Life-threatening, resuscitation required',
    2: 'ED Urgent — Emergency care within 15 minutes',
    3: 'Urgent Care — Evaluation within 1 hour',
    4: 'Walk-in/Clinic — Can wait 2-4 hours',
    5: 'Primary Care — Routine, next available'
  };
  routing.textContent = careRouting[level] || '';
}

// ---- Leaflet Facility Map ----

let facilityMap = null;
let mapMarkers = [];

function initFacilityMap() {
  const mapEl = document.getElementById('facility-map');
  if (!mapEl || facilityMap) return;

  facilityMap = L.map('facility-map', { zoomControl: false }).setView([48.4284, -123.3656], 12);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© CartoDB', maxZoom: 19
  }).addTo(facilityMap);
  L.control.zoom({ position: 'bottomright' }).addTo(facilityMap);
}

function updateMapMarkers(facilities, recommendedId) {
  if (!facilityMap) initFacilityMap();
  if (!facilityMap) return;

  mapMarkers.forEach(m => facilityMap.removeLayer(m));
  mapMarkers = [];

  const typeColors = { hospital_trauma: '#EF4444', hospital_community: '#F97316', urgent_care: '#EAB308', clinic: '#3B82F6', community_health: '#22C55E', pharmacy: '#A855F7', virtual_care: '#06B6D4' };

  facilities.forEach(f => {
    if (!f.latitude || !f.longitude) return;
    const isRecommended = f.id == recommendedId;
    const color = typeColors[f.type] || '#6B7280';
    const size = isRecommended ? 16 : 10;

    const icon = L.divIcon({
      className: 'facility-marker',
      html: '<div style="width:' + size + 'px;height:' + size + 'px;background:' + color + ';border-radius:50%;border:2px solid #fff;' + (isRecommended ? 'box-shadow:0 0 12px ' + color + ',0 0 24px ' + color + '60;animation:pulse-soft 2s infinite;' : '') + '"></div>',
      iconSize: [size, size], iconAnchor: [size/2, size/2]
    });

    const marker = L.marker([f.latitude, f.longitude], { icon }).addTo(facilityMap);
    const waitColor = f.wait_minutes > 60 ? 'var(--danger)' : f.wait_minutes > 30 ? 'var(--warning)' : 'var(--success)';
    marker.bindPopup('<div style="color:#e4e4e7;font-size:13px;"><strong>' + f.name + '</strong><br>' + (f.address||'') + '<br>Wait: <span style="color:' + waitColor + '">' + (f.wait_minutes||'?') + ' min</span></div>');
    mapMarkers.push(marker);
  });

  const mapCard = document.getElementById('map-card');
  if (mapCard) mapCard.style.display = '';
}

// ---- Phone Simulator ----

let phoneWaveformInterval = null;
let phoneDurationInterval = null;
let phoneSeconds = 0;

function initPhoneSimulator() {
  const waveform = document.getElementById('phone-waveform');
  if (!waveform) return;
  waveform.innerHTML = Array.from({length: 8}, () => '<div class="waveform-bar"></div>').join('');
}

function showPhoneDrawer() {
  const drawer = document.getElementById('phone-drawer');
  if (drawer) { drawer.style.display = ''; drawer.classList.add('phone-drawer-open'); }
  startPhoneWaveform();
  startPhoneDuration();
}

function hidePhoneDrawer() {
  const drawer = document.getElementById('phone-drawer');
  if (drawer) { drawer.classList.remove('phone-drawer-open'); setTimeout(() => drawer.style.display = 'none', 300); }
  stopPhoneWaveform();
  stopPhoneDuration();
}

function togglePhoneDrawer() {
  const drawer = document.getElementById('phone-drawer');
  if (drawer && drawer.classList.contains('phone-drawer-open')) hidePhoneDrawer();
  else showPhoneDrawer();
}

function startPhoneWaveform() {
  stopPhoneWaveform();
  phoneWaveformInterval = setInterval(() => {
    document.querySelectorAll('.waveform-bar').forEach(bar => {
      bar.style.height = (20 + Math.random() * 80) + '%';
    });
  }, 100);
}

function stopPhoneWaveform() {
  if (phoneWaveformInterval) { clearInterval(phoneWaveformInterval); phoneWaveformInterval = null; }
}

function startPhoneDuration() {
  phoneSeconds = 0;
  stopPhoneDuration();
  phoneDurationInterval = setInterval(() => {
    phoneSeconds++;
    const h = String(Math.floor(phoneSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((phoneSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(phoneSeconds % 60).padStart(2, '0');
    const el = document.getElementById('phone-duration');
    if (el) el.textContent = h + ':' + m + ':' + s;
  }, 1000);
}

function stopPhoneDuration() {
  if (phoneDurationInterval) { clearInterval(phoneDurationInterval); phoneDurationInterval = null; }
}

// ---- Multi-Call Grid ----

function updateCallGrid(calls) {
  const grid = document.getElementById('call-grid');
  const card = document.getElementById('calls-card');
  if (!grid || !card) return;
  if (!calls || calls.length === 0) { card.style.display = 'none'; return; }
  card.style.display = '';

  grid.innerHTML = calls.map(call => {
    const statusColors = { ringing: 'var(--warning)', connected: 'var(--success)', verifying: 'var(--info)', assessing: 'var(--primary)', complete: 'var(--triage-green)' };
    const statusEmoji = { ringing: '📞', connected: '🟢', verifying: '🔍', assessing: '🧠', complete: '✅' };
    const initials = (call.name || 'UN').split(' ').map(n => n[0]).join('').slice(0,2);

    return '<div class="call-card' + (call.active ? ' call-active' : '') + '" onclick="selectCall(\'' + call.id + '\')">' +
      '<div class="call-card-header">' +
        '<div class="call-avatar" style="background:' + (statusColors[call.status] || 'var(--border)') + '">' + initials + '</div>' +
        '<div class="call-card-info"><div class="call-card-name">' + (call.name || 'Unknown') + '</div>' +
        '<div class="call-card-status">' + (statusEmoji[call.status]||'') + ' ' + (call.status || '') + '</div></div>' +
      '</div>' +
      '<div class="call-card-complaint">' + (call.complaint || '') + '</div>' +
      '<div class="call-card-metrics">' +
        '<span>Score: ' + (call.triageScore || '—') + '</span>' +
        '<span>Level: ' + (call.triageLevel || '—') + '</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ---- SILA Notification Banner with Countdown ----

let silaCountdownInterval = null;
let silaCountdownValue = 30;
let pendingSilaReroute = null;

function showSilaNotification(offer) {
  pendingSilaReroute = offer;
  silaCountdownValue = 30;
  const notif = document.getElementById('sila-notification');
  if (!notif) return;
  notif.style.display = '';

  const countdown = document.getElementById('sila-countdown');
  const progress = document.getElementById('sila-progress');

  if (silaCountdownInterval) clearInterval(silaCountdownInterval);
  silaCountdownInterval = setInterval(() => {
    silaCountdownValue--;
    if (countdown) { countdown.textContent = silaCountdownValue; countdown.classList.toggle('countdown-urgent', silaCountdownValue <= 10); }
    if (progress) progress.style.width = (silaCountdownValue / 30 * 100) + '%';
    if (silaCountdownValue <= 0) { declineSilaReroute(); }
  }, 1000);
}

function acceptSilaReroute() {
  if (silaCountdownInterval) clearInterval(silaCountdownInterval);
  document.getElementById('sila-notification').style.display = 'none';
  if (pendingSilaReroute && currentSessionId) acceptReroute(currentSessionId);
}

function declineSilaReroute() {
  if (silaCountdownInterval) clearInterval(silaCountdownInterval);
  document.getElementById('sila-notification').style.display = 'none';
  pendingSilaReroute = null;
}
