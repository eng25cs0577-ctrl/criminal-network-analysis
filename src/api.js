const API_BASE = import.meta.env.VITE_API_BASE || 'https://criminal-network-analysis.onrender.com';

function getAuthHeader() {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function apiSignup(email, password) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function apiGetMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeader(),
  });
  return handleResponse(res);
}

export async function apiGetGraph() {
  const res = await fetch(`${API_BASE}/api/graph`, {
    headers: getAuthHeader(),
  });
  return handleResponse(res);
}

export async function apiGetPath(source, target) {
  const res = await fetch(`${API_BASE}/api/path?source=${source}&target=${target}`, {
    headers: getAuthHeader(),
  });
  return handleResponse(res);
}

export async function apiExtractEntities(text) {
  const res = await fetch(`${API_BASE}/api/ai/extract-entities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ text }),
  });
  return handleResponse(res);
}

export async function apiAskAssistant(question) {
  const res = await fetch(`${API_BASE}/api/ai/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ question }),
  });
  return handleResponse(res);
}

export async function apiHealthCheck() {
  const res = await fetch(`${API_BASE}/api/health`);
  return handleResponse(res);
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}

export function getToken() {
  return localStorage.getItem('access_token');
}

export function setToken(token) {
  localStorage.setItem('access_token', token);
}

export function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}