const scriptInfo = {
    name: 'Popularity Analytic commands',
    desc: 'Get report data on popularity metrics',
    createdBy: 'IronY',
};
const _ = require('lodash');
const Models = require('funsociety-bookshelf-model-loader');
const logger = require('../../lib/logger');
const typo = require('../lib/_ircTypography');
const getPopSent = require('../generators/_getPopularitySentiment');
const getChanPopRank = require('../generators/_getChannelPopularityRanking');
const getCanPopRank = require('../generators/_getCandidatePopularityRanking');

module.exports = app => {
    // Database not available
    if (!Models.Upvote) return scriptInfo;

    /**
     * Popularity Feels Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const popularityFeelsHandler = async (to, from, text) => {
        const [voter,
            candidate,
            channel,
        ] = text.split(' ');

        if (!voter || !candidate) {
            app.say(to, 'I need more information to properly rate feels');
            return;
        }

        try {
            // Get result from generator, then return
            const result = await getPopSent(voter, candidate, channel);

            if (!result) {
                let out = `${voter} has zero feels for ${candidate}`;
                if (channel) out += ` in matters of ${channel}`;
                app.say(to, out);
                return;
            }

            let output = `${result.voter} feels ${result.adjective} (Sum of ${typo.colorSignedNumber(result.score)}) about ${result.candidate}`;

            if (channel) { output += ` in matters of ${result.channel}`; }

            output += ` (${result.votes} votes)`;
            app.say(to, output);
        } catch (err) {
            logger.error('Error in popularityFeels command', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, 'An Error has occurred with your popularity-feels command');
        }
    };
    app.Commands.set('popularity-feels', {
        desc: '[voter] [candidate] [channel?] - Get someones feels on someone else',
        access: app.Config.accessLevels.identified,
        call: popularityFeelsHandler,
    });

    /**
     * Popularity Ranking Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const popularityRankingHandler =async (to, from, text) => {
        const channel = text || to;
        // Get result from generator then return
        try {
            const result = await getChanPopRank(channel);

            if (!result || !result.rankings || !result.rankings.length) {
                app.say(to, `There are no popularity statistics for ${channel}`);
                return;
            }

            app.say(to, `The  Rankings have been messaged to you ${from}`);
            app.say(from, `Popularity Rankings for ${channel}`);

            _.forEach(result.rankings, (v, k) => app.say(from, `[${k + 1}] Candidate: ${v.candidate} Score: ${typo.colorSignedNumber(v.score)} Votes: ${v.votes}`));

            app.say(from, `Mean Score: ${result.meanScore} Total Score: ${typo.colorSignedNumber(result.totalScore)} Total Votes: ${result.totalVotes}`);
        } catch (err) {
            logger.error('Error in popularityRaking command', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, 'An Error has occurred with your popularity-ranking command');
        }
    };
    app.Commands.set('popularity-ranking', {
        desc: '[channel?] - Get popularity ranking for a channel',
        access: app.Config.accessLevels.identified,
        call: popularityRankingHandler,
    });

    /**
     * Popularity Contest Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const popularityContestHandler = async (to, from, text) => {
        let [nick,
            channel,
        ] = text.split(' ');

        // default to current user if no user specified
        nick = nick || from;

        try {
            const result = await getCanPopRank(nick, channel);
            const inChan = channel ?
                ` in ${channel}` :
                '';

            if (!result) {
                app.say(to, `There are no results available for ${nick}${inChan}`);
                return;
            }

            app.say(to, `Popularity for candidate ${nick}${inChan} has been messaged to you ${from}`);
            app.say(from, `Popularity for candidate ${nick}${inChan}`);

            _.forEach(result.rankings, (value, key) => app.say(from, `[${key + 1}] Voter: ${value.voter} Score: ${typo.colorSignedNumber(value.score)} Votes: ${value.votes}`));

            app.say(from, `Mean Score: ${result.meanScore} Total Score: ${typo.colorSignedNumber(result.totalScore)} Total Votes: ${result.totalVotes}`);
        } catch (err) {
            logger.error('Error in popularity-contest', {
                message: err.message || '',
                stack: err.stack || '',
            });

            app.say(to, 'An Error has occurred with your popularity-contest command');
        }
    };
    app.Commands.set('popularity-contest', {
        desc: '[user?] [channel?] - Get results on popularity',
        access: app.Config.accessLevels.identified,
        call: popularityContestHandler,
    });

    /**
     * Popularity Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const popularityHandler = async (to, from, text) => {
        let [nick,
            channel,
        ] = text.split(' ');
        nick = nick || from;

        try {
            const result = await getCanPopRank(nick, channel);

            if (!result || !result.totalVotes) {
                app.say(to, `There is no popularity data for ${nick}`);
                return;
            }

            app.say(to, `Popularity of ${nick}${channel
                ? ` On ${channel}`
                : ''} ${typo.icons.sideArrow} ${result.totalVotes} ${typo.icons.views} ${typo.icons.sideArrow} Total ${typo.colorSignedNumber(result.totalScore)} ` + `${result.totalScore > 0
                ? typo.icons.happy
                : typo.icons.sad} ${typo.icons.sideArrow} Mean ${result.meanScore} ${result.meanScore > 0
                ? typo.icons.happy
                : typo.icons.sad}`);
        } catch (err) {
            logger.error('Error in popularity command', {
                message: err.message || '',
                stack: err.stack || '',
            });

            app.say(to, 'An Error has occurred with your popularity command');
        }
    };
    app.Commands.set('popularity', {
        desc: '[nick?] [channel?] Get a users popularity',
        access: app.Config.accessLevels.identified,
        call: popularityHandler,
    });

    return scriptInfo;
};
