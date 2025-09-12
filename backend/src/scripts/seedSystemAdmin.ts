import mongoose from 'mongoose';
import AdminModel from '../model/adminModel';

const seedSystemAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI!)
        console.log("Connected to MongoDB for seeding")

        // check if system admin already exist
        const existingSysAdmin = await AdminModel.findOne({ role: "system_admin" })

        if(existingSysAdmin){
            console.log("System Admin already exist", existingSysAdmin.email)
            return;
        }
// / Create system admin from environment variables
    const systemAdmin = new AdminModel({
      name: process.env.SYSTEM_ADMIN_NAME || 'System Administrator',
      email: process.env.SYSTEM_ADMIN_EMAIL,
      password: process.env.SYSTEM_ADMIN_PASSWORD,
      role: 'system_admin'
    });

    await systemAdmin.save();
    console.log('System Admin created successfully!');
    console.log('Email:', systemAdmin.email);
    console.log('Please store these credentials securely.');

  } catch (error) {
    console.error('Error seeding system admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  
    }
}

seedSystemAdmin()