const request = require('request');
const UploadController = require('../controllers/UploadController');

describe('Starting up server', () => {
  describe('post /addDefaultPic', () => {
    beforeAll((done) => {
      spyOn(UploadController, 'addDefaultPic');
      UploadController.addDefaultPic();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(UploadController.addDefaultPic).toHaveBeenCalled();
    });
  });
  describe('post /getUserImage', () => {
    beforeAll((done) => {
      spyOn(UploadController, 'getUserImage');
      UploadController.getUserImage();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(UploadController.getUserImage).toHaveBeenCalled();
    });
  });
});