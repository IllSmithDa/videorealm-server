const mongoose = require('mongoose');

const BetaKeySchema = new mongoose.Schema({
  betaKey: [{
    key: {
      type: String,
      require: true,
      unique: true
    },
    email: {
      type: String,
      require: true,
      unique: true
    },
    sent: {
      type: Boolean,
      default: false,
    }
  }]
},{ usePushEach: true });

module.exports = mongoose.model('BetaKey', BetaKeySchema);
