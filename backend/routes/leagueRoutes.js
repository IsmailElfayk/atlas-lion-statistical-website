const router = require('express').Router();
const { getLeagues } = require('../controllers/leagueController');
router.get('/', getLeagues);
module.exports = router;
