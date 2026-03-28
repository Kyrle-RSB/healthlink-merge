// ============================================================
// API Client — frontend helper for calling the Worker API
// ============================================================

const API_BASE = '/api';

/** Core fetch wrapper with consistent error handling */
async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available (not needed in demo mode)
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    return data;
  } catch (err) {
    return { ok: false, data: null, error: err.message };
  }
}

/** API methods */
const api = {
  // Health
  health: () => apiFetch('/health'),

  // Records
  listRecords: (limit = 50, offset = 0) =>
    apiFetch(`/records?limit=${limit}&offset=${offset}`),

  getRecord: (id) => apiFetch(`/records/${id}`),

  createRecord: (record) =>
    apiFetch('/records', {
      method: 'POST',
      body: JSON.stringify(record),
    }),

  // Auth
  login: (email, password) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email, password) =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // AI — Transcription
  transcribe: async (audioFile) => {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const token = localStorage.getItem('auth_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_BASE}/ai/transcribe`, {
        method: 'POST',
        headers,
        body: formData,
      });
      return await response.json();
    } catch (err) {
      return { ok: false, data: null, error: err.message };
    }
  },

  // AI — Reading Level
  readingLevel: (content, context) =>
    apiFetch('/ai/reading-level', {
      method: 'POST',
      body: JSON.stringify({ content, context }),
    }),

  // AI — Confidence Scoring
  confidence: (original, generated) =>
    apiFetch('/ai/confidence', {
      method: 'POST',
      body: JSON.stringify({ original, generated }),
    }),
};
