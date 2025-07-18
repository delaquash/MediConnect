import express, { NextFunction, Request, Response } from 'express';
import DoctorModel from '../model/doctorModel';
import validator from 'validator';
import { v2 as cloudinary } from 'cloudinary';

export const addDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, email, password, specialty, degree, experience, about, available, fees, address } = req.body;
        
        if(!name || !email || !password || !specialty || !degree || !experience || !about || !fees || !address) {
            res.status(400).json({ message: "All fields are required" })
            return; 
        }

        if (!validator.isEmail(email)) {
            res.status(400).json({ message: "Invalid email format" })
            return; 

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

        // ✅ Add file validation
        if (!req.file) {
            res.status(400).json({ message: "Doctor image is required" });
            return;
        }

        const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(fileStr, {
            folder: 'uploads',
            resource_type: 'auto',
        });

        const uploadedImage = result.secure_url

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
            address,
            date: Date.now(),
        });

        const SavedDoctor = await doctor.save();
        res.status(201).json({ 
            status: "success",
            message: "Doctor added successfully", 
            data: SavedDoctor,
        });
    } catch (error) {
        next(error);
        
    }
}
export const allDoctors = async (req: Request, res: Response, next: NextFunction) => {}
export const loginAdmin = async (req: Request, res: Response, next: NextFunction) => {}
export const appointmentsAdmin = async (req: Request, res: Response, next: NextFunction) => {}
export const appointmentCancel = async (req: Request, res: Response, next: NextFunction) => {}
export const adminDashboard = async (req: Request, res: Response, next: NextFunction) => {}