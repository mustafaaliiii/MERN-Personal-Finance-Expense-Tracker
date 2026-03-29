const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function makeAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    if (users.length === 0) {
      console.log('No users found. Please register a user first.');
      return;
    }
    console.log('Available users:');
    users.forEach(user => console.log(`- ${user.email} (role: ${user.role})`));

    // Make the first user admin
    const firstUser = users[0];
    firstUser.role = 'admin';
    await firstUser.save();
    console.log(`Made ${firstUser.email} an admin!`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

makeAdmin();