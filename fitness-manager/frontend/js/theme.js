/** Tema escuro/claro persistido no localStorage. */
const KEY = 'fm_theme';

export function initTheme(button) {
  const apply = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    if (button) button.textContent = theme === 'dark' ? '🌙 Tema' : '☀️ Tema';
    if (button && button.classList.contains('icon-btn')) button.textContent = theme === 'dark' ? '🌙' : '☀️';
  };

  apply(localStorage.getItem(KEY) || 'dark');

  button?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem(KEY, next);
    apply(next);
  });
}
