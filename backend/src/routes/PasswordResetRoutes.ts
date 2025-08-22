import express from 'express';
import {
    requestUserPasswordReset,
    requestDoctorPasswordReset,
    resetUserPassword,
    resetDoctorPassword,
    resendVerificationOTP,
    verifyResetToken
} from '../controllers/PasswordResetController'

const passwordRouter = express.Router();

// Password Reset Routes
passwordRouter.post('/user/request-reset', requestUserPasswordReset); // send reset email
passwordRouter.post('/doctor/request-reset', requestDoctorPasswordReset); // send reset email
passwordRouter.post('/user/reset', resetUserPassword); //reset password button in FE
passwordRouter.post('/doctor/reset', resetDoctorPassword); //reset password button in FE

// Utility Routes
passwordRouter.post('/resend-otp', resendVerificationOTP);
passwordRouter.post('/verify-token', verifyResetToken);

export default passwordRouter;