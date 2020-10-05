const fs = require('fs').promises;
const Handlebars = require('handlebars');
const minify = require('html-minifier').minify;
const {formatNumber, getColorByTotal, extractStateById} = require('./hbs-helpers');

// register custom helpers
Handlebars.registerHelper('format_number', formatNumber);
Handlebars.registerHelper('color', getColorByTotal);
Handlebars.registerHelper('extract_state_by_id', extractStateById);

async function renderHtml(data, templatePath, destinationPath) {
    const content = await fs.readFile(templatePath, 'utf8');
    const template = await Handlebars.compile(content, {noEscape: true});
    const html = template(data);

    const minified = minify(html, {
        caseSensitive: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeComments: true
    });
    await fs.writeFile(destinationPath, minified, 'utf8');
}

// render index.html
async function renderIndex(data) {
    const template = 'templates/index.hbs';
    const destination = 'public/index.html';

    // add google analytics tracking ID
    data.tracking_id = process.env.GA_TRACKING_ID;

    try {
        await renderHtml(data, template, destination);
    } catch (error) {
        throw new Error(`Error rendering index.html: ${error.message}`);
    } finally {
        delete data.tracking_id; // prevent caching the tracking ID
    }
}


module.exports.renderHtml = renderHtml;
module.exports.renderIndex = renderIndex;