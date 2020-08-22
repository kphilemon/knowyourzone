const chai = require('chai');
const expect = chai.expect;
const sinonChai = require("sinon-chai");
const sandbox = require('sinon').createSandbox();

const cache = require('memory-cache');
const logger = require('../utilities/logger');
const mailer = require('../utilities/mailer');
const hbsRenderer = require('../utilities/hbs-renderer');
const dataScrapper = require('../utilities/data-scraper');
const {update} = require('../utilities/data-updater');

chai.use(sinonChai);

describe('Data Updater Functions', () => {
    describe('update()', () => {
        process.env.ADMIN_NOTIFICATION_ENABLED = false;

        beforeEach(() => {
            // stub logger methods to disable logging
            sandbox.spy(cache, 'put');
            sandbox.spy(mailer, 'notifyAdmin');
            sandbox.stub(logger, 'error');
            sandbox.stub(logger, 'info');
        });

        afterEach(() => {
            cache.clear();
            sandbox.restore();
        });

        it('should cache the scrapped data, render index.html with the new data, and notify admin of the new data', async () => {
            const mockData = {
                states: [{
                    name: 'foo',
                    total: 42,
                    districts: [{name: 'bar', total: 0}]
                }]
            };

            // stubbing these two expensive dependencies
            sandbox.stub(dataScrapper, 'scrape').returns(mockData);
            sandbox.stub(hbsRenderer, 'renderIndex');

            await update();

            expect(dataScrapper.scrape).to.have.been.calledOnce;
            expect(hbsRenderer.renderIndex).to.have.been.calledOnceWith(mockData);
            expect(cache.put).to.have.been.calledOnceWith('data', mockData);
            expect(mailer.notifyAdmin).to.have.been.calledOnceWith(mockData);

            // verify cache content
            expect(cache.get('data')).to.deep.equal(mockData);
        });

        it('should not cache the scrapped data, should not render index.html, if the data has error', async () => {
            const mockData = {error: 'Fake data error'};
            sandbox.stub(dataScrapper, 'scrape').returns(mockData);
            sandbox.spy(hbsRenderer, 'renderIndex');

            await update();

            expect(dataScrapper.scrape).to.have.been.calledOnce;
            expect(hbsRenderer.renderIndex).to.not.have.been.called;
            expect(cache.put).to.not.have.been.called;
            expect(mailer.notifyAdmin).to.have.been.calledOnceWith(mockData);
            expect(cache.get('data')).to.be.null;
        });

        it('should not cache the scrapped data if the rendering of index.html fails', async () => {
            const mockData = {
                states: [{
                    name: 'foo',
                    total: 42,
                    districts: [{name: 'bar', total: 0}]
                }]
            };

            sandbox.stub(dataScrapper, 'scrape').returns(mockData);
            sandbox.stub(hbsRenderer, 'renderIndex').throws(new Error('Fake index.html rendering error'));

            await update();

            expect(dataScrapper.scrape).to.have.been.calledOnce;
            expect(hbsRenderer.renderIndex).to.have.been.calledOnceWith(mockData);
            expect(cache.put).to.not.have.been.called;
            expect(mailer.notifyAdmin).to.have.been.calledOnceWith({error: 'Error: Fake index.html rendering error'});
            expect(cache.get('data')).to.be.null;
        });
    });
});