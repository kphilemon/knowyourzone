require('dotenv').config();
const path = require('path');
const cron = require('node-cron');
const helmet = require("helmet");
const morgan = require('morgan');
const express = require('express');
const rateLimit = require("express-rate-limit");
const scrape = require('./data-scraper');
const logger = require('./utilities/logger');


const app = express();
const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.API_RATELIMIT_WINDOW),
    max: parseInt(process.env.API_RATELIMIT_MAX_REQUEST),
    message: 'Too many requests'
});

const httpLogger = morgan('common', {
    // skip logging status code < 400 in production
    skip: (req, res) => process.env.NODE_ENV === 'prod' && res.statusCode < 400,
    stream: {write: message => logger.info(`${message}`.trim())}
});


// mount middlewares
app.use(httpLogger);
app.use(helmet());
app.use(express.static(publicDir));
app.use('/api/', apiLimiter);
app.use('/api/data', require('./api/data'));
app.use('/api/admin', require('./api/admin'));
app.use('/api/*', (req, res) => res.status(404).json({message: 'Not found'}));
app.use((req, res) => res.status(404).sendFile(path.join(publicDir, '404.html')));


// schedule a cron job to scrape data at specified schedule
cron.schedule(process.env.DATA_SCRAPE_CRON_SCHEDULE, scrape, {
    scheduled: true,
    timezone: 'Asia/Kuala_Lumpur'
});


// scrape data before starting server to ensure data availability
scrape();
app.listen(port, () => logger.info(`Server is listening on port ${port}`));