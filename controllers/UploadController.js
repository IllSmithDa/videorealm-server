const db = require('../db.js');
var AWS = require('aws-sdk');
const fs = require('fs');

const STATUS_OK = 200;
const STATUS_USER_ERROR = 422;
const STATUS_SERVER_ERROR = 500;

const uploadProfileImage = (req, res) => {
  console.log(req.files.profPictureFile);
  if (!req.files) return res.status(400).send('No files were uploaded.');
  
  let tempFile = req.files.profPictureFile;
  tempFile.mv(`./controllers/images/${req.files.profPictureFile.name}`, (err) => {
    if (err) return res.status(500).send(err);

   
    fs.readFile(`./controllers/images/${req.files.profPictureFile.name}`, (err, data) => {
      if (err) { throw err; }
      
      const s3 = new AWS.S3();
      const myBucket = 'my.unique.bucket.userimages';
      const myKey = 'myBucketKey';
      const params = { Bucket: myBucket, Key: myKey, Body: data }
      s3.putObject(params, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully uploaded data to myBucket/myKey");
          res.writeHead(301, {Location: `http://localhost:3000/profile}`});
          res.end();
        }
      })
    })
  })
}

const listAllBucketObjects = (req, res) => {
  const s3 = new AWS.S3();
  const myBucket = 'my.unique.bucket.userimages';
  const numKeys = 2;
  const params = { Bucket: myBucket, MaxKeys: numKeys}
  s3.listObjects(params, (err, data) => {
    console.log(data);
  })
}

const getUserImage = (req, res) => {
  const s3 = new AWS.S3();
  const myBucket = 'my.unique.bucket.userimages';
  const myKey = 'myBucketKey';
  const params = { Bucket: myBucket, Key: myKey};
  s3.getObject(params, (err, data) => {
    if (err) console.log(err, err.stack); // an error occurred
    console.log(data);
  })

}
module.exports = {
  uploadProfileImage,
  listAllBucketObjects,
  getUserImage
}