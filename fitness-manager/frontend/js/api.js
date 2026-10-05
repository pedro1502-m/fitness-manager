/**
 * Camada de acesso à API + gerenciamento da sessão (token JWT no localStorage).
 */
const API_URL = '/api';
const TOKEN_KEY = 'fm_token';
const USER_KEY = 'fm_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getUser = () => JSON.parse(localStorage.getItem(USER_KEY) || 'null');

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Wrapper do fetch: injeta o token, serializa JSON e lança Error com a
 * mensagem da API. Em caso de 401 em rota protegida, encerra a sessão.
 */
export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor.');
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Token expirado em uma rota protegida: volta ao login
    if (response.status === 401 && token && !path.startsWith('/auth/login')) {
      clearSession();
      window.location.href = 'index.html';
    }
    throw new Error(data.message || 'Erro inesperado.');
  }
  return data;
}
