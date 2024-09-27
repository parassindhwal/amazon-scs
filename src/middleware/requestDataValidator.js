const Joi = require('joi');

const userAuthSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9@#\$%\^&\*]{3,30}$')).required(),
    username: Joi.string().min(3).max(255).required(),
})

const userLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9@#\$%\^&\*]{3,30}$')).required(),
})

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(
            req.body,
            { abortEarly: false }, // return all errors
        )
    
        if(error) {
            return res.status(400).json({
                message: 'Invalid Details',
                error: error.details.map(err => err.message)
            })
        }
    
        //if no error, then continue the registration
        next();
    }
}

module.exports = {
    validateRegistration: validate(userAuthSchema),
    validateLogin: validate(userLoginSchema)
}