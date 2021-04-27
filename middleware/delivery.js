const jwt = require('jsonwebtoken');

const db = require('../config/db');

module.exports = {
    ensureDelivery: (req, res, next) => {
        console.log(req.cookies)
        const token = req.cookies.token;
        if (!token) return res.send("Denied")
        try {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log(err);
                    res.send(err)
                    return;
                }
                console.log(decoded) // bar
                let query = `SELECT * FROM delivery WHERE username='${decoded.username}' LIMIT 1`;
                db.query(query, function (error, results, fields) {
                    if (error) {
                        console.log(error);
                        res.send(error)
                        return;
                    }
                    if (results.length==0){
                        res.send("you are not registered as delivery")
                        return;
                    }
                    if (decoded.role!=='delivery'){
                        res.send("You are not a delivery")
                        return;
                    }
                    req.delivery = results[0];
                    next() 
                });
            })
        } catch(err) {
            res.send(err)
        }
    }
}