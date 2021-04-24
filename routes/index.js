const express = require('express');
const router = express.Router();
const db = require('../config/db');
const {ensureAuth} = require('../middleware/auth')

/* GET home page. */
router.get('/',  ensureAuth, function(req, res, next) {
  

  
  // connection.end();

  res.render('index', { title: req.username });
});



module.exports = router;
