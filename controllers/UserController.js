const db = require('../db.js');
const User = require('../models/UserModel');
const STATUS_OK = 200;
const STATUS_USER_ERROR = 422;
const STATUS_SERVER_ERROR = 500;

const createUser = (req, res) => {
  const usernameReq = req.body.username;
  const passwordReq = req.body.password;
  console.log(usernameReq);
  console.log(usernameReq);
  const newUser = new User({ username: usernameReq, password: passwordReq });
  newUser
    .save()
    .then((userData) => {
      req.session.username = usernameReq;
      req.session.password = passwordReq;
      res.status(STATUS_OK).json(userData);
      // res.writeHead(301, {Location: `http://localhost:3000/profile`});
      // res.end();
    })
    .catch((err) => {
      res.status(STATUS_USER_ERROR).json(err);
    })
  /*
  db
    .insert(user)
    .into('userTable')
    .then((user) => {
      res.status(STATUS_OK).json({created: user})
    })
    .catch(err => {
      res.status(STATUS_SERVER_ERROR).json({ error: err.message });
    });
  */

}

const loginUser = (req, res) => {
  const usernameReq = req.body.username;
  const passwordReq = req.body.password;
  console.log(usernameReq);
  console.log(passwordReq);
  db('userTable')
    .where('username', usernameReq)
    .then((post) => {
      if (post.length === 0) {
        console.log('incorrect username and/or password');
        return;
      }
      if (post[0].password !== passwordReq) {
        console.log('incorrect username and/or password');
        return;
      }
      req.session.username = usernameReq;
      req.session.password = passwordReq;
      console.log('session', req.session.username)
      res.json(req.session.username);
    })
    .catch(function(err) {
      res.status(500).json({ error: err.messsage });
    });
  /*
  User.findOne({username}, (err, user) => {
    if (err || user === null) {
      res.status(422).json(err);
    }
    if (err || password !== user.password) {
      res.status(422).json(err);
    }
  })
  */
}
const mongoLogin = (req, res) => {
  const usernameReq = req.body.username;
  const passwordReq = req.body.password;
  console.log(usernameReq);
  console.log(passwordReq);
  const {username, password} = req.body;
  User.findOne({username}, (err, user) => {
    if (err || user === null) {
      res.status(422).json(err);
    }
    if (err || password !== user.password) {
      res.status(422).json(err);
    }
    req.session.username = usernameReq;
    req.session.password = passwordReq;
    console.log('session', req.session.username)
    res.status(STATUS_OK).json(req.session.username);
  })
}

const logoutUser = (req, res) => {
  req.session.destroy();
  //req.session.username = undefined;
  res.status(200).json({ success: true });
}
const getUsername = (req, res) => {
  const { username } = req.session;
  // mySession = req.session;
  console.log('username: ', req.session.username);
  res.status(STATUS_OK).json(req.session.username);
}
const getUserID = (req, res) => {
  User.find({username: req.session.username}, (err, userData) => {
    if (err) {
      res.status(422).json(err);
    }
    console.log(userData);
    res.status(STATUS_OK).json(userData._id);
  })
}
module.exports = {
  loginUser,
  createUser,
  getUsername,
  logoutUser, 
  mongoLogin,
  getUserID
}