const router = require('express').Router();
const { compareplayers } = require('../controllers/compareController');
router.get('/', compareplayers);
module.exports = router;
