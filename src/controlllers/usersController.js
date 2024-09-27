const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require("../configs/mysql_db");
const { blacklist } = require('../middleware/verifyAuthToken')
const User = db.user;

const registerUser = async(req, res) => {
    try {
        const { username, email, password } = req.body;

        const hasedPassword = await bcrypt.hash(password, 8);
        const newUser = await User.create({
            username,
            email,
            password: hasedPassword
        })

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: newUser
        });
      
    } catch(error) {
        console.error(error);
        res.status(500).json({
        success: false,
        message: error.message
        });
    }
}

const logingUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email }});

        if(!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        const passwordMatch = await bcrypt.compare(password, user.password)
        if(!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect password'
            })
        }

        const token = jwt.sign(
            { id: user.id, email: user.email}, 
            process.env.JWT_SECRET, 
            { expiresIn: 86400}
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token
        })
    } catch(error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

const logoutUser = (req, res) => {
    try {
        blacklist.push(req.header["authorization"]?.split("JWT ")[1]);

        res.status(200).json({
            success: true,
            message: 'User logged out'
        })
    } catch(error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

module.exports = {
    registerUser,
    logingUser,
    logoutUser
}