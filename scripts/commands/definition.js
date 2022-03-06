const scriptInfo = {
    name: 'definition',
    desc: 'Get definitions of stuff',
    createdBy: 'IronY',
};

const _ = require('lodash');
const gen = require('../generators/_getDefinition');
const logger = require('../../lib/logger');
const ircTypography = require('../lib/_ircTypography');

module.exports = app => {
    /**
     * Definition Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const getDefinition = async (to, from, text) => {
        if (_.isEmpty(text.trim())) {
            app.say(to, `I am sorry ${from}, I need something to lookup`);
            return;
        }
        try {
            const sb = new ircTypography.StringBuilder({
                logo: 'dictionary',
            });
            const results = await gen(text);
            sb
                .append(from)
                .append(text)
                .append(results.date)
                .append(results.type)
                .insert(results.definition)
                .insertIcon('anchor')
                .insert(results.link);
            app.say(to, sb.toString());
        } catch (err) {
            if ('innerErr' in err) {
                logger.error('Something went wrong fetching a definition', {
                    message: err.innerErr.message || '',
                    stack: err.innerErr.stack || '',
                });
            }

            app.say(to, `${err.message}, ${from}`);
        }
    };
    app.Commands.set('definition', {
        desc: '[text] Exactly what it sounds like',
        access: app.Config.accessLevels.identified,
        call: getDefinition,
    });
    app.Commands.set('define', {
        desc: '[text] Exactly what it sounds like',
        access: app.Config.accessLevels.identified,
        call: getDefinition,
    });

    // Return the script info
    return scriptInfo;
};
