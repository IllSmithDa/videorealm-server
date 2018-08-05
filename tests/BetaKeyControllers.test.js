const request = require('request');

const BetaKeyControllers = require('../controllers/BetaKeyControllers');

describe('Starting up server', () => {
  describe('Get /addNewKey', () => {
    beforeAll((done) => {
      spyOn(BetaKeyControllers, 'addNewKey');
      BetaKeyControllers.addNewKey();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(BetaKeyControllers.addNewKey).toHaveBeenCalled();
    });
  });
  describe('post /sendBetaKey', () => {
    beforeAll((done) => {
      spyOn(BetaKeyControllers, 'sendBetaKey');
      BetaKeyControllers.sendBetaKey();
      done();
    });
    it('tracks that the spy was called', () => {
      expect(BetaKeyControllers.sendBetaKey).toHaveBeenCalled();
    });
  });
});