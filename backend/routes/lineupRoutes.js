const router = require('express').Router();
const { getBestXI } = require('../controllers/lineupController');
router.get('/best-xi', getBestXI);
module.exports = router;
