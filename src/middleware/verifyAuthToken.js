const jwt = require('jsonwebtoken');
const db = require("../configs/mysql_db");
const User = db.user;

const blacklist = [];

const verifyToken = async (req, res, next) => {
    const token = req.headers["authorization"]?.split("JWT ")[1];

    if(blacklist.includes(token)) {
        return res.status(401).json({
            success: false,
            message: 'Token is blacklisted'
        });
    }

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async(err, decoded) => {
            if (err) {
                const message = "Header verification failed"
                return res.status(403).send({ message });
            }
            try {
                const user = await User.findOne({where : {
                    id: decoded.id
                }})
                req.user = user;
                req.message = "Found the user succcessfully, user has valid login token";
                next();
            } catch (err) {
                return res.status(500).send({ message: err.message });
            }
        })
    } else {
        const message = "Authorization header not found";
        return res.status(401).send({message })
    }
}

module.exports = {
    verifyToken,
    blacklist
}