const scriptInfo = {
    name: 'stats',
    desc: 'Provide very basic command usage stats',
    createdBy: 'IronY',
};

const _ = require('lodash');
const moment = require('moment');

const helpers = require('../../helpers');
const logger = require('../../lib/logger');
const usageOverTime = require('../generators/_getUsageOverTime');

module.exports = app => {
    // Get command usage statistics
    app.Commands.set('stats', {
        desc: 'Get command usage statistics',
        access: app.Config.accessLevels.admin,
        call: (to, from, text, message) => app.Stats.forEach((value, key) => {
            if (!app.Commands.get(key)[2]) app.say(from, `${key} : ${value}`);
        }),
    });

    // Get the bots uptime
    app.Commands.set('uptime', {
        desc: 'Get the current uptime',
        access: app.Config.accessLevels.admin,
        call: (to, from, text, message) => app.say(to, `I have been alive since ${helpers.StartTime}, about ${helpers.StartTime.fromNow()}`),
    });

    // Get a users high and low usage bound to a channel
    app.Commands.set('high-low-usage', {
        desc: '[user] Get a users high/low usage for a specified channel (defaults to current channel)',
        access: app.Config.accessLevels.admin,
        call: async (to, from, text, message) => {
            try {
                // Extract Results
                const [nick, preChannel] = text.split(' ');
                // Extract channel or set default
                const channel = preChannel || to;

                // Validate nick
                if (!nick) {
                    app.say(to, `I require a nick to fetch that data, ${from}`);
                    return;
                }

                // Fetch results
                const results = await usageOverTime(channel, nick);

                // Validate basic object
                if (!_.isObject(results) || _.isEmpty(results)) {
                    app.say(to, `I am sorry, I was unable to find any data on ${nick} from ${channel}, ${from}`);
                    return;
                }

                // Validate results object
                if (
                    !_.isObject(results.lowest) ||
                    !_.isSafeInteger(results.lowest.messages) ||
                    !_.isDate(results.lowest.timestamp) ||
                    !_.isObject(results.highest) ||
                    !_.isSafeInteger(results.highest.messages) ||
                    !_.isDate(results.highest.timestamp)

                ) {
                    app.say(to, `I am sorry, I cannot find data on ${nick} from ${channel}, ${from}`);
                    logger.debug('Something went wrong fetching the highest / lowest data', results);
                    return;
                }

                // Report back
                app.say(to,
                    `${nick} was most active on ${channel} ${moment(results.highest.timestamp).format('MMMM Do, YYYY')} with a total of ${results.highest.messages} ${helpers.Plural('line', results.highest.messages)}, they were least active on ${moment(results.lowest.timestamp).format('MMMM Do, YYYY')} with a total of ${results.lowest.messages} ${helpers.Plural('line', results.lowest.messages)}`
                );
            } catch (err) {
                app.say(to, `I am sorry ${from}, something went wrong fetching usage`);
                logger.error(`Error in usage command of _stats.js`, {
                    message: err.message || '',
                    stack: err.stack || '',
                })
            }
        }
    });

    // Return the script info
    return scriptInfo;
};
