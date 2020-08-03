const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');
const minify = require('html-minifier').minify;


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


Handlebars.registerHelper('color', getColor);
Handlebars.registerHelper('extract_state_by_id', extractStateById);


function getColor(total) {
    return (total > 40) ? 'red' : (total > 0) ? 'yellow' : (total === 0) ? 'green' : '';
}


// to be used within the context of 'states' array: {{#with states}} ... {{/with}}
function extractStateById(stateId) {
    // 'this' represents states array
    const index = this.findIndex(e => {
        return statesNameMapping[stateId] && statesNameMapping[stateId].includes(e.name.toLowerCase());
    });

    if (index === -1) return 'data-total="-1"';

    const total = (this[index].total === undefined) ? -1 : this[index].total;
    const color = getColor(total);
    return `class="fill-${color}" data-target="#item-${index}" data-total="${total}"`;
}


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

module.exports.renderIndex = renderIndex;