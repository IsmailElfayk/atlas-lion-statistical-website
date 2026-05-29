const router = require('express').Router();
const { getFormations, getOptions } = require('../controllers/metaController');
router.get('/formations', getFormations);
router.get('/options', getOptions);
module.exports = router;
