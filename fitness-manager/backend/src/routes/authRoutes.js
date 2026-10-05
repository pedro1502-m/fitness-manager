const router = require('express').Router();
const auth = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/profile', authMiddleware, auth.getProfile);
router.put('/profile', authMiddleware, auth.updateProfile);

module.exports = router;
