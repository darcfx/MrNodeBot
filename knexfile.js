// This configuration file is used primary by the knex cli tool
const config = require('./config');
// Switch between engines
const knexConfig = (
	config.knex.engine === 'sqlite' 
	? config.knex.sqlite 
	: (
		config.knex.engine === 'mssql' 
		? config.knex.mssql 
		: config.knex.mysql
	)
);

module.exports = {
    development: {
        client: knexConfig.client,
        connection: knexConfig.connection,
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: 'database/migrations',
            tableName: 'knex_migrations',
        },
        seeds: {
            directory: 'database/seeds',
        },
    },
};
