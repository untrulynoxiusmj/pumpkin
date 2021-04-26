const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {ensureHotel} = require('../middleware/hotel')

const db = require('../config/db');

const router = express.Router();

const saltRounds = 10;

router.get('/signup', function(req, res, next) {
    res.render('signup');
});


router.post('/signup', function(req, res, next) {
    let hotel = req.body;
    console.log(hotel.password)
    console.log(saltRounds)
    try {
        bcrypt.hash(hotel.password, saltRounds, function(err, hash) {
            if (err) {
                console.log(err);
                res.send(err)
                return;
            }
            let query = `INSERT INTO hotel ( username, password, name, address, phone, image, bio, delivery ) VALUES ( '${hotel.username}', '${hash}', '${hotel.name}', '${hotel.address}', '${hotel.phone}', '${hotel.image}', '${hotel.bio}', '${hotel.delivery}' )`;
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
    res.render('login', {role:'hotel'});
});

router.post('/login', function(req, res, next) {
    let user = req.body;
    console.log(process.env.JWT_SECRET)
    try {
        let query = `SELECT username, password FROM hotel WHERE username='${user.username}' LIMIT 1`;
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
                    role: 'hotel',
                  }, process.env.JWT_SECRET, { expiresIn: '20m' });
                res.cookie('token', token).redirect(`${user.username}`)
            });
        });
    } catch (error) {
        res.send(error)
        return;
    }
});

router.get('/', function(req, res, next) {
    let query = `SELECT username, name, address, phone, bio, image, delivery FROM hotel`;
    db.query(query, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        res.render('hotel', {results: results})
    })
  });

router.get('/details/:h_username', (req, res) => {
    let query = `SELECT * FROM item WHERE h_username='${req.params.h_username}'`;
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        res.render('item', {results: results})
    });
})

router.get('/item/create', ensureHotel, (req, res) => {
    res.render('item_form', { title: req.hotel.username });
})

router.post('/item/create', ensureHotel, (req, res) => {
    const item = req.body;
    let query = `INSERT INTO item ( h_username, name, image, details, cost ) VALUES ( '${req.hotel.username}', '${item.name}', '${item.image}', '${item.details}', '${item.cost}' )`;
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        res.redirect(`/hotel/${req.hotel.username}`)
    });
})

router.get('/order', ensureHotel, (req, res) => {
    let query = `SELECT o.*, i.id as i_id, i.name as i_name, i.image as i_image, i.details as i_details, i.cost as i_cost, h.username as h_username, h.name as h_name, h.address as h_address, h.phone as h_phone, h.bio as h_bio, h.image as h_image, h.delivery as h_delivery FROM order_t o, item i, hotel h WHERE o.i_id = i.id AND i.h_username='${req.hotel.username}' AND h.username ='${req.hotel.username}';`
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
