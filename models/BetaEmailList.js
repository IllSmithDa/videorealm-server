const mongoose = require('mongoose');

const BetaKeySchema = new mongoose.Schema({
  emailList: [{
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
