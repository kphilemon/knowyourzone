const puppeteer = require('puppeteer');

// scrape data from malaysiakini.com
async function scrape() {
    const dataSource = 'https://newslab.malaysiakini.com/covid-19/en';
    const htmlSelector = 'ul.uk-accordion-districts';

    try {
        const browser = await puppeteer.launch({args: ['--no-sandbox']});
        const page = await browser.newPage();
        await page.goto(dataSource);
        await page.waitForSelector(htmlSelector);
        const data = await page.evaluate(DOMScript, htmlSelector);
        await browser.close();
        data.last_updated = Math.trunc(Date.now() / 1000);
        return data;

    } catch (error) {
        // assign puppeteer error message to the 'error' property
        return {error: `Error scraping data: ${error.message}`};
    }
}

/* istanbul ignore next */
function DOMScript(selector) {
    const data = {};

    const target = document.querySelector(selector);
    if (!target) {
        data.error = `Error scraping data: Query selector ${selector} not found`;
        return data;
    }

    const listItems = target.querySelectorAll('li');
    if (listItems.length === 0) {
        data.error = `Error scraping data: List item element not found in ${selector}`;
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
        data.error = 'Error scraping data: No data scraped from the list elements';
        return data;
    }

    return data;
}


module.exports.scrape = scrape;