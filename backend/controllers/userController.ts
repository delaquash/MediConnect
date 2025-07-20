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
        // Get user ID from authenticated request (set by authUser middleware)
        const userId = req.userId;
        
        // Extract fields from request body
        const { name, password, address, dob, phone } = req.body;
        const imageFile = req.file;
        
        // Validate user authentication
        if (!userId) {
            res.status(401).json({ 
                success: false, 
                message: "User not authenticated" 
            });
            return;
        }
        
        // Validate required fields (excluding password as it's optional for updates)
        if (!name || !address || !dob || !phone) {
            res.status(400).json({ 
                success: false, 
                message: "Please fill all required fields (name, address, dob, phone)" 
            });
            return;
        }
        
        // Check if user exists
        const existingUser = await UserModel.findById(userId);
        if (!existingUser) {
            res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
            return;
        }
        
        // Prepare update object with basic fields
        const updateData: any = {
            name,
            address,
            dob,
            phone
        };
        
        // Handle password update if provided
        if (password) {
            // Validate password strength
            if (!validator.isStrongPassword(password, {
                minLength: 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            })) {
                res.status(400).json({
                    success: false,
                    message: "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and symbols",
                });
                return;
            }
            // Password will be automatically hashed by pre-save middleware
            updateData.password = password;
        }
        
        // Handle image upload if provided
        if (imageFile) {
            try {
                // Create base64 string from file buffer
                const fileStr = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
                
                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(fileStr, {
                    folder: 'uploads',
                    resource_type: 'auto',
                });
                
                // Add image URL to update data
                updateData.image = result.secure_url;
            } catch (uploadError) {
                console.error("Image upload error:", uploadError);
                res.status(500).json({
                    success: false,
                    message: "Failed to upload image"
                });
                return;
            }
        }
        
        // Update user profile in a single operation
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId, 
            updateData,
            { 
                new: true, // Return updated document
                runValidators: true // Run schema validators
            }
        ).select("-password"); // Exclude password from response
        
        // Check if update was successful
        if (!updatedUser) {
            res.status(500).json({
                success: false,
                message: "Failed to update profile"
            });
            return;
        }
        
        // Send success response
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });
        
    } catch (error) {
        console.error("Update profile error:", error);
        next(error);
    }
};


export {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    // bookAppointment,
    // listAppointment,
    // cancelAppointment,
}