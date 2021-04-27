const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {ensureDelivery} = require('../middleware/delivery')

const db = require('../config/db');
const { commit } = require('../config/db');

const router = express.Router();

const saltRounds = 10;

router.get('/signup', function(req, res, next) {
    res.render('signup', {role:'delivery'});
});


router.post('/signup', function(req, res, next) {
    let delivery = req.body;
    console.log(delivery.password)
    console.log(saltRounds)
    try {
        bcrypt.hash(delivery.password, saltRounds, function(err, hash) {
            if (err) {
                console.log(err);
                res.send(err)
                return;
            }
            let query = `INSERT INTO delivery ( username, password, name, address, phone, image, bio ) VALUES ( '${delivery.username}', '${hash}', '${delivery.name}', '${delivery.address}', '${delivery.phone}', '${delivery.image}', '${delivery.bio}' )`;
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
    res.render('login', {role:'delivery'});
});

router.post('/login', function(req, res, next) {
    let user = req.body;
    console.log(process.env.JWT_SECRET)
    try {
        let query = `SELECT username, password FROM delivery WHERE username='${user.username}' LIMIT 1`;
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
                    role : 'delivery'
                  }, process.env.JWT_SECRET, { expiresIn: '20m' });
                res.cookie('token', token).send({
                    token: token,
                    hotel : results
                })
            });
        });
    } catch (error) {
        res.send(error)
        return;
    }
});

router.get('/', ensureDelivery, function(req, res, next) {
    console.log(req.delivery)
    res.render('index', { title: req.delivery.username });
  });

router.get('/order', ensureDelivery, function(req, res, next) {
    console.log(req.delivery)
    let query = `SELECT * from order_t where order_status='PENDING' and delivery_chosen=1 AND d_username is NULL;`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        console.log(results)
        res.send(results)
    });
    // res.render('index', { title: req.delivery.username });
});

router.post('/order/accept/:h_username/:c_username', ensureDelivery, (req, res) => {
    let query = `UPDATE order_t SET d_username='${req.delivery.username}' WHERE order_status='PENDING' and delivery_chosen=1 AND d_username is NULL AND c_username='${req.params.c_username}' AND i_id in (SELECT id from item where h_username='${req.params.h_username}');`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        console.log(results)
        res.send(results)
    });
})




router.get('/logout', (req, res) => {
    res.clearCookie("token").send("Logout successful");
})

module.exports = router;
