export const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8080';

export const api = {
  // AI endpoints
  ask: (question) =>
    fetch(`${BASE_URL}/api/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    }).then(r => r.text()),

  explainTopic: (topic, level) =>
    fetch(`${BASE_URL}/api/ai/explain?topic=${encodeURIComponent(topic)}&level=${encodeURIComponent(level)}`)
      .then(r => r.text()),

  explainCode: (code, language) =>
    fetch(`${BASE_URL}/api/ai/explain-code?language=${encodeURIComponent(language)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: code,
    }).then(r => r.text()),

  explainRaw: (prompt) =>
    fetch(`${BASE_URL}/api/ai/raw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    }).then(r => r.text()),

  saveApiKey: (key) =>
    fetch(`${BASE_URL}/api/ai/key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    }),

  generateQuiz: (topic, difficulty, count = 5) =>
    fetch(`${BASE_URL}/api/ai/quiz?topic=${encodeURIComponent(topic)}&difficulty=${encodeURIComponent(difficulty)}&count=${count}`)
      .then(r => r.json()),

  generateDiagram: (topic) =>
    fetch(`${BASE_URL}/api/ai/diagram?topic=${encodeURIComponent(topic)}`)
      .then(r => r.json()),

  // Notes endpoints
  getNotes: (userId = 1) =>
    fetch(`${BASE_URL}/api/notes?userId=${userId}`)
      .then(r => (r.ok ? r.json() : []))
      .catch(() => []),

  searchNotes: (keyword, userId = 1) =>
    fetch(`${BASE_URL}/api/notes/search?userId=${userId}&keyword=${encodeURIComponent(keyword)}`)
      .then(r => (r.ok ? r.json() : []))
      .catch(() => []),

  createNote: (note) =>
    fetch(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    }).then(r => (r.ok ? r.json() : null)),

  deleteNote: (id) =>
    fetch(`${BASE_URL}/api/notes/${id}`, { method: 'DELETE' }),

  // Progress endpoints
  getProgress: (userId = 1) =>
    fetch(`${BASE_URL}/api/progress?userId=${userId}`)
      .then(r => (r.ok ? r.json() : []))
      .catch(() => []),

  getStats: (userId = 1) =>
    fetch(`${BASE_URL}/api/progress/stats?userId=${userId}`)
      .then(r => (r.ok ? r.json() : { totalTopics: 0, totalQuestions: 0, avgScore: 0, streak: 0 }))
      .catch(() => ({ totalTopics: 0, totalQuestions: 0, avgScore: 0, streak: 0 })),

  recordProgress: (data) =>
    fetch(`${BASE_URL}/api/progress/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => (r.ok ? r.json() : null)),

  // Auth endpoints
  register: (name, email, password) =>
    fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    }).then(r => r.json()),

  login: (email, password) =>
    fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(r => r.json()),

  googleAuth: (payload) =>
    fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(r => (r.ok ? r.json() : null)).catch(() => null),
};
