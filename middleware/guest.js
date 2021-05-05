const jwt = require('jsonwebtoken');

const db = require('../config/db');

module.exports = {
    ensureGuest: (req, res, next) => {
        console.log(req.cookies)
        const token = req.cookies.token;
        if (!token) next()
        try {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log(err);
                    next()
                    return
                }
                return res.redirect(`/${decoded.role}`)
            })
        } catch(err) {
            next()
        }
    }
}