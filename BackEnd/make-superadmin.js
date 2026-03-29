require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOneAndUpdate(
      { email: 'mustafaaliaurangzeb3@gmail.com' },
      { role: 'superadmin' },
      { new: true }
    );
    if(user) {
      console.log(`Success! ${user.email} role updated to ${user.role}`);
    } else {
      console.log('User not found. Please make sure the email is registered.');
    }
  } catch(err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
};
run();
