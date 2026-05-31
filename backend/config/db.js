const mongoose = require('mongoose');

async function connectDB() {
  // Reuse existing connection on warm serverless invocations
  if (mongoose.connection.readyState >= 1) return;
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/atlas-lions';
  await mongoose.connect(uri, {
    // Keep connections alive across serverless invocations
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS:          45_000,
  });
  console.log('[MongoDB] Connected');
}

module.exports = connectDB;
