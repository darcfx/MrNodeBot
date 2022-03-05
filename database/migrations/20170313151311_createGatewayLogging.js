exports.up = function (knex, Promise) {
    return knex.schema.createTable('gatewayLogging', (table) => {
        //table.collate('utf8mb4_unicode_ci');
        table.increments('id').primary();
        table.string('from');//.collate('utf8mb4_unicode_ci');
        table.string('to');//.collate('utf8mb4_unicode_ci');
        table.string('payload', 1000);//.collate('utf8mb4_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.dropTableIfExists('gatewayLogging');
};
