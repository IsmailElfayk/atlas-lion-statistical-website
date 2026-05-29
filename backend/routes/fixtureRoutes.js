const router = require('express').Router();
const { getFixtures } = require('../controllers/fixtureController');
router.get('/', getFixtures);
module.exports = router;
