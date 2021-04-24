const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {ensureCustomer} = require('../middleware/customer')

const db = require('../config/db');

const router = express.Router();

const saltRounds = 10;

router.get('/signup', function(req, res, next) {
    res.render('customer_signup');
});


router.post('/signup', function(req, res, next) {
    let customer = req.body;
    console.log(customer.password)
    console.log(saltRounds)
    try {
        bcrypt.hash(customer.password, saltRounds, function(err, hash) {
            if (err) {
                console.log(err);
                res.send(err)
                return;
            }
            let query = `INSERT INTO customer ( username, password, name, address, phone, image, bio ) VALUES ( '${customer.username}', '${hash}', '${customer.name}', '${customer.address}', '${customer.phone}', '${customer.image}', '${customer.bio}' )`;
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
    res.render('login', {role:'customer'});
});

router.post('/login', function(req, res, next) {
    let user = req.body;
    console.log(process.env.JWT_SECRET)
    try {
        let query = `SELECT username, password FROM customer WHERE username='${user.username}' LIMIT 1`;
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
                    role : 'customer'
                  }, process.env.JWT_SECRET, { expiresIn: '5m' });
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

router.get('/', ensureCustomer, function(req, res, next) {
    console.log(req.customer)
    res.render('index', { title: req.customer.username });
  });

router.post('/cart', ensureCustomer, (req, res) => {
    if (req.body.id){
        let query = `INSERT INTO cart ( c_username, i_id ) VALUES ( '${req.customer.username}', '${req.body.id}' )`;
        db.query(query, function (error, results, fields) {
            if (error) {
                console.log(error);
                res.send(error)
                return;
            }
            res.send(results)
        });
    }
    else{
        res.send("Invalid item id")
    }
})

// router.get('/:h_username/item', (req, res) => {
//     let query = `SELECT * FROM item WHERE h_username='${req.params.h_username}'`;
//     db.query(query, function (error, results, fields) {
//         if (error) {
//             console.log(error);
//             res.send(error)
//             return;
//         }
//         res.send(results)
//     });
// })

// router.get('/item/create', ensureHotel, (req, res) => {
//     res.render('item', { title: req.hotel.username });
// })

// router.post('/item/create', ensureHotel, (req, res) => {
//     const item = req.body;
//     let query = `INSERT INTO item ( h_username, name, image, details, cost ) VALUES ( '${req.hotel.username}', '${item.name}', '${item.image}', '${item.details}', '${item.cost}' )`;
//     db.query(query, function (error, results, fields) {
//         if (error) {
//             console.log(error);
//             res.send(error)
//             return;
//         }
//         res.send(results)
//     });
// })

router.get('/logout', (req, res) => {
    res.clearCookie("token").send("Logout successful");
})



module.exports = router;
