const request = require('request');
const VideoController = require('../controllers/VideoController');

describe('Starting up server', () => {
  describe('get /getVideoList', () => {
    beforeAll((done) => {
      spyOn(VideoController, 'getVideoList');
      VideoController.getVideoList();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(VideoController.getVideoList).toHaveBeenCalled();
    });
  });

  describe('get /getAllVideos', () => {
    beforeAll((done) => {
      spyOn(VideoController, 'getAllVideos');
      VideoController.getAllVideos();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(VideoController.getAllVideos).toHaveBeenCalled();
    });
  });

  describe('post /searchVideos', () => {
    beforeAll((done) => {
      spyOn(VideoController, 'videoSearch');
      VideoController.videoSearch();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(VideoController.videoSearch).toHaveBeenCalled();
    });
  });

  describe('post /getVideo', () => {
    beforeAll((done) => {
      spyOn(VideoController, 'getVideoByID');
      VideoController.getVideoByID();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(VideoController.getVideoByID).toHaveBeenCalled();
    });
  });
  describe('post /deleteVideos', () => {
    beforeAll((done) => {
      spyOn(VideoController, 'deleteVideos');
      VideoController.deleteVideos();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(VideoController.deleteVideos).toHaveBeenCalled();
    });
  });

  describe('post /addComment', () => {
    beforeAll((done) => {
      spyOn(VideoController, 'addComment');
      VideoController.addComment();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(VideoController.addComment).toHaveBeenCalled();
    });
  });

  describe('post /addReplies', () => {
    beforeAll((done) => {
      spyOn(VideoController, 'addReplies');
      VideoController.addReplies();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(VideoController.addReplies).toHaveBeenCalled();
    });
  });
});