const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VideoSchema = new Schema({
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
      commentIndex: {
        type: Number,
        default: 0,
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
///  channel_name: String,
//  viewer_count: Number,
},{ usePushEach: true });

VideoSchema.methods.getVideoName = function() {
  return this.video_name;
};
module.exports = mongoose.model('Video', VideoSchema);