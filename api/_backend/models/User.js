const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'employee', 'user'],
    default: 'employee'
  },
  currentSessionToken: {
    type: String
  },
  biometricCredentialId: {
    type: String // WebAuthn Credential ID
  },
  biometricPublicKey: {
    type: String // WebAuthn Public Key (PEM or base64)
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema); 
