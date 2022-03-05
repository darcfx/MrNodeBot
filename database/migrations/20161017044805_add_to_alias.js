exports.up = function (knex, Promise) {
    return knex.schema.table('alias', (table) => {
        table.string('channels', 1000);
        table.string('user');//.collate('utf8mb4_unicode_ci');
        table.string('host');//.collate('utf8mb4_unicode_ci');
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.table('alias', (table) => {
        table.dropColumns('user', 'host');
    });
};
