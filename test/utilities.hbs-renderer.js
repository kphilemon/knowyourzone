const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
const fs = require('fs').promises;
const mockfs = require('mock-fs');

const {renderHtml, renderIndex} = require('../utilities/hbs-renderer');

chai.use(chaiAsPromised);

describe('Handlebars HTML Rendering Functions', () => {
    const mockTemplate = "{{#each states}}{{name}} ({{total}}) - {{color total}}\n{{#each districts}} + {{name}} ({{total}}) - {{color total}}\n{{/each}}{{/each}}\n\n{{#with states}}{{extract_state_by_id 'SBH'}}{{/with}}";
    const mockRenderedHtml = 'Sabah (42) - red + district A (40) - yellow + district B (2) - yellow Sarawak (0) - green + district A (0) - green class="fill-red" data-target="#item-0" data-total="42"';
    const mockData = {
        states: [{
            name: 'Sabah',
            total: 42,
            districts: [{name: 'district A', total: 40}, {name: 'district B', total: 2}]
        }, {
            name: 'Sarawak',
            total: 0,
            districts: [{name: 'district A', total: 0}]
        }]
    };

    describe('renderHtml()', () => {
        const mockTemplatePath = 'foo/test.hbs';
        const mockDestinationPath = 'bar/test.html';
        afterEach(mockfs.restore);

        it('should output rendered html at the destination path', async () => {
            mockfs({
                'foo': {'test.hbs': mockTemplate},
                'bar': {} // mocking only the directory so that we can verify that the file is created
            });

            await renderHtml(mockData, mockTemplatePath, mockDestinationPath);

            // read back from the file to verify its content
            const result = await fs.readFile(mockDestinationPath, 'utf8');
            expect(result).to.deep.equal(mockRenderedHtml);
        });

        it('should throw error when template file does not exist at template path', async () => {
            mockfs({
                'foo': {}, // empty dir without template file
                'bar': {}
            });

            await expect(renderHtml(mockData, mockTemplatePath, mockDestinationPath)).to.be.rejectedWith(Error, /^ENOENT, no such file or directory .*foo[\/\\]test.hbs/i);
        });

        it('should throw error when parent directory of destination file does not exist or incomplete', async () => {
            mockfs({
                'foo': {'test.hbs': mockTemplate}
            });

            await expect(renderHtml(mockData, mockTemplatePath, mockDestinationPath)).to.be.rejectedWith(Error, /^ENOENT, no such file or directory .*bar[\/\\]test.html/i);
        });
    });

    describe('renderIndex()', () => {
        afterEach(mockfs.restore);

        it("should render html based on template at 'template/index.hbs' and output rendered html at 'public/index.html'", async () => {
            mockfs({
                'templates': {'index.hbs': mockTemplate},
                'public': {} // mocking only the directory so that we can verify that the file is created
            });

            await renderIndex(mockData);

            // read back from the file to verify its content
            const result = await fs.readFile('public/index.html', 'utf8');
            expect(result).to.deep.equal(mockRenderedHtml);
        });

        it("should throw error when 'index.hbs' does not exist in 'templates' directory", async () => {
            mockfs({
                'template': {}, // empty dir without index.hbs
                'public': {}
            });

            await expect(renderIndex(mockData)).to.be.rejectedWith(Error, /^Error rendering index.html: ENOENT, no such file or directory .*templates[\/\\]index.hbs/i);
        });

        it("should throw error when 'public' directory does not exist", async () => {
            mockfs({
                'templates': {'index.hbs': mockTemplate}
            });

            await expect(renderIndex(mockData)).to.be.rejectedWith(Error, /^Error rendering index.html: ENOENT, no such file or directory .*public[\/\\]index.html/i);
        });
    });
});