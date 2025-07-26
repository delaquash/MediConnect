import { NextFunction, Request, Response } from 'express';
import DoctorModel, { IDoctor } from '../model/doctorModel';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import AppointmentModel from '../model/appointmentModel';

const addDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, email, password, image, specialty, degree, experience, about, available, fees, address, slots_booked } = req.body as IDoctor;
        
        if(!name || !email || !password || !image || !specialty || !degree || !experience || !about || !fees || !address || !slots_booked) {
            res.status(400).json({ message: "All fields are required" })
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
            const fileStr = `data:${req.file.mimetype};base64,${req?.file?.buffer?.toString('base64')}`;
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

        const doctor = new DoctorModel({
            name,
            email,
            password,
            specialty,
            degree,
            experience,
            image: uploadedImage,
            about,
            available,
            fees,
            slots_booked,
            address,
            date: Date.now(),
        });

        const SavedDoctor = await doctor.save();
        res.status(201).json({ 
            status: "success",
            message: "Doctor added successfully", 
            data: SavedDoctor,
        });
    } catch (error: any) {
        next(error);
    } 
}

// export const allDoctors = async (req: Request, res: Response, next: NextFunction) => {}
const loginAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validate credentials
        if(process.env.ADMIN_EMAIL !== email || process.env.ADMIN_PASSWORD !== password) {
            res.status(401).json({ success: false, message: "Invalid email or password" });
            return;
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                email: process.env.ADMIN_EMAIL, 
                role: 'admin',
                id: 'admin' 
            },
            process.env.JWT_SECRET!,
            { expiresIn: "30d" }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
        });
    } catch (error) {
        next(error);
    } 
}

const allDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    console.log("🔍 allDoctors route hit!"); // Add this line
    
    try {
        const doctors = await DoctorModel.find({}).select("-password").sort({ date: -1 });
        
        console.log("📊 Found doctors:", doctors.length); // Add this too
        
        res.status(200).json({
            success: true,
            message: doctors.length === 0 ? "No doctors found" : "Doctors retrieved successfully",
            data: doctors,
            count: doctors.length,
        });
    } catch (error) {
        console.error("❌ Database error:", error); // Add this
        next(error);
    }
}

const appointmentsAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const adminAppointment = await AppointmentModel
        .find({})  // this is to get all the information about the appointment
        .populate("userId", "name, phone, email, dob") // Get patient details such as name
        .populate("doctorId", "name, phone, specialty")
        .sort({ date: -1 })  // Sort by date  i.e latest date
    
    
        // Send successful response with all appointments data


    res.status(200).json({ 
      success: true, 
      adminAppointment // Return the appointments array directly
    });

  } catch (error) {
    // Log error details for debugging purposes
    console.error("Admin appointments error:", error);
    
    // Send error response to client with error message
    res.status(500).json({ 
      success: false, 
      message: error.message // Include actual error message for troubleshooting
    });
}
const appointmentCancel = async (req: Request, res: Response, next: NextFunction) => {}
const adminDashboard = async (req: Request, res: Response, next: NextFunction) => {}

export  {
    addDoctor,
    loginAdmin,
    allDoctors,
    // appointmentsAdmin,
    // appointmentCancel,
    // adminDashboard,
}