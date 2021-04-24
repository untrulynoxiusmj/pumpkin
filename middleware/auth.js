const jwt = require('jsonwebtoken');

const db = require('../config/db');

module.exports = {
    ensureAuth: (req, res, next) => {
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
                req.username = decoded.username
                next()
            })
        } catch(err) {
            res.send(err)
        }
    }
}