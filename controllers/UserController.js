const bcrypt = require('bcrypt');
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
    })
    .catch((err) => {
      res.status(STATUS_USER_ERROR).json(err);
    })
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
      res.status(STATUS_SERVER_ERROR).json({ error: err.messsage });
    });
}
const mongoLogin = (req, res) => {
  const usernameReq = req.body.username;
  const passwordReq = req.body.password;

  const {username, password} = req.body;
  User.findOne({username}, (err, user) => {
    if (err || user === null) {
      res.status(STATUS_USER_ERROR).json(err);
    }
    bcrypt
      .compare(passwordReq, user.password, (err) => {
        req.session.username = usernameReq;
        req.session.password = passwordReq;
        res.status(STATUS_OK).json(req.session.username);
      })
  })
}

const logoutUser = (req, res) => {
  req.session.destroy();
  //req.session.username = undefined;
  res.status(200).json({ success: true });
}

const getUsername = (req, res) => {
  // mySession = req.session;
  console.log('username: ', req.session.username);
  res.status(STATUS_OK).json(req.session.username);
}

const getUserID = (req, res) => {
  User.find({username: req.session.username}, (err, userData) => {
    if (err) {
      res.status(STATUS_USER_ERROR).json(err);
    }
    console.log(userData);
    res.status(STATUS_OK).json(userData._id);
  })
}
const passwordHash = (req, res) => {
  const saltRounds = 11;
  const { password } = req.body;
  bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message });

      bcrypt.hash(password, salt, (err, hashedData) => {
      if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message });
      req.body.password = hashedData;
      next();
     })
  })
}

module.exports = {
  loginUser,
  createUser,
  getUsername,
  logoutUser, 
  mongoLogin,
  getUserID,
  passwordHash
}