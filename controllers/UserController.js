const bcrypt = require('bcrypt');
const db = require('../db.js');
const User = require('../models/UserModel');
const Video = require('../models/VideoModel');
const BetaKey = require('../models/BetaKey');
const STATUS_OK = 200;
const STATUS_USER_ERROR = 422;
const STATUS_SERVER_ERROR = 500;

const createUser = (req, res, next) => {
  const usernameReq = req.body.username;
  const passwordReq = req.body.password;
  const emailReq  = req.body.email;
  const newUser = new User({ username: usernameReq, password: passwordReq, email: emailReq });
  newUser
    .save()
    .then(() => {
      req.session.username = usernameReq;
      next();
    })
    .catch((err) => {
      res.status(STATUS_USER_ERROR).json(err);
    });
};

const checkSecretKey = (req, res) => {
  const recievedKey = req.body.secretKey;
  BetaKey.find({}, (err, keyData) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
    for (let i = 0; i < keyData[0].betaKey.length; i++) {
      if (recievedKey === keyData[0].betaKey[i].key) {
        res.status(STATUS_OK).json({ success: 'Key was found'});
        break;
      }
      if (i === keyData[0].betaKey.length - 1) {
        res.json({ error: 'Could not find key'});
      }
    }
  });
};

const checkAdminKey = (req, res) => {
  const adminReq = req.body.adminPassword;
  if (adminReq !== process.env.ADMIN_KEY) {
    res.json({error: 'Admin key is not correct'});
  } else {
    res.status(STATUS_OK).json({ success: true });
  }
};

const checkUsername = (req, res) => {
  const usernameReq = req.body.username;
  User.find({ username: usernameReq}, (err, userData) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message });
    if (userData[0] === null || userData[0] === undefined || userData[0] === '') {
      res.status(STATUS_OK).json({ success: true});
    } else {
      res.json({ error: 'username exists'});
    }
  });
};


const userNameMatch = (req, res) => {
  if (req.session.username === null || req.session.username === undefined || req.session.username === '') {
    res.json({error: 'user not logged on'});
  } else {
    const userNameReq = req.body.username;
    if (userNameReq !== req.session.username) {
      res.json({error: 'usernames do not match'});
    } else {
      res.status(STATUS_OK).json({ success: true });
    }
  }
};

const getUserData = (req, res) => {
  User.find({username: req.body.username}, (err, userData) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
    // console.log('userdata', userData);
    res.status(STATUS_OK).json(userData);
  });
};

const checkEmail = (req, res) => {
  const emailReq = req.body.email;
  User.find({ email: emailReq}, (err, userData) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message });
    if (userData[0] === null || userData[0] === undefined || userData[0] === '') {
      // console.log('no email exists')
      res.status(STATUS_OK).json({ sucess: true});
    } else {
      // // console.log(userData);
      res.json({ error: 'email exists'});
    }
  });
};

const deleteUser = (req, res) => {
  User.find({ username: req.session.username })
    .remove()
    .exec()
    .then(() => {
      res.status(STATUS_OK).json({ success: true });
    })
    .catch(err => {
      if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message });
    });

  /*
    let j = null;
    for (let i = 0; i < userData.length; i++) {
      if (req.session.username === userData[i].username) {
        // console.log('user found', userData[i].username)
        userData.splice(i, 1);
        j = i;
      }
    }
    // console.log('new data',userData)
    res.status(STATUS_OK).json({ success: true });
    
    userData[j]
      .save()
      .then(() => {
        // console.log('reached', product);
        res.status(STATUS_OK).json({ success: true });
      })
      .catch(err => {
        if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message });
      });
      */
};

const createAwsUser = () => {
  /*
  const usernameReq = req.body.username;
  const passwordReq = req.body.password;
  const emailReq = req.body.email;
  const foundTable = false;
  // // console.log(usernameReq);
  // // console.log(passwordReq );
  // // console.log(emailReq);
  
  params = {};
  const dynamodb = new AWS.DynamoDB();
  dynamodb.listTables(params, (err, data) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({error: err.stack })
    else {
      res.json(data.TableNames);
      for (let i = 0; i < data.TableNames.length; i++) {
        if (data.TableNames[i] === 'UserTable') {
          foundTable = true;
          break;
        }
      }
      // create new table if table cannot be found
      if (!foundTable) {
        // // console.log('reached');
        const params = {
          TableName : "UserTable",
          KeySchema: [       
              { AttributeName: "username", KeyType: "HASH"},  //Sort key
              { AttributeName: "password", KeyType: "RANGE" }, //Partition key
              { AttributeName: "email", KeyType: "RANGE" }  
          ],
          AttributeDefinitions: [       
              { AttributeName: "username", AttributeType: "S" },
              { AttributeName: "title", AttributeType: "S" },
              { AttributeName: "email", AttributeType: "S" }
          ],
          ProvisionedThroughput: {       
              ReadCapacityUnits: 5, 
              WriteCapacityUnits: 5
          }
        };
        dynamodb.createTable(params, (err, data) => {
          //if (err) res.status(STATUS_SERVER_ERROR).json({error: err.stack });
          if (err)  // // console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
          else {
            // // console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
          }
        });
      }
      // once User table is created or found
      const docClient = new AWS.DynamoDB.DocumentClient();
      var params = {
        TableName: "UserTable",
        Item:{
          "username": usernameReq,
          "password": passwordReq,
          "email": emailReq,
        }
      };
      docClient.put(params, function(err, data) {
        if (err) res.status(STATUS_SERVER_ERROR).json({error: err.stack });
        else {
          req.session.username = usernameReq;
          req.session.password = passwordReq;
          // // console.log('hello');
          res.status(STATUS_OK).json(userData);
        }
      })
    }
  }) 
  */
};

const loginUser = (req, res) => {
  const usernameReq = req.body.username;
  const passwordReq = req.body.password;
  // // console.log(usernameReq);
  // // console.log(passwordReq);
  db('userTable')
    .where('username', usernameReq)
    .then((post) => {
      if (post.length === 0) {
        // // console.log('incorrect username and/or password');
        return;
      }
      if (post[0].password !== passwordReq) {
        // // console.log('incorrect username and/or password');
        return;
      }
      req.session.username = usernameReq;
      req.session.password = passwordReq;
      // // console.log('session', req.session.username)
      res.status(STATUS_OK).json(req.session.username);
    })
    .catch(function(err) {
      res.status(STATUS_SERVER_ERROR).json({ error: err.messsage });
    });
};

const mongoLogin = (req, res) => {
  const usernameReq = req.body.username;
  const passwordReq = req.body.password;
  // // console.log(passwordReq);
  User.findOne({username: usernameReq}, (err, user) => {
    if (err || user === null) {
      res.json({error: 'incorrect username/password'});
    } else {
      bcrypt
        .compare(passwordReq, user.password, (err, match) => {
          if (err) {
            res.status(STATUS_SERVER_ERROR).json({error: err.message});
          } 
          if (!match) {
            res.json({error: 'incorrect username/password'});
          } else {
            req.session.username = usernameReq;
            res.status(STATUS_OK).json(req.session.username);
          }
        });
    }
  });
};

const logoutUser = (req, res) => {
  req.session.destroy();
  //req.session.username = undefined;
  res.status(200).json({ success: true });
};

const getUsername = (req, res) => {
  // mySession = req.session;
  if (req.session.username === null || req.session.username === undefined || req.session.username === '') {
    res.json({error: 'user not logged on'});
  } else {
    // // console.log('username: ', req.session.username);
    res.status(STATUS_OK).json(req.session.username);
  }
};

const changeUsername = (req, res) => {
  const { username, newUsername } = req.body;
  User.findOne({ username: newUsername }, (err, userData) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
    if (userData === !null) {
      res.json({ error: 'username already exists' });
    } else {
      User.findOne({ username }, (err, userData) => {
        if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
        for (let i = 0; i < userData.videoList.length; i++) {
          userData.videoList[i].userName = newUsername;
        }
        userData.username = newUsername;
        userData
          .save()
          .then((data) => {
            Video.find({}, (err, videoData) => {
              if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
              for (let j = 0; j < videoData[0].videoList.length; j++) {
                if (videoData[0].videoList[j].userName === username) {
                  videoData[0].videoList[j].userName = newUsername;
                }
              }
              videoData[0]
                .save()
                .then(() => {
                  console.log(data);
                  req.session.username = newUsername;
                  res.status(STATUS_OK).json(data.username);
                })
                .catch((err) => {
                  res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
                });
            });
          })
          .catch((err) => {
            res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
          });
      });
    }
  });
};

const checkPassword = (req, res) => {
  const { password } = req.body;
  const username = req.session.username; 
  User.findOne({ username }, (err, userData) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
    bcrypt
      .compare(password, userData.password, (err, match) => {
        if (err) res.status(STATUS_SERVER_ERROR).json({error: err.message});
        if (!match) {
          res.json({error: 'incorrect username/password'});
        } else {
          res.status(STATUS_OK).json({ success: true});
        }
      });
  });
};

const changePassword = (req, res) => {
  const { password } = req.body;
  const username = req.session.username; 
  User.findOne({ username }, (err, userData) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
    userData.password = password;
    userData
      .save()
      .then((data) => {
        res.status(STATUS_OK).json(data);
      })
      .catch((err) => {
        res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
      });
  });
};

const getUserID = (req, res) => {
  User.find({username: req.session.username}, (err, userData) => {
    if (err) {
      res.status(STATUS_USER_ERROR).json(err);
    }
    // // console.log(userData);
    res.status(STATUS_OK).json(userData._id);
  });
};

const passwordHash = (req, res, next) => {
  const saltRounds = 11;
  const { password } = req.body;
  bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message });
      
    bcrypt.hash(password, salt, (err, hashedData) => {
      if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message });
      req.body.password = hashedData;
      // // console.log(hashedData)
      next();
    });
  });
};

module.exports = {
  loginUser,
  createUser,
  checkUsername,
  getUserData,
  deleteUser,
  checkSecretKey,
  checkAdminKey,
  checkEmail,
  createAwsUser,
  getUsername,
  userNameMatch,
  logoutUser, 
  mongoLogin,
  getUserID,
  passwordHash,
  changeUsername,
  changePassword,
  checkPassword
};
