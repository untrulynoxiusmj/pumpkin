const jwt = require('jsonwebtoken');

const db = require('../config/db');

module.exports = {
    ensureGuest: (req, res, next) => {
        console.log(req.cookies)
        const token = req.cookies.token;
        if (!token) return next()
        try {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log(err);
                    return next()
                }
                return res.redirect(`/${decoded.role}`)
            })
        } catch(err) {
            return next()
        }
    }
}