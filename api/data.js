const express = require('express');
const router = express.Router();
const cache = require('memory-cache');

router.get(['/covid19', '/covid19/latest'], (req, res) => {
    const data = cache.get('data');
    if (data === null) {
        return res.status(404).json({message: 'Data currently unavailable'});
    }

    res.json(data);
});

// TODO: Add state/district filtering


module.exports = router;