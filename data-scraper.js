const fs = require('fs').promises;
const path = require('path');
const cache = require('memory-cache');
const puppeteer = require('puppeteer');
const Handlebars = require('handlebars');
const mailer = require('./utilities/mailer');
const logger = require('./utilities/logger');


const dataSource = 'https://newslab.malaysiakini.com/covid-19/en';
const htmlSelector = 'ul.uk-accordion-districts';


async function scrape() {
    try {
        logger.info('Data scrapping started');
        const browser = await puppeteer.launch({args: ['--no-sandbox']});
        const page = await browser.newPage();
        await page.goto(dataSource);
        await page.waitForSelector(htmlSelector);
        const data = await page.evaluate(extractDataFromDOM, htmlSelector);
        await browser.close();

        if (data.error) {
            logger.error(`Error scraping data: ${data.error}`);
            notifyAdmin(data);
            return;
        }

        // compile index.html and cache data if no errors
        await compileIndex(data);
        cache.put('data', data);

        logger.info('Data scrapping successful');
        notifyAdmin(data);

    } catch (e) {
        logger.error(e.toString());
        notifyAdmin({error: e.toString()});
    }
}


function extractDataFromDOM(selector) {
    const data = {};

    const target = document.querySelector(selector);
    if (!target) {
        data.error = `Query selector ${selector} not found`;
        return data;
    }

    const listItems = target.querySelectorAll('li');
    if (listItems.length === 0) {
        data.error = `List item element not found in ${selector}`;
        return data;
    }

    data.states = [];
    for (let i = 0; i < listItems.length; i++) {
        // Title string format: Kuala Lumpur (10)
        const title = listItems[i].querySelector('a').innerText.match(/(.*)\s*\((\d+)\)/);
        if (title && title.length === 3) {
            data.states[i] = {
                name: title[1].trim(),
                total: parseInt(title[2]) || 0,
                districts: []
            };

            const tableRows = listItems[i].querySelectorAll('tbody tr');
            for (let j = 0; j < tableRows.length; j++) {
                const tableColumns = tableRows[j].querySelectorAll('td');
                if (tableColumns && tableColumns.length > 2) {
                    data.states[i].districts[j] = {
                        name: tableColumns[0].innerText.trim(),
                        total: parseInt(tableColumns[1].innerText) || 0
                    };
                }
            }
        }
    }

    if (data.states.length === 0) {
        data.error = 'No data scrapped from the list elements';
        return data;
    }

    // setting last updated timestamp in seconds (defaults back to now)
    const time = target.parentElement.querySelector('p');
    data.last_updated = Math.trunc((Date.parse(time && time.innerText) || Date.now()) / 1000);

    return data;
}


// outputs static html to index.html with data
async function compileIndex(data) {
    try {
        const content = await fs.readFile(path.join(__dirname, 'templates/index.html'), 'utf8');
        const template = await Handlebars.compile(content);
        const html = template(data);
        await fs.writeFile(path.join(__dirname, 'public/index.html'), html, 'utf8');
    } catch (e) {
        throw `Error compiling index.html: ${e.toString()}`;
    }
}


function notifyAdmin(message) {
    if (process.env.ADMIN_NOTIFICATION_ENABLED !== 'true') return;

    const mail = {
        from: process.env.SMTP_EMAIL_ADDRESS,
        to: process.env.ADMIN_EMAIL,
        subject: `[${(message.error) ? 'ERROR' : 'SUCCESS'}] COVID-19 Zones Data Scraping`,
        html: `<p>TIMESTAMP: ${new Date().toLocaleString()}</p>
        <pre>${JSON.stringify(message, null, 4)}</pre>`
    };

    mailer.sendMail(mail, (err) => {
        if (err) logger.error(`Error sending email to admin: ${err}`);
    });
}

module.exports = scrape;
