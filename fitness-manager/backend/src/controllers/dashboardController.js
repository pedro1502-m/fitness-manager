/** Dados de resumo do usuário para o dashboard. */
const db = require('../config/db');
const httpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

exports.summary = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // O cliente envia a data local (?date=AAAA-MM-DD) para evitar divergência de fuso
  let today = req.query.date;
  if (today && !DATE_REGEX.test(today)) throw httpError(400, 'Data inválida (use AAAA-MM-DD).');
  if (!today) today = new Date().toISOString().slice(0, 10);

  const [[user]] = await db.query('SELECT id, name, email, weight, height, goal FROM users WHERE id = ?', [userId]);
  if (!user) throw httpError(404, 'Usuário não encontrado.');

  const [[counts]] = await db.query(
    `SELECT
       (SELECT COUNT(*) FROM workouts WHERE user_id = ?) AS workouts,
       (SELECT COUNT(*) FROM exercises e JOIN workouts w ON w.id = e.workout_id WHERE w.user_id = ?) AS exercises,
       (SELECT COUNT(*) FROM meals WHERE user_id = ? AND date = ?) AS meals_today`,
    [userId, userId, userId, today]
  );

  const [[totals]] = await db.query(
    `SELECT COALESCE(SUM(calories),0) AS calories, COALESCE(SUM(prot),0) AS prot,
            COALESCE(SUM(carb),0) AS carb, COALESCE(SUM(fat),0) AS fat
       FROM meals WHERE user_id = ? AND date = ?`,
    [userId, today]
  );

  // Calorias dos últimos 7 dias (hoje incluso)
  const [week] = await db.query(
    `SELECT date, SUM(calories) AS calories
       FROM meals
      WHERE user_id = ? AND date BETWEEN DATE_SUB(?, INTERVAL 6 DAY) AND ?
      GROUP BY date ORDER BY date`,
    [userId, today, today]
  );

  const [recentWorkouts] = await db.query(
    `SELECT w.id, w.title, COUNT(e.id) AS exercises_count
       FROM workouts w LEFT JOIN exercises e ON e.workout_id = w.id
      WHERE w.user_id = ?
      GROUP BY w.id ORDER BY w.created_at DESC, w.id DESC LIMIT 5`,
    [userId]
  );

  // IMC = peso(kg) / altura(m)^2
  const bmi = user.weight && user.height ? +(user.weight / Math.pow(user.height / 100, 2)).toFixed(1) : null;

  res.json({ user: { ...user, bmi }, counts, today: { date: today, ...totals }, week, recentWorkouts });
});
