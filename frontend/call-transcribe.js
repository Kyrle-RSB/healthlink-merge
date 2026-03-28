// ============================================================
// Live Call Transcription + AI Agent Assist
// ============================================================
// Demo mode: simulated transcript with auto-typing
// Live mode: Deepgram WebSocket for real microphone transcription
// ============================================================

let transcriptSocket = null;
let mediaRecorder = null;
let accumulatedTranscript = '';
let isRecording = false;
let suggestionTimer = null;

// ---- Deepgram Live Transcription (Real Mode) ----

async function startLiveTranscription() {
  // Get Deepgram API key from integrations
  let dgKey = null;
  try {
    const res = await fetch('/api/integrations/deepgram');
    const data = await res.json();
    if (data.ok && data.data?.config) {
      const config = JSON.parse(data.data.config);
      dgKey = config.api_key;
    }
  } catch {}

  if (!dgKey) {
    addTranscriptLine('system', 'Deepgram API key not configured. Add it in Admin > Integrations. Using demo mode.');
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    transcriptSocket = new WebSocket(
      'wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&interim_results=true&punctuate=true&model=nova-3&smart_format=true',
      ['token', dgKey]
    );

    transcriptSocket.onopen = () => {
      updateRecordingStatus('recording');
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.addEventListener('dataavailable', (e) => {
        if (e.data.size > 0 && transcriptSocket?.readyState === 1) {
          transcriptSocket.send(e.data);
        }
      });
      mediaRecorder.start(250);
      isRecording = true;
    };

    transcriptSocket.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.channel?.alternatives?.[0]) {
        const text = data.channel.alternatives[0].transcript;
        if (!text) return;

        if (data.is_final) {
          accumulatedTranscript += text + ' ';
          addTranscriptLine('patient', text);
          // Trigger AI suggestions on each final segment
          requestSuggestions(text);
        } else {
          updateInterimTranscript(text);
        }
      }
    };

    transcriptSocket.onerror = () => {
      updateRecordingStatus('error');
      addTranscriptLine('system', 'Connection error. Check your Deepgram API key.');
    };

    transcriptSocket.onclose = () => {
      updateRecordingStatus('stopped');
      isRecording = false;
    };

    return true;
  } catch (err) {
    addTranscriptLine('system', 'Microphone access denied: ' + err.message);
    return false;
  }
}

function stopLiveTranscription() {
  if (mediaRecorder) { mediaRecorder.stop(); mediaRecorder = null; }
  if (transcriptSocket) { transcriptSocket.close(); transcriptSocket = null; }
  isRecording = false;
  updateRecordingStatus('stopped');
}

// ---- Demo Transcript Simulation ----

const DEMO_TRANSCRIPTS = {
  maria: [
    { speaker: 'attendant', text: 'SILA intake, how can I help you today?', delay: 500 },
    { speaker: 'patient', text: "Hi, I've been having stomach pain for about 3 weeks now. It won't go away, especially after eating.", delay: 2000 },
    { speaker: 'attendant', text: 'I\'m sorry to hear that. Can you tell me more about the pain? Where exactly is it?', delay: 2500 },
    { speaker: 'patient', text: "It's mostly in my upper stomach area. No fever, no vomiting. Just constant pain.", delay: 2000 },
    { speaker: 'attendant', text: 'Do you have a family doctor you can see about this?', delay: 2000 },
    { speaker: 'patient', text: "No, I just moved here from the Philippines 2 months ago. I don't have a doctor and my insurance hasn't started yet.", delay: 2500 },
  ],
  tyler: [
    { speaker: 'attendant', text: 'SILA intake, how can I help you?', delay: 500 },
    { speaker: 'patient', text: "My heart is racing really fast and I can't breathe properly. I feel like something terrible is about to happen.", delay: 2000 },
    { speaker: 'attendant', text: 'I understand. Are you having any chest pain or arm numbness right now?', delay: 2500 },
    { speaker: 'patient', text: "No chest pain. I've had panic attacks before but this one feels really bad. I'm so scared.", delay: 2000 },
    { speaker: 'attendant', text: "You're in a safe space. Have you been seen for your anxiety before?", delay: 2000 },
    { speaker: 'patient', text: "I was prescribed Sertraline but I can't afford to see a psychiatrist. The ER told me to follow up with a doctor I don't have.", delay: 2500 },
  ],
  robert: [
    { speaker: 'attendant', text: 'SILA intake, how can I help you today?', delay: 500 },
    { speaker: 'patient', text: "I have numbness and tingling in both feet. It's been getting worse over the past few weeks.", delay: 2000 },
    { speaker: 'attendant', text: 'That must be concerning. Do you have any medical conditions I should know about?', delay: 2500 },
    { speaker: 'patient', text: "I have type 2 diabetes. My last A1C was over 8. I haven't been able to see a doctor since mine retired over a year ago.", delay: 2500 },
    { speaker: 'attendant', text: 'I see. Are you managing your diabetes with medication currently?', delay: 2000 },
    { speaker: 'patient', text: "Yes, Metformin and Lisinopril, but nobody's checked my levels in months.", delay: 2000 },
  ],
  // ---- SILA Scenarios ----
  margaret: [
    { speaker: 'attendant', text: 'SILA intake, how can I help you?', delay: 500 },
    { speaker: 'patient', text: "I'm having severe chest pain. It started about 20 minutes ago. Feels like pressure spreading to my left arm.", delay: 2000 },
    { speaker: 'attendant', text: 'I need to ask some quick questions. Are you having difficulty breathing?', delay: 2000 },
    { speaker: 'patient', text: "A little. I'm also sweating and feel nauseous. The pain is about 8 out of 10.", delay: 2000 },
    { speaker: 'attendant', text: 'Do you have any medical conditions? Are you on any medications?', delay: 2000 },
    { speaker: 'patient', text: "I have high blood pressure and diabetes. I take Metoprolol, Lisinopril, and Metformin.", delay: 2500 },
  ],
  jose: [
    { speaker: 'attendant', text: 'SILA intake, how can I help you?', delay: 500 },
    { speaker: 'patient', text: "I twisted my ankle really badly playing soccer. It swelled up right away and I can't walk on it.", delay: 2000 },
    { speaker: 'attendant', text: 'Did you hear any popping or snapping when it happened?', delay: 2000 },
    { speaker: 'patient', text: "Yeah, there was a pop. It's turning purple now and the pain is about a 7.", delay: 2000 },
    { speaker: 'attendant', text: 'Can you move your toes at all?', delay: 2000 },
    { speaker: 'patient', text: "Barely. It hurts too much. I need to get this looked at.", delay: 2000 },
  ],
  tiffany: [
    { speaker: 'attendant', text: 'SILA intake, how can I help you today?', delay: 500 },
    { speaker: 'patient', text: "I've had sharp pain in my lower right side since last night. It keeps getting worse.", delay: 2000 },
    { speaker: 'attendant', text: 'On a scale of 1 to 10, how would you rate the pain?', delay: 2000 },
    { speaker: 'patient', text: "About a 6, but it goes up when I move. I've also been nauseous and had a fever this morning.", delay: 2500 },
    { speaker: 'attendant', text: 'Have you had any changes in appetite or bowel movements?', delay: 2000 },
    { speaker: 'patient', text: "I haven't wanted to eat. The pain started near my belly button and moved to the right side.", delay: 2500 },
  ],
  peter: [
    { speaker: 'attendant', text: 'SILA intake, how can I help you?', delay: 500 },
    { speaker: 'patient', text: "I've been getting bad headaches almost every day for the past two weeks. OTC painkillers aren't working.", delay: 2000 },
    { speaker: 'attendant', text: 'Are you experiencing any vision changes, neck stiffness, or sensitivity to light?', delay: 2500 },
    { speaker: 'patient', text: "No, none of that. They're throbbing headaches, usually worse in the afternoon.", delay: 2000 },
    { speaker: 'attendant', text: 'Have you seen a doctor about these headaches before?', delay: 2000 },
    { speaker: 'patient', text: "Not yet. I don't have a family doctor. I was hoping you could point me in the right direction.", delay: 2500 },
  ],
  anna: [
    { speaker: 'attendant', text: 'SILA intake, how can I help you?', delay: 500 },
    { speaker: 'patient', text: "I've been having terrible allergies. Itchy eyes, constant sneezing, runny nose. It started with pollen season.", delay: 2000 },
    { speaker: 'attendant', text: 'Are you having any difficulty breathing or swelling?', delay: 2000 },
    { speaker: 'patient', text: "No, nothing like that. Just really uncomfortable. I've tried regular antihistamines but they don't help much.", delay: 2500 },
    { speaker: 'attendant', text: 'Have you tried any prescription-strength allergy medications before?', delay: 2000 },
    { speaker: 'patient', text: "No, just over-the-counter stuff. A pharmacist might be able to help, right?", delay: 2000 },
  ],
  lee: [
    { speaker: 'attendant', text: 'SILA intake, how can I help you today?', delay: 500 },
    { speaker: 'patient', text: "I've had a cold for about 4 days. Runny nose, mild sore throat, and a cough. No fever though.", delay: 2000 },
    { speaker: 'attendant', text: 'Are your symptoms getting worse or staying about the same?', delay: 2000 },
    { speaker: 'patient', text: "About the same. Just wanted to know if I should see a doctor or if there's something I can do at home.", delay: 2500 },
    { speaker: 'attendant', text: 'Any pre-existing conditions or medications I should know about?', delay: 2000 },
    { speaker: 'patient', text: "No, I'm generally healthy. Just want to make sure it's nothing serious.", delay: 2000 },
  ],
};

async function playDemoTranscript(scenario) {
  const lines = DEMO_TRANSCRIPTS[scenario];
  if (!lines) return;

  accumulatedTranscript = '';
  clearTranscriptPanel();
  updateRecordingStatus('demo');

  for (const line of lines) {
    if (!demoRunning) break;
    await sleep(line.delay);
    if (!demoRunning) break;

    addTranscriptLine(line.speaker, line.text);
    accumulatedTranscript += `${line.speaker}: ${line.text}\n`;

    // Request AI suggestions after patient lines
    if (line.speaker === 'patient') {
      requestSuggestions(line.text);
    }
  }
}

// ---- AI Suggestion Engine ----

async function requestSuggestions(latestSegment) {
  // Debounce — don't spam the API
  if (suggestionTimer) clearTimeout(suggestionTimer);
  suggestionTimer = setTimeout(async () => {
    try {
      const res = await fetch('/api/assistant/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: latestSegment,
          patient_id: currentPatientId || undefined,
          accumulated_transcript: accumulatedTranscript,
        }),
      });
      const data = await res.json();
      if (data.ok && data.data) {
        renderSuggestions(data.data);
      }
    } catch (err) {
      // Silent fail — don't disrupt the call
    }
  }, 800);
}

function renderSuggestions(data) {
  const panel = document.getElementById('suggestions-panel');
  if (!panel) return;

  const typeIcons = { ask: '💬', info: 'ℹ️', route: '🏥', escalate: '🚨' };
  const priorityColors = { critical: '#ef4444', high: '#eab308', medium: '#3b82f6' };

  let html = '';

  if (data.urgency === 'critical') {
    html += `<div class="suggest-alert">URGENT — ${data.detected_keywords?.join(', ') || 'Emergency detected'}</div>`;
  }

  if (data.suggestions) {
    html += data.suggestions.map(s => `
      <div class="suggest-card suggest-${s.type}" style="border-left: 3px solid ${priorityColors[s.priority] || '#71717a'}">
        <span class="suggest-icon">${typeIcons[s.type] || '💡'}</span>
        <span class="suggest-text">${escapeHtml(s.text)}</span>
      </div>
    `).join('');
  }

  if (data.recommended_destination) {
    html += `<div class="suggest-route">Routing: <strong>${data.recommended_destination.replace(/_/g, ' ')}</strong></div>`;
  }

  panel.innerHTML = html || '<div class="suggest-empty">Listening for conversation...</div>';
}

// ---- Quick Response Templates ----

const QUICK_RESPONSES = [
  { label: 'Pain 1-10?', text: 'Can you describe your pain on a scale of 1 to 10?' },
  { label: 'Family Dr?', text: 'Do you have a family doctor or someone you see regularly?' },
  { label: 'Medications?', text: 'Are you currently taking any medications?' },
  { label: 'How long?', text: 'How long have you been experiencing these symptoms?' },
  { label: 'Allergies?', text: 'Do you have any allergies we should know about?' },
  { label: 'Escalate', text: "I'm going to connect you with our clinical team right away." },
];

function renderQuickResponses() {
  const container = document.getElementById('quick-responses');
  if (!container) return;
  container.innerHTML = QUICK_RESPONSES.map(r =>
    `<button class="quick-btn" onclick="useQuickResponse('${escapeHtml(r.text)}')" title="${escapeHtml(r.text)}">${r.label}</button>`
  ).join('');
}

function useQuickResponse(text) {
  addTranscriptLine('attendant', text);
  accumulatedTranscript += `attendant: ${text}\n`;
}

// ---- Transcript Panel Rendering ----

function addTranscriptLine(speaker, text) {
  const panel = document.getElementById('transcript-lines');
  if (!panel) return;

  const line = document.createElement('div');
  line.className = `transcript-line tl-${speaker}`;
  line.innerHTML = `<span class="tl-speaker">${speaker === 'patient' ? 'Patient' : speaker === 'attendant' ? 'Attendant' : 'System'}:</span> ${escapeHtml(text)}`;
  panel.appendChild(line);
  panel.scrollTop = panel.scrollHeight;
}

function updateInterimTranscript(text) {
  let interim = document.getElementById('transcript-interim');
  const panel = document.getElementById('transcript-lines');
  if (!panel) return;

  if (!interim) {
    interim = document.createElement('div');
    interim.id = 'transcript-interim';
    interim.className = 'transcript-line tl-interim';
    panel.appendChild(interim);
  }
  interim.innerHTML = `<span class="tl-speaker">Patient:</span> ${escapeHtml(text)}...`;
  panel.scrollTop = panel.scrollHeight;
}

function clearTranscriptPanel() {
  const panel = document.getElementById('transcript-lines');
  if (panel) panel.innerHTML = '';
  const suggestions = document.getElementById('suggestions-panel');
  if (suggestions) suggestions.innerHTML = '<div class="suggest-empty">Listening for conversation...</div>';
  accumulatedTranscript = '';
}

function updateRecordingStatus(status) {
  const indicator = document.getElementById('recording-status');
  if (!indicator) return;
  const states = {
    recording: '🔴 Recording',
    demo: '🎬 Demo Mode',
    stopped: '⏹ Stopped',
    error: '⚠️ Error',
  };
  indicator.textContent = states[status] || status;
  indicator.className = `recording-status rs-${status}`;
}
