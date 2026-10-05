/** CRUD de treinos e de seus exercícios. Todo acesso é restrito ao dono (req.user.id). */
const db = require('../config/db');
const httpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');

// ---------- helpers ----------
async function findOwnedWorkout(workoutId, userId) {
  const [rows] = await db.query('SELECT * FROM workouts WHERE id = ? AND user_id = ?', [workoutId, userId]);
  if (!rows.length) throw httpError(404, 'Treino não encontrado.');
  return rows[0];
}

/** Valida e normaliza os dados de um exercício. */
function parseExercise(body) {
  const name = (body.name || '').trim();
  const sets = Number(body.sets);
  const reps = Number(body.reps);
  const weight = body.weight === '' || body.weight == null ? 0 : Number(body.weight);

  if (!name) throw httpError(400, 'O nome do exercício é obrigatório.');
  if (!Number.isInteger(sets) || sets < 1) throw httpError(400, 'Séries deve ser um inteiro maior que 0.');
  if (!Number.isInteger(reps) || reps < 1) throw httpError(400, 'Repetições deve ser um inteiro maior que 0.');
  if (Number.isNaN(weight) || weight < 0) throw httpError(400, 'Carga inválida.');
  return { name, sets, reps, weight };
}

async function loadWorkoutsWithExercises(userId, workoutId = null) {
  const params = [userId];
  let where = 'WHERE user_id = ?';
  if (workoutId) {
    where += ' AND id = ?';
    params.push(workoutId);
  }
  const [workouts] = await db.query(`SELECT * FROM workouts ${where} ORDER BY created_at DESC, id DESC`, params);
  if (!workouts.length) return [];

  const ids = workouts.map((w) => w.id);
  const [exercises] = await db.query('SELECT * FROM exercises WHERE workout_id IN (?) ORDER BY id', [ids]);

  return workouts.map((w) => ({ ...w, exercises: exercises.filter((e) => e.workout_id === w.id) }));
}

// ---------- treinos ----------
exports.list = asyncHandler(async (req, res) => {
  res.json(await loadWorkoutsWithExercises(req.user.id));
});

exports.getOne = asyncHandler(async (req, res) => {
  const [workout] = await loadWorkoutsWithExercises(req.user.id, req.params.id);
  if (!workout) throw httpError(404, 'Treino não encontrado.');
  res.json(workout);
});

exports.create = asyncHandler(async (req, res) => {
  const title = (req.body.title || '').trim();
  const description = req.body.description ? req.body.description.trim() : null;
  if (!title) throw httpError(400, 'O título do treino é obrigatório.');

  // Exercícios opcionais enviados junto: [{name, sets, reps, weight}]
  const exercises = Array.isArray(req.body.exercises) ? req.body.exercises.map(parseExercise) : [];

  // Transação: treino + exercícios são salvos juntos ou nada é salvo
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO workouts (user_id, title, description) VALUES (?, ?, ?)',
      [req.user.id, title, description]
    );
    for (const ex of exercises) {
      await conn.query(
        'INSERT INTO exercises (workout_id, name, sets, reps, weight) VALUES (?, ?, ?, ?, ?)',
        [result.insertId, ex.name, ex.sets, ex.reps, ex.weight]
      );
    }
    await conn.commit();

    const [workout] = await loadWorkoutsWithExercises(req.user.id, result.insertId);
    res.status(201).json(workout);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

exports.update = asyncHandler(async (req, res) => {
  await findOwnedWorkout(req.params.id, req.user.id);
  const title = (req.body.title || '').trim();
  const description = req.body.description ? req.body.description.trim() : null;
  if (!title) throw httpError(400, 'O título do treino é obrigatório.');

  await db.query('UPDATE workouts SET title = ?, description = ? WHERE id = ?', [title, description, req.params.id]);
  const [workout] = await loadWorkoutsWithExercises(req.user.id, req.params.id);
  res.json(workout);
});

exports.remove = asyncHandler(async (req, res) => {
  await findOwnedWorkout(req.params.id, req.user.id);
  await db.query('DELETE FROM workouts WHERE id = ?', [req.params.id]); // exercises em cascata
  res.status(204).end();
});

// ---------- exercícios ----------
exports.addExercise = asyncHandler(async (req, res) => {
  await findOwnedWorkout(req.params.id, req.user.id);
  const ex = parseExercise(req.body);
  const [result] = await db.query(
    'INSERT INTO exercises (workout_id, name, sets, reps, weight) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, ex.name, ex.sets, ex.reps, ex.weight]
  );
  const [rows] = await db.query('SELECT * FROM exercises WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

exports.updateExercise = asyncHandler(async (req, res) => {
  await findOwnedWorkout(req.params.id, req.user.id);
  const ex = parseExercise(req.body);
  const [result] = await db.query(
    'UPDATE exercises SET name = ?, sets = ?, reps = ?, weight = ? WHERE id = ? AND workout_id = ?',
    [ex.name, ex.sets, ex.reps, ex.weight, req.params.exerciseId, req.params.id]
  );
  if (!result.affectedRows) throw httpError(404, 'Exercício não encontrado.');
  const [rows] = await db.query('SELECT * FROM exercises WHERE id = ?', [req.params.exerciseId]);
  res.json(rows[0]);
});

exports.removeExercise = asyncHandler(async (req, res) => {
  await findOwnedWorkout(req.params.id, req.user.id);
  const [result] = await db.query('DELETE FROM exercises WHERE id = ? AND workout_id = ?', [
    req.params.exerciseId,
    req.params.id,
  ]);
  if (!result.affectedRows) throw httpError(404, 'Exercício não encontrado.');
  res.status(204).end();
});
