const AWS = require('aws-sdk');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const uniqueID = require('uniqid');
const Video = require('../models/VideoModel');
const User = require('../models/UserModel');
const STATUS_OK = 200;
const STATUS_USER_ERROR = 422;
const STATUS_SERVER_ERROR = 500;

const uploadVideo = (req, res) => {
  if (!req.files) return res.status(400).send('No files were uploaded.');

  s3 = new AWS.S3();
  const myBucket = 'my.unique.bucket.uservideos';
  const myKey = uniqueID();
  // console.log('unique key', myKey);
  let params = { Bucket: myBucket, Key: myKey, Body: req.files.videoFile.data};
  
  s3.putObject(params, (err, data) => {
    params = {Bucket: myBucket, Key: myKey};
    let url = s3.getSignedUrl('getObject', params);
    // console.log('The URL is', url);
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
             // console.log('file deleted!')
            });
            thumbParams = { Bucket: myBucket, Key: thumbKey }
            let thumbURL = s3.getSignedUrl('getObject', thumbParams)
            thumbURL = thumbURL.split(/\?/)[0];
            
            /*
            const video = new Video({ videoList: [{ userName: req.session.username, videoID: myKey, videoURL: url, 
            videoName: req.body.videoName, videoThumbnailID: thumbKey, videoThumbURL: thumbURL }] });
            video.save()
              .then(() => {
                User.findOne({ username: req.session.username }, (err, userData) => {
                  const video2 = { userName: req.session.username, videoID: myKey, videoURL: url, 
                    videoName: req.body.videoName, videoThumbnailID: thumbKey, videoThumbURL: thumbURL };
                  // console.log(video);
                  userData.videoList.push(video2);
                  userData
                  .save()
                  .then(() => {
                    res.writeHead(301, {Location: `https://friendrealm.herokuapp.com/account`});
                    res.end();
                  })
                  .catch((err) => {
                    res.status(STATUS_SERVER_ERROR).json(err);
                  })
                })
              })
              .catch((err) => {
                res.status(STATUS_SERVER_ERROR).json(err);
              })
            */
          const video = { userName: req.session.username, videoID: myKey, videoURL: url, 
             videoName: req.body.videoName, videoThumbnailID: thumbKey, videoThumbURL: thumbURL };
            
            Video.find({}, (err, videoData) => {
              // console.log(videoData.videoList);
              videoData[0].videoList.push(video);
              videoData[0]
                .save()
                .then(() => {
                  User.findOne({ username: req.session.username }, (err, userData) => {
                    // console.log(video);
                    userData.videoList.push(video);
                    userData
                    .save()
                    .then(() => {
                      res.writeHead(301, {Location: `https://friendrealm.herokuapp.com/account`});
                      res.end();
                    })
                    .catch((err) => {
                      res.status(STATUS_SERVER_ERROR).json(err);
                    })
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
    // console.log(userData[0].videoList)
    res.status(STATUS_OK).json(userData[0].videoList);
  })
}

const getAllVideos = (req, res) => {
  Video.find({}, (err, videos) => {
    // console.log(videos[0].videoList);
    if (err) res.status(STATUS_SERVER_ERROR).json(err);
    res.status(STATUS_OK).json(videos[0].videoList);
  })
}

const getVideoByID = (req, res) => {

  const reqVideoID = req.body.videoID;
  Video.find({}, (err, videoData) => {
    if (err) res.state(STATUS_USER_ERROR).json(err)

    // console.log(videoData[0].videoList);  
    for (let i = 0; i < videoData[0].videoList.length; i++) {
      if (reqVideoID === videoData[0].videoList[i].videoID) {
        // console.log('match found');
        res.status(STATUS_OK).json(videoData[0].videoList[i]);
      }
    }
  })
}

const addComment = (req, res) => {
  const commentUsername = req.session.username;
  // console.log(commentUsername);
  // console.log(req.body);
  const { comment, videoID, videoUploader } = req.body;

  Video.find({}, (err, videoData) => {
    if (err) res.state(STATUS_USER_ERROR).json(err);
    
    for (let i = 0; i < videoData[0].videoList.length; i++) {
      if (videoID === videoData[0].videoList[i].videoID) {
        videoData[0].videoList[i].comments.push({ comment, username: commentUsername})
      }
    }
    videoData[0]
      .save()
      .then(() => {
        User.findOne({username: videoUploader}, (err, userData) => {
          if (err) res.state(STATUS_USER_ERROR).json(err);
          let index = 0
          for(let j = 0; j < userData.videoList.length; j++) {
            if (videoID === userData.videoList[j].videoID) {
              // console.log('added comment');
              userData.videoList[j].comments.push({ comment, username: commentUsername });
              index = j;
            }
          }
          userData
            .save()
            .then((data) => {
              // return data back to the client side
              // console.log('data here', index);
              // console.log(userData.videoList[0].comments)
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
  const { videoID, videoUploader, replyStatement, commentIndex } = req.body;
  const reqUsername = req.session.username;
  // console.log('id',videoID);
  Video.find({}, (err, videoData) => {
    if (err) res.state(STATUS_USER_ERROR).json(err);

    for (let i = 0; i < videoData[0].videoList.length; i++) {
      if (videoID === videoData[0].videoList[i].videoID) {
        videoData[0].videoList[i].comments[commentIndex].replies.push({ username: reqUsername, comment: replyStatement })
      }
    }
    videoData[0]
      .save()
      .then(() => {
        User.findOne({ username: videoUploader }, (err, userData) => {
          if (err) res.state(STATUS_USER_ERROR).json(err);
          let tempIndex = 0;
          for (i = 0; i < userData.videoList.length; i++) { 
            // both need to be strings for correct comparison
            if (userData.videoList[i].videoID === videoID) {
              userData.videoList[i].comments[commentIndex].replies.push({username: reqUsername, comment: replyStatement})
              tempIndex = i;
              break;
            } 
          }
          userData
            .save()
            .then((data) => {
              // send replies back to client side
              // // console.log('good data', data.videoList[tempIndex].comments[commentIndex].replies);
              res.status(200).json(data.videoList[tempIndex].comments[commentIndex].replies)
            })
            .catch((err) => {
              res.status(STATUS_SERVER_ERROR).json({ error: err.message });
            })
        });
      })
      .catch((err) => {
        res.status(STATUS_SERVER_ERROR).json({ error: err.message });
      })
  })
}

const deleteVideos = (req, res) => {
  s3 = new AWS.S3();
  const myBucket = 'my.unique.bucket.uservideos';
  const videoList = { Objects: req.body.videoIDList };
  let params = { Bucket: myBucket, Delete: videoList, Quiet: false };
  s3.deleteObjects(params, (err, data) => {
    if (err) // console.log(err);
    // console.log(data);
    User.find({ username: req.session.username }, (err, userData) => {
      if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message });

      let videoListArr = req.body.videoIDList;
      for (let i = 0; i < videoListArr.length; i++) {
        for (let j = 0; j < userData[0].videoList.length; j++) {
          if (videoListArr[i].Key === userData[0].videoList[j].videoID)
            userData[0].videoList.splice(j, 1);
        }
      }
      userData[0]
        .save()
        .then(() => {
          Video.find({}, (err, vidData) => {
            if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message });
            // console.log(vidData.length)
            for (let k = 0; k < videoListArr.length; k++) {
              for (let t = 0; t < vidData[0].videoList.length; t++) {
                if (videoListArr[k].Key === vidData[0].videoList[t].videoID) {
                  // console.log('one video', vidData[0].videoList[t].videoID);
                  // console.log('one video', videoListArr[k].Key);
                  vidData[0].videoList.splice(t, 1);
                }
              }
            }
            // console.log('good video data',vidData);
            vidData[0]
              .save()
              .then(() => {
                res.status(STATUS_OK).json({ sucess: true });
              })
              .catch((err) => {
                res.status(STATUS_SERVER_ERROR).json({ error: err.message });
              })
          })
 
        })
        .catch((err) => {
          res.status(STATUS_SERVER_ERROR).json({ error: err.message });
        })
    })
  })
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