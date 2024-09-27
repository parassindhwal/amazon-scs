const express = require('express');
const users = require('../controlllers/usersController');
const { validateLogin, validateRegistration} = require('../middleware/requestDataValidator')

const router = express.Router();

router.post('/register', validateRegistration, users.registerUser)
router.post('/login', validateLogin, users.logingUser)
router.post('/logout', users.logoutUser)

module.exports = router;