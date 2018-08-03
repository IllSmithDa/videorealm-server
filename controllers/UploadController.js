const db = require('../db.js');
var AWS = require('aws-sdk');
const uniqueID = require('uniqid');
const User = require('../models/UserModel');
const requrl = require('../reqURL');

const STATUS_OK = 200;
const STATUS_USER_ERROR = 422;
const STATUS_SERVER_ERROR = 500;

const uploadProfileImage = (req, res) => {
  if (!req.files) return res.status(STATUS_USER_ERROR).send('No files were uploaded.');
  if (!(/.png/).test(req.files.profPictureFile.name) && !(/.jpg/).test(req.files.profPictureFile.name) &&
  !(/.bmp/).test(req.files.profPictureFile.name)) {
    res.writeHead(301, {Location: `${requrl.reqURL}/profile/${req.session.username}`});
    res.end();
  } else {
    const s3 = new AWS.S3();
    const myBucket = 'my.unique.bucket.userimages';
    const myKey = uniqueID();
    // console.log('my key:', myKey);
    let params = { Bucket: myBucket, Key: myKey, Body: req.files.profPictureFile.data }
    s3.putObject(params, (err, data) => {
      if (err) {
        res.status(STATUS_SERVER_ERROR).json({err});
      } else {
        // console.log("Successfully uploaded data to myBucket/myKey");
        params = { Bucket: myBucket, Key: myKey };
        let  url = s3.getSignedUrl('getObject', params);
        url = url.split(/\?/)[0];
        // console.log('new url', url);

        User.findOne({username: req.session.username}, (err, userData) => {
          // console.log(userData);
          userData.profilePictureID = myKey;
          userData
            .save()
            .then(() => {
              res.writeHead(301, {Location: `${requrl.reqURL}/profile/${userData.username}`});
              res.end();
            })
            .catch(err => {
              if (err) res.status(STATUS_SERVER_ERROR).json({err});
            })
        })
      }
    })
  }
}
const deleteProfileImage = (req, res, next) => {
  console.log(req.session.username);
  User.findOne({username: req.session.username}, (err, userdata) => {
    const s3 = new AWS.S3();
    const myBucket = 'my.unique.bucket.userimages';
    const myKey = userdata.profilePictureID;
    console.log('id',userdata.profilePictureID);
    if (myKey === 'DefaultPic.jpg') {
      next();
    } else {
      // console.log('key', myKey);
      let params = { Bucket: myBucket, Key: myKey};
      s3.deleteObject(params, (err, data) => {
        if (err) {
          if (err) res.status(STATUS_SERVER_ERROR).json({err});
        } else {
          // console.log(data)
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
      // console.log(err);
    } else {
      // console.log("Successfully uploaded data to myBucket/myKey");
      const paramImage = {Bucket: myBucket, Key: myKey};
      s3.getObject(paramImage, (err, data) => {
        if (err) res.status(STATUS_SERVER_ERROR).json({err});
        res.writeHead(301, {Location: `${requrl.reqURL}/adminpage`});
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
    // console.log(data);
    res.status(STATUS_USER_ERROR).json(data)
  })
}

const getUserImage = (req, res) => {
  // console.log(req.session.username)
  const usernameReq = req.body.username;
  console.log('username hreer',usernameReq)
  User.findOne({username: usernameReq}, (err, data) => {
    if (err) res.status(STATUS_OK).json({ error: err.stack });
    const s3 = new AWS.S3();
    const myBucket = 'my.unique.bucket.userimages';
    const myKey = data.profilePictureID;
    const params = { Bucket: myBucket, Key: myKey};
    let url = s3.getSignedUrl('getObject', params);
    url = url.split(/\?/)[0];
    res.status(STATUS_OK).json(url)
  })
}
module.exports = {
  uploadProfileImage,
  deleteProfileImage,
  listAllBucketObjects,
  getUserImage,
  addDefaultPic
}