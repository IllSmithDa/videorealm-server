const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  profilePictureID: {
    type: String,
    default: 'https://s3.amazonaws.com/my.unique.bucket.userimages/DefaultPic.jpg'
  },
  videoList: [{
    videoName: {
      type: String,
      required: true
    },
    videoID :{
      type: String,
      required: true,
    },
    videoURL: {
      type: String,
    },
    userName : {
      type: String,
      required: true
    },
    comments : [{
      username:{
        type: String
      },
      comment: {
        type: String
      },
      replies: [{
        username:{
          type: String
        },
        comment: {
          type: String
        }
      }]
    }],
    views: {
      type: Number,
      default: 0
    },
    videoThumbnailID: {
      type: String
    },
    videoThumbURL: {
      type: String
    }
  }],
}, { usePushEach: true });

module.exports = mongoose.model('User', UserSchema);