import { NextFunction, Request, Response } from 'express';
import DoctorModel from '../model/doctorModel';
import jwt from 'jsonwebtoken';

const changeAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // ✅ Add safety check for req.body
        if (!req.body) {
            res.status(400).json({
                success: false,
                message: "Request body is required"
            });
            return;
        }

        const { docId } = req.body;
        
        // Validate that docId is provided
        if (!docId) {
            res.status(400).json({
                success: false,
                message: "Doctor ID (docId) is required"
            });
            return;
        }
        
        // Find doctor first to get current availability status
        const doctor = await DoctorModel.findById(docId);
        
        // Check if doctor exists
        if (!doctor) {
            res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
            return;
        }
        
        // Calculate new availability status
        const newAvailability = !doctor.available;
        
        // Update doctor's availability
        await DoctorModel.findByIdAndUpdate(
            docId,
            { available: newAvailability },
            { new: true }
        );
        
        // Send success response
        res.status(200).json({
            success: true,
            message: `Doctor availability ${newAvailability ? 'enabled' : 'disabled'} successfully`,
            data: { 
                docId: docId,
                available: newAvailability 
            }
        });
    } catch (error) {
        next(error);
    }
}
const doctorList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doctors = await DoctorModel.find({}).select(["-password", "-email"]).sort({ date: -1 });
        res.status(200).json({
            success: true,
            message: "Doctors retrieved successfully",
            data: doctors
        });
    } catch (error) {
        next(error);
    }
}
const loginDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // ✅ Add safety check for req.body
        if (!req.body) {
            console.log(req.body); // Debug log
            res.status(400).json({
                success: false,
                message: "Request body is required"
            });
            return;
        }
        // Validate that email and password are provided
        const { email, password } = req.body

        if (!email || !password) {
            res.status(400).json({ success: false, message: "Email and password are required" });
            return;
        }
        const doctor = await DoctorModel.findOne({ email })

           if (!doctor) {
                 res.json({ success: false, message: "Invalid credentials" });
                 return;
           }

            const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET!, {
                expiresIn: "30d" })
    

           res.status(200).json({
                success: true,
                message: "Login successful",
               token
            });
    } catch (error) {
        next(error);
    }
}

const appointmentsDoctor = async (req: any, res: Response, next: NextFunction): Promise<void> => {
      // Start MongoDB session for transaction support (ensures data consistency)

}
const appointmentCancelDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {}
const doctorsDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {}
const doctorsProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {}
const updateDoctorProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {}

export {
    changeAvailability,
    doctorList,
    loginDoctor,
    appointmentsDoctor,
    appointmentCancelDoctor,
    doctorsDashboard,
    doctorsProfile,
    updateDoctorProfile
}