const AWS = require('aws-sdk');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const Video = require('../models/VideoModel');
const User = require('../models/UserModel');
const STATUS_OK = 200;
const STATUS_USER_ERROR = 422;
const STATUS_SERVER_ERROR = 500;

const uploadVideo = (req, res) => {
  if (!req.files)
  return res.status(400).send('No files were uploaded.');
  console.log(req.body.videoName);
  s3 = new AWS.S3();
  const myBucket = 'my.unique.bucket.uservideos';
  const myKey = req.files.videoFile.md5;
  let params = { Bucket: myBucket, Key: myKey, Body: req.files.videoFile.data};
  console.log(myKey); 
  s3.putObject(params, (err, data) => {
    params = {Bucket: myBucket, Key: myKey};
    let url = s3.getSignedUrl('getObject', params);
    console.log('The URL is', url);
    url = url.split(/\?/)[0];
    ffmpeg(url)
      .on('end', () => {

        // read newly created thumbnail file to convert it to buffer
        fs.readFile(`./controllers/thumbnails/${myKey}tn.jpg`, function (err, data) {
          if (err) { throw err; }
          const base64data = new Buffer(data, 'binary');
          const thumbKey = `${ myKey }tn.jpg`;
          let thumbParams = { Bucket: myBucket, Key: thumbKey, Body: base64data }

          s3.putObject(thumbParams, (err, data) => {
            fs.unlink( `./controllers/thumbnails/${myKey}tn.jpg`, err => {
              if (err) throw err;
             //console.log('file deleted!')
            });
            thumbParams = { Bucket: myBucket, Key: thumbKey }
            let thumbURL = s3.getSignedUrl('getObject', thumbParams)
            thumbURL = thumbURL.split(/\?/)[0];
            const video = new Video({ userName: req.session.username, videoID: req.files.videoFile.md5, videoURL: url, 
              videoName: req.body.videoName, videoThumbnailID: thumbKey, videoThumbURL: thumbURL });
            video
              .save()
              .then(() => {
                User.findOne({ username: req.session.username }, (err, userData) => {
                  console.log(video);
                  userData.videoList.push(video);
                  userData
                  .save()
                  .then(() => {
                    res.writeHead(301, {Location: `http://localhost:3000/account`});
                    res.end();
                  })
  
                })
              })
              .catch((err) => {
                res.status(STATUS_SERVER_ERROR).json(err);
              })
          })
        })
      })
      .on('error', function(err) {
        console.error(err);
      })
      .screenshots({
        // Will take screenshots at 20%, 40%, 60% and 80% of the video
        count: 1,
        filename:`${myKey}tn.jpg`,
        folder: './controllers/thumbnails',
        size: '200x150'
      });
  })
}

const getVideoList = (req, res) => {
  User.find({ username: req.session.username }, (err, userData) => {
    if (err) res.status(STATUS_USER_ERROR).json(err);
    console.log(userData[0].videoList);
    res.status(STATUS_OK).json(userData[0].videoList);
  })
}


module.exports = {
  uploadVideo,
  getVideoList,
}