import mongoose from 'mongoose';
import { NextFunction, Request, Response } from 'express';
import AdminModel from '../model/adminModel';
import bcrypt from "bcryptjs"
import dotenv from 'dotenv';
dotenv.config();

// This is for registering new admin and seeding them 
export const seedInitialAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    // Security check - only allow in development or with a secret key
    if (process.env.NODE_ENV === 'production') {
      const secretKey = req.headers['x-setup-secret'];
      if (secretKey !== process.env.SETUP_SECRET) {
        res.status(403).json({ 
          success: false, 
          message: "Not allowed in production without secret key" 
        });
        return;
      }
    }

    const adminData = {
      name: 'System Administrator',
      email: process.env.SEED_EMAIL,
      password: process.env.SEED_PASSWORD,
      role: 'system_admin',
      permissions: ['add_doctor', 'manage_doctors', 'view_appointments', 'cancel_appointments', 'view_dashboard', 'manage_users'],
      isActive: true
    };

    // Check if admin already exists
    const existingAdmin = await AdminModel.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      res.status(400).json({ 
        success: false, 
        message: "Admin already exists" 
      });
      return;
    }

    // Create new admin (password will be auto-hashed by your pre-save hook)
    const admin = new AdminModel(adminData);
    await admin.save();

    res.status(201).json({
      success: true,
      message: "Admin seeded successfully",
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });

    console.log('✅ Admin seeded via API:', admin.email);
    
  } catch (error: any) {
    console.error('Seeding failed:', error);
    res.status(500).json({ 
      success: false, 
      message: "Seeding failed", 
      error: error.message 
    });
  }
};



const seedAdmin = async () => {
  try {
    // Connect to database
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is required');
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Admin details
    const adminData = {
      name: 'System Administrator',
      email: process.env.SEED_EMAIL,
      password: process.env.SEED_PASSWORD,
      role: 'system_admin',
      permissions: ['add_doctor', 'manage_doctors', 'view_appointments', 'cancel_appointments', 'view_dashboard', 'manage_users'],
      isActive: true
    };

    // Check if admin already exists
    const existingAdmin = await AdminModel.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('Admin already exists. Updating password...');
      
      // Hash new password and update
      const saltRounds = 10;
      if (!adminData.password) {
        throw new Error('SEED_PASSWORD environment variable is required');
      }
      const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
      
      existingAdmin.password = hashedPassword;
      existingAdmin.isActive = true;
      await existingAdmin.save();
      
      console.log('Admin password updated successfully');
    } else {
      console.log('Creating new admin...');
      
      // Create new admin (password will be auto-hashed by the pre-save hook)
      const admin = new AdminModel(adminData);
      await admin.save();
      
      console.log('Admin created successfully');
    }

    // Verify the admin was created
    const verifiedAdmin = await AdminModel.findOne({ email: adminData.email });
    console.log('\n Admin Details:');
    console.log('Email:', verifiedAdmin?.email);
    console.log('Name:', verifiedAdmin?.name);
    console.log('Role:', verifiedAdmin?.role);
    console.log('ID:', verifiedAdmin?._id);
    console.log('Active:', verifiedAdmin?.isActive);

    await mongoose.disconnect();
    console.log('Disconnected from database');

  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};


// Run the seeding
seedAdmin();