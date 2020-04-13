const scriptInfo = {
    name: 'Sentiment Line',
    desc: 'Get a random sentiment',
    createdBy: 'IronY',
};

const _ = require('lodash');
const Moment = require('moment');
const Models = require('funsociety-bookshelf-model-loader');
const logger = require('../../lib/logger');

module.exports = async app => {
    // Database not available
    if (!Models.Upvote) return scriptInfo;

    /**
     * Random Sentiment Handler
     * @param to
     * @param from
     * @returns {Promise<void>}
     */
    const randomSentimentHandler = async (to, from) => {
        try {
            // Grab results
            const result = await Models.Upvote.query(qb => qb
                .select('candidate', 'voter', 'text', 'result', 'channel', 'timestamp')
                .where('channel', to)
                .whereNotNull('text')
                .orderByRaw('rand()')
                .limit(1)).fetch();

            // No results
            if (!result) {
                app.say(to, `It seems there is no sentiments for ${to}, ${from}`);
                return;
            }

            // Format Disposition
            const disposition = result.get('result') === 1 ? '{likes|adores|commends}' : '{dislikes|hates|despises}';

            // Report back
            app.say(to, `${result.get('voter')} ${disposition} ${result.get('candidate')} ${result.get('text')} [${Moment(result.get('timestamp')).fromNow()}]`);
        } catch (err) {
            logger.error('Something went wrong in randomSentiment', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Something went wrong finding a random sentiment, ${from}`);
        }
    };
    app.Commands.set('random-sentiment', {
        desc: 'Get a random sentiment',
        access: app.Config.accessLevels.identified,
        call: randomSentimentHandler,
    });

    return scriptInfo;
};
