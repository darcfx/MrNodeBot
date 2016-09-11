'use strict';
const Moment = require('moment');
const Models = require('bookshelf-model-loader');

/**
  Message Statistics Module
  Commands: counter clear-counter last-active
  Listeners: counter
  Web Routes: counter
**/
module.exports = app => {

    // If we have Database availability
    if (!app.Database || !Models.Logging) {
        return;
    }

    const logging = Models.Logging;

    /**
        Show the last known activity of a given username
    **/
    const lastActive = (to, from, text, message) => {
        let user = text.split(' ')[0];

        // We have no user
        if (!user) {
            app.say(to, 'you must specify a user');
            return;
        }

        logging
            .query(qb => {
                qb
                    .select('to', 'from', 'text', 'timestamp')
                    .where('from', user)
                    .orderBy('timestamp', 'desc')
                    .limit(1);
            })
            .fetch()
            .then(result => {
                if (!result) {
                    app.say(to, `${from}, I have never seen ${user} active`);
                    return;
                }
                let timeString = Moment(result.get('timestamp')).format('h:mma MMM Do');
                app.say(to, `${result.get('from')} was last active on ${result.get('to')} at ${timeString} saying: ${result.get('text')}`);
            });
    };

    // Command
    app.Commands.set('last-active', {
        desc: '[user] shows the last activity of the user',
        access: app.Config.accessLevels.guest,
        call: lastActive
    });

};
