
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('userTable').del()
    .then( () => {
      // Inserts seed entries
      return knex('userTable').insert([
        {username: 'sam@sam.com', password: 'sdfwaeo'},
        {username: 'admin', password: 'admin'},
        {username: 'dan@dan.com', password: 'dan'},
        {username: 'joe@joe.com', password: 'asdfjkl;'}
      ]);
    });
};
