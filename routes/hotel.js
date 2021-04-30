const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {ensureHotel} = require('../middleware/hotel')

const db = require('../config/db');


const multer = require("multer");
const customer = require('../middleware/customer');

var upload = multer({ dest: 'uploads/hotel/' })

const router = express.Router();

const saltRounds = 10;

router.get('/signup', function(req, res, next) {
    res.render('signup', {hotel: true, role: 'hotel'});
});


router.post('/signup', multer({ dest: 'uploads/hotel/' }).single('image'), function(req, res, next) {
    console.log(req.file)
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
            let query = `INSERT INTO hotel ( username, password, name, address, phone, image, bio, delivery, open ) VALUES ( '${hotel.username}', '${hash}', '${hotel.name}', '${hotel.address}', '${hotel.phone}', '${req.file.filename}', "${hotel.bio}", '${hotel.delivery}', '${hotel.open}' )`;
            db.query(query, function (error, results, fields) {
                if (error) {
                    console.log(error);
                    res.send(error)
                    return;
                }
                res.redirect("/hotel/login")
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

router.get('/edit', ensureHotel, (req, res) => {
    res.render('hotel_edit', {user: req.hotel, 'role':'hotel', hotel: true})
})

router.post('/edit', ensureHotel, function(req, res, next) {
    // console.log(req.file)
    let hotel = req.body;
    console.log(hotel)
    // console.log(hotel.password)
    // console.log(saltRounds)
    
    let query = `UPDATE hotel SET name = '${hotel.name}', address = '${hotel.address}', phone = '${hotel.phone}', bio = "${hotel.bio}", delivery = '${hotel.delivery}', open = '${hotel.open}' where username='${req.hotel.username}';`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        res.send(results)
    });
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
                res.cookie('token', token).redirect(`/hotel/details/${user.username}`)
            });
        });
    } catch (error) {
        res.send(error)
        return;
    }
});

router.get('/', function(req, res, next) {
    let query = `SELECT username, name, address, phone, bio, image, delivery, open FROM hotel`;
    db.query(query, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        res.render('hotel', {results: results, active: 'hotel'})
    })
  });

router.get('/details/:h_username', (req, res) => {
    let query = `SELECT * FROM item i WHERE h_username='${req.params.h_username}'`;
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        const token = req.cookies.token;
        if (!token) return res.render('item', { hotel:req.params.h_username, results: results})
        try {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log(err);
                    res.render('item', { hotel:req.params.h_username, results: results})
                    return;
                }
                console.log(decoded) // bar
                if (decoded.role=='customer'){
                            res.render('item', {customer:1, role:"customer", hotel:req.params.h_username, results: results})
                            return;
                }
                if (decoded.username==req.params.h_username && decoded.role=='hotel'){
                    res.render('item', {"role":"hotel", authorized:1, hotel:req.params.h_username, results: results})
                    return
                }
                // let query = `SELECT * FROM customer WHERE username='${decoded.username}' LIMIT 1`;
                // db.query(query, function (error, results, fields) {
                //     if (error) {
                //         console.log(error);
                //         res.redirect("/customer/login")
                //         return;
                //     }
                //     if (results.length==0){
                //         res.redirect("/customer/login")
                //         return;
                //     }
                //     if (decoded.role!=='customer'){
                //         res.redirect("/customer/login")
                //         return;
                //     }
                //     req.customer = results[0];
                //     next() 
                // });
            })
        } catch(err) {
            res.redirect("/customer/login")
        }
    });
})

router.get('/item/create', ensureHotel, (req, res) => {
    res.render('item_form', { "role":"hotel", title: req.hotel.username });
})

router.post('/item/create', ensureHotel, multer({ dest: 'uploads/item/' }).single('image'), (req, res) => {
    const item = req.body;
    console.log(item)
    let query = `INSERT INTO item ( h_username, name, image, details, cost, category, available ) VALUES ( '${req.hotel.username}', '${item.name}', '${req.file.filename}', '${item.details}', '${item.cost}', '${item.category}', '${item.available}' )`;
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        res.redirect(`/hotel/details/${req.hotel.username}`)
    });
})

router.get('/item/:id/edit', ensureHotel, (req, res) => {
    let query = `SELECT * from item where h_username='${req.hotel.username}' AND id='${req.params.id}'`;
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        if (results.length==0) {
            res.send("No item found")
            return
        }
        let item=results[0];
        res.render('item_edit', {user: req.hotel, 'role':'hotel', 'item':item, hotel: true})
    });
})

router.post('/item/:id/edit', ensureHotel, function(req, res, next) {
    // console.log(req.file)
    let item = req.body;
    console.log(item)
    // console.log(item.password)
    // console.log(saltRounds)
    
    let query = `UPDATE item SET name = '${item.name}', details = "${item.details}", cost = '${item.cost}', category = "${item.category}", available = '${item.available}' where h_username='${req.hotel.username}' AND id='${req.params.id}';`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        res.redirect("/hotel")
    });
});


router.get('/order/:status', ensureHotel, (req, res) => {
    let query = `SELECT o.*, i.id as i_id, i.name as i_name, i.image as i_image, i.details as i_details, i.cost as i_cost, h.username as h_username, h.name as h_name, h.address as h_address, h.phone as h_phone, h.bio as h_bio, h.image as h_image, h.delivery as h_delivery,  h.delivery_cost as h_delivery_cost, c.username as c_username, c.name as c_name, c.address as c_address, c.phone as c_phone, c.bio as c_bio, c.image as c_image FROM order_t o, customer c, item i, hotel h WHERE c.username=o.c_username AND o.i_id = i.id AND i.h_username='${req.hotel.username}' AND h.username ='${req.hotel.username}' AND o.order_status='${req.params.status}' ORDER BY o.timestamp DESC;`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        console.log(results)
        let ObjResult = new Object();
        results.forEach(element => {
            if (!ObjResult[element.timestamp]){
                ObjResult[element.timestamp] = new Object()
                ObjResult[element.timestamp][element.c_username] = new Object()
                ObjResult[element.timestamp][element.c_username]['data'] = element;
                ObjResult[element.timestamp][element.c_username]['order_info'] = new Object()
                ObjResult[element.timestamp][element.c_username]['order_info'][element.delivery_chosen] = new Object()
                ObjResult[element.timestamp][element.c_username]['order_info'][element.delivery_chosen][element.d_username] = new Object(
                    {
                        delivery_provided: element.h_delivery ,
                        delivery_chosen: element.delivery_chosen,
                        orders: Array(element)
                    })
            }
            else{
                if (!ObjResult[element.timestamp][element.c_username]){
                    ObjResult[element.timestamp][element.c_username] = new Object()
                    ObjResult[element.timestamp][element.c_username]['data'] = element;
                    ObjResult[element.timestamp][element.c_username]['order_info'] = new Object()
                    ObjResult[element.timestamp][element.c_username]['order_info'][element.delivery_chosen] = new Object()
                    ObjResult[element.timestamp][element.c_username]['order_info'][element.delivery_chosen][element.d_username] = new Object(
                        {
                            delivery_provided: element.h_delivery ,
                            delivery_chosen: element.delivery_chosen,
                            orders: Array(element)
                        })
                }
                else{
                    if (!ObjResult[element.timestamp][element.c_username]['order_info'][element.delivery_chosen]){
                        ObjResult[element.timestamp][element.c_username]['order_info'][element.delivery_chosen] = new Object()
                        ObjResult[element.timestamp][element.c_username]['order_info'][element.delivery_chosen][element.d_username] = new Object(
                            {
                                delivery_provided: element.h_delivery ,
                                delivery_chosen: element.delivery_chosen,
                                orders: Array(element)
                            })
                    }
                    else{
                        if (!ObjResult[element.timestamp][element.c_username]['order_info'][element.delivery_chosen][element.d_username]){
                            // ObjResult[element.timestamp][element.c_username]['order_info'][element.delivery_chosen] = new Object()
                            ObjResult[element.timestamp][element.c_username]['order_info'][element.delivery_chosen][element.d_username] = new Object(
                                {
                                    delivery_provided: element.h_delivery ,
                                    delivery_chosen: element.delivery_chosen,
                                    orders: Array(element)
                                })
                        }
                        else{
                            ObjResult[element.timestamp][element.c_username]['order_info'][element.delivery_chosen][element.d_username]['orders'].push(element)
                        }
                    }
                }
            }
        });
        console.log(ObjResult)
        // res.send(ObjResult)
        res.render('hotel_order', {role:"hotel", objResult:ObjResult, customer:req.customer})
    });
})

router.post('/order/:id/status/completed', ensureHotel,  (req, res) => {
    let query = `UPDATE order_t SET payment_status='COMPLETED', order_status='COMPLETED' where id='${req.params.id}' AND '${req.hotel.username}' in (SELECT h_username FROM item where id=i_id) AND order_status='PENDING';`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        res.redirect(`/hotel/order/completed`)
    });
})

router.post('/order/:id/payment/completed', ensureHotel, (req, res) => {
    let query = `UPDATE order_t SET payment_status='COMPLETED' where id='${req.params.id}' AND '${req.hotel.username}' in (SELECT h_username FROM item where id=i_id) AND order_status='PENDING';`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        res.redirect(`/hotel/order/pending`)
    });
})

router.get('/logout', (req, res) => {
    res.clearCookie("token").redirect("/");
})



module.exports = router;
