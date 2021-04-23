const express = require('express');
const router = express.Router();
var db = require('../config/db');

const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

router.post('/register', function(req, res, next) {
    let user = req.body;
    try {
        bcrypt.hash(user.password, saltRounds, function(err, hash) {
            if (err) {
                console.log(err);
                res.send(err)
                return;
            }
            let query = `INSERT INTO user ( username, password, name) VALUES ( '${user.username}', '${hash}', '${user.name}' )`;
            db.query(query, function (error, results, fields) {
                if (error) {
                    console.log(error);
                    res.send(error)
                    return;
                }
                res.send(results)
            });
        });
    } catch (error) {
        res.send(error)
        return;
    }
});


router.post('/login', function(req, res, next) {
    let user = req.body;
    try {
        let query = `SELECT * FROM user WHERE username='${user.username}'`;
        db.query(query, function (error, results, fields) {
            if (error) {
                console.log(error);
                res.send(error)
                return;
            }
            res.send(results)
        });
    } catch (error) {
        res.send(error)
        return;
    }
});




module.exports = router;
