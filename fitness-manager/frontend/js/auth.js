/** Tela de login/cadastro. */
import { api, getToken, saveSession } from './api.js';
import { initTheme } from './theme.js';

initTheme(document.getElementById('theme-toggle'));

// Já autenticado? Vai direto ao dashboard.
if (getToken()) window.location.href = 'dashboard.html';

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Alternância entre as abas
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    loginForm.classList.toggle('hidden', tab.dataset.tab !== 'login');
    registerForm.classList.toggle('hidden', tab.dataset.tab !== 'register');
  });
});

/** Envia o formulário, salva o token e redireciona. */
function handleAuth(form, endpoint, errorId) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById(errorId);
    const button = form.querySelector('button[type="submit"]');
    errorBox.textContent = '';
    button.disabled = true;

    try {
      const payload = Object.fromEntries(new FormData(form));
      const { token, user } = await api(endpoint, { method: 'POST', body: payload });
      saveSession(token, user);
      window.location.href = 'dashboard.html';
    } catch (err) {
      errorBox.textContent = err.message;
    } finally {
      button.disabled = false;
    }
  });
}

handleAuth(loginForm, '/auth/login', 'login-error');
handleAuth(registerForm, '/auth/register', 'register-error');
