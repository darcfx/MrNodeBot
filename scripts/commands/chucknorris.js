const scriptInfo = {
    name: 'Chuck Norris',
    desc: 'Retrieve a random chuck joke',
    createdBy: 'IronY',
};

const gen = require('../generators/_getChuckNorris');
const typo = require('../lib/_ircTypography');
const logger = require('../../lib/logger');

module.exports = (app) => {
    const chuck = async (to, from, text, message) => {
        try {
            const value = await gen();
            app.say(to, `${typo.logos.chuckNorris}: ${value}`);
        } catch (err) {
            logger.error('Something went wrong in the chucknorris command file', {
                message: err.message || '',
                stack: err.stack || '',
            });

            app.say(to, `I am sorry ${from}, Chuck Norris caused a epic error`);
        }
    };

    app.Commands.set('chuck', {
        desc: scriptInfo.desc,
        access: app.Config.accessLevels.identified,
        call: chuck,
    });

    return scriptInfo;
};
