const cache = require('memory-cache');
const logger = require('./logger');
const mailer = require('./mailer');
const hbsRenderer = require('./hbs-renderer');
const dataScrapper = require('./data-scraper');

async function update() {
    logger.info('Data update started');

    const data = await dataScrapper.scrape();
    if (data.error) {
        await mailer.notifyAdmin(data);
        logger.error(data.error);
        return;
    }

    try {
        await hbsRenderer.renderIndex(data);
    } catch (error) {
        await mailer.notifyAdmin({error: error.toString()});
        logger.error(error.toString());
        return;
    }

    cache.put('data', data);

    await mailer.notifyAdmin(data);
    logger.info('Data update successful');
}


module.exports.update = update;