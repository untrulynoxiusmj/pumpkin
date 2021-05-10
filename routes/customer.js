const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {ensureCustomer} = require('../middleware/customer')
const {ensureGuest} = require('../middleware/guest')

const db = require('../config/db');
const { commit } = require('../config/db');




const multer = require("multer");

var upload = multer({ dest: 'uploads/customer' })



const router = express.Router();

const saltRounds = 10;



router.get('/signup', ensureGuest, function(req, res, next) {
    res.render('signup', {ofRole:'customer'});
});

// router.get('/edit', ensureCustomer, function(req, res, next) {
//     res.render('edit', req.customer);
// });


router.post('/signup', ensureGuest, upload.single('image'), function(req, res, next) {
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
            let query = `INSERT INTO customer ( username, password, name, address, phone, image, bio ) VALUES ( '${customer.username}', '${hash}', '${customer.name}', '${customer.address}', '${customer.phone}', '${req.file.filename}', '${customer.bio}' )`;
            db.query(query, function (error, results, fields) {
                if (error) {
                    console.log(error);
                    res.send(error)
                    return;
                }
                res.redirect("/customer/login")
            });
        });
    } catch (error) {
        res.send(error)
        return;
    }
});

router.get('/login', ensureGuest, function(req, res, next) {
    res.render('login', {ofRole:'customer'});
});

router.post('/login', ensureGuest, function(req, res, next) {
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
                  }, process.env.JWT_SECRET, { expiresIn: '24h' });
                res.cookie('token', token).redirect("/customer")
            });
        });
    } catch (error) {
        res.send(error)
        return;
    }
});

router.get('/', ensureCustomer, function(req, res, next) {
    console.log(req.customer)
    res.render('index', {auth:true, user : req.customer, customer:true, role:'customer', ofRole:'customer'} );
  });

  router.get('/details/:c_username', (req, res) => {
    let query = `SELECT * from customer where username="${req.params.c_username}"`;
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        const token = req.cookies.token;
        if (!token) return res.render('index', {user: results[0], active: 'hotel', ofRole:"customer"})
        try {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log(err);
                    res.render('index', {user: results[0], active: 'hotel', ofRole:"customer"})
                    return;
                }
                console.log(decoded.role)
                return res.render('index', {user: results[0], role:decoded.role, active: 'hotel', role:decoded.role, ofRole:"customer"})
            })
        } catch(err) {
            res.redirect("/home")
        }
    })
})

router.get('/cart', ensureCustomer, (req, res) => {
    // let query = `SELECT * from cart where c_username='${req.customer.username}'`;
    let query = `SELECT c.*, i.id as i_id, i.name as i_name, i.image as i_image, i.details as i_details, i.cost as i_cost, i.available, i.category,  h.username as h_username, h.name as h_name, h.address as h_address, h.phone as h_phone, h.bio as h_bio, h.image as h_image, h.delivery as h_delivery, h.delivery_cost as h_delivery_cost, open,  cd.delivery_chosen FROM cart c, item i, hotel h, cart_deliver cd WHERE c.c_username = '${req.customer.username}' AND c.i_id = i.id AND i.h_username=h.username AND cd.c_username=c.c_username AND cd.h_username=h.username ORDER BY h.username;`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        console.log(results)
        let total_cost=0;
        let delivery_cost=0;
        let ObjResultKeyHotel = new Object();
        results.forEach(element => {
            element['total_i_cost']=element['i_cost']*element['i_quantity']
            if (element.available && element.open) total_cost += element['total_i_cost'];
            if (!ObjResultKeyHotel[element.h_username]){
                if (element.available && element.h_delivery && element.delivery_chosen && element.open) delivery_cost+=element.h_delivery_cost;
                ObjResultKeyHotel[element.h_username] = new Object({
                    data: {
                        h_username: element.h_username,
                        h_name: element.h_name,
                        h_address: element.h_address,
                        h_phone: element.h_phone,
                        h_image: element.h_image,
                        h_delivery: element.h_delivery,
                        open: element.open,
                        h_delivery_cost : element.h_delivery_cost
                    },
                    total_h_cost : element.total_i_cost*element.available*element.open,
                    h_delivery_cost : element.h_delivery_cost*element.h_delivery*element.delivery_chosen*element.available*element.open,
                    delivery_provided: element.h_delivery ,
                    delivery_chosen: element.delivery_chosen,
                    orders: Array(element)
                });
            }
            else{
                ObjResultKeyHotel[element.h_username]['total_h_cost'] += element.total_i_cost*element.available*element.open
                if (ObjResultKeyHotel[element.h_username]['h_delivery_cost']==0) delivery_cost+=element.h_delivery_cost*element.h_delivery*element.delivery_chosen*element.available*element.open;
                ObjResultKeyHotel[element.h_username]['h_delivery_cost'] = element.h_delivery_cost*element.h_delivery*element.delivery_chosen*element.available*element.open;
                ObjResultKeyHotel[element.h_username]['orders'].push(element);
            }
        });
        console.log(ObjResultKeyHotel)
        // res.send(ObjResultKeyHotel)
        res.render('cart', {role: "customer", hotelOrders:ObjResultKeyHotel, delivery_cost:delivery_cost, total_cost:total_cost, total_order_cost: delivery_cost+total_cost, customer:req.customer})
    });
})

router.post("/cart/deliver", ensureCustomer, (req, res) => {
    if (!Object.keys(req.body)[0]) return res.redirect("/customer/cart");
    let query = `UPDATE cart_deliver SET delivery_chosen = (${Object.values(req.body)[0]} AND (SELECT delivery from hotel where username=h_username) ) WHERE c_username='${req.customer.username}' AND h_username='${Object.keys(req.body)[0]}';`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        console.log(results)
        res.redirect("/customer/cart")
    });
})



router.get('/order/:status', ensureCustomer, (req, res) => {
    // let query = `SELECT * from cart where c_username='${req.customer.username}'`;
    let query = `select oicht.*, h.username as h_username,  h.name as h_name,  h.address as h_address,  h.phone as h_phone,  h.bio as h_bio,  h.image as h_image,  h.delivery as h_delivery from order_icht oicht, hotel h where oicht.c_username="${req.customer.username}" and order_status="${req.params.status}" and oicht.h_username=h.username ORDER BY oicht.timestamp DESC;`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        console.log(results)
        console.log(results.length)
        if (results.length===0){
            return res.render('customer_order', { role: "customer", customer:req.customer})
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
                    return res.render('customer_order', { role: "customer", objResult:results, customer:req.customer})
                }

            })
        }
        console.log(results)
        
        // console.log(ObjResult)
        // res.send(ObjResult)
        // res.render('customer_order', { role: "customer", objResult:ObjResult, customer:req.customer})
    });
})



// router.get('/order/:status', ensureCustomer, (req, res) => {
//     // let query = `SELECT * from cart where c_username='${req.customer.username}'`;
//     let query = `SELECT o.*, i.id as i_id, i.name as i_name, i.image as i_image, i.details as i_details, i.cost as i_cost, i.available as i_available, i.category as i_category, h.username as h_username, h.name as h_name, h.address as h_address, h.phone as h_phone, h.bio as h_bio, h.image as h_image, h.delivery as h_delivery, h.open as h_open, h.delivery_cost as h_delivery_cost FROM order_t o, item i, hotel h WHERE o.i_id = i.id AND i.h_username=h.username AND o.c_username='${req.customer.username}' AND order_status='${req.params.status}' ORDER BY o.timestamp DESC;`
//     db.query(query, function (error, results, fields) {
//         if (error) {
//             console.log(error);
//             res.send(error)
//             return;
//         }
//         console.log(results)
//         let ObjResult = new Object();
//         results.forEach(element => {
//             if (!ObjResult[element.timestamp]){
//                 ObjResult[element.timestamp] = new Object()
//                 ObjResult[element.timestamp][element.h_username] = new Object()
//                 ObjResult[element.timestamp][element.h_username]['data'] = element;
//                 ObjResult[element.timestamp][element.h_username]['order_info'] = new Object()
//                 ObjResult[element.timestamp][element.h_username]['order_info'][element.delivery_chosen] = new Object()
//                 ObjResult[element.timestamp][element.h_username]['order_info'][element.delivery_chosen][element.d_username] = new Object(
//                     {
//                         delivery_provided: element.h_delivery ,
//                         delivery_chosen: element.delivery_chosen,
//                         orders: Array(element)
//                     })
//             }
//             else{
//                 if (!ObjResult[element.timestamp][element.h_username]){
//                     ObjResult[element.timestamp][element.h_username] = new Object()
//                     ObjResult[element.timestamp][element.h_username]['data'] = element;
//                     ObjResult[element.timestamp][element.h_username]['order_info'] = new Object()
//                     ObjResult[element.timestamp][element.h_username]['order_info'][element.delivery_chosen] = new Object()
//                     ObjResult[element.timestamp][element.h_username]['order_info'][element.delivery_chosen][element.d_username] = new Object(
//                         {
//                             delivery_provided: element.h_delivery ,
//                             delivery_chosen: element.delivery_chosen,
//                             orders: Array(element)
//                         })
//                 }
//                 else{
//                     if (!ObjResult[element.timestamp][element.h_username]['order_info'][element.delivery_chosen]){
//                         ObjResult[element.timestamp][element.h_username]['order_info'][element.delivery_chosen] = new Object()
//                         ObjResult[element.timestamp][element.h_username]['order_info'][element.delivery_chosen][element.d_username] = new Object(
//                             {
//                                 delivery_provided: element.h_delivery ,
//                                 delivery_chosen: element.delivery_chosen,
//                                 orders: Array(element)
//                             })
//                     }
//                     else{
//                         if (!ObjResult[element.timestamp][element.h_username]['order_info'][element.delivery_chosen][element.d_username]){
//                             // ObjResult[element.timestamp][element.h_username]['order_info'][element.delivery_chosen] = new Object()
//                             ObjResult[element.timestamp][element.h_username]['order_info'][element.delivery_chosen][element.d_username] = new Object(
//                                 {
//                                     delivery_provided: element.h_delivery ,
//                                     delivery_chosen: element.delivery_chosen,
//                                     orders: Array(element)
//                                 })
//                         }
//                         else{
//                             ObjResult[element.timestamp][element.h_username]['order_info'][element.delivery_chosen][element.d_username]['orders'].push(element)
//                         }
//                     }
//                 }
//             }
//         });
//         console.log(ObjResult)
//         // res.send(ObjResult)
//         res.render('customer_order', { role: "customer", objResult:ObjResult, customer:req.customer})
//     });
// })


// {
//     time: {
//         h: {
//             d: 
//             o: 
//         },
//         {

//         }
//     }
// }

router.post('/order/:id/cancel', ensureCustomer, (req, res) => {
    let query = `UPDATE order_icht SET payment_status='CANCELLED', order_status='CANCELLED' where id='${req.params.id}' AND c_username='${req.customer.username}' AND order_status='PENDING';`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        res.redirect(`/customer/order/cancelled`)
    });
})

router.post('/order', ensureCustomer, (req, res) => {
    console.log(req.body)
    
    let deleteQuery = `DELETE from cart where c_username = '${req.customer.username}';`
    let query = `INSERT INTO order_icht (c_username, h_username, delivery_chosen, delivery_cost, address) select distinct ca.c_username, i.h_username , (cd.delivery_chosen AND h.delivery) as delivery_chosen , h.delivery_cost, "${req.body.address}" from cart ca, item i, cart_deliver cd, hotel h where ca.c_username="${req.customer.username}" and ca.i_id=i.id AND cd.c_username=ca.c_username AND i.h_username=cd.h_username AND i.h_username=h.username AND i.available=1 AND h.open=1  order by i.h_username;`
    let Anotherquery = `INSERT INTO order_ioi (o_id, i_id, i_quantity, cost) select o.id as oid, ca.i_id, ca.i_quantity, (ca.i_quantity*i.cost) as cost from order_icht o, cart ca, item i where ca.c_username='${req.customer.username}' AND ca.c_username=o.c_username AND (not o.moved) AND ca.i_id=i.id AND i.available=1 AND ca.i_id in (select id from item where h_username=o.h_username) order by oid;`
    let updateQuery = `UPDATE order_icht SET moved=1 where c_username = '${req.customer.username}'`
    db.query(query, function (error, results, fields) {

        console.log(results)
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }

        db.query(Anotherquery, (error, results, fields) => {
            if (error) {
                console.log(error);
                res.send(error)
                return;
            }
            console.log(results)
            db.query(updateQuery, (error, results, fields) => {
                if (error) {
                    console.log(error);
                    res.send(error)
                    return;
                }
                console.log(results)
                db.query(deleteQuery, (error, deleteResult, fields) => {
                    if (error) {
                        console.log(error);
                        res.send(error)
                        return;
                    }
                    // console.log(results)
                    console.log(deleteResult)
                    res.redirect("/customer/order/pending")
                })
            })
        })
        
    });
})

router.post('/cart/:id', ensureCustomer, (req, res) => {
    if (req.params.id){
        let query = `INSERT INTO cart ( c_username, i_id ) VALUES ( '${req.customer.username}', (SELECT id from item where id='${req.params.id}' AND available=1 AND (SELECT open from hotel where username=h_username) ) )`;
        let Anotherquery = `INSERT INTO cart_deliver ( c_username, h_username ) VALUES ( '${req.customer.username}', (SELECT h_username from item where id='${req.params.id}') )`;
        db.query(query, function (error, results, fields) {
            if (error) {
                console.log(error);
                res.redirect("/cart")
                return;
            }
            db.query(Anotherquery, function (error, results, fields) {
                if (error) {
                    console.log(error);
                    res.redirect("/customer/cart")
                    return;
                }
                res.redirect("/customer/cart")
            });
            // res.send(results)
        });
    }
    else{
        res.send("Invalid item id")
    }
})

router.post('/cart/:id/quantity', ensureCustomer, (req, res) => {
    // res.send(req.body)
    if (req.params.id){
        let query = `UPDATE cart SET i_quantity='${req.body.quantity}' where c_username='${req.customer.username}' AND i_id='${req.params.id}'`;
        // let Anotherquery = `INSERT INTO cart_deliver ( c_username, h_username ) VALUES ( '${req.customer.username}', (SELECT h_username from item where id='${req.params.id}') )`;
        db.query(query, function (error, results, fields) {
            if (error) {
                console.log(error);
                res.send(error)
                return;
            }
            res.redirect("/customer/cart")
        });
    }
    else{
        res.send("Invalid item id")
    }
})

router.post('/cart/:id/remove', ensureCustomer, (req, res) => {
    // res.send(req.body)
    if (req.params.id){
        let query = `DELETE from cart where c_username='${req.customer.username}' AND i_id='${req.params.id}'`;
        // let Anotherquery = `INSERT INTO cart_deliver ( c_username, h_username ) VALUES ( '${req.customer.username}', (SELECT h_username from item where id='${req.params.id}') )`;
        db.query(query, function (error, results, fields) {
            if (error) {
                console.log(error);
                res.send(error)
                return;
            }
            res.redirect("/customer/cart")
        });
    }
    else{
        res.send("Invalid item id")
    }
})


router.get('/logout', (req, res) => {
    res.clearCookie("token").redirect("/");
})



module.exports = router;
