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

const getAllVideos = (req, res) => {
  Video.find({}, (err, videos) => {
    if (err) res.status(STATUS_SERVER_ERROR).json(err);
    res.status(STATUS_OK).json(videos);
  })
}

const getVideoByID = (req, res) => {

  const reqVideoID = req.body.videoID;
  Video.findOne({ _id: reqVideoID }, (err, videoData) => {

    if (err) res.state(STATUS_USER_ERROR).json(err)
    
    res.status(STATUS_OK).json(videoData);
  })
}

const addComment = (req, res) => {
  const commentUsername = req.session.username;
  console.log(commentUsername);
  console.log(req.body);
  const { comment, videoID, videoUploader } = req.body;

  Video.findOne({ _id: videoID}, (err, videoData) => {
    if (err) res.state(STATUS_USER_ERROR).json(err);
    // console.log('videodata', videoData)
    // console.log(comment);
    videoData.comments.push({ comment, username: commentUsername });

    videoData
      .save()
      .then(() => {
        User.findOne({username: videoUploader}, (err, userData) => {
          if (err) res.state(STATUS_USER_ERROR).json(err);
          let index = 0
          for(let j = 0; j < userData.videoList.length; j++) {
            if (videoID === userData.videoList[j]._id.toString()) {
              console.log('added man');
              userData.videoList[j].comments.push({ comment, username: commentUsername });
              index = j;
            }
          }
          userData
            .save()
            .then((data) => {
              // return data back to the client side
              console.log('data here', index);
              console.log(userData.videoList[0].comments)
              res.json(data.videoList[index].comments);
            })
            .catch((err) => {
              res.status(STATUS_USER_ERROR).json({ error: err.message });
            });
        })
      })
      .catch((err) => {
        res.status(STATUS_USER_ERROR).json({ error: err.message });
      });
  })
}
const addReplies = (req, res) => {
  const { videoID, videoUploader, replayStatement, commentIndex } = req.body;
  const reqUsername = req.session.username;
  console.log('id',videoID);
  Video.findOne({ _id: videoID }, (err, videoData) => {
    if (err) res.state(STATUS_USER_ERROR).json(err);
    console.log(videoUploader)
    videoData.comments[commentIndex].replies.push({  username: reqUsername, comment: replayStatement });
    videoData
      .save()
      .then(() => {
        console.log('uploader', videoUploader);
        User.findOne({ username: videoUploader }, (err, userData) => {
          if (err) res.state(STATUS_USER_ERROR).json(err);
          let tempIndex = 0;
          for (i = 0; i < userData.videoList.length; i++) { 
            // both need to be strings for correct comparison
            if (userData.videoList[i]._id.toString() === videoID) {
              userData.videoList[i].comments[commentIndex].replies.push({username: reqUsername, comment: replayStatement})
              tempIndex = i;
              break;
            } 
          }
          userData
            .save()
            .then((data) => {
              // send replies back to client side
              console.log('good data', data.videoList[tempIndex].comments[commentIndex].replies);
              res.status(200).json(data.videoList[tempIndex].comments[commentIndex].replies)
            })
            .catch((err) => {
              res.status(STATUS_SERVER_ERROR).json({ error: err.message });
            })
        });
      })
      .catch((err) => {
        res.status(STATUS_USER_ERROR).json({ error: err.message });
      })
    console.log(videoData);
  })
}

const deleteVideos = (req, res) => {
  s3 = new AWS.S3();
  const myBucket = 'my.unique.bucket.uservideos';
  const myKey = req.files.videoFile.md5;
  let params = { Bucket: myBucket, Key: myKey, Body: req.files.videoFile.data};
  
}

module.exports = {
  uploadVideo,
  getVideoList,
  getAllVideos,
  getVideoByID,
  addComment,
  addReplies,
  deleteVideos
}