exports.up = function (knex, Promise) {
    return knex.schema.createTable('mention', (table) => {
        //table.collate('utf8mb4_unicode_ci');
        table.increments('id').primary();
        table.string('text', 550);//.collate('utf8mb4_unicode_ci');
        table.string('by');//.collate('utf8mb4_unicode_ci');
        table.string('channel');//.collate('utf8mb4_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};
exports.down = function (knex, Promise) {
    return knex.schema.dropTable('mention');
};
