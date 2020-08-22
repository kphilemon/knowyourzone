const fs = require('fs').promises;
const Handlebars = require('handlebars');
const minify = require('html-minifier').minify;
const {getColorByTotal, extractStateById} = require('./hbs-helpers');

// register custom helpers
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

    await renderHtml(data, template, destination).catch(error => {
        throw new Error(`Error rendering index.html: ${error.message}`);
    });
}


module.exports.renderHtml = renderHtml;
module.exports.renderIndex = renderIndex;