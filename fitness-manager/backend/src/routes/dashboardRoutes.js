const router = require('express').Router();
const dashboard = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, dashboard.summary);

module.exports = router;
