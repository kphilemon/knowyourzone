const express = require('express');
const cache = require('memory-cache');
const Joi = require('@hapi/joi');
const router = express.Router();
const logger = require('../utilities/logger');
const HTMLRenderer = require('../utilities/html-renderer');


router.use((req, res, next) => {
    if (req.headers.authorization !== process.env.ADMIN_AUTH_TOKEN) {
        logger.warn(`Someone's trying to be funny: ${req.headers.authorization}, ip: ${req.connection.remoteAddress}`)
        return res.status(401).send({message: 'Unauthorized action'});
    }
    next();
});

// mount json body parser middleware and error handler
router.use(express.json(), (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({message: 'Invalid request body'});
    }
    next();
});

router.put('/', async (req, res) => {
    const districtObjSchema = Joi.object({
        name: Joi.string().required(),
        total: Joi.number().integer().min(0).required(),
    });

    const stateObjSchema = Joi.object({
        name: Joi.string().required(),
        total: Joi.number().integer().min(0).required(),
        districts: Joi.array().items(districtObjSchema).min(1).required()
    });

    const reqBodySchema = Joi.object({
        states: Joi.array().items(stateObjSchema).min(1).required()
    }).required();

    const {error} = reqBodySchema.validate(req.body, {abortEarly: false});
    if (error) {
        return res.status(400).json({message: error.message});
    }

    const newData = {
        states: req.body.states,
        last_updated: Math.trunc(Date.now() / 1000)
    };

    try {
        await HTMLRenderer.renderIndex(newData);
    } catch (e) {
        logger.error(e.toString());
        return res.status(500).json({message: e.toString()});
    }

    cache.put('data', newData);
    res.json(newData);
});

module.exports = router;
