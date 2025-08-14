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
passwordRouter.post('/user/request-reset', requestUserPasswordReset);
passwordRouter.post('/doctor/request-reset', requestDoctorPasswordReset);
passwordRouter.post('/user/reset', resetUserPassword);
passwordRouter.post('/doctor/reset', resetDoctorPassword);

// Utility Routes
passwordRouter.post('/resend-otp', resendVerificationOTP);
passwordRouter.post('/verify-token', verifyResetToken);

export default passwordRouter;