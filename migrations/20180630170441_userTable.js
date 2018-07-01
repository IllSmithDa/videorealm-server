
exports.up = function(knex, Promise) {
  // what happens when we run migrations
  return knex.schema.createTable('userTable', (tbl) => {
    tbl.increments('id'); // creates id and increments it
    tbl.string('username', 255).notNullable().unique('account_username'); // has to unique, cannot be null, up to 255 chars
    tbl.string('password', 255).notNullable();
    tbl.timestamp('created_at').defaultTo(knex.fn.now());
  })
};

exports.down = function(knex, Promise) {
    // rollback or undo the changes when running dowm
    // drops the database which we don't really want to do
    // knex.schema.dropTableIfExist('userTable');
};
