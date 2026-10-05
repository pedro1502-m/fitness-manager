/** CRUD de refeições (calorias e macros). Acesso restrito ao dono. */
const db = require('../config/db');
const httpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseMeal(body) {
  const name = (body.name || '').trim();
  const calories = Number(body.calories);
  const prot = body.prot === '' || body.prot == null ? 0 : Number(body.prot);
  const carb = body.carb === '' || body.carb == null ? 0 : Number(body.carb);
  const fat = body.fat === '' || body.fat == null ? 0 : Number(body.fat);
  const date = body.date;

  if (!name) throw httpError(400, 'O nome da refeição é obrigatório.');
  if (!Number.isFinite(calories) || calories < 0) throw httpError(400, 'Calorias inválidas.');
  for (const [label, v] of [['Proteínas', prot], ['Carboidratos', carb], ['Gorduras', fat]]) {
    if (!Number.isFinite(v) || v < 0) throw httpError(400, `${label} inválido(a).`);
  }
  if (!date || !DATE_REGEX.test(date)) throw httpError(400, 'Data inválida (use AAAA-MM-DD).');

  return { name, calories: Math.round(calories), prot, carb, fat, date };
}

exports.list = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const params = [req.user.id];
  let where = 'WHERE user_id = ?';

  if (date) {
    if (!DATE_REGEX.test(date)) throw httpError(400, 'Data inválida (use AAAA-MM-DD).');
    where += ' AND date = ?';
    params.push(date);
  }

  const [rows] = await db.query(`SELECT * FROM meals ${where} ORDER BY date DESC, id ASC`, params);
  res.json(rows);
});

exports.create = asyncHandler(async (req, res) => {
  const m = parseMeal(req.body);
  const [result] = await db.query(
    'INSERT INTO meals (user_id, name, calories, prot, carb, fat, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, m.name, m.calories, m.prot, m.carb, m.fat, m.date]
  );
  const [rows] = await db.query('SELECT * FROM meals WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const m = parseMeal(req.body);
  const [result] = await db.query(
    'UPDATE meals SET name = ?, calories = ?, prot = ?, carb = ?, fat = ?, date = ? WHERE id = ? AND user_id = ?',
    [m.name, m.calories, m.prot, m.carb, m.fat, m.date, req.params.id, req.user.id]
  );
  if (!result.affectedRows) throw httpError(404, 'Refeição não encontrada.');
  const [rows] = await db.query('SELECT * FROM meals WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

exports.remove = asyncHandler(async (req, res) => {
  const [result] = await db.query('DELETE FROM meals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!result.affectedRows) throw httpError(404, 'Refeição não encontrada.');
  res.status(204).end();
});
