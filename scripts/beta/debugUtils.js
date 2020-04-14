const scriptInfo = {
    name: 'Debug Utils',
    desc: 'Bot Debugging',
    createdBy: 'IronY',
};
const _ = require('lodash');
const util = require('util');
const logger = require('../../lib/logger.js');
require('lodash-addons');

// noinspection RegExpRedundantEscape
/**
 * Get a simple string representation
 * @param object
 * @returns {string}
 */
const simpleString = object =>
    util.inspect(object, {
        depth: null,
    })
        .replace(/<Buffer[ \w\.]+>/ig, '"buffer"')
        .replace(/\[Function]/ig, 'function(){}')
        .replace(/\[Circular]/ig, '"Circular"')
        .replace(/\{ \[Function: ([\w]+)]/ig, '{ $1: function $1 () {},')
        .replace(/\[Function: ([\w]+)]/ig, 'function $1(){}')
        .replace(/(\w+): ([\w :]+GMT\+[\w \(\)]+),/ig, '$1: new Date("$2"),')
        .replace(/(\S+): ,/ig, '$1: null,');

module.exports = app => {

    /**
     * Eval Handler
     * @param to
     * @param from
     * @param text
     */
    const evalHandler = (to, from, text) => {
        try {
            // Get the results of the eval
            let result = eval(text);

            // Display them to the console
            console.dir(result);

            // Format them to avoid circular deps
            result = _.isString(result) ? result : simpleString(result);

            // Split on new line
            const splitResults = result.split('\n') || [];

            // We are an op in the channel and the user is in the channel
            if (app._ircClient.isOpInChannel(to) && app._ircClient.isInChannel(to, from)) {
                // Announce
                app.say(to, splitResults.length ?
                    `I have finished evaluating ${text}, and am messaging you the results ${from}` :
                    `I have finished evaluating ${text}, ${from}`);

                // Create function to clear the buffer to prevent flood
                const produce = () => {
                    // Channel say to the caller
                    app._ircClient.cSay(
                        from,
                        to,
                        (splitResults.shift()).replace(/([\[\]{}'`:,])/g, '\x02$1\x02'),
                    );

                    // If there is any results left, recurse
                    if (splitResults.length) setTimeout(produce, 1000);
                };

                // if there are results, initially call the function
                if (splitResults.length) produce();
            } else app.say(to, `I have finished evaluating ${text}, ${from}`);
        } catch (err) {
            logger.error('Eval command failed:', {
                message: err.message || '',
                stack: err.stack || '',
            });
        }
    };
    app.Commands.set('eval', {
        desc: '[valid js] will return value to console',
        access: app.Config.accessLevels.owner,
        call: evalHandler,
    });


    return scriptInfo;
};
