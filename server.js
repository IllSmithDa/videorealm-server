const express = require('express');
const cors = require('cors');
const session = require('client-sessions');

const knex = require('knex');
const mysql = require('mysql');
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');
const server = express();

const routes = require('./routes/routes');

const port = 3030;


const corsOption = {
  origin: 'http://localhost:3000',
  credentials: true,
};
server.use(cors(corsOption));
server.use(bodyParser.json());
server.use(session({ 
  secret: process.env.NODE_SESSIONSECRET,
  cookieName: 'session',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}))
server.listen(port, () => {
  console.log(`server listening on port ${port}`);
})

routes(server);