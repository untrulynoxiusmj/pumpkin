const jwt = require('jsonwebtoken');

const db = require('../config/db');

module.exports = {
    ensureHotel: (req, res, next) => {
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
                let query = `SELECT * FROM hotel WHERE username='${decoded.username}' LIMIT 1`;
                db.query(query, function (error, results, fields) {
                    if (error) {
                        console.log(error);
                        res.send(error)
                        return;
                    }
                    req.hotel = results[0]
                    next() 
                });
            })
        } catch(err) {
            res.send(err)
        }
    }
}