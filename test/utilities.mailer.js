const chai = require('chai');
const expect = chai.expect;
const sinonChai = require("sinon-chai");
const sandbox = require('sinon').createSandbox();

const logger = require('../utilities/logger');
const {transporter, notifyAdmin} = require('../utilities/mailer');

chai.use(sinonChai);

describe('Mailer Functions', () => {
    describe('notifyAdmin()', () => {
        afterEach(() => {
            sandbox.restore();
        });

        it('should send an email with a `SUCCESS` subject if the`error` property does not exist in the data', async () => {
            process.env.ADMIN_NOTIFICATION_ENABLED = true;
            const mockData = {message: 'a message for admin'};
            sandbox.stub(transporter, 'sendMail').resolves();

            await notifyAdmin(mockData);

            expect(transporter.sendMail).to.have.been.calledOnce;
            expect(transporter.sendMail.getCall(0).args[0]).to.have.deep.property('subject', '[SUCCESS] KnowYourZone Data Scraping');
        });

        it('should send an email with a `ERROR` subject if the`error` property exists in the data', async () => {
            process.env.ADMIN_NOTIFICATION_ENABLED = true;
            const mockData = {error: 'fake error'};
            sandbox.stub(transporter, 'sendMail').resolves();

            await notifyAdmin(mockData);

            expect(transporter.sendMail).to.have.been.calledOnce;
            expect(transporter.sendMail.getCall(0).args[0]).to.have.deep.property('subject', '[ERROR] KnowYourZone Data Scraping');
        });

        it('should log the error if it fails to send the email', async () => {
            process.env.ADMIN_NOTIFICATION_ENABLED = true;
            const mockData = {message: 'a message for admin'};
            sandbox.stub(logger, 'error');
            sandbox.stub(transporter, 'sendMail').rejects(new Error('Fake sendMail error'));

            await notifyAdmin(mockData);

            expect(transporter.sendMail).to.have.been.calledOnce;
            expect(logger.error).to.have.been.calledOnceWith('Error sending email to admin: Fake sendMail error');
        });

        it('should not send email if the admin notification flag is disabled', async () => {
            process.env.ADMIN_NOTIFICATION_ENABLED = false;
            const mockData = {message: 'a message for admin'};
            sandbox.spy(transporter, 'sendMail');

            await notifyAdmin(mockData);

            expect(transporter.sendMail).to.not.have.been.called;
        });
    });
});