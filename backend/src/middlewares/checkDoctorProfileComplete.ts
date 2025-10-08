import { Request, Response, NextFunction } from "express";
import DoctorModel from '../model/DoctorModel';

export const checkDoctorProfileComplete = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const docId = req.docId
        if(!docId){
            res.status(401).json({
                success: false,
                message: "Doctor not authicated"
            })
            return;
        }

        const doctor = await DoctorModel.findById(docId).select("profileComplete")
        if(!doctor?.profileComplete){
            res.status(403).json({
                success: false,
                message: "Profile must be completed before accepting patient. Please complete your profile.",
                action: "COMPLETE_PROFILE_REQUIRED"
            })
            return;
        }

        next()
    } catch (error) {
            console.error("Profile check error:", error);
            res.status(500).json({
            success: false,
            message: "Error checking profile status"
        });
    }
}