/** Registro, login e perfil do usuário. */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const httpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Nunca devolve password_hash ao cliente
const publicFields = 'id, name, email, weight, height, goal, created_at';

// "" ou undefined -> null; caso contrário Number()
const toNumberOrNull = (v) => (v === '' || v === undefined || v === null ? null : Number(v));

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) throw httpError(400, 'Nome, e-mail e senha são obrigatórios.');
  if (!EMAIL_REGEX.test(email)) throw httpError(400, 'E-mail inválido.');
  if (password.length < 6) throw httpError(400, 'A senha deve ter ao menos 6 caracteres.');

  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (existing.length) throw httpError(409, 'E-mail já cadastrado.');

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name.trim(), email.toLowerCase(), passwordHash]
  );

  const [rows] = await db.query(`SELECT ${publicFields} FROM users WHERE id = ?`, [result.insertId]);
  res.status(201).json({ token: signToken(result.insertId), user: rows[0] });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw httpError(400, 'Informe e-mail e senha.');

  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  const user = rows[0];

  // Mensagem genérica: não revela se o e-mail existe
  const valid = user && (await bcrypt.compare(password, user.password_hash));
  if (!valid) throw httpError(401, 'E-mail ou senha incorretos.');

  delete user.password_hash;
  res.json({ token: signToken(user.id), user });
});

exports.getProfile = asyncHandler(async (req, res) => {
  const [rows] = await db.query(`SELECT ${publicFields} FROM users WHERE id = ?`, [req.user.id]);
  if (!rows.length) throw httpError(404, 'Usuário não encontrado.');
  res.json(rows[0]);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, goal } = req.body;
  const weight = toNumberOrNull(req.body.weight);
  const height = toNumberOrNull(req.body.height);

  if (!name || !name.trim()) throw httpError(400, 'O nome é obrigatório.');
  if (weight !== null && (Number.isNaN(weight) || weight <= 0 || weight > 500))
    throw httpError(400, 'Peso inválido.');
  if (height !== null && (Number.isNaN(height) || height <= 0 || height > 300))
    throw httpError(400, 'Altura inválida (use centímetros).');

  await db.query('UPDATE users SET name = ?, weight = ?, height = ?, goal = ? WHERE id = ?', [
    name.trim(),
    weight,
    height,
    goal ? goal.trim() : null,
    req.user.id,
  ]);

  const [rows] = await db.query(`SELECT ${publicFields} FROM users WHERE id = ?`, [req.user.id]);
  res.json(rows[0]);
});
