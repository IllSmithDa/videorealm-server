const AccountController = require('../controllers/UserController');
const UploadController = require('../controllers/UploadController');
module.exports = (server) => {
  server.route('/userCreate')
    .post(AccountController.createUser)
  server.route('/loginUser')
    .post(AccountController.loginUser)
  server.route('/mongoLogin')
    .post(AccountController.mongoLogin)
  server.route('/getUsername')
    .get(AccountController.getUsername)
  server.route('/logoutUser')
    .get(AccountController.logoutUser)
  server.route('/uploadProfilePic')
    .post(UploadController.uploadProfileImage)
  server.route('/getBucketList')
    .get(UploadController.listAllBucketObjects)
  server.route('/getUserImage')
    .get(UploadController.getUserImage)
}