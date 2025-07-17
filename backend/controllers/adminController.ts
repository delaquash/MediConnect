import express, { NextFunction, Request, Response } from 'express';
import DoctorModel from '../model/doctorModel';
import validator from 'validator';

export const addDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, specialty, degree, experience, about, available, fees, address } = req.body;
        if(!name || !email || !password || !specialty || !degree || !experience || !about || !fees || !address) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        if (!validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        })) {return res.status(400).json({
            message:
            "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and symbols",
        });
        }


        const doctor = new DoctorModel({
            name,
            email,
            password,
            specialty,
            degree,
            experience,
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