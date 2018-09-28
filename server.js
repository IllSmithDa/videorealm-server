const express = require('express');
const cors = require('cors');
const session = require('client-sessions');
const AWS = require('aws-sdk');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const favicon = require('serve-favicon');
const path = require('path');
const request = require('request');
const fs = require('fs');
const knex = require('knex');
const mysql = require('mysql');
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');
const server = express();

const routes = require('./routes/routes');
const requrl = require('./reqURL');

const port = 3030;

server.use(bodyParser.json());


const corsOption = {
  origin: requrl.reqURL,
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false
};
server.use(cors(corsOption));
server.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
/*
server.use((req, res, next) => {
  console.log(req.headers)
  res.setHeader("Access-Control-Allow-Origin", requrl.reqURL );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
*/

// required for uploading images and videos
server.use(fileUpload());
server.use(session({ 
  secret: process.env.NODE_SESSIONSECRET,
  cookieName: 'session',
  // duration: 30 * 60 * 1000,
  // activeDuration: 5 * 60 * 1000,
}));
server.listen(process.env.PORT || port, () => {
  // console.log(`server listening on port ${port}`);
});

routes(server);
// got credentials working through this help
// https://stackoverflow.com/questions/26284181/aws-missing-credentials-when-i-try-send-something-to-my-s3-bucket-node-js
// https://docs.aws.amazon.com/sdk-for-java/v1/developer-guide/credentials.html
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESSKEYID,
  secretAccessKey: process.env.AWS_SECRETACCESSKEY,
  region: 'us-west-1',
});

mongoose.Promise = global.Promise;
mongoose
  .connect(process.env.MONGOLAB_KEY)
  // .connect("mongodb://localhost:27017/loanie")
  .then(function() {
    console.log('Database connected successfully to Mongolab');
  })
  .catch(function(err) {
    console.log('DB connection failed..', err.message);
  });

// prevents heroku from setting wbesite to sleep due to inactivity
setInterval(() => {
  request(process.env.BACKEND_URL,(err) => {
    if (err) console.log(err);
    console.log('sucessfully reached website');
  });
}, 300000); // every 5 minutes (300000)
