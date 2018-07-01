const db = require('../db.js');
const STATUS_OK = 200;
const STATUS_USER_ERROR = 422;
const STATUS_SERVER_ERROR = 500;

const createUser = (req, res) => {
  const {username, password } = req.body;
  console.log(username);
  console.log(password);
  const user = {username, password};
  db
    .insert(user)
    .into('userTable')
    .then((user) => {
      res.status(STATUS_OK).json({created: user})
    })
    .catch(err => {
      res.status(STATUS_SERVER_ERROR).json({ error: err.message });
    });

}

const loginUser = (req, res) => {
  const {username, password} = req.body;
  User.findOne({username}, (err, user) => {
    if (err || user === null) {
      res.status(422).json(err);
    }
    if (err || password !== user.password) {
      res.status(422).json(err);
    }
  })
}

module.exports = {
  loginUser,
  createUser
}