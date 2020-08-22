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

function getColorByTotal(total) {
    return (total > 40) ? 'red' : (total > 0) ? 'yellow' : (total === 0) ? 'green' : '';
}

// to be used within the context of 'states' array: {{#with states}} ... {{/with}}
function extractStateById(stateId) {
    // 'this' represents states array
    const index = this.findIndex(e => {
        return e.name && statesNameMapping[stateId] && statesNameMapping[stateId].includes(e.name.toLowerCase());
    });

    if (index === -1) return 'data-total="-1"';

    const total = (this[index].total === undefined) ? -1 : this[index].total;
    const color = getColorByTotal(total);

    // refer public/js/site.js for the usage data-attributes
    return `class="fill-${color}" data-target="#item-${index}" data-total="${total}"`;
}


module.exports.getColorByTotal = getColorByTotal;
module.exports.extractStateById = extractStateById;