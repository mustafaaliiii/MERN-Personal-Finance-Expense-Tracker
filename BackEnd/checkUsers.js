const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    console.log('All users:');
    users.forEach(user => {
      console.log(`- ${user.email}: role=${user.role}, id=${user._id}`);
    });

    // Check the admin user specifically
    const adminUser = await User.findOne({ email: 'mustafaaliaurangzeb3@gmail.com' });
    if (adminUser) {
      console.log('\nAdmin user details:');
      console.log(JSON.stringify(adminUser.toObject(), null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

checkUsers();