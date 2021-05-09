const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {ensureDelivery} = require('../middleware/delivery')
const {ensureGuest} = require('../middleware/guest')

const db = require('../config/db');
const { commit } = require('../config/db');


const multer = require("multer");

var upload = multer({ dest: 'uploads/delivery' })


const router = express.Router();

const saltRounds = 10;

router.get('/signup', ensureGuest, function(req, res, next) {
    res.render('signup', {ofRole:'delivery'});
});


router.post('/signup', ensureGuest, upload.single('image'), function(req, res, next) {
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
                res.redirect("/delivery/login")
            });
        });
    } catch (error) {
        res.send(error)
        return;
    }
});

router.get('/login', ensureGuest, function(req, res, next) {
    res.render('login', {ofRole:'delivery'});
});

router.post('/login', ensureGuest, function(req, res, next) {
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
                res.cookie('token', token).redirect("/delivery")
            });
        });
    } catch (error) {
        res.send(error)
        return;
    }
});

router.get('/', ensureDelivery, function(req, res, next) {
    console.log(req.delivery)
    res.render('index', { user: req.delivery, role:'delivery', ofRole:'delivery'});
  });


router.get('/details/:d_username', (req, res) => {
    let query = `SELECT * from delivery where username="${req.params.d_username}"`;
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        const token = req.cookies.token;
        if (!token) return res.render('index', {user: results[0], active: 'hotel', ofRole:"delivery"})
        try {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log(err);
                    res.render('index', {user: results[0], active: 'hotel', ofRole:"delivery"})
                    return;
                }
                console.log(decoded.role)
                return res.render('index', {user: results[0], role:decoded.role, active: 'hotel', role:decoded.role, ofRole:"delivery"})
            })
        } catch(err) {
            res.redirect("/home")
        }
    })
})

router.get('/order/unassigned', ensureDelivery, function(req, res, next) {
        let query = `select oicht.*, h.username as h_username,  h.name as h_name,  h.address as h_address,  h.phone as h_phone,  h.bio as h_bio,  h.image as h_image,  h.delivery as h_delivery from order_icht oicht, hotel h where oicht.delivery_chosen=1 AND oicht.d_username is NULL AND oicht.order_status='PENDING' AND oicht.h_username=h.username ORDER BY oicht.timestamp DESC;`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        console.log(results)
        console.log(results.length)
        if (results.length===0){
            return res.render('delivery_order', { role: "delivery", delivery:req.delivery})
        }
        for (let i=0; i<results.length; i++){
            // result[i]
            // console.log("hello", results[i].id)
            let Anotherquery=`select oioi.o_id as o_id, oioi.i_id as i_id, oioi.i_quantity as i_quantity, oioi.cost as t_cost, i.* from order_ioi oioi, item i where i.id=oioi.i_id and oioi.o_id='${results[i].id}' order by oioi.o_id;`
            db.query(Anotherquery, function (error, anotherResults, fields) {
                if (error) {
                    console.log(error);
                    // res.send(error)
                    // return;
                }
                // console.log(anotherResults)
                let total_cost=0;
                anotherResults.forEach(anotherResult => {
                    total_cost+=anotherResult["t_cost"]
                })
                console.log(total_cost)
                results[i].ioi = anotherResults;
                results[i].total_cost = total_cost;
                console.log(anotherResults)
                
                if (i===results.length-1){
                    console.log(results)
                    return res.render('delivery_order', { role: "delivery", objResult:results, delivery:req.delivery})
                }

            })
        }
        console.log(results)
        
        // console.log(ObjResult)
        // res.send(ObjResult)
        // res.render('customer_order', { role: "customer", objResult:ObjResult, customer:req.customer})
    });
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
    let query = `select oicht.*, h.username as h_username,  h.name as h_name,  h.address as h_address,  h.phone as h_phone,  h.bio as h_bio,  h.image as h_image,  h.delivery as h_delivery from order_icht oicht, hotel h where oicht.delivery_chosen=1 AND oicht.d_username='${req.delivery.username}' AND oicht.order_status='${req.params.status}' AND oicht.h_username=h.username ORDER BY oicht.timestamp DESC;`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        console.log(results)
        console.log(results.length)
        if (results.length===0){
            return res.render('delivery_order', { role: "delivery", delivery:req.delivery})
        }
        for (let i=0; i<results.length; i++){
            // result[i]
            // console.log("hello", results[i].id)
            let Anotherquery=`select oioi.o_id as o_id, oioi.i_id as i_id, oioi.i_quantity as i_quantity, oioi.cost as t_cost, i.* from order_ioi oioi, item i where i.id=oioi.i_id and oioi.o_id='${results[i].id}' order by oioi.o_id;`
            db.query(Anotherquery, function (error, anotherResults, fields) {
                if (error) {
                    console.log(error);
                    // res.send(error)
                    // return;
                }
                // console.log(anotherResults)
                let total_cost=0;
                anotherResults.forEach(anotherResult => {
                    total_cost+=anotherResult["t_cost"]
                })
                console.log(total_cost)
                results[i].ioi = anotherResults;
                results[i].total_cost = total_cost;
                console.log(anotherResults)
                
                if (i===results.length-1){
                    console.log(results)
                    return res.render('delivery_order', { role: "delivery", objResult:results, delivery:req.delivery})
                }

            })
        }
        console.log(results)
        
        // console.log(ObjResult)
        // res.send(ObjResult)
        // res.render('customer_order', { role: "customer", objResult:ObjResult, customer:req.customer})
    });
});

router.post('/order/:id/accept', ensureDelivery, (req, res) => {
    let query = `UPDATE order_icht SET d_username='${req.delivery.username}' WHERE id='${req.params.id}' AND order_status='PENDING' and delivery_chosen=1 AND d_username is NULL;`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        console.log(results)
        res.redirect("/delivery/order/pending")
    });
})

router.post('/order/:id/status/completed', ensureDelivery, (req, res) => {
    let query = `UPDATE order_icht SET payment_status='COMPLETED', order_status='COMPLETED' where id='${req.params.id}' AND delivery_chosen=1 AND d_username='${req.delivery.username}' AND order_status='PENDING';`
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
    let query = `UPDATE order_icht SET payment_status='COMPLETED' where id='${req.params.id}' AND delivery_chosen=1 AND d_username='${req.delivery.username}' AND payment_status='PENDING';`
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
    res.clearCookie("token").redirect("/");
})

module.exports = router;

