import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    sparse: true,
  },
  password: {
    type: String,
    required: true,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true,
  },
  vercelToken: {
    type: String,
    sparse: true,
  },
  vercelRefreshToken: {
    type: String,
    sparse: true,
  },
  netlifyToken: {
    type: String,
    sparse: true,
  },
  netlifySiteId: {
    type: String,
    sparse: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});



export default mongoose.model('user', UserSchema);