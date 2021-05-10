const jwt = require('jsonwebtoken');

const db = require('../config/db');

module.exports = {
    ensureDelivery: (req, res, next) => {
        console.log(req.cookies)
        const token = req.cookies.token;
        if (!token) return res.redirect("/delivery/login")
        try {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                console.log(process.env.JWT_SECRET)
                if (err) {
                    console.log(err);
                    res.redirect("/delivery/login")
                    return;
                }
                console.log(decoded) // bar
                let query = `SELECT * FROM delivery WHERE username='${decoded.username}' LIMIT 1`;
                db.query(query, function (error, results, fields) {
                    if (error) {
                        console.log(error);
                        res.redirect("/delivery/login")
                        return;
                    }
                    if (results.length==0){
                        res.redirect("/delivery/login")
                        return;
                    }
                    if (decoded.role!=='delivery'){
                        res.redirect("/delivery/login")
                        return;
                    }
                    req.delivery = results[0];
                    next() 
                });
            })
        } catch(err) {
            res.redirect("/delivery/login")
        }
    }
}