const AWS = require('aws-sdk');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static').path;
const ffprobe = require('@ffprobe-installer/ffprobe').path;
const uniqueID = require('uniqid');
const fs = require('fs-extra');
const tmp = require('tmp');
const Video = require('../models/VideoModel');
const User = require('../models/UserModel');
const requrl = require('../reqURL');
const STATUS_OK = 200;
const STATUS_USER_ERROR = 422;
const STATUS_SERVER_ERROR = 500;

ffmpeg.setFfmpegPath('/app/node_modules/@ffprobe-installer/win32-x64/ffprobe');
ffmpeg.setFfprobePath(ffprobe);

const uploadVideo = (req, res) => {
  console.log(req.body.videoThumbnailID);
  const { videoThumbnailID, videoThumbURL } = req.body;
  if (!req.files) return res.status(400).send('No files were uploaded.');
  const s3 = new AWS.S3();
  const myBucket = 'my.unique.bucket.uservideos';
  const myKey = uniqueID();
  // // console.log('unique key', myKey);
  let params = { Bucket: myBucket, Key: myKey, Body: req.files.videoFile.data};
  
  s3.putObject(params, () => {
    params = {Bucket: myBucket, Key: myKey};
    let signedurl = s3.getSignedUrl('getObject', params);
    // // console.log('The URL is', url);
    // getting the date for video creation
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June',
      'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
    ];
    const myDate = new Date();
    const getYear = myDate.getFullYear().toString();
    const getMonth = monthNames[myDate.getMonth()];
    const getDay = myDate.getDate().toString();
    const fullDate = `${getMonth} ${getDay}, ${getYear}`;
    let url = signedurl.split(/\?/)[0];
    const video = {
      userName: req.session.username,
      videoID: myKey, videoURL: url, 
      videoName: req.body.videoName,
      videoDate: fullDate,
      videoThumbnailID,
      videoThumbURL,
    };
    Video.find({}, (err, videoData) => {
      if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.stack});
      // console.log('reached phase 1');
      videoData[0].videoList.unshift(video);
      videoData[0]
        .save()
        .then(() => {
          User.findOne({ username: req.session.username }, (err, userData) => {
            console.log(userData);
            if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.stack});
            if (userData === undefined) {
              res.json({ error: 'user with that email does not exist'});
            } 
            // console.log('reached phase 2');
            userData.videoList.unshift(video);
            userData
              .save()
              .then(() => {
                // console.log('reaced phase 3');
                res.writeHead(301, {Location: `${requrl.reqURL}/account`});
                res.end();
              })
              .catch((err) => {
                res.status(STATUS_SERVER_ERROR).json({ error: err.message});
              });
          });
        })
        .catch((err) => {
          res.status(STATUS_SERVER_ERROR).json({ error: err.message});
        });
    });            
  });
};

const createScreenshot = (req, res, next) => {
  ///if (!req.files) return res.status(400).send('No files were uploaded.');
  const videoFile = req.files.videoFile;
  // console.log(videoFile);
  const newFileName = uniqueID();

  tmp.dir(function _tempDirCreated(err, path, cleanupCallback) {
    if (err) res.status(STATUS_USER_ERROR).json({ error: err.message});
    console.log(`${path}\\${newFileName}.mp4s`);
    videoFile.mv(`${path}\\${newFileName}.mp4`, () => {
      ffmpeg(`${path}\\${newFileName}.mp4`)
        .on('filenames', function(filenames) {
          console.log('Will generate ' + filenames.join(', '));
        })
        .on('end', function() {
          const s3 = new AWS.S3();
          const myBucket = 'my.unique.bucket.uservideos';
          const myKey = `${newFileName}.jpg`;

          const file = fs.createReadStream(`${path}\\${newFileName}.jpg`);
          let params = { Bucket: myBucket, Key: myKey, Body: file};
          console.log(`${path}\\${newFileName}.jpg`);          
          s3.upload(params, {}, (err) => {
            if (err) res.status(STATUS_USER_ERROR).json({ error: err.message});
            params = {Bucket: myBucket, Key: myKey};
            let signedurl = s3.getSignedUrl('getObject', params);
            let url = signedurl.split(/\?/)[0];
            req.body.videoThumbnailID = myKey;
            req.body.videoThumbURL = url;
            
            console.log('reached');
            fs.remove(`${path}`, () => {
              next();
            });
          });
        })
        .screenshots({
          // Will take screens at 20%, 40%, 60% and 80% of the video
          count: 1,
          folder: `${path}`,
          filename: `${newFileName}.jpg`,
          size: '500x275',
        });
    });
  });
};

const screenShotTest = (req, res) => {
  ///if (!req.files) return res.status(400).send('No files were uploaded.');
  const videoFile = req.files.videoFile;
  // console.log(videoFile);
  const newFileName = 'j5a7hh7gjkunw2y7';

  tmp.dir(function _tempDirCreated(err, path, cleanupCallback) {
    if (err) res.status(STATUS_USER_ERROR).json({ error: err.message});
    console.log(`${path}\\${newFileName}.mp4s`);
    videoFile.mv(`${path}\\${newFileName}.mp4`, () => {
      ffmpeg(`${path}\\${newFileName}.mp4`)
        .on('filenames', function(filenames) {
          console.log('Will generate ' + filenames.join(', '));
        })
        .on('end', function() {
          const s3 = new AWS.S3();
          const myBucket = 'my.unique.bucket.uservideos';
          const myKey = `${newFileName}.jpg`;

          const file = fs.createReadStream(`${path}\\${newFileName}.jpg`);
          let params = { Bucket: myBucket, Key: myKey, Body: file};
          console.log(`${path}\\${newFileName}.jpg`);          
          s3.upload(params, {}, (err) => {
            if (err) res.status(STATUS_USER_ERROR).json({ error: err.message});
            console.log('reached');
            fs.remove(`${path}`, () => {
              res.json({ success: true });
            });
          });
        })
        .screenshots({
          // Will take screens at 20%, 40%, 60% and 80% of the video
          count: 1,
          folder: `${path}`,
          filename: `${newFileName}.jpg`,
          size: '500x275',
        });
    });
  });
};


const countNumVideos = (req, res, next) => {
  User.find({username: req.session.username}, (err, userData) => {
    // console.log('match found');
    if (err) res.status(STATUS_USER_ERROR).json({ error: err.message});
    if (userData[0].videoList.length >= 5) {
      res.writeHead(301, {Location: `${requrl.reqURL}/account`});
      res.end();
    } else {
      next();
    }
  });
};
const getVideoList = (req, res) => {
  const reqUsername = req.session.username;
  if (reqUsername=== undefined || reqUsername === null || reqUsername === ''){
    res.json({error: 'user is not logged in'});
  } else {
    User.find({ username: reqUsername }, (err, userData) => {
      if (err) res.status(STATUS_USER_ERROR).json({ error: err.message});
      // // console.log(userData[0].videoList)
      res.status(STATUS_OK).json(userData[0].videoList);
    });
  }
};

const postVideoList = (req, res) => {
  const reqUsername = req.body.username;
  User.find({ username: reqUsername }, (err, userData) => {
    if (err) res.status(STATUS_USER_ERROR).json({ error: err.message});
    res.status(STATUS_OK).json(userData[0].videoList);
  });
};

const getAllVideos = (req, res) => {
  const maxVideos = 50;
  const { index } = req.body;
  let { reachedEnd } = req.body;
  const videoArr = [];
  Video.find({}, (err, videos) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message});
    // console.log(videos[0].videoList);
    for (let i = index; i < videos[0].videoList.length; i++) {
      videoArr.push(videos[0].videoList[i]);
      if (i === videos[0].videoList.length - 1 || i === maxVideos) {
        reachedEnd = true;
        break;
      }

      if (i === index + 4) {
        break;
      }
    }
    res.status(STATUS_OK).json({videoArr , reachedEnd});
  });
};

const getPopularVideos = (req, res) => {
  const maxVideos = 50;
  const { index } = req.body;
  let { reachedEnd } = req.body;
  let videoArr = [];
  Video.find({}, (err, videos) => {
    videos[0].videoList.sort((a, b) => {
      return b.views - a.views;
    });
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message});
    // console.log(videos[0].videoList);
    for (let i = index; i < videos[0].videoList.length; i++) {
      videoArr.push(videos[0].videoList[i]);
      if (i === videos[0].videoList.length - 1 || i === maxVideos) {
        reachedEnd = true;
        break;
      }
      if (i === index + 4) {
        break;
      }
    }
    // console.log(reachedEnd);
    res.status(STATUS_OK).json({videoArr , reachedEnd});
  });
};


const getFirstVideoName = (req, res) => {
  const { index } = req.body;
  Video.find({}, (err, videoData) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message});
    // console.log(videoData[0].videoList[0].videoName)
    res.status(STATUS_OK).json(videoData[0].videoList[0].videoName);
  });
};

const deleteUserVideos = (req, res, next) => {
  const videoIDList = [];
  const s3 = new AWS.S3();
  const myBucket = 'my.unique.bucket.uservideos';

  Video.find({}, (err, videoData) => {
    if (err) res.state(STATUS_USER_ERROR).json(err);

    // console.log(videoData);
    for (let i = 0; i < videoData[0].videoList.length; i++) {
      if (req.session.username === videoData[0].videoList[i].userName) {
        videoIDList.push(videoData[0].videoList[i].videoID);
        videoData[0].videoList.splice(i, 1);
      }
    }
    videoData[0]
      .save()
      .then(() => {
        const videoList = { Objects: videoIDList };
        // console.log((videoList.Objects));
        if (videoList.Objects.length < 1) {
          next();
        } else {
          let params = { Bucket: myBucket, Delete: videoList };
          s3.deleteObjects(params, (err) => {
            // console.log('afewf')
            if (err) res.status(STATUS_SERVER_ERROR).json({error: err.message});
            else {
              next();
            }
            // res.json(STATUS_OK).json({ success: true })
          });
        }
      })
      .catch((err) => {
        res.status(STATUS_SERVER_ERROR).json({error: err.message});
      });
  });
};

const getVideoByID = (req, res) => {
  const reqVideoID = req.body.videoID;
  Video.find({}, (err, videoData) => {
    if (err) res.state(STATUS_USER_ERROR).json(err);

    // console.log(videoData[0].videoList);  
    for (let i = 0; i < videoData[0].videoList.length; i++) {
      if (reqVideoID === videoData[0].videoList[i].videoID) {
        // console.log('match found');
        res.status(STATUS_OK).json(videoData[0].videoList[i]);
        break;
      }
      if (i === videoData[0].videoList.length - 1) {
        res.json({ error: 'video does not exist' });
      }
    }
  });
};

const getCommentList = (req, res) => {
  const { index, videoID } = req.body;
  let { reachedEnd } = req.body;
  const commentArr = [];
  Video.find({}, (err, videoData) => {
    if (err) res.state(STATUS_USER_ERROR).json(err);

    // console.log(videoData[0].videoList);  
    for (let i = 0; i < videoData[0].videoList.length; i++) {
      if (videoID === videoData[0].videoList[i].videoID) {
        // console.log('match found');
        // console.log(videoData[0].videoList[i].comments)
        for (let j = 0; j < videoData[0].videoList[i].comments.length; j++) {
          commentArr.push(videoData[0].videoList[i].comments[j]);
          if (i === videoData[0].videoList[i].comments.length - 1) {
            reachedEnd = true;
            break;
          }
          if (j === index + 4) {
            break;
          }
        }
        res.status(STATUS_OK).json({reachedEnd, commentArr});
        break;
      }
      if (i === videoData[0].videoList.length - 1) {
        res.json({ error: 'video does not exist' });
      }
    }
  });
};

const getReplyList = (req, res) => {
  const { index, videoID, commentIndex } = req.body;
  let { reachedEnd } = req.body;
  const repliesArr = [];
  Video.find({}, (err, videoData) => {
    if (err) res.state(STATUS_USER_ERROR).json(err);

    // console.log(videoData[0].videoList);  
    for (let i = 0; i < videoData[0].videoList.length; i++) {
      if (videoID === videoData[0].videoList[i].videoID) {
        for (let j = 0; j < videoData[0].videoList[i].comments.length; j++) {
          if (commentIndex === videoData[0].videoList[i].comments[j].commentIndex) {
            for (let k = 0; k < videoData[0].videoList[i].comments[j].replies.length; k++) {
              repliesArr.push(videoData[0].videoList[i].comments[j].replies[k]);
              if (k === videoData[0].videoList[i].comments[j].replies.length - 1) {
                reachedEnd = true;
                break;
              }
              if (k === index + 4) {
                break;
              }
            }
          }
        }
        console.log(repliesArr);
        res.status(STATUS_OK).json({reachedEnd, repliesArr});
        break;
      }
      if (i === videoData[0].videoList.length - 1) {
        res.json({ error: 'video does not exist' });
      }
    }
  });
};


const videoSearch = (req, res) => {
  const { index } = req.body;
  let {searchTerm, reachedEnd } = req.body;

  // console.log(searchTerm)
  const patt = new RegExp(searchTerm.toUpperCase());
  const searchResults = [];

  Video.find({}, (err, videos) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message });
    const maxVideos = 50;
    // console.log('length',videos[0].videoList.length);
    let i = index;
    for (i; i < videos[0].videoList.length; i++) {
      // console.log('data', videos[0].videoList[i])
      if (patt.test(videos[0].videoList[i].videoName.toUpperCase())) {
        searchResults.push(videos[0].videoList[i]);
      }
      if (i === videos[0].videoList.length - 1 || i === maxVideos) {
        reachedEnd = true;
        break;
      }
      if (index === 0 && searchResults.length === 10) {
        break;
      }
      if (index !== 0 && searchResults.length === 5) {
        break;
      }
    }
    res.status(STATUS_OK).json({reachedEnd, searchResults, index: i});
  });
};

const addComment = (req, res) => {
  const commentUsername = req.session.username;
  // // console.log(commentUsername);
  // // console.log(req.body);
  const { comment, videoID, videoUploader, index } = req.body;

  Video.find({}, (err, videoData) => {
    if (err) res.state(STATUS_USER_ERROR).json({ error: err.message});
    
    for (let i = 0; i < videoData[0].videoList.length; i++) {
      if (videoID === videoData[0].videoList[i].videoID) {
        const commentIndex = videoData[0].videoList[i].comments.length;
        videoData[0].videoList[i].comments.push({ comment, username: commentUsername, commentIndex});
      }
    }
    videoData[0]
      .save()
      .then(() => {
        User.findOne({username: videoUploader}, (err, userData) => {
          console.log(userData);
          if (err) res.state(STATUS_USER_ERROR).json({ error: err.message});
          let index = 0;
          for(let j = 0; j < userData.videoList.length; j++) {
            if (videoID === userData.videoList[j].videoID) {
              const commentIndex = userData.videoList[j].comments.length;
              userData.videoList[j].comments.push({ comment, username: commentUsername, commentIndex });
              index = j;
            }
          }
          userData
            .save()
            .then((data) => {
              // return data back to the client side
              // // console.log('data here', index);
              // console.log(data.videoList[0].comments)
              res.status(STATUS_OK).json(data.videoList[index].comments);
            })
            .catch((err) => {
              res.status(STATUS_USER_ERROR).json({ error: err.message });
            });
        });
      })
      .catch((err) => {
        res.status(STATUS_USER_ERROR).json({ error: err.message });
      });
  });
};

const addReplies = (req, res) => {
  const { videoID, videoUploader, replyStatement, commentIndex } = req.body;
  const reqUsername = req.session.username;
  // // console.log('id',videoID);
  Video.find({}, (err, videoData) => {
    if (err) res.state(STATUS_USER_ERROR).json({ error: err.message});

    for (let i = 0; i < videoData[0].videoList.length; i++) {
      if (videoID === videoData[0].videoList[i].videoID) {
        videoData[0].videoList[i].comments[commentIndex].replies.push({ username: reqUsername, comment: replyStatement });
      }
    }
    videoData[0]
      .save()
      .then(() => {
        User.findOne({ username: videoUploader }, (err, userData) => {
          if (err) res.state(STATUS_USER_ERROR).json({ error: err.message});
          let tempIndex = 0;
          for (let i = 0; i < userData.videoList.length; i++) { 
            // both need to be strings for correct comparison
            if (userData.videoList[i].videoID === videoID) {
              userData.videoList[i].comments[commentIndex].replies.push({username: reqUsername, comment: replyStatement});
              tempIndex = i;
              break;
            } 
          }
          userData
            .save()
            .then((data) => {
              // send replies back to client side
              // // // console.log('good data', data.videoList[tempIndex].comments[commentIndex].replies);
              res.status(200).json(data.videoList[tempIndex].comments[commentIndex].replies);
            })
            .catch((err) => {
              res.status(STATUS_SERVER_ERROR).json({ error: err.message });
            });
        });
      })
      .catch((err) => {
        res.status(STATUS_SERVER_ERROR).json({ error: err.message });
      });
  });
};

const deleteVideos = (req, res) => {
  const s3 = new AWS.S3();
  const myBucket = 'my.unique.bucket.uservideos';
  const videoList = { Objects: req.body.videoIDList };
  const thumbnailList = [];
  let params = { Bucket: myBucket, Delete: videoList };
  s3.deleteObjects(params, (err) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message });
    // // console.log(data);
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
            // // console.log(vidData.length)
            for (let k = 0; k < videoListArr.length; k++) {
              for (let t = 0; t < vidData[0].videoList.length; t++) {
                if (videoListArr[k].Key === vidData[0].videoList[t].videoID) {
                  thumbnailList.push(vidData[0].videoList[t].videoThumbnailID);
                  // // console.log('one video', vidData[0].videoList[t].videoID);
                  // // console.log('one video', videoListArr[k].Key);
                  vidData[0].videoList.splice(t, 1);
                }
              }
            }
            // // console.log('good video data',vidData);
            vidData[0]
              .save()
              .then(() => {
                console.log('list', thumbnailList);
                const thumbList = { Objects: thumbnailList };
                console.log(thumbList);
                params = { Bucket: myBucket, Delete: thumbList };
                s3.deleteObjects(params, (err) => {
                  if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message });
                  res.status(STATUS_OK).json({ sucess: true });
                });
              })
              .catch((err) => {
                res.status(STATUS_SERVER_ERROR).json({ error: err.message });
              });
          });
 
        })  
        .catch((err) => {
          res.status(STATUS_SERVER_ERROR).json({ error: err.message });
        });
    });
  });
};

const viewUpdate = (req, res) => {
  const { videoID, videoUploader } = req.body;
  Video.find({}, ( err, videoData) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message });
    // console.log(videoData[0].videoList);  
    for (let i = 0; i < videoData[0].videoList.length; i++) {
      if (videoID === videoData[0].videoList[i].videoID) {
        videoData[0].videoList[i].views += 1;
        break;
      }
    }
    videoData[0]
      .save()
      .then(() => {
        User.findOne({ username: videoUploader }, (err, userData) => {
          if (err) res.state(STATUS_USER_ERROR).json({ error: err.message});
          let tempIndex = 0;
          for (let i = 0; i < userData.videoList.length; i++) { 
            // both need to be strings for correct comparison
            if (userData.videoList[i].videoID === videoID) {
              userData.videoList[i].views += 1;
              break;
            } 
          }
          userData
            .save()
            .then((data) => {
              res.status(200).json(data.videoList[tempIndex].views);  
            })
            .catch((err) => {
              res.status(STATUS_SERVER_ERROR).json({ error: err.message });
            });
        });
      })
      .catch((err) => {
        res.status(STATUS_SERVER_ERROR).json({ error : err.stack});
      });
  });
};

const createVideoDate = (req, res) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June',
    'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
  ];
  const myDate = new Date();
  const getYear = myDate.getFullYear().toString();
  const getMonth = monthNames[myDate.getMonth()];
  const getDay = myDate.getDate().toString();
  const fullDate = `${getMonth} ${getDay}, ${getYear}`;
  res.json(fullDate);
};

module.exports = {
  uploadVideo,
  getVideoList,
  postVideoList,
  getAllVideos,
  getFirstVideoName,
  deleteUserVideos,
  getVideoByID,
  addComment,
  addReplies,
  deleteVideos,
  countNumVideos,
  videoSearch,
  viewUpdate,
  createVideoDate,
  getCommentList,
  getReplyList,
  getPopularVideos,
  createScreenshot,
  screenShotTest
};