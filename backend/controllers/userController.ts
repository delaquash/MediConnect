import { NextFunction, Request, Response } from 'express';
import UserModel from '../model/userModel';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';

const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
   try {
     const {name, email, password, image, address, gender, dob, phone  } = req.body

    if (!name || !email || !password || !address || !image || !gender || !dob || !phone) {
        res.status(400).json({
            success: false,
            message: "Please fill all fields"
        });
        return;
    }

    if (!validator.isEmail(email)) {
                res.status(400).json({ message: "Invalid email format" })
                return; 
            }
            if (!validator.isStrongPassword(password, {
                minLength: 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            })) {
                res.status(400).json({
                    message: "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and symbols",
                });
                return; // 
            }
            let uploadedImage: string ;
            // ✅ Add file validation
             if (req.file) {
                // File upload - upload to Cloudinary
                const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
                const result = await cloudinary.uploader.upload(fileStr, {
                    folder: 'uploads',
                    resource_type: 'auto',
                });
                uploadedImage = result.secure_url;
            } else if (image) {
                // Image URL provided
                uploadedImage = image;
            } else {
                res.status(400).json({ message: "Doctor image is required (either upload file or provide image URL)" });
                return;
            }
    const user = new UserModel({
        name,
        email,
        password,
        image: uploadedImage,
        address,
        dob,
        phone
    });

    const newRegisteredUser = await user.save();
    res.status(201).json({
        success: true,
        message: "User registered successfully",
        newRegisteredUser
    });
   } catch (error) {
        next(error);
    }
    
}
        
const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {}

export {
    registerUser,
    loginUser,
    // getProfile,
    // updateProfile,
    // bookAppointment,
    // listAppointment,
    // cancelAppointment,
}