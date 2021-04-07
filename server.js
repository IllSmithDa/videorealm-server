const express = require('express');
const cors = require('cors');
const session = require('client-sessions');
const AWS = require('aws-sdk');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const favicon = require('serve-favicon');
const path = require('path');
const request = require('request');
const bcrypt = require('bcrypt');
const server = express();

const routes = require('./routes/routes');
const requrl = require('./reqURL');

const port = 3031;

server.use(express.json());
require('dotenv').config();

var corsOptions = {
  origin: requrl.reqURL,
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false
};
server.use(cors(corsOptions));
/*
const corsOption = {
  origin: requrl.reqURL,
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false
}
server.use(cors(corsOption));
server.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

server.use((req, res, next) => {
  console.log(req.headers);
  res.setHeader('Access-Control-Allow-Origin', requrl.reqURL );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});
*/
// required for uploading images and videos

server.use(fileUpload());
server.use(session({ 
  cookieName: 'mySession',
  secret: process.env.NODE_SESSIONSECRET,
  // duration: 30 * 60 * 1000,
  // activeDuration: 5 * 60 * 1000,
}));

//https://stackoverflow.com/questions/15693192/heroku-node-js-error-web-process-failed-to-bind-to-port-within-60-seconds-of
// add process.env.PORT to avoid this issue
server.listen(process.env.PORT || port, () => {
  console.log(`server listening on port ${port}`);
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
  .connect(process.env.MONGOALTLAS_KEY, {dbName: 'socialclub-users', useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true})
  //.connect('mongodb://localhost:27017/loanie')
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
}, 900000); // every 5 minutes (300000)
