const router = require('express').Router();
const { listPlayers, getPlayer, getPlayerRatings } = require('../controllers/playerController');
router.get('/', listPlayers);
router.get('/:id', getPlayer);
router.get('/:id/ratings', getPlayerRatings);
module.exports = router;
