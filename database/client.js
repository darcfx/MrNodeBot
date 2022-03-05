const _ = require('lodash');
const logger = require('../lib/logger');
const config = require('../config');

const client = new Promise((res, rej) => {
// Do not load ORM if we have a disabled database
    if (!config.knex.enabled) res(false);

    // Switch between engines
    const knexConfig =(
        config.knex.engine === 'sqlite' 
        ? config.knex.sqlite 
        : (
            config.knex.engine === 'mssql' 
            ? config.knex.mssql 
            : config.knex.mysql
        )
    );
    //config.knex.engine === 'sqlite' ? config.knex.sqlite : config.knex.mysql;

    // Knex configuration object
    const knexBuilder = {
    // debug: true,
        client: knexConfig.client,
        connection: knexConfig.connection,
        debug: true,
        supportBigNumbers: true,
        migrations: {
            directory: 'database/migrations',
        },
        seeds: {
            directory: 'database/seeds',
        },
    };

    if (config.knex.engine !== 'sqlite' && config.knex.engine !== 'mssql') {
        knexBuilder.pool = {
            min: 2,
            max: 10,
            afterCreate(conn, cb) {
                conn.query('SET sql_mode="NO_ENGINE_SUBSTITUTION";', (err) => {
                    cb(err, conn);
                });
            },
        };
    }

    // Set flags on sqlite instances
    if (config.knex.engine === 'sqlite') knexBuilder.useNullAsDefault = true;

    const knex = require('knex')(knexBuilder);

    // Make sure sqlite uses UTF8
    if (config.knex.engine === 'sqlite') knex.raw('PRAGMA encoding = "UTF-8"');

    /**
 * Validate Migration Results
 * @param {Object} results
 */
    const isEmptyResults = (results) => !results ||
    _.isEmpty(results) ||
    !_.isArray(results[1]) ||
    _.isEmpty(results[1]);

    /**
 * Process Migrations Results
 * @param {Object} results
 */
    const processResults = (results) => {
        if (isEmptyResults(results)) return;
        logger.info(`Processing Migration batch ${results[0]}`);
        _.forEach(results[1], (result) => logger.info(`Adding Migration: ${result}`));
    };

    // Update database to latest migration
    return knex.migrate
        .latest()
        .catch((err) => {
            logger.error('Error in updating to most recent migration', {
                message: err.message || '',
                stack: err.stack || '',
            });
            return rej(err);
        })
        .then((results) => {
            processResults(results);

            // Export bookshelf
            const bookShelf = require('bookshelf')(knex);

            require('funsociety-bookshelf-model-loader').init(bookShelf, {
                plugins: ['bookshelf-virtuals-plugin'], // Optional - Bookshelf plugins to load. Defaults to loading the 'virtuals', 'visibility' & 'registry' plugins
                excludes: [], // Optional - files to ignore
                path: `${__dirname}/models`, // Required
                modelOptions: {},
            });

            return res(bookShelf);
        });
});

module.exports = client;
