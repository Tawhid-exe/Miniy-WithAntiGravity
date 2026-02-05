const Joi = require('joi');
const logger = require('../config/logger');

// Schemas
const registerSchema = Joi.object({
    name: Joi.string().min(4).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
    // .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')) // Simplify for now, strict later if needed
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// Middleware
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        logger.warn(`Validation Error: ${errorMessage} | IP: ${req.ip}`);
        return res.status(400).json({ success: false, message: errorMessage });
    }
    next();
};

module.exports = {
    validate,
    registerSchema,
    loginSchema
};
