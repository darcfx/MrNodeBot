const scriptInfo = {
    name: 'FSociety Peoples',
    desc: 'Commands for certain #fsociety members',
    createdBy: 'IronY',
};
const _ = require('lodash');
const c = require('irc-colors');
const Models = require('funsociety-bookshelf-model-loader');
const excuse = require('../generators/_simpleExcuse');

module.exports = (app) => {
    // Report an image of our lord and savour, RaptorJesus
    app.Commands.set('RaptorJesus', {
        desc: 'Get a pic of RaptorJesus',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => {
            // If he is in the channel
            if (app._ircClient.isInChannel(to, 'RaptorJesus')) app.action(to, 'prays to RaptorJesus');
            // Report back to IRC
            app.say(to, 'Our Lord and Saviour: http://i.imgur.com/E1fQQdr.png');
        },
    });

    // Report an image of our lord and savour, RaptorJesus
    app.Commands.set('eagle-excuse', {
        desc: 'Get a random excuse, DIY excuse style',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => {
            // Report back to IRC
            excuse().then(excuses => app.say(to, _.first(excuses)));
        },
    });

    // Show a very attractive wheel barrowa
    app.Commands.set('redwheelbarrow', {
        desc: 'Show a Red Wheelbarrow',
        access: app.Config.accessLevels.admin,
        call: (to, from, text, message) => _.each([
            '                                   _______',
            '      ___________________________.\'.------`',
            '     \'---------------------------.\'',
            '       `.       #FSOCIETY      .\'',
            '     .-//`.                  .\'',
            '  .\' .//.\'/`================\'',
            ' =[=:====:=]=           \\||',
            '  \'. `--\' .\'             \_|',
            '    `-  -\'',
        ], line => app.say(to, c.red(line))),
    });

    // Everything past this point requires the database
    if (!Models.Logging) return scriptInfo;
    // /

    return scriptInfo;
};
