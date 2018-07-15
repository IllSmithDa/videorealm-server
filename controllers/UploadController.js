const db = require('../db.js');
var AWS = require('aws-sdk');
const User = require('../models/UserModel')

const STATUS_OK = 200;
const STATUS_USER_ERROR = 422;
const STATUS_SERVER_ERROR = 500;

const uploadProfileImage = (req, res) => {
  if (!req.files) return res.status(400).send('No files were uploaded.');

  const s3 = new AWS.S3();
  const myBucket = 'my.unique.bucket.userimages';
  const myKey = req.files.profPictureFile.md5;
  console.log(myKey);
  let params = { Bucket: myBucket, Key: myKey, Body: req.files.profPictureFile.data }

  s3.putObject(params, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully uploaded data to myBucket/myKey");
      params = { Bucket: myBucket, Key: myKey };
      let  url = s3.getSignedUrl('getObject', params);
      url = url.split(/\?/)[0];
      console.log('new url', url);

      User.findOne({username: req.session.username}, (err, userData) => {
        console.log(userData);
        userData.profilePictureID = req.files.profPictureFile.md5;
        userData
          .save()
          .then(() => {
            res.writeHead(301, {Location: `http://localhost:3000/profile`});
            res.end();
          })
          .catch(err => {
            console.log(err);
          })
      })
    }
  })
}
const deleteProfileImage = (req, res, next) => {

  User.findOne({username: req.session.username}, (err, userdata) => {
    const s3 = new AWS.S3();
    const myBucket = 'my.unique.bucket.userimages';
    const myKey = userdata.profilePictureID;
    if (myKey === 'DefaultPic.jpg') {
      next();
    } else {
      console.log('key', myKey);
      let params = { Bucket: myBucket, Key: myKey};
      s3.deleteObject(params, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          console.log(data)
          next();
        }
      })
    }
  })
}
const addDefaultPic = (req, res) => {
  if (!req.files) return res.status(400).send('No files were uploaded.');
  const s3 = new AWS.S3();
  const myBucket = 'my.unique.bucket.userimages';
  const myKey = 'DefaultPic.jpg';
  const params = { Bucket: myBucket, Key: myKey, Body: req.files.profPictureFile.data }
  s3.putObject(params, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully uploaded data to myBucket/myKey");
      const paramImage = {Bucket: myBucket, Key: myKey};
      s3.getObject(paramImage, (err, data) => {
        if (err) console.log(err)

        console.log(data);
        // res.status(STATUS_OK).json(data);
        res.writeHead(301, {Location: `http://localhost:3000/adminpage`});
        res.end();
      })
    }
  })
}

const listAllBucketObjects = (req, res) => {
  const s3 = new AWS.S3();
  const myBucket = 'my.unique.bucket.userimages';
  const numKeys = 2;
  const params = { Bucket: myBucket, MaxKeys: numKeys}
  s3.listObjects(params, (err, data) => {
    console.log(data);
    res.json(data)
  })
}

const getUserImage = (req, res) => {
  console.log(req.session.username)
  User.findOne({username: req.session.username}, (err, data) => {
    
    console.log(data.profilePictureID);
    const s3 = new AWS.S3();
    const myBucket = 'my.unique.bucket.userimages';
    const myKey = data.profilePictureID;
    const params = { Bucket: myBucket, Key: myKey};
    let url = s3.getSignedUrl('getObject', params);
    console.log('The URL is', url);
    url = url.split(/\?/)[0];
    console.log(url)
    res.status(STATUS_OK).json(url)
    /*
    s3.getObject(params, (err, data) => {
      if (err) console.log(err, err.stack); // an error occurred
      console.log(data);
      res.status(STATUS_OK).json(data.Body);
    })
    */
  })

/*
  const s3 = new AWS.S3();
  const myBucket = 'my.unique.bucket.userimages';
  const myKey = 'myBucketKey';
  const params = { Bucket: myBucket, Key: myKey};
  s3.getObject(params, (err, data) => {
    if (err) console.log(err, err.stack); // an error occurred
    console.log(data);
    res.json(data);
  })
*/
}
module.exports = {
  uploadProfileImage,
  deleteProfileImage,
  listAllBucketObjects,
  getUserImage,
  addDefaultPic
}