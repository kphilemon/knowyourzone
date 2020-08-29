const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const sinonChai = require("sinon-chai");
const sandbox = require('sinon').createSandbox();
const fs = require('fs');

const app = require('../app');
const cache = require('memory-cache');
const logger = require('../utilities/logger');
const hbsRenderer = require('../utilities/hbs-renderer');

chai.use(chaiHttp);
chai.use(sinonChai);

describe('App Integration Test', () => {
    beforeEach(() => {
        sandbox.stub(logger, 'info');
        sandbox.stub(logger, 'warn');
        sandbox.stub(logger, 'error');
    });

    afterEach(() => {
        cache.clear();
        sandbox.restore();
    });

    describe('GET /', () => {
        it('should return a 200 if index.html exists in public directory, else a 404 if it does not, both with html content', (done) => {
            // index.html in the public directory is git-ignored as it is dynamic based on data.
            // A NEWLY-CLONED project will not include index.html. In this case, 404.html with status 404 will be returned
            // Starting the server with 'node app.js' will create index.html and we shall expect a 200

            chai.request(app)
                .get('/')
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.be.html;
                    expect(res).to.have.status((fs.existsSync('public/index.html')) ? 200 : 404);
                    done();
                });
        });
    });

    describe('GET /non/existing/route', () => {
        it('should return a 404 with html content', (done) => {
            chai.request(app)
                .get('/a/non/existing/route')
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.be.html;
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('GET /api/non/existing/api/route', () => {
        it('should return a 404 with json content if the route is an API route (routes with /api/*)', (done) => {
            chai.request(app)
                .get('/api/non/existing/api/route')
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.be.json;
                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({message: 'Not found'});
                    done();
                });
        });
    });

    describe('GET /api/data/covid19/latest', () => {
        it('should return a 200 with the cached data', (done) => {
            // setting up the cache
            cache.put('data', 'fake cache data');

            chai.request(app)
                .get('/api/data/covid19/latest')
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.be.json;
                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal(cache.get('data'));
                    done();
                });
        });

        it('should return a 404 when the data does not present in the cache', (done) => {
            chai.request(app)
                .get('/api/data/covid19/latest')
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.be.json;
                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({message: 'Data currently unavailable'});
                    done();
                });
        });
    });

    describe('PUT /api/admin/covid19', () => {
        process.env.ADMIN_API_KEY = 'foo';
        const fakeOldCacheData = 'fake old cache data';

        beforeEach(() => {
            cache.put('data', fakeOldCacheData); // caching a fake old data to verify data has been updated
            sandbox.spy(cache, 'put');
        });

        it('should replace the old cache data with new data, re-render index.html, and return a 200 with the cached data, if the request is good', (done) => {
            const mockData = {
                states: [{
                    name: 'foo',
                    total: 42,
                    districts: [{name: 'bar', total: 0}]
                }]
            };

            sandbox.stub(hbsRenderer, 'renderIndex');

            chai.request(app)
                .put('/api/admin/covid19')
                .set('X-API-KEY', 'foo')
                .send(mockData)
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.be.json;
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.deep.property('states', mockData.states);
                    expect(res.body).to.have.property('last_updated').that.is.a('number');
                    expect(hbsRenderer.renderIndex).to.have.been.calledOnceWith(res.body);
                    expect(cache.put).to.have.been.calledOnceWith('data', res.body);
                    expect(cache.get('data')).to.not.equal(fakeOldCacheData);
                    expect(cache.get('data')).to.deep.equal(res.body);
                    done();
                });
        });

        it('should not replace the old cache data, should not re-render index.html, and return a 401 if the authorization fails', (done) => {
            const mockData = {
                states: [{
                    name: 'foo',
                    total: 42,
                    districts: [{name: 'bar', total: 0}]
                }]
            };

            sandbox.spy(hbsRenderer, 'renderIndex');

            chai.request(app)
                .put('/api/admin/covid19')
                .set('X-API-KEY', 'a wrong API key')
                .send(mockData)
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.be.json;
                    expect(res).to.have.status(401);
                    expect(res.body).to.deep.equal({message: 'Unauthorized action'});
                    expect(hbsRenderer.renderIndex).to.not.have.been.called;
                    expect(cache.put).to.not.have.been.called;
                    expect(cache.get('data')).to.deep.equal(fakeOldCacheData);
                    done();
                });
        });

        it('should not replace the old cache data, should not re-render index.html, and return a 400 if the schema validation of the request body fails', (done) => {
            const mockData = {
                states: [{
                    total: 'forty-two',
                    districts: [{name: 'bar'}]
                }, {
                    name: 'foo',
                    total: 42
                }]
            };

            sandbox.spy(hbsRenderer, 'renderIndex');

            chai.request(app)
                .put('/api/admin/covid19')
                .set('X-API-KEY', 'foo')
                .send(mockData)
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.be.json;
                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({message: '"states[0].name" is required. "states[0].total" must be a number. "states[0].districts[0].total" is required. "states[1].districts" is required'});
                    expect(hbsRenderer.renderIndex).to.not.have.been.called;
                    expect(cache.put).to.not.have.been.called;
                    expect(cache.get('data')).to.deep.equal(fakeOldCacheData);
                    done();
                });
        });

        it('should not replace the old cache data, should not re-render index.html, and return a 500 if the rendering of index.html fails', (done) => {
            const mockData = {
                states: [{
                    name: 'foo',
                    total: 42,
                    districts: [{name: 'bar', total: 0}]
                }]
            };

            sandbox.stub(hbsRenderer, 'renderIndex').throws(new Error('Fake index.html rendering error'));

            chai.request(app)
                .put('/api/admin/covid19')
                .set('X-API-KEY', 'foo')
                .send(mockData)
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.be.json;
                    expect(res).to.have.status(500);
                    expect(res.body).to.deep.equal({message: 'Error: Fake index.html rendering error'});
                    expect(hbsRenderer.renderIndex).to.have.been.calledOnce;
                    expect(cache.put).to.not.have.been.called;
                    expect(cache.get('data')).to.deep.equal(fakeOldCacheData);
                    done();
                });
        });
    });
});