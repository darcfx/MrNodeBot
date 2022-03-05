exports.up = function (knex, Promise) {
    return knex.schema.createTable('mentioned', (table) => {
        //table.collate('utf8mb4_unicode_ci');
        table.increments('id').primary();
        table.string('nick');//.collate('utf8mb4_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
        table.integer('mention_id');//.references('mention_id');
    });
};
exports.down = function (knex, Promise) {
    return knex.schema.dropTable('mentioned');
};
