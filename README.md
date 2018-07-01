Using knex and mysql requires several different steps:
 
0. Install knex, sqlite3, and mysql
1. Create a 'knexfile.js' by using 'knex init'
2. Edit the knexfile based on what database you are using, 
who is hosting the database, name of database, username and password and set `useNullAsDefault` to true 
3. Create database folder for the project a migrations table using 'knex migrate:make tableName'
4. A database should be added to the database folder. However, if the database fails to be created, simply create it yourself.
5. When migrations file is created, note that the up function is what happens when we run the migrations and down function is 
about rolling back and undoing changes.
6. We are going to ask connect schema to create a table for us, add a callback function, and that callback functions will 
have specific functionality and labels for the table. 
  a. tbl.increments() automatically create a id for us and will increment for each entry for us. 
  b. tbl.string('name') creates a field on the table called 'name'
7. Run command 'knex migrate:latest" to run all the latest migrations that
have not yet ran.
8. Run command 'knex seed: make seedName' which creates a seed file and folder'. Seed files are what we use to actually add data 
to the database.
9. THe command 'knex seed: run' will run the seed file, and create the entries for the database
10. create some endpoints by creating a db.js file with the included boiler plate code
  a. Create a standard routes and controller folders with routes and controllers. Export db file to the controllers and use db to 
  store the income requests (posts) into the tables and databases that we have created. 
  b. uses functions like insert(), into() as well as async functions like then(), catch() etc.