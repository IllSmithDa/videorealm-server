const express = require('express');
const knex = require('knex');
const mysql = require('mysql');
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');
const server = express();

const routes = require('./routes/routes');

const port = 3031;

server.use(bodyParser.json());
server.listen(port, () => {
  console.log(`server listening on port ${port}`);
})

routes(server);