// Update with your config settings.
const dotenv =  require('dotenv').config();

module.exports = {

  development: {
    client: /*'sqlite3'*/ 'mysql',
    connection: {
      /*
      filename: './database/socialclub.db',
      */
     host: `${process.env.RDS_HOSTNAME}`, // provide the AWS or Firebase url 
     database: `${process.env.RDS_DATABASE}`,
     user:  `${process.env.RDS_USERNAME}`,
     password: `${process.env.RDS_PASSWORD}`
    },
    migrations: {
      tableName: 'migrations'
    },
    useNullAsDefault: true,
  },
  staging: {
    client: 'postgresql',
    connection: {
      database: 'posts',
      user:     'sam',
      password: 'kim'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'mysql',
    connection: {
      host: `${process.env.RDS_HOSTNAME}`, // provide the AWS or Firebase url 
      database: `${process.env.RDS_DATABASE}`,
      user:  `${process.env.RDS_USERNAME}`,
      password: `${process.env.RDS_PASSWORD}`
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
