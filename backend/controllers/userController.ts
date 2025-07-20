import { NextFunction, Request, Response } from 'express';
import UserModel from '../model/userModel';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';

// Assuming your authUser middleware adds user info to req
// Define custom interface extending Request
interface AuthenticatedRequest extends Request {
  userId?: string;
}


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

              // Check if user already exists
                const existingUser = await UserModel.findOne({ email });
                if (existingUser) {
                    res.status(409).json({
                        success: false,
                        message: "User already exists with this email"
                    });
                    return;
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

       const userResponse = {
        _id: newRegisteredUser._id,
        name: newRegisteredUser.name,
        email: newRegisteredUser.email,
        image: newRegisteredUser.image,
        address: newRegisteredUser.address,
        gender: newRegisteredUser.gender,
        dob: newRegisteredUser.dob,
        phone: newRegisteredUser.phone
    };

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        userResponse
    });
   } catch (error) {
        next(error);
    }
    
}
        
const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;
          if (!email || !password) {
            res.status(400).json({ success: false, message: "Email and password are required" });
            return;
        }

        const user = await UserModel.findOne({ email })

        if(!user) {
             res.json({ success: false, message: "Invalid credentials" });
                 return;
        }

        const token = jwt.sign({ id: user._id}, process.env.JWT_SECRET!, {
            expiresIn: "30d"
        })

        res.status(200).json({
            success: true,
            message:"User login successfully",
            token
,        })
    } catch (error) {
        next(error)
    }
}

const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
      return;
    }
    
    const userProfile = await UserModel.findById(userId).select("-password");
    
    if (!userProfile) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: "User profile successfully retrieved",
      userProfile
    });
    
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { userId, name, password, address, dob, phone } = req.body;
        const imageFile = req.file;
        if (!userId) {
            res.status(400).json({ success: false, message: "User ID is required" });
            return;
        }
        if (!name || !address || !dob || !phone) {
            res.status(400).json({ success: false, message: "Please fill all fields" });
            return;
        }
    } catch (error) {
        next(error);
        
    }
}

export {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    // bookAppointment,
    // listAppointment,
    // cancelAppointment,
}