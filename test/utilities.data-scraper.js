const expect = require('chai').expect;
const sinon = require('sinon');

const puppeteer = require('puppeteer');
const {scrape} = require('../utilities/data-scraper');

describe('Data Scrapper Functions', () => {
    describe('scrape() *takes time*', () => {

        it('should return an object with `states` or/and `error` property', async () => {
            const result = await scrape();
            expect(result).to.be.an('object');
            expect(result).to.have.any.keys('states', 'error');
        }).timeout(20000);

        it('should return an object with `error` property if puppeteer throws error', async () => {
            const stub = sinon.stub(puppeteer, 'launch').throws(new Error('fake puppeteer error'));
            const result = await scrape();
            stub.restore();
            expect(result).to.be.an('object');
            expect(result).to.deep.equal({error: 'Error scraping data: fake puppeteer error'});
        });
    });
});