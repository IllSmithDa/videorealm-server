const request = require('request');
const UserController = require('../controllers/UserController');

describe('Starting up server', () => {
  describe('post /checkUsername', () => {
    beforeAll((done) => {
      spyOn(UserController, 'checkUsername');
      UserController.checkUsername();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(UserController.checkUsername).toHaveBeenCalled();
    });
  });

  describe('post /checkEmail', () => {
    beforeAll((done) => {
      spyOn(UserController, 'checkEmail');
      UserController.checkEmail();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(UserController.checkEmail).toHaveBeenCalled();
    });
  });

  describe('post /mongoLogin', () => {
    beforeAll((done) => {
      spyOn(UserController, 'mongoLogin');
      UserController.mongoLogin();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(UserController.mongoLogin).toHaveBeenCalled();
    });
  });

  describe('post /userNameMatch', () => {
    beforeAll((done) => {
      spyOn(UserController, 'userNameMatch');
      UserController.userNameMatch();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(UserController.userNameMatch).toHaveBeenCalled();
    });
  });
  describe('post /getUserData', () => {
    beforeAll((done) => {
      spyOn(UserController, 'getUserData');
      UserController.getUserData();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(UserController.getUserData).toHaveBeenCalled();
    });
  });

  describe('get /getUserID', () => {
    beforeAll((done) => {
      spyOn(UserController, 'getUserID');
      UserController.getUserID();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(UserController.getUserID).toHaveBeenCalled();
    });
  });

  describe('post /checkSecretKey', () => {
    beforeAll((done) => {
      spyOn(UserController, 'checkSecretKey');
      UserController.checkSecretKey();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(UserController.checkSecretKey).toHaveBeenCalled();
    });
  });
});