const express = require('express');
const router = express.Router();
var db = require('../config/db');

/* GET home page. */
router.get('/', function(req, res, next) {
  
  db.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
    if (error) throw error;
    console.log('The solution is: ', results[0].solution);
  });

  
  // connection.end();

  res.render('index', { title: 'Express' });
});



module.exports = router;
