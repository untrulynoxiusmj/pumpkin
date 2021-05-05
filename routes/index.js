const express = require('express');
const router = express.Router();
const db = require('../config/db');
const {ensureGuest} = require("../middleware/guest")

router.get('/', ensureGuest, (req, res) => {
    res.render('landing', {active: 'home'})
})


module.exports = router;
