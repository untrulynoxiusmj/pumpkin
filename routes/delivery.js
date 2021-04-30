const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {ensureDelivery} = require('../middleware/delivery')

const db = require('../config/db');
const { commit } = require('../config/db');


const multer = require("multer");

var upload = multer({ dest: 'uploads/delivery' })


const router = express.Router();

const saltRounds = 10;

router.get('/signup', function(req, res, next) {
    res.render('signup', {role:'delivery'});
});


router.post('/signup',  upload.single('image'), function(req, res, next) {
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
            let query = `INSERT INTO delivery ( username, password, name, address, phone, image, bio ) VALUES ( '${delivery.username}', '${hash}', '${delivery.name}', '${delivery.address}', '${delivery.phone}', '${req.file.filename}', '${delivery.bio}' )`;
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
                  }, process.env.JWT_SECRET, { expiresIn: '24h' });
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
    res.render('index', req.delivery);
  });

router.get('/order/unassigned', ensureDelivery, function(req, res, next) {
    console.log(req.delivery)
    let query = `SELECT o.*, i.id as i_id, i.name as i_name, i.image as i_image, i.details as i_details, i.cost as i_cost, h.username as h_username, h.name as h_name, h.address as h_address, h.phone as h_phone, h.bio as h_bio, h.image as h_image, h.delivery as h_delivery FROM order_t o, item i, hotel h WHERE o.i_id = i.id AND i.h_username=h.username AND o.d_username IS NULL and delivery_chosen=1  AND o.order_status='PENDING';`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        console.log(results)
        let ObjResult = new Object();
        results.forEach(element => {
            if (!ObjResult[element.c_username]){
                ObjResult[element.c_username] = new Object()
                ObjResult[element.c_username][element.h_username] = new Object()
                ObjResult[element.c_username][element.h_username][element.timestamp] = new Object(
                    {
                        delivery_provided: element.h_delivery ,
                        delivery_chosen: element.delivery_chosen,
                        orders: Array(element)
                    })
            }
            else{
                if (!ObjResult[element.c_username][element.h_username]){
                    ObjResult[element.c_username][element.h_username] = new Object()
                    ObjResult[element.c_username][element.h_username][element.timestamp] = new Object(
                        {
                            delivery_provided: element.h_delivery ,
                            delivery_chosen: element.delivery_chosen,
                            orders: Array(element)
                        })
                }
                else{
                    if (!ObjResult[element.c_username][element.h_username][element.timestamp]){
                        ObjResult[element.c_username][element.h_username][element.timestamp] = new Object(
                            {
                                delivery_provided: element.h_delivery ,
                                delivery_chosen: element.delivery_chosen,
                                orders: Array(element)
                            })
                    }
                    else{
                        ObjResult[element.c_username][element.h_username][element.timestamp]['orders'].push(element)
                    }
                }
            }
        });
        console.log(ObjResult)
        // res.send(ObjResult)
        res.render('delivery_order', {objResult:ObjResult, customer:req.customer})
    });
    // res.render('index', { title: req.delivery.username });
});


// {
//     t: {
//         c: {
//             h: {

//             }
//         }
//     }
// }

router.get('/order/:status', ensureDelivery, function(req, res, next) {



    let query = `SELECT o.*, i.id as i_id, i.name as i_name, i.image as i_image, i.details as i_details, i.cost as i_cost, h.username as h_username, h.name as h_name, h.address as h_address, h.phone as h_phone, h.bio as h_bio, h.image as h_image, h.delivery as h_delivery FROM order_t o, item i, hotel h WHERE o.i_id = i.id AND i.h_username=h.username AND o.d_username='${req.delivery.username}' AND o.order_status='${req.params.status}' ORDER BY o.timestamp DESC;`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        console.log(results)
        let ObjResult = new Object();
        results.forEach(element => {
            if (!ObjResult[element.c_username]){
                ObjResult[element.c_username] = new Object()
                ObjResult[element.c_username][element.h_username] = new Object()
                ObjResult[element.c_username][element.h_username][element.timestamp] = new Object(
                    {
                        delivery_provided: element.h_delivery ,
                        delivery_chosen: element.delivery_chosen,
                        orders: Array(element)
                    })
            }
            else{
                if (!ObjResult[element.c_username][element.h_username]){
                    ObjResult[element.c_username][element.h_username] = new Object()
                    ObjResult[element.c_username][element.h_username][element.timestamp] = new Object(
                        {
                            delivery_provided: element.h_delivery ,
                            delivery_chosen: element.delivery_chosen,
                            orders: Array(element)
                        })
                }
                else{
                    if (!ObjResult[element.c_username][element.h_username][element.timestamp]){
                        ObjResult[element.c_username][element.h_username][element.timestamp] = new Object(
                            {
                                delivery_provided: element.h_delivery ,
                                delivery_chosen: element.delivery_chosen,
                                orders: Array(element)
                            })
                    }
                    else{
                        ObjResult[element.c_username][element.h_username][element.timestamp]['orders'].push(element)
                    }
                }
            }
        });
        console.log(ObjResult)
        // res.send(ObjResult)
        res.render('delivery_order', {objResult:ObjResult, customer:req.customer})
    });

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

router.post('/order/:id/status/completed', ensureDelivery, (req, res) => {
    let query = `UPDATE order_t SET payment_status='COMPLETED', order_status='COMPLETED' where id='${req.params.id}' AND delivery_chosen=1 AND d_username='${req.delivery.username}' AND order_status='PENDING';`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        console.log(results)
        res.redirect('/delivery/order/completed');
        // res.send(results)
    });
})

router.post('/order/:id/payment/completed', ensureDelivery, (req, res) => {
    let query = `UPDATE order_t SET payment_status='COMPLETED' where id='${req.params.id}' AND delivery_chosen=1 AND d_username='${req.delivery.username}' AND payment_status='PENDING';`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        console.log(results)
        res.redirect('/delivery/order/pending');
        // res.send(results)
    });
})


router.get('/logout', (req, res) => {
    res.clearCookie("token").send("Logout successful");
})

module.exports = router;

