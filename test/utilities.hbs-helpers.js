const expect = require('chai').expect;

const Handlebars = require('handlebars');
const {formatNumber, getColorByTotal, extractStateById} = require('../utilities/hbs-helpers');

describe('Handlebars Custom Helpers', () => {
    describe("'format_number' helper", () => {
        let template;

        // register helper and set up template
        before(async () => {
            Handlebars.registerHelper('format_number', formatNumber);
            template = await Handlebars.compile('{{format_number total}}');
        });

        it('should be registered', () => {
            expect(Handlebars.helpers.format_number).to.exist;
            expect(Handlebars.helpers.format_number).to.be.a('function');
        });

        it('should return a number with thousands separator when the number is greater than 1000', () => {
            const data = {total: 1000};
            const result = template(data);
            expect(result).to.deep.equal('1,000');
        });

        it('should return a number as it is when the number is smaller than 1000', () => {
            const data = {total: 100};
            const result = template(data);
            expect(result).to.deep.equal('100');
        });
    });

    describe("'color' helper", () => {
        let template;

        // register helper and set up template
        before(async () => {
            Handlebars.registerHelper('color', getColorByTotal);
            template = await Handlebars.compile('{{color total}}');
        });

        it('should be registered', () => {
            expect(Handlebars.helpers.color).to.exist;
            expect(Handlebars.helpers.color).to.be.a('function');
        });

        it('should return "red" when total is greater than 40', () => {
            const data = {total: 41};
            const result = template(data);
            expect(result).to.deep.equal('red');
        });

        it('should return "yellow" when total is greater than 0 and not greater than 40', () => {
            const data = {total: 40};
            const result = template(data);
            expect(result).to.deep.equal('yellow');
        });

        it('should return "green" when total is equals to 0', () => {
            const data = {total: 0};
            const result = template(data);
            expect(result).to.deep.equal('green');
        });

        it('should return an empty string when total is less than 0', () => {
            const data = {total: -1};
            const result = template(data);
            expect(result).to.deep.equal('');
        });
    });

    describe("'extract_state_by_id' helper", () => {
        let template;

        // register helper and set up template
        before(async () => {
            Handlebars.registerHelper('extract_state_by_id', extractStateById);
            // using 'SBH' as stateID for the tests below
            template = await Handlebars.compile('{{extract_state_by_id "SBH"}}', {noEscape: true});
        });

        it('should be registered', () => {
            expect(Handlebars.helpers.extract_state_by_id).to.exist;
            expect(Handlebars.helpers.extract_state_by_id).to.be.a('function');
        });

        it('should return a string that contains `class="fill-{color}"`, where {color`} is based on the logic in `color` helper above', () => {
            const data = [{
                name: "Sabah",
                total: 41
            }];
            const result = template(data);
            expect(result).to.contain('class="fill-red"'); // red because 'total' is greater than 40
        });

        it('should return a string that contains `data-target="#item-{index}"`, where {index} is the index of the matched element in the data array', () => {
            const data = [{}, {}, {
                name: "Sabah",
                total: 41
            }];
            const result = template(data);
            expect(result).to.contain('data-target="#item-2"'); // 'SBH' matches with the element at index 2
        });

        it('should return a string that contains `data-total="{total}"`, where {total} is the value of the `total` property of the matched element', () => {
            const data = [{
                name: "Sabah",
                total: 41
            }];
            const result = template(data);
            expect(result).to.contain('data-total="41"');
        });

        it('should return a string that contains `data-total="-1"` when `total` property does not exists in the matched element', () => {
            const data = [{
                name: "Sabah"
            }];
            const result = template(data);
            expect(result).to.contain('data-total="-1"');
        });

        it('should return `data-total="-1"` when the value of `name` property of all elements in the data array does not match with the specified names of given ID in statesNameMapping', () => {
            const data = [{
                foo: "does not have a 'name' property"
            }, {
                name: "has 'name' property but its value does not exist in stateNamesMapping"
            }];
            const result = template(data);
            expect(result).to.deep.equal('data-total="-1"');
        });
    });
});