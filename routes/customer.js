const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {ensureCustomer} = require('../middleware/customer')

const db = require('../config/db');
const { commit } = require('../config/db');




const multer = require("multer");

var upload = multer({ dest: 'uploads/' })



const router = express.Router();

const saltRounds = 10;


// var storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, 'storage')
//     },
//     filename: function (req, file, cb) {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//       cb(null, file.fieldname + '-' + uniqueSuffix)
//     }
//   })
  
//   var upload = multer({ storage: storage })








router.get('/signup', function(req, res, next) {
    res.render('signup', {role:'customer'});
});

router.get('/edit', ensureCustomer, function(req, res, next) {
    res.render('edit', req.customer);
});


router.post('/signup', upload.single('image'), function(req, res, next) {
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

router.get('/', ensureCustomer, function(req, res, next) {
    console.log(req.customer)
    res.render('index', req.customer );
  });

router.get('/cart', ensureCustomer, (req, res) => {
    // let query = `SELECT * from cart where c_username='${req.customer.username}'`;
    let query = `SELECT c.*, i.id as i_id, i.name as i_name, i.image as i_image, i.details as i_details, i.cost as i_cost, h.username as h_username, h.name as h_name, h.address as h_address, h.phone as h_phone, h.bio as h_bio, h.image as h_image, h.delivery as h_delivery, cd.delivery_chosen FROM cart c, item i, hotel h, cart_deliver cd WHERE c.c_username = '${req.customer.username}' AND c.i_id = i.id AND i.h_username=h.username AND cd.c_username=c.c_username AND cd.h_username=h.username ORDER BY h.username;`
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
                    delivery_provided: element.h_delivery ,
                    delivery_chosen: element.delivery_chosen,
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
        res.send(results)
    });
})

router.get('/order/:status', ensureCustomer, (req, res) => {
    // let query = `SELECT * from cart where c_username='${req.customer.username}'`;
    let query = `SELECT o.*, i.id as i_id, i.name as i_name, i.image as i_image, i.details as i_details, i.cost as i_cost, h.username as h_username, h.name as h_name, h.address as h_address, h.phone as h_phone, h.bio as h_bio, h.image as h_image, h.delivery as h_delivery FROM order_t o, item i, hotel h WHERE o.i_id = i.id AND i.h_username=h.username AND o.c_username='${req.customer.username}' AND order_status='${req.params.status}' ORDER BY o.timestamp DESC;`
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
                ObjResult[element.timestamp][element.h_username] = new Object()
                ObjResult[element.timestamp][element.h_username][element.d_username] = new Object(
                    {
                        delivery_provided: element.h_delivery ,
                        delivery_chosen: element.delivery_chosen,
                        orders: Array(element)
                    })
            }
            else{
                if (!ObjResult[element.timestamp][element.h_username]){
                    ObjResult[element.timestamp][element.h_username] = new Object()
                    ObjResult[element.timestamp][element.h_username][element.d_username] = new Object(
                        {
                            delivery_provided: element.h_delivery ,
                            delivery_chosen: element.delivery_chosen,
                            orders: Array(element)
                        })
                }
                else{
                    if (!ObjResult[element.timestamp][element.h_username][element.d_username]){
                        ObjResult[element.timestamp][element.h_username][element.d_username] = new Object(
                            {
                                delivery_provided: element.h_delivery ,
                                delivery_chosen: element.delivery_chosen,
                                orders: Array(element)
                            })
                    }
                    else{
                        ObjResult[element.timestamp][element.h_username][element.d_username]['orders'].push(element)
                    }
                }
            }
        });
        console.log(ObjResult)
        // res.send(ObjResult)
        res.render('customer_order', {objResult:ObjResult, customer:req.customer})
    });
})


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
    let query = `UPDATE order_t SET payment_status='CANCELLED', order_status='CANCELLED' where id='${req.params.id}' AND c_username='${req.customer.username}' AND order_status='PENDING';`
    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }
        res.redirect(`/customer/order`)
    });
})

router.post('/order', ensureCustomer, (req, res) => {
    console.log(req.body)
    // INSERT INTO dues_storage
    // SELECT d.*, CURRENT_DATE()
    // FROM dues d
    // WHERE id = 5;
    mapUndefTo0  = {
        undefined: 0,
        0: 0,
        1: 1
    }
    // let query = `INSERT INTO order_t ( c_username, i_id, i_quantity, cost, delivery_chosen, address ) SELECT c.*, (SELECT cost from item where id=c.i_id)*c.i_quantity as cost, '${mapUndefTo0[req.body['select h_username from item where id=c.i_id']]}', '${req.body.address}' as address FROM cart c WHERE c.c_username = '${req.customer.username}';`
    
    let selectQuery = `SELECT * from cart where c_username = '${req.customer.username}'`;
    let deleteQuery = `DELETE from cart where c_username = '${req.customer.username}';`


    let query = `INSERT INTO order_t ( c_username, i_id, i_quantity, cost, delivery_chosen, address ) SELECT c.* , (SELECT cost from item where id=c.i_id)*c.i_quantity as cost, (SELECT delivery_chosen from cart_deliver where h_username in (SELECT h_username from item where id=c.i_id) AND c_username='${req.customer.username}'), '${req.body.address}' FROM cart c WHERE c.c_username = '${req.customer.username}';`

    db.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send(error)
            return;
        }

        // results.forEach(result => {
        //     let insertQuery = `INSERT INTO order_t ( c_username, i_id, i_quantity, cost, d (SELECT cost from item where id=c.i_id)*c.i_quantity as cost, '${req.body.address}' as address FROM cart c WHERE c.c_username = '${req.customer.username}';`
        // })

        
        res.send(results)
        // db.query(deleteQuery, (error, deleteResult, fields) => {
        //     if (error) {
        //         console.log(error);
        //         res.send(error)
        //         return;
        //     }
        //     console.log(results)
        //     console.log(deleteResult)
        //     res.send(results)
        // })
    });
})

router.post('/cart/:id', ensureCustomer, (req, res) => {
    if (req.params.id){
        let query = `INSERT INTO cart ( c_username, i_id ) VALUES ( '${req.customer.username}', (SELECT id from item where id='${req.params.id}') )`;
        let Anotherquery = `INSERT INTO cart_deliver ( c_username, h_username ) VALUES ( '${req.customer.username}', (SELECT h_username from item where id='${req.params.id}') )`;
        db.query(query, function (error, results, fields) {
            if (error) {
                console.log(error);
                res.send(error)
                return;
            }
            db.query(Anotherquery, function (error, results, fields) {
                if (error) {
                    console.log(error);
                    res.send(error)
                    return;
                }
                res.send(results)
            });
            // res.send(results)
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
