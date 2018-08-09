const BetaKey = require('../models/BetaKey');
const User = require('../models/UserModel');
const sgMail = require('@sendgrid/mail');
const validator = require('email-validator');
const cryptoRandomString = require('crypto-random-string');
const STATUS_OK = 200;
const STATUS_USER_ERROR = 422;
const STATUS_SERVER_ERROR = 500;

const createNewTable = (req, res) => {
  const newKey = cryptoRandomString(16);
  const newBetaKeyTable = new BetaKey({ betaKey:[{key: newKey}] });
  newBetaKeyTable
    .save()
    .then(() => {
      res.status(STATUS_OK).json({ sucess: true });
    })
    .catch((err) => {
      res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
    });
};

const removeBetaKey = (req, res) => {
  const recievedKey = req.body.secretKey;
  BetaKey.find({}, (err, keyData) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
    for (let i = 0; i < keyData[0].betaKey.length; i++) {
      if (recievedKey === keyData[0].betaKey[i].key) {
        keyData[0].betaKey.splice(i, 1);
        keyData[0]
          .save()
          .then(() => {
            res.status(STATUS_OK).json({ success: true });
          })
          .catch((err) => {
            res.status(STATUS_USER_ERROR).json({ error: err.stack });
          });
      }
      if (i === keyData[0].betaKey.length - 1) {
        res.json({ error: 'Could not find key'});
      }
    }
  });
};
/*
const requestBetaKey = (req, res) => {
  const reqEmail = req.body.email;
  User.find({ email: emailReq}, (err, userData) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message });
    if (userData[0] === null || userData[0] === undefined || userData[0] === '') {
      // console.log('no email exists')
      
    } else {
      // console.log(userData);
      res.json({ error: 'email exists'})
    }
  })
}
*/

const checkBetaEmail = (req, res, next) => {
  const { email } = req.body;
  BetaKey.find({}, (err, betaArr) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
    console.log(betaArr);
    for (let i = 0; i< betaArr[0].betaKey.length; i++) {
      if (email === betaArr[0].betaKey[i].email) {
        res.json({ error: 'email already sent beta key'});
        break;
      }
      if (i === betaArr[0].betaKey.length - 1) {
        next();
      }
    }
  });
};

const sendBetaKey = (req, res) => {
  const email = req.body.email;
  if(validator.validate(email)) {
    User.find({ email }, (err, userData) => {
      if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.message });
      if (userData[0] === null || userData[0] === undefined || userData[0] === '') {
        // console.log('no email exists')
        const newKey = cryptoRandomString(16);
        BetaKey.find({},(err, keyData) => {
          // console.log(keyData[0].betaKey);
          if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
          keyData[0].betaKey.push({key: newKey, email});
          keyData[0]
            .save()
            .then(() => {
              sgMail.setApiKey(process.env.SENDGRID_API_KEY);
              const msg = {
                to: email,
                from: process.env.SECRET_EMAIL,
                subject: 'Videorealm Beta Key',
                text: 'Videorealm is Here!',
                html: `Congratulations! You have been selected to participate in the
                Videorealm closed beta. This is your key to get in.
                key: ${newKey}.
                Use this key when creating your account to participate in the beta
                at https://videorealm.herokuapp.com.
                Thanks for your participation
                -Videorealm
                `,
              };
              sgMail.send(msg);
              res.status(STATUS_OK).json({ sucess: true });
            })
            .catch((err) => {
              res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
            });
        });
      } else {
        // console.log(userData);
        res.json({ error: 'email exists'});
      }
    });
  } else {
    res.json({ error: 'not a valid email'});
  }
};

// test code for sending beta codes
const sendEmail = (req, res) => {
  const email = req.body.email;
  // Just some boiler plate. Not to be used
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: process.env.SECRET_EMAIL,
    from: email,
    subject: 'Please send me a Beta Key',
    text: `Please send a beta key to ${email}`,
    html: `Please send a beta key to ${email}`,
  };
  sgMail.send(msg);
  res.status(STATUS_OK).json({ success: true });
};

const addNewKey = (req, res) => {
  const newKey = cryptoRandomString(16);
  BetaKey.find({},(err, keyData) => {
    // console.log(keyData[0].betaKey);
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
    keyData[0].betaKey.push({key: newKey});
    keyData[0]
      .save()
      .then(() => {
        res.status(STATUS_OK).json({ sucess: true });
      })
      .catch((err) => {
        res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
      });
  });
};

const doesKeyExist = (req, res) => {
  const recievedKey = req.body.betaKey;
  BetaKey.find({}, (err, keyData) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
    for (let i = 0; i < keyData[0].betaKey.length; i++) {
      if (recievedKey === keyData[0].betaKey[i].key) {
        res.status(STATUS_OK).json({ success: 'Key was found'});
        //next();
      }
      if (i === keyData[0].betaKey.length - 1) {
        res.json({ error: 'Could not find key'});
      }
    }
  });
};

const getUnsentKeys = (req, res) => {
  const unUsedKeys = [];
  BetaKey.find({}, (err, keyData) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
    for (let i = 0; i < keyData[0].betaKey.length; i++) {
      if (!keyData[0].betaKey[i].sent) {
        unUsedKeys.push(keyData[0].betaKey[i]);
      }
    }
    res.status(STATUS_OK).json(unUsedKeys);
  });
};

const deleteKey = (req, res) => {
  const recievedKey = req.body.betaKey;
  BetaKey.find({}, (err, keyData) => {
    if (err) res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
    for (let i = 0; i < keyData[0].betaKey.length; i++) {
      if (recievedKey === keyData[0].betaKey[i].key) {
        keyData[0].betaKey.splice(i, 1);
        keyData[0]
          .save()
          .then(() => {
            res.status(STATUS_OK).json({ success: 'Key was deleted'});
          })
          .catch((err) => {
            res.status(STATUS_SERVER_ERROR).json({ error: err.stack });
          });
      }
      if (i === keyData[0].betaKey.length - 1) {
        res.json({ error: 'Could not find key'});
      }
    }
  });
};

module.exports = {
  createNewTable,
  removeBetaKey,
  addNewKey,
  doesKeyExist,
  deleteKey,
  getUnsentKeys,
  sendEmail,
  sendBetaKey,
  checkBetaEmail
};