/**
 * Helpers de DOM. h() cria elementos usando textContent/createTextNode,
 * o que evita XSS ao exibir dados vindos do usuário.
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key === 'class') el.className = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

let toastTimer;
export function toast(message, isError = false) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.toggle('error', isError);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/** Abre o <dialog> reutilizável montando os campos dinamicamente. */
export function openForm({ title, fields, values = {}, submitLabel = 'Salvar', onSubmit }) {
  const dialog = document.getElementById('modal');
  const form = document.getElementById('modal-form');
  const fieldsBox = document.getElementById('modal-fields');
  const errorBox = document.getElementById('modal-error');

  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-submit').textContent = submitLabel;
  errorBox.textContent = '';
  fieldsBox.replaceChildren();

  for (const f of fields) {
    const input =
      f.type === 'textarea'
        ? h('textarea', { name: f.name, rows: 3 })
        : h('input', { name: f.name, type: f.type || 'text', step: f.step, min: f.min, required: !!f.required });
    input.value = values[f.name] ?? f.default ?? '';
    fieldsBox.append(h('label', { class: 'field' }, h('span', {}, f.label), input));
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(Object.fromEntries(new FormData(form)));
      dialog.close();
    } catch (err) {
      errorBox.textContent = err.message;
    }
  };
  document.getElementById('modal-cancel').onclick = () => dialog.close();
  dialog.showModal();
}
