const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hiremind';

async function reset() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Dropping database...');
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped successfully! All old test data wiped clean.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to reset database:', err.message);
    process.exit(1);
  }
}

reset();
