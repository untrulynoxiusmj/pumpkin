const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const db = require('../config/db');

const router = express.Router();

const saltRounds = process.env.SALT_ROUNDS;

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

router.get('/login', function(req, res, next) {
    res.render('form');
});

router.post('/login', function(req, res, next) {
    let user = req.body;
    try {
        let query = `SELECT username, password FROM user WHERE username='${user.username}' LIMIT 1`;
        db.query(query, function (error, results, fields) {
            if (error) {
                console.log(error);
                res.send(error)
                return;
            }
            if (results.length==0) {
                res.send("No username exists")
                return
            }
            bcrypt.compare(user.password, results[0].password, function(err, result) {
                if (err) {
                    console.log(err);
                    res.send(err)
                    return;
                }
                if (!result){
                    res.send("wrong password")
                    return;
                }
                const token = jwt.sign({
                    username: results[0].username,
                  }, process.env.JWT_SECRET, { expiresIn: '5m' });
                res.cookie('token', token).send(token)
            });
        });
    } catch (error) {
        res.send(error)
        return;
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie("token").send("Logout successful");
})



module.exports = router;
