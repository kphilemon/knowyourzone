const express = require('express');
const router = express.Router();
const Joi = require('joi');
const cache = require('memory-cache');
const logger = require('../utilities/logger');
const hbsRenderer = require('../utilities/hbs-renderer');

router.use(express.json());
router.use((req, res, next) => {
    if (req.headers.authorization !== process.env.ADMIN_AUTH_TOKEN) {
        logger.warn(`Someone's trying to be funny: ${req.headers.authorization}, ip: ${req.connection.remoteAddress}`)
        return res.status(401).send({message: 'Unauthorized action'});
    }
    next();
});

/* istanbul ignore next */
router.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        // to handle syntax error. eg: invalid json req body
        return res.status(400).json({message: 'Invalid request body'});
    }
    next();
});

router.put('/covid19', async (req, res) => {
    const error = validateSchema(req.body);
    if (error) {
        return res.status(400).json({message: error.message});
    }

    const newData = {
        states: req.body.states,
        last_updated: Math.trunc(Date.now() / 1000)
    };

    try {
        await hbsRenderer.renderIndex(newData);
    } catch (error) {
        logger.error(error.toString());
        return res.status(500).json({message: error.toString()});
    }

    cache.put('data', newData);
    res.json(newData);
});

function validateSchema(reqBody) {
    const districtObjSchema = Joi.object({
        name: Joi.string().required(),
        total: Joi.number().integer().min(0).required()
    });

    const stateObjSchema = Joi.object({
        name: Joi.string().required(),
        total: Joi.number().integer().min(0).required(),
        districts: Joi.array().items(districtObjSchema).min(1).required()
    });

    const reqBodySchema = Joi.object({
        states: Joi.array().items(stateObjSchema).min(1).required()
    }).required();

    return reqBodySchema.validate(reqBody, {abortEarly: false}).error;
}


module.exports = router;