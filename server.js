const express = require('express');
const cors = require('cors');
const session = require('client-sessions');
const AWS = require('aws-sdk');

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
// got credentials working through this help
// https://stackoverflow.com/questions/26284181/aws-missing-credentials-when-i-try-send-something-to-my-s3-bucket-node-js
// https://docs.aws.amazon.com/sdk-for-java/v1/developer-guide/credentials.html
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESSKEYID,
  secretAccessKey: process.env.AWS_SECRETACCESSKEY
})

const s3 = new AWS.S3();
var myBucket = 'my.unique.bucket.userimages';
var myKey = 'myBucketKey';

s3.createBucket({Bucket: myBucket}, function(err, data) {

if (err) {

   console.log(err);

   } else {

     params = {Bucket: myBucket, Key: myKey, Body: 'Hello!'};

     s3.putObject(params, function(err, data) {

         if (err) {

             console.log(err)

         } else {

             console.log("Successfully uploaded data to myBucket/myKey");

         }

      });

   }

});