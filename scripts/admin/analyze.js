const scriptInfo = {
    name: 'analyze',
    desc: 'Get a summary of information from a online IRC user',
    createdBy: 'IronY',
};
const _ = require('lodash');
const c = require('irc-colors');
const Models = require('funsociety-bookshelf-model-loader');
const Moment = require('moment');
const getLocationData = require('../generators/_ipLocationData');
const getBestGuess = require('../generators/_nickBestGuess');

const errorMessage = 'Something went wrong fetching your results';

module.exports = (app) => {
    // No Database Data available...
    if (!app.Database && !Models.Logging) return;

    // Helpers
    const titleLine = text => c.underline.red.bgblack(text);

    // Render the Data object
    const renderData = (nick, subCommand, dbResults, whoisResults, locResults) => {
        const db = _(dbResults);

        const result = {
            currentNick: nick,
            nicks: db.map('from').uniq(),
            pastChannels: db.map('to').uniq(),
            hosts: db.map('host').uniq(),
            idents: db.map('ident').uniq(),
            firstResult: db.first(),
            lastResult: db.last(),
            totalLines: db.size().toString(),
            subCommand,
        };

        if (whoisResults) {
            Object.assign(result, {
                currentChannels: whoisResults.channels || [],
                currentServer: whoisResults.server || '',
                currentIdent: whoisResults.user || '',
                currentHost: whoisResults.host || '',
                primaryNick: whoisResults.account || '',
                secureServer: whoisResults.secure || '',
                realName: whoisResults.realname || '',
            });
        }
        if (locResults) {
            Object.assign(result, {
                countryCode: locResults.country_code || '',
                countryName: locResults.country_name || '',
                regionCode: locResults.region_code || '',
                regionName: locResults.region_name || '',
                city: locResults.city || '',
                postal: locResults.zip_code || '',
                timeZone: locResults.time_zone || '',
                lat: locResults.latitude || '',
                long: locResults.longitude || '',
            });
        }
        return result;
    };

    // Report back to IRC
    const reportToIrc = async (to, data) => {
        const sayHelper = (header, content) => {
            const paddedResult = _.padEnd(`${header}${header ? ':' : ' '}`, pad, ' ');
            app.say(to, `${titleLine(paddedResult)} ${content}`);
        };

        const firstDateActive = _.isUndefined(data.firstResult.timestamp) ? null : Moment(data.firstResult.timestamp);
        const lastDateActive = _.isUndefined(data.lastResult.timestamp) ? null : Moment(data.lastResult.timestamp);

        let pad = 19;
        const realName = data.realName ? `(${c.white.bgblack(data.realName)})` : '';
        const primaryNick = data.primaryNick ? `${c.white.bgblack.bold('ACC: ')}${c.green.bgblack(data.primaryNick)}` : c.red.bgblack('-Unident/Offline-');
        const city = data.city ? `City(${data.city}) ` : '';
        const regionName = data.regionName ? `Region(${data.regionName}) ` : '';
        const countryName = data.countryName ? `Country(${data.countryName}) ` : '';
        const postal = data.postal ? `Postal(${data.postal}) ` : '';
        const timeZone = data.timeZone ? `Time Zone(${data.timeZone}) ` : '';
        const lat = data.lat ? `Lat(${data.lat}) ` : '';
        const long = data.long ? `Long(${data.long}) ` : '';
        const paddedResult = _.padStart(`Searching VIA ${data.subCommand}`, pad * 4, ' ');
        app.say(to, `${c.underline.red.bgblack(paddedResult)}`);
        app.say(to, `${primaryNick} ${c.white.bgblack.bold('Current:')} ${c.white.bgblack(data.currentNick)}!${c.red.bgblack(data.currentIdent)}@${c.blue.bgblack.bold(data.currentHost)} ${realName}`);

        sayHelper('Nicks', data.nicks.join(' | '));
        sayHelper('Past Channels', data.pastChannels.join(' | '));
        if (!_.isEmpty(data.currentChannels)) sayHelper('Current Channels', data.currentChannels.join(' | '));
        sayHelper('Hosts', data.hosts.join(' | '));
        sayHelper('Idents', data.idents.join(' | '));
        if (data.currentServer) sayHelper('Server', `${data.currentServer} ${data.secureServer ? '(SSL)' : '(Plain Text)'}`);

        if (firstDateActive) {
            sayHelper('First Active', `as ${data.firstResult.from} on ${firstDateActive.format('h:mma MMM Do')} (${firstDateActive.fromNow()}) On: ${data.firstResult.to}`);
            sayHelper('First Message', data.firstResult.text);
        }

        if (lastDateActive) {
            sayHelper('Last Active', `as ${data.lastResult.from} on ${lastDateActive.format('h:mma MMM Do')} (${lastDateActive.fromNow()}) On: ${data.lastResult.to}`);
            sayHelper('Last Message', data.lastResult.text);
        }

        // Display location data if it exists
        if (city || regionName || countryName || postal || timeZone || lat || long) {
            sayHelper('Location Data', `${city}${regionName}${countryName}${postal}${timeZone}${lat}${long}`);
        }

        sayHelper('Total Lines', `${data.totalLines}`);
    };

    // Handle info verbiage
    const convertSubInfo = (val) => {
        switch (val) {
        case 'ident':
            return 'user';
        }
        return val;
    };

    // Handle query verbiage
    const convertSubFrom = (val) => {
        switch (val) {
        case 'nick':
            return 'from';
        }
        return val;
    };

    // Build the initial query
    const queryBuilder = (field, value) => Models.Logging.query((qb) => {
        qb.select(['id', 'timestamp', 'ident', 'from', 'to', 'host', 'text']);
        qb.where(field, 'like', value);
    }).fetchAll();

    const init = async (to, rawNick, subCommand, argument, processor) => {
        // Verify Info object
        if (!rawNick) {
            app.say(to, 'A Nick is required');
            return;
        }

        const bestGuess = await getBestGuess(rawNick);
        const nick = bestGuess.nearestNeighbor.from;

        // Hold whois results
        let whoisResults;

        try {
            whoisResults = await app._ircClient.whoisPromise(nick);
        } catch (err) {
            app.say(to, err.message);
            return;
        }

        // Insignificant information
        if (!whoisResults || (!whoisResults.user && subCommand === 'ident')) {
            app.say(to, 'The user is either offline or I do not have any information on them');
            return;
        }

        whoisResults.host = whoisResults.host || argument;
        whoisResults.user = whoisResults.user || nick;

        if (!whoisResults.host || !whoisResults.user) {
            // Hold Results
            let results;

            try {
                results = await Models.Logging.query(qb => qb
                    .where('from', 'like', whoisResults.user)
                    .orderBy('timestamp', 'desc')
                    .limit(1))
                    .fetch();
            } catch (err) {
                app.say(to, errorMessage);
                return;
            }

            if (!results.length) {
                app.say(to, `No results are available on ${nick}`);
                return;
            }

            whoisResults.host = whoisResults.host || results.get('host');
            whoisResults.user = whoisResults.user || results.get('ident');

            // Hold on to the dbResults
            let dbResults;
            try {
                dbResults = await queryBuilder(convertSubFrom(subCommand), whoisResults[convertSubInfo(subCommand)]);
            } catch (err) {
                app.say(to, errorMessage);
                return;
            }

            if (!dbResults.length) {
                app.say(to, `No results are available on ${nick}`);
                return;
            }

            // Hold on to the location results
            let locResults;

            try {
                if (helpers.ValidHostExpression.test(whoisResults.host)) {
                    locResults = await getLocationData(whoisResults.host);
                }
            } catch (err) {
                // Ignore Error
            } finally {
                processor(to, renderData(nick, subCommand, dbResults.toJSON(), whoisResults, locResults));
            }
        } else {
            // Hold on to the dbResults
            let dbResults;
            try {
                dbResults = await queryBuilder(convertSubFrom(subCommand), whoisResults[convertSubInfo(subCommand)]);
            } catch (err) {
                app.say(to, errorMessage);
                return;
            }

            if (!dbResults.length) {
                app.say(to, `No results are available on ${nick}`);
                return;
            }

            whoisResults.host = whoisResults.host || _.last(dbResults).get('host');

            // Hold on to the location results
            let locResults;

            try {
                if (helpers.ValidHostExpression.test(whoisResults.host)) {
                    locResults = await getLocationData(whoisResults.host);
                }
            } catch (err) {
                // Ignore Error
            } finally {
                processor(to, renderData(nick, subCommand, dbResults.toJSON(), whoisResults, locResults));
            }
        }
    };

    /**
     Trigger command for advanced active tracking
     * */
    const analyze = async (to, from, text, message) => {
        // Parse Text
        const txtArray = text.split(' ');
        const nick = txtArray.shift();
        const subCommand = txtArray.shift();
        const argument = txtArray.shift();

        if (nick === app.nick) {
            app.say(from, 'I have never really been good at self analysis');
            return;
        }

        if (!subCommand || !nick) {
            app.say(to, 'Both a Sub Command and a Nick are required');
            return;
        }

        // Check for valid commands
        if (!_.includes(['ident', 'host', 'nick'], subCommand)) {
            app.say(to, 'That is not a valid Sub Command silly');
            return;
        }

        init(to, nick, subCommand, argument, reportToIrc);
    };

    app.Commands.set('analyze', {
        desc: '[Nick] [Sub Command] - Advanced Analytics tool',
        access: app.Config.accessLevels.admin,
        call: analyze,
    });

    // Return the script info
    return scriptInfo;
};
