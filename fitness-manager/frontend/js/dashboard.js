/**
 * Dashboard: resumo, treinos, refeições e perfil.
 * Tudo consome a API via fetch() usando o token JWT salvo no localStorage.
 */
import { api, getToken, getUser, setUser, clearSession } from './api.js';
import { h, toast, openForm } from './dom.js';
import { initTheme } from './theme.js';

// ---------- Guarda de rota ----------
if (!getToken()) window.location.href = 'index.html';

initTheme(document.getElementById('theme-toggle'));

// Data local no formato AAAA-MM-DD
const todayStr = () => new Date().toLocaleDateString('sv-SE');
const num = (v) => (v === '' || v == null ? null : Number(v));
const fmt = (n) => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

const TITLES = { summary: 'Resumo', workouts: 'Treinos', meals: 'Refeições', profile: 'Perfil' };
const loaders = { summary: loadSummary, workouts: loadWorkouts, meals: loadMeals, profile: loadProfile };

// ---------- Navegação ----------
function showSection(name) {
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.section === name));
  document.querySelectorAll('.section').forEach((s) => s.classList.toggle('hidden', s.id !== `section-${name}`));
  document.getElementById('page-title').textContent = TITLES[name];
  loaders[name]().catch((err) => toast(err.message, true));
}

document.getElementById('nav').addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-btn');
  if (btn) showSection(btn.dataset.section);
});

document.getElementById('logout-btn').addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});

const currentSection = () => document.querySelector('.nav-btn.active').dataset.section;
const reload = () => loaders[currentSection()]().catch((err) => toast(err.message, true));

// =====================================================
// RESUMO
// =====================================================
async function loadSummary() {
  const data = await api(`/dashboard?date=${todayStr()}`);
  document.getElementById('welcome').textContent = `Olá, ${data.user.name.split(' ')[0]}!`;

  // Cartões de estatísticas
  const stats = [
    ['Treinos', data.counts.workouts],
    ['Exercícios', data.counts.exercises],
    ['Refeições hoje', data.counts.meals_today],
    ['Calorias hoje', fmt(data.today.calories)],
    ['IMC', data.user.bmi ?? '—'],
    ['Objetivo', data.user.goal || '—'],
  ];
  document.getElementById('stats').replaceChildren(
    ...stats.map(([label, value]) =>
      h('div', { class: 'card stat' }, h('div', { class: 'value' }, value), h('div', { class: 'label' }, label))
    )
  );

  // Barras de macros (proporção entre os três nutrientes)
  const { prot, carb, fat } = data.today;
  const maxMacro = Math.max(prot, carb, fat, 1);
  const macroRow = (label, value, cls) =>
    h('div', { class: 'macro' },
      h('div', { class: 'macro-top' }, h('span', {}, label), h('strong', {}, `${fmt(value)} g`)),
      h('div', { class: `bar ${cls}` }, h('span', { style: `width:${(value / maxMacro) * 100}%` }))
    );
  document.getElementById('macros').replaceChildren(
    macroRow('Proteínas', prot, 'prot'), macroRow('Carboidratos', carb, 'carb'), macroRow('Gorduras', fat, 'fat')
  );

  // Gráfico dos últimos 7 dias (preenche dias sem registro com 0)
  const byDate = Object.fromEntries(data.week.map((r) => [r.date, Number(r.calories)]));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toLocaleDateString('sv-SE');
    return { key, label: d.toLocaleDateString('pt-BR', { weekday: 'short' }), value: byDate[key] || 0 };
  });
  const maxCal = Math.max(...days.map((d) => d.value), 1);
  document.getElementById('week-chart').replaceChildren(
    ...days.map((d) =>
      h('div', { class: 'col', title: `${d.value} kcal` },
        h('small', {}, d.value || ''),
        h('div', { class: 'fill', style: `height:${(d.value / maxCal) * 130}px` }),
        h('small', {}, d.label)
      )
    )
  );

  // Treinos recentes
  const list = document.getElementById('recent-workouts');
  list.replaceChildren(
    ...(data.recentWorkouts.length
      ? data.recentWorkouts.map((w) =>
          h('li', {}, h('span', {}, w.title), h('span', { class: 'muted' }, `${w.exercises_count} exercício(s)`))
        )
      : [h('li', { class: 'muted' }, 'Nenhum treino cadastrado ainda.')])
  );
}

// =====================================================
// TREINOS
// =====================================================
const workoutFields = [
  { name: 'title', label: 'Título', required: true },
  { name: 'description', label: 'Descrição', type: 'textarea' },
];
const exerciseFields = [
  { name: 'name', label: 'Exercício', required: true },
  { name: 'sets', label: 'Séries', type: 'number', min: 1, required: true, default: 3 },
  { name: 'reps', label: 'Repetições', type: 'number', min: 1, required: true, default: 10 },
  { name: 'weight', label: 'Carga (kg)', type: 'number', step: '0.5', min: 0, default: 0 },
];

async function loadWorkouts() {
  const workouts = await api('/workouts');
  const box = document.getElementById('workouts-list');
  if (!workouts.length) {
    box.replaceChildren(h('div', { class: 'card empty' }, 'Nenhum treino ainda. Crie o primeiro!'));
    return;
  }
  box.replaceChildren(...workouts.map(renderWorkoutCard));
}

function renderWorkoutCard(w) {
  const exerciseRows = w.exercises.map((ex) =>
    h('tr', {},
      h('td', {}, ex.name), h('td', {}, ex.sets), h('td', {}, ex.reps), h('td', {}, `${fmt(ex.weight)} kg`),
      h('td', {}, h('div', { class: 'actions' },
        h('button', { class: 'btn ghost small', onclick: () => editExercise(w, ex) }, 'Editar'),
        h('button', { class: 'btn danger small', onclick: () => deleteExercise(w, ex) }, 'Remover')
      ))
    )
  );

  const table = w.exercises.length
    ? h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
        h('thead', {}, h('tr', {}, ...['Exercício', 'Séries', 'Reps', 'Carga', ''].map((t) => h('th', {}, t)))),
        h('tbody', {}, exerciseRows)))
    : h('p', { class: 'muted' }, 'Sem exercícios neste treino.');

  return h('article', { class: 'card' },
    h('div', { class: 'card-head' }, h('div', {}, h('h3', {}, w.title), h('span', { class: 'muted' }, w.description || ''))),
    table,
    h('div', { class: 'card-actions' },
      h('button', { class: 'btn primary small', onclick: () => addExercise(w) }, '+ Exercício'),
      h('button', { class: 'btn ghost small', onclick: () => editWorkout(w) }, 'Editar treino'),
      h('button', { class: 'btn danger small', onclick: () => deleteWorkout(w) }, 'Excluir')
    )
  );
}

const exerciseBody = (d) => ({ name: d.name, sets: num(d.sets), reps: num(d.reps), weight: num(d.weight) ?? 0 });

document.getElementById('new-workout').addEventListener('click', () =>
  openForm({
    title: 'Novo treino', fields: workoutFields, submitLabel: 'Criar',
    onSubmit: async (d) => { await api('/workouts', { method: 'POST', body: d }); toast('Treino criado!'); reload(); },
  })
);

const editWorkout = (w) =>
  openForm({
    title: 'Editar treino', fields: workoutFields, values: w,
    onSubmit: async (d) => { await api(`/workouts/${w.id}`, { method: 'PUT', body: d }); toast('Treino atualizado!'); reload(); },
  });

async function deleteWorkout(w) {
  if (!confirm(`Excluir "${w.title}" e todos os seus exercícios?`)) return;
  try { await api(`/workouts/${w.id}`, { method: 'DELETE' }); toast('Treino excluído.'); reload(); }
  catch (err) { toast(err.message, true); }
}

const addExercise = (w) =>
  openForm({
    title: `Novo exercício em "${w.title}"`, fields: exerciseFields, submitLabel: 'Adicionar',
    onSubmit: async (d) => {
      await api(`/workouts/${w.id}/exercises`, { method: 'POST', body: exerciseBody(d) });
      toast('Exercício adicionado!'); reload();
    },
  });

const editExercise = (w, ex) =>
  openForm({
    title: 'Editar exercício', fields: exerciseFields, values: ex,
    onSubmit: async (d) => {
      await api(`/workouts/${w.id}/exercises/${ex.id}`, { method: 'PUT', body: exerciseBody(d) });
      toast('Exercício atualizado!'); reload();
    },
  });

async function deleteExercise(w, ex) {
  if (!confirm(`Remover "${ex.name}"?`)) return;
  try { await api(`/workouts/${w.id}/exercises/${ex.id}`, { method: 'DELETE' }); toast('Exercício removido.'); reload(); }
  catch (err) { toast(err.message, true); }
}

// =====================================================
// REFEIÇÕES
// =====================================================
const mealDateInput = document.getElementById('meal-date');
mealDateInput.value = todayStr();
mealDateInput.addEventListener('change', () => loadMeals().catch((e) => toast(e.message, true)));

const mealFields = [
  { name: 'name', label: 'Refeição', required: true },
  { name: 'calories', label: 'Calorias (kcal)', type: 'number', min: 0, required: true },
  { name: 'prot', label: 'Proteínas (g)', type: 'number', step: '0.1', min: 0, default: 0 },
  { name: 'carb', label: 'Carboidratos (g)', type: 'number', step: '0.1', min: 0, default: 0 },
  { name: 'fat', label: 'Gorduras (g)', type: 'number', step: '0.1', min: 0, default: 0 },
  { name: 'date', label: 'Data', type: 'date', required: true },
];
const mealBody = (d) => ({
  name: d.name, calories: num(d.calories), prot: num(d.prot) ?? 0,
  carb: num(d.carb) ?? 0, fat: num(d.fat) ?? 0, date: d.date,
});

async function loadMeals() {
  const date = mealDateInput.value || todayStr();
  const meals = await api(`/meals?date=${date}`);
  const table = document.getElementById('meals-table');

  if (!meals.length) {
    table.replaceChildren(h('tbody', {}, h('tr', {}, h('td', { class: 'empty' }, 'Nenhuma refeição neste dia.'))));
    return;
  }

  const sum = (key) => meals.reduce((acc, m) => acc + Number(m[key]), 0);
  table.replaceChildren(
    h('thead', {}, h('tr', {}, ...['Refeição', 'Kcal', 'Prot (g)', 'Carb (g)', 'Gord (g)', ''].map((t) => h('th', {}, t)))),
    h('tbody', {}, meals.map((m) =>
      h('tr', {},
        h('td', {}, m.name), h('td', {}, fmt(m.calories)), h('td', {}, fmt(m.prot)), h('td', {}, fmt(m.carb)), h('td', {}, fmt(m.fat)),
        h('td', {}, h('div', { class: 'actions' },
          h('button', { class: 'btn ghost small', onclick: () => editMeal(m) }, 'Editar'),
          h('button', { class: 'btn danger small', onclick: () => deleteMeal(m) }, 'Excluir')
        ))
      )
    )),
    h('tfoot', {}, h('tr', {},
      h('td', {}, 'Total'), h('td', {}, fmt(sum('calories'))), h('td', {}, fmt(sum('prot'))),
      h('td', {}, fmt(sum('carb'))), h('td', {}, fmt(sum('fat'))), h('td', {})
    ))
  );
}

document.getElementById('new-meal').addEventListener('click', () =>
  openForm({
    title: 'Nova refeição', fields: mealFields, values: { date: mealDateInput.value || todayStr() }, submitLabel: 'Registrar',
    onSubmit: async (d) => { await api('/meals', { method: 'POST', body: mealBody(d) }); toast('Refeição registrada!'); reload(); },
  })
);

const editMeal = (m) =>
  openForm({
    title: 'Editar refeição', fields: mealFields, values: m,
    onSubmit: async (d) => { await api(`/meals/${m.id}`, { method: 'PUT', body: mealBody(d) }); toast('Refeição atualizada!'); reload(); },
  });

async function deleteMeal(m) {
  if (!confirm(`Excluir "${m.name}"?`)) return;
  try { await api(`/meals/${m.id}`, { method: 'DELETE' }); toast('Refeição excluída.'); reload(); }
  catch (err) { toast(err.message, true); }
}

// =====================================================
// PERFIL
// =====================================================
const profileForm = document.getElementById('profile-form');

async function loadProfile() {
  const user = await api('/auth/profile');
  for (const field of ['name', 'email', 'weight', 'height', 'goal']) {
    profileForm.elements[field].value = user[field] ?? '';
  }
}

profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('profile-error');
  errorBox.textContent = '';
  const d = Object.fromEntries(new FormData(profileForm));
  try {
    const user = await api('/auth/profile', {
      method: 'PUT',
      body: { name: d.name, weight: num(d.weight), height: num(d.height), goal: d.goal },
    });
    setUser(user);
    toast('Perfil atualizado!');
  } catch (err) {
    errorBox.textContent = err.message;
  }
});

// ---------- Início ----------
document.getElementById('welcome').textContent = `Olá, ${(getUser()?.name || '').split(' ')[0]}!`;
showSection('summary');
