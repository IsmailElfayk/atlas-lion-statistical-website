const router = require('express').Router();
const { listPlayers, getPlayer, getPlayerRatings, getPlayerAverages } = require('../controllers/playerController');
router.get('/', listPlayers);
router.get('/:id', getPlayer);
router.get('/:id/ratings', getPlayerRatings);
router.get('/:id/averages', getPlayerAverages);
module.exports = router;
