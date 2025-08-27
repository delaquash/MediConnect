"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDoctorProfile = exports.getDoctorProfile = exports.doctorsDashboard = exports.appointmentComplete = exports.doctorCancelAppointment = exports.getDoctorAppointments = exports.loginDoctor = exports.doctorList = exports.changeAvailability = void 0;
const doctorModel_1 = __importDefault(require("../model/doctorModel"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const appointmentModel_1 = __importDefault(require("../model/appointmentModel"));
const appointmentModel_2 = __importDefault(require("../model/appointmentModel"));
const changeAvailability = async (req, res, next) => {
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
        const doctor = await doctorModel_1.default.findById(docId);
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
        await doctorModel_1.default.findByIdAndUpdate(docId, { available: newAvailability }, { new: true });
        // Send success response
        res.status(200).json({
            success: true,
            message: `Doctor availability ${newAvailability ? 'enabled' : 'disabled'} successfully`,
            data: {
                docId: docId,
                available: newAvailability
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.changeAvailability = changeAvailability;
const doctorList = async (req, res, next) => {
    try {
        const doctors = await doctorModel_1.default.find({}).select(["-password", "-email"]).sort({ date: -1 });
        res.status(200).json({
            success: true,
            message: "Doctors retrieved successfully",
            data: doctors
        });
    }
    catch (error) {
        next(error);
    }
};
exports.doctorList = doctorList;
const loginDoctor = async (req, res, next) => {
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
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: "Email and password are required" });
            return;
        }
        const doctor = await doctorModel_1.default.findOne({ email });
        if (!doctor) {
            res.json({ success: false, message: "Invalid credentials" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: doctor._id }, process.env.JWT_SECRET, {
            expiresIn: "30d"
        });
        res.status(200).json({
            success: true,
            message: "Login successful",
            token
        });
    }
    catch (error) {
        next(error);
    }
};
exports.loginDoctor = loginDoctor;
const getDoctorAppointments = async (req, res, next) => {
    try {
        // FIXED: Use req.docId instead of req.userId for doctor authentication
        const doctorId = req.docId; // From doctor auth middleware
        // Validate doctor ID format
        if (!doctorId || !mongoose_1.default.Types.ObjectId.isValid(doctorId)) {
            res.status(400).json({
                success: false,
                message: "Invalid doctor ID format"
            });
            return;
        }
        // Get query parameters for filtering (optional)
        const { status, date, page = 1, limit = 10 } = req.query;
        // Build query filter
        const filter = {
            docId: doctorId,
            cancelled: false, // Only non-cancelled appointments
            slotDate: {
                $gte: new Date().toISOString().split('T')[0] // Future and today's appointments
            }
        };
        // Add additional filters if provided
        if (status === 'completed') {
            filter.isCompleted = true;
        }
        else if (status === 'pending') {
            filter.isCompleted = false;
        }
        if (date) {
            filter.slotDate = date; // Specific date filter
        }
        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Fetch appointments with population and sorting
        const appointments = await appointmentModel_1.default.find(filter)
            .populate('userId', 'name phone email') // Populate user details
            .sort({ slotDate: 1, slotTime: 1 }) // Sort by date and time
            .skip(skip)
            .limit(limitNum);
        // Get total count for pagination
        const totalAppointments = await appointmentModel_1.default.countDocuments(filter);
        // Format appointments for better response structure
        const formattedAppointments = appointments.map(apt => ({
            appointmentId: apt._id,
            patient: {
                // id: apt.userId?._id,
                name: apt.userData.name,
                phone: apt.userData.phone,
                // email: apt.userId.email,
                address: apt.userData.address
            },
            appointment: {
                date: apt.slotDate,
                time: apt.slotTime,
                amount: apt.amount,
                status: apt.isCompleted ? 'completed' : 'pending',
                paymentStatus: apt.payment ? 'paid' : 'pending',
                createdAt: apt.date
            }
        }));
        res.status(200).json({
            success: true,
            message: "Appointments retrieved successfully",
            data: {
                appointments: formattedAppointments,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalAppointments / limitNum),
                    totalAppointments,
                    hasNext: pageNum < Math.ceil(totalAppointments / limitNum),
                    hasPrev: pageNum > 1
                }
            }
        });
    }
    catch (error) {
        console.error("Get doctor appointments error:", error);
        if (error.name === 'CastError') {
            res.status(400).json({
                success: false,
                message: "Invalid ID format"
            });
            return;
        }
        next(error);
    }
};
exports.getDoctorAppointments = getDoctorAppointments;
const doctorCancelAppointment = async (req, res, next) => {
    const session = await mongoose_1.default.startSession();
    try {
        await session.withTransaction(async () => {
            const doctorId = req.docId; // Authenticated doctor ID
            const { appointmentId, reason } = req.body;
            // Find appointment belonging to this doctor
            const appointment = await appointmentModel_1.default.findOne({
                _id: appointmentId,
                docId: doctorId, // Ensure doctor owns this appointment
                cancelled: false
            }).session(session);
            if (!appointment) {
                res.status(404).json({
                    success: false,
                    message: "Appointment not found"
                });
                return;
            }
            // Mark as cancelled with doctor reason
            await appointmentModel_1.default.findByIdAndUpdate(appointmentId, {
                cancelled: true,
                cancelledBy: 'doctor', // Track who cancelled
                cancellationReason: reason
            }, { session });
            // Free up the time slot
            const doctor = await doctorModel_1.default.findById(doctorId).session(session);
            const updatedSlots = { ...doctor?.slots_booked };
            const dateSlots = updatedSlots[appointment.slotDate] || [];
            updatedSlots[appointment.slotDate] = dateSlots.filter((slot) => slot !== appointment.slotTime);
            await doctorModel_1.default.findByIdAndUpdate(doctorId, { slots_booked: updatedSlots }, { session });
            // Send notification to patient about cancellation
            // sendCancellationNotification(appointment.userId, appointment, reason);
            res.json({
                success: true,
                message: "Appointment cancelled successfully"
            });
        });
    }
    catch (error) {
        next(error);
    }
    finally {
        await session.endSession();
    }
};
exports.doctorCancelAppointment = doctorCancelAppointment;
const appointmentComplete = async (req, res, next) => {
    try {
        const authenticatedDoctorId = req.docId;
        const { appointmentId } = req.body;
        // validate appointment ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(appointmentId)) {
            res.status(400).json({
                success: false,
                message: "Invalid appointment ID"
            });
            return;
        }
        const appointmentData = await appointmentModel_1.default.findById(appointmentId);
        if (!appointmentData) {
            res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
            return;
        }
        // Security: Only assigned doctor can complete
        if (appointmentData.docId.toString() !== authenticatedDoctorId) {
            res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
            return;
        }
        // Check if already completed or cancelled
        if (appointmentData.isCompleted) {
            res.status(400).json({
                success: false,
                message: "Appointment already completed"
            });
            return;
        }
        if (appointmentData.cancelled) {
            res.status(400).json({
                success: false,
                message: "Cannot complete cancelled appointment"
            });
            return;
        }
        const appointmentDetails = await appointmentModel_2.default.findByIdAndUpdate(appointmentId, {
            isCompleted: true,
        });
        res.status(200).json({
            success: true,
            message: "Appointment completed successfully",
            data: {
                appointmentDetails
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.appointmentComplete = appointmentComplete;
const doctorsDashboard = async (req, res, next) => {
    try {
        // Get doctor ID from doctor auth middleware (secure)
        const authenticatedDoctorId = req.docId;
        // Validate doctor ID format before querying database
        if (!mongoose_1.default.Types.ObjectId.isValid(authenticatedDoctorId)) {
            res.status(400).json({
                success: false,
                message: "Invalid doctor ID format"
            });
            return;
        }
        // Verify doctor exists in database
        const doctor = await doctorModel_1.default.findById(authenticatedDoctorId);
        if (!doctor) {
            res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
            return;
        }
        // Fetch all appointments for this doctor
        const appointments = await appointmentModel_2.default.find({
            docId: authenticatedDoctorId
        }).populate('userId', 'name email phone');
        // Calculate total earnings from completed/paid appointments
        let earnings = 0;
        appointments.forEach((appointment) => {
            // Count earnings only if appointment is completed OR payment is made
            if (appointment.isCompleted || appointment.payment) {
                earnings += appointment.amount;
            }
        });
        // Get unique patient count using Set for better performance
        const uniquePatients = new Set();
        appointments.forEach((appointment) => {
            uniquePatients.add(appointment.userId.toString());
        });
        // Filter appointments for better dashboard metrics
        const activeAppointments = appointments.filter(apt => !apt.cancelled);
        const completedAppointments = appointments.filter(apt => apt.isCompleted);
        const pendingAppointments = appointments.filter(apt => !apt.isCompleted && !apt.cancelled);
        const todaysAppointments = appointments.filter(apt => {
            const today = new Date().toISOString().split('T')[0];
            return apt.slotDate === today && !apt.cancelled;
        });
        // Get latest 5 appointments (most recent first)
        const latestAppointments = activeAppointments
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map(apt => ({
            appointmentId: apt._id,
            patientName: apt.userData.name,
            patientPhone: apt.userData.phone,
            slotDate: apt.slotDate,
            slotTime: apt.slotTime,
            status: apt.isCompleted ? 'completed' : apt.cancelled ? 'cancelled' : 'pending',
            amount: apt.amount,
            paymentStatus: apt.payment ? 'paid' : 'pending'
        }));
        // Prepare comprehensive dashboard data
        const dashData = {
            earnings,
            totalAppointments: appointments.length,
            activeAppointments: activeAppointments.length,
            completedAppointments: completedAppointments.length,
            pendingAppointments: pendingAppointments.length,
            todaysAppointments: todaysAppointments.length,
            totalPatients: uniquePatients.size,
            latestAppointments,
            doctorInfo: {
                name: doctor.name,
                speciality: doctor.specialty,
                available: doctor.available,
                email: doctor.email
            }
        };
        res.status(200).json({
            success: true,
            dashData
        });
    }
    catch (error) {
        console.error("Doctor dashboard error:", error);
        if (error.name === 'CastError') {
            res.status(400).json({
                success: false,
                message: "Invalid data format"
            });
            return;
        }
        next(error);
    }
};
exports.doctorsDashboard = doctorsDashboard;
const getDoctorProfile = async (req, res, next) => {
    try {
        // FIXED: Get doctor ID directly from req.docId (not destructured)
        const doctorId = req.docId; // This is the authenticated doctor ID from middleware
        // Validate doctor ID format
        if (!doctorId || !mongoose_1.default.Types.ObjectId.isValid(doctorId)) {
            res.status(400).json({
                success: false,
                message: "Invalid doctor ID format"
            });
            return;
        }
        // Find doctor profile excluding sensitive fields
        const doctorProfile = await doctorModel_1.default.findById(doctorId).select("-password -__v");
        if (!doctorProfile) {
            res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
            return;
        }
        // Return formatted doctor profile
        res.status(200).json({
            success: true,
            message: "Doctor profile retrieved successfully",
            data: {
                profile: {
                    id: doctorProfile._id,
                    name: doctorProfile.name,
                    email: doctorProfile.email,
                    speciality: doctorProfile.specialty,
                    degree: doctorProfile.degree,
                    experience: doctorProfile.experience,
                    about: doctorProfile.about,
                    fees: doctorProfile.fees,
                    image: doctorProfile.image,
                    address: doctorProfile.address,
                    available: doctorProfile.available,
                    totalSlots: Object.keys(doctorProfile.slots_booked || {}).length
                }
            }
        });
    }
    catch (error) {
        console.error("Get doctor profile error:", error);
        if (error.name === 'CastError') {
            res.status(400).json({
                success: false,
                message: "Invalid doctor ID format"
            });
            return;
        }
        next(error);
    }
};
exports.getDoctorProfile = getDoctorProfile;
const updateDoctorProfile = async (req, res, next) => { };
exports.updateDoctorProfile = updateDoctorProfile;
