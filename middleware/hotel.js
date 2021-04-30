const jwt = require('jsonwebtoken');

const db = require('../config/db');

module.exports = {
    ensureHotel: (req, res, next) => {
        console.log(req.cookies)
        const token = req.cookies.token;
        if (!token) return res.redirect("/delivery/login")
        try {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log(err);
                    res.redirect("/delivery/login")
                    return;
                }
                console.log(decoded) // bar
                let query = `SELECT * FROM hotel WHERE username='${decoded.username}' LIMIT 1`;
                db.query(query, function (error, results, fields) {
                    if (error) {
                        console.log(error);
                        res.redirect("/delivery/login")
                        return;
                    }
                    console.log(results)
                    if (results.length==0){
                        res.redirect("/delivery/login")
                        return;
                    }
                    if (decoded.role!=='hotel'){
                        res.redirect("/delivery/login")
                        return;
                    }
                    req.hotel = results[0];
                    next() 
                });
            })
        } catch(err) {
            res.redirect("/delivery/login")
        }
    }
}