const router = require('express').Router();
const meals = require('../controllers/mealController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', meals.list); // ?date=AAAA-MM-DD (opcional)
router.post('/', meals.create);
router.put('/:id', meals.update);
router.delete('/:id', meals.remove);

module.exports = router;
