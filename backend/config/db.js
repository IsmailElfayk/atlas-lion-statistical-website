const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/atlas-lions';
  await mongoose.connect(uri);
  console.log('[MongoDB] Connected');
}

module.exports = connectDB;
