exports.up = function (knex) {
    return knex.schema.table('upvotes', table => Promise.all([
        knex.schema.hasColumn('upvotes', 'user').then((exists) => {
            if (!exists) knex.schema.table('upvotes', t => t.string('user'));//.collate('utf8mb4_unicode_ci'));
        }),
        knex.schema.hasColumn('upvotes', 'host').then((exists) => {
            if (!exists) knex.schema.table('upvotes', t => t.string('host'));//.collate('utf8mb4_unicode_ci'));
        }),
    ]));
};

exports.down = function (knex, Promise) {
    return knex.schema.table('upvotes', (table) => {
    });
};
