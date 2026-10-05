const router = require('express').Router();
const workouts = require('../controllers/workoutController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware); // todas as rotas de treino exigem login

router.get('/', workouts.list);
router.post('/', workouts.create);
router.get('/:id', workouts.getOne);
router.put('/:id', workouts.update);
router.delete('/:id', workouts.remove);

router.post('/:id/exercises', workouts.addExercise);
router.put('/:id/exercises/:exerciseId', workouts.updateExercise);
router.delete('/:id/exercises/:exerciseId', workouts.removeExercise);

module.exports = router;
