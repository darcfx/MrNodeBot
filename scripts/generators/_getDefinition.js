const _ = require('lodash');
const rp = require('request-promise-native');
const xray = require('x-ray')();
const shortService = require('../lib/_getShortService')();

const endPoint = 'http://www.dictionary.com/browse';

module.exports = async (word) => {
    const apiUrl = `${endPoint}/${word}`;
    try {
        const results = await rp({
            uri: apiUrl,
            json: false,
            method: 'GET',
            query: {
                s: 't',
            },
        });

        const definition = await new Promise((res, rej) => {
            xray(results, {
                definition: 'meta[name="description"]@content',
                type: 'span.luna-pos',
                date: 'span.luna-date',
            })((err, xresults) => {
                if (err) {
                    // Something actually went wrong
                    err.message = 'Something went wrong attempting to contact the provider.';
                    logger.error(err.message, {
                        stack: err.stack || '',
                    });
                    rej(err);
                    return;
                }

                if (!xresults || !xresults.definition || !_.isString(xresults.definition)) {
                    res(`No definition is available for ${xresults.definition}`);
                    return;
                }

                shortService(apiUrl).then(link => {
                    // Set the Page Title
                    res({
                        definition: text,
                        type: _.upperFirst(xresults.type).replace(',', '').trim(),
                        date: _.isString(xresults.date) ? xresults.date.replace(';', '').trim() : 'No Date',
                        link
                    });
                });
            });
        });

        return definition;

    } catch (err) {
        const error = new Error('Something went wrong getting a definition');
        error.innerErr = err;
        throw error;
    }
};
