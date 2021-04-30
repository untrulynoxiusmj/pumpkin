const jwt = require('jsonwebtoken');

const db = require('../config/db');

module.exports = {
    ensureCustomer: (req, res, next) => {
        console.log(req.cookies)
        const token = req.cookies.token;
        if (!token) return res.redirect("/customer/login")
        try {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log(err);
                    res.redirect("/customer/login")
                    return;
                }
                console.log(decoded) // bar
                let query = `SELECT * FROM customer WHERE username='${decoded.username}' LIMIT 1`;
                db.query(query, function (error, results, fields) {
                    if (error) {
                        console.log(error);
                        res.redirect("/customer/login")
                        return;
                    }
                    if (results.length==0){
                        res.redirect("/customer/login")
                        return;
                    }
                    if (decoded.role!=='customer'){
                        res.redirect("/customer/login")
                        return;
                    }
                    req.customer = results[0];
                    next() 
                });
            })
        } catch(err) {
            res.redirect("/customer/login")
        }
    }
}