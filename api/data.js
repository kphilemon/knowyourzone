const express = require('express');
const cache = require('memory-cache');
const router = express.Router();

router.get(['/', '/latest'], (req, res) => {
    const data = cache.get('data');
    if (data === null) {
        return res.status(404).json({message: 'Data currently unavailable'});
    }

    res.json(data);
});

// TODO: Add state/district filtering

module.exports = router;
