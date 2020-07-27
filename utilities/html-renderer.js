const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');
const minify = require('html-minifier').minify;


Handlebars.registerHelper('color', getColor);
Handlebars.registerHelper('extract_data_by_state_id', extractDataByStateId);


const publicDir = path.join(__dirname, '../public');
const templatesDir = path.join(__dirname, '../templates');
const statesNameMapping = {
    SBH: ['sabah'],
    SRW: ['sarawak'],
    LBN: ['labuan'],
    PRK: ['perak'],
    PNG: ['p pinang', 'pulau pinang', 'penang'],
    KDH: ['kedah'],
    PLS: ['perlis'],
    JHR: ['johor'],
    KTN: ['kelantan'],
    MLK: ['melaka'],
    NSN: ['n sembilan', 'negeri sembilan'],
    PHG: ['pahang'],
    SGR: ['selangor'],
    TRG: ['terengganu'],
    KUL: ['kuala lumpur'],
    PJY: ['putrajaya']
};


// render static index.html and minify it
async function renderIndex(data) {
    try {
        const content = await fs.readFile(path.join(templatesDir, 'index.hbs'), 'utf8');
        const template = await Handlebars.compile(content, {noEscape: true});
        const html = template(data);
        const minified = minify(html, {
            caseSensitive: true,
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeComments: true
        });

        await fs.writeFile(path.join(publicDir, 'index.html'), minified, 'utf8');
    } catch (e) {
        throw `Error rendering index.html: ${e.toString()}`;
    }
}


function getColor(total) {
    return (total > 40) ? 'red' : (total > 0) ? 'yellow' : (total === 0) ? 'green' : '';
}


function extractDataByStateId(allStates, stateId) {
    const index = allStates.findIndex(e => {
        return statesNameMapping[stateId] && statesNameMapping[stateId].includes(e.name.toLowerCase());
    });

    if (index === -1) return 'data-total="-1"';

    const total = (allStates[index].total === undefined) ? -1 : allStates[index].total;
    const color = getColor(total);
    return `class="fill-${color}" data-target="#item-${index}" data-total="${total}"`;
}


module.exports.renderIndex = renderIndex;