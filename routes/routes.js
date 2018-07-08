const AccountController = require('../controllers/UserController');

module.exports = (server) => {
  server.route('/userCreate')
    .post(AccountController.createUser)
  server.route('/loginUser')
    .post(AccountController.loginUser)
  server.route('/getUsername')
    .get(AccountController.getUsername)
  
}