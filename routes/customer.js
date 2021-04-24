const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {ensureCustomer} = require('../middleware/customer')

const db = require('../config/db');
const { commit } = require('../config/db');

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

router.get('/cart', ensureCustomer, (req, res) => {
    // let query = `SELECT * from cart where c_username='${req.customer.username}'`;
    let query = `SELECT c.*, i.id as i_id, i.name as i_name, i.image as i_image, i.details as i_details, i.cost as i_cost, h.username as h_username, h.name as h_name, h.address as h_address, h.phone as h_phone, h.bio as h_bio, h.image as h_image, h.delivery as h_delivery FROM cart c, item i, hotel h WHERE c.c_username = '${req.customer.username}' AND c.i_id = i.id AND i.h_username=h.username ORDER BY h.username;`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        console.log(results)
        let ObjResultKeyHotel = new Object();
        results.forEach(element => {
            if (!ObjResultKeyHotel[element.h_username]){
                ObjResultKeyHotel[element.h_username] = new Object({
                    delivery: element.h_delivery ,
                    orders: Array(element)
                });
            }
            else{
                ObjResultKeyHotel[element.h_username]['orders'].push(element);
            }
        });
        console.log(ObjResultKeyHotel)
        // res.send(ObjResultKeyHotel)
        res.render('cart', {hotelOrders:ObjResultKeyHotel, customer:req.customer})
    });
})

router.post('order', ensureCustomer, (req, res) => {

})

router.post('/cart/:id', ensureCustomer, (req, res) => {
    if (req.params.id){
        let query = `INSERT INTO cart ( c_username, i_id ) VALUES ( '${req.customer.username}', (SELECT id from item where id='${req.params.id}') )`;
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
