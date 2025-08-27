"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelAppointment = exports.listAppointment = exports.bookAppointment = exports.updateProfile = exports.getProfile = exports.loginUser = exports.registerUser = void 0;
const userModel_1 = __importDefault(require("../model/userModel"));
const validator_1 = __importDefault(require("validator"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cloudinary_1 = require("cloudinary");
const doctorModel_1 = __importDefault(require("../model/doctorModel"));
const appointmentModel_1 = __importDefault(require("../model/appointmentModel"));
const timeSlot_1 = require("../utils/timeSlot");
const appointmentDate_1 = require("../utils/appointmentDate");
const mongoose_1 = __importDefault(require("mongoose"));
const appointmentModel_2 = __importDefault(require("../model/appointmentModel"));
const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, image, address, gender, dob, phone } = req.body;
        if (!name || !email || !password || !address || !image || !gender || !dob || !phone) {
            res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });
            return;
        }
        if (!validator_1.default.isEmail(email)) {
            res.status(400).json({ message: "Invalid email format" });
            return;
        }
        if (!validator_1.default.isStrongPassword(password, {
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
        const existingUser = await userModel_1.default.findOne({ email });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: "User already exists with this email"
            });
            return;
        }
        let uploadedImage;
        // ✅ Add file validation
        if (req.file) {
            // File upload - upload to Cloudinary
            const fileStr = `data:${req.file?.mimetype};base64,${req.file?.buffer?.toString('base64')}`;
            const result = await cloudinary_1.v2.uploader.upload(fileStr, {
                folder: 'uploads',
                resource_type: 'auto',
            });
            uploadedImage = result.secure_url;
        }
        else if (image) {
            // Image URL provided
            uploadedImage = image;
        }
        else {
            res.status(400).json({ message: "Doctor image is required (either upload file or provide image URL)" });
            return;
        }
        const user = new userModel_1.default({
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
    }
    catch (error) {
        next(error);
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: "Email and password are required" });
            return;
        }
        const user = await userModel_1.default.findOne({ email });
        if (!user) {
            res.json({ success: false, message: "Invalid credentials" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "30d"
        });
        res.status(200).json({
            success: true,
            message: "User login successfully",
            token,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.loginUser = loginUser;
const getProfile = async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }
        const userProfile = await userModel_1.default.findById(userId).select("-password");
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
    }
    catch (error) {
        next(error);
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res, next) => {
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
        const existingUser = await userModel_1.default.findById(userId);
        if (!existingUser) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }
        // Prepare update object with basic fields
        const updateData = {
            name,
            address,
            dob,
            phone
        };
        // Handle password update if provided
        if (password) {
            // Validate password strength
            if (!validator_1.default.isStrongPassword(password, {
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
                const fileStr = `data:${imageFile.mimetype};base64,${imageFile?.buffer?.toString('base64')}`;
                // Upload to Cloudinary
                const result = await cloudinary_1.v2.uploader.upload(fileStr, {
                    folder: 'uploads',
                    resource_type: 'auto',
                });
                // Add image URL to update data
                updateData.image = result.secure_url;
            }
            catch (uploadError) {
                console.error("Image upload error:", uploadError);
                res.status(500).json({
                    success: false,
                    message: "Failed to upload image"
                });
                return;
            }
        }
        // Update user profile in a single operation
        const updatedUser = await userModel_1.default.findByIdAndUpdate(userId, updateData, {
            new: true, // Return updated document
            runValidators: true // Run schema validators
        }).select("-password"); // Exclude password from response
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
    }
    catch (error) {
        console.error("Update profile error:", error);
        next(error);
    }
};
exports.updateProfile = updateProfile;
const bookAppointment = async (req, res, next) => {
    // Start MongoDB session for transaction support (ensures data consistency)
    const session = await mongoose_1.default.startSession();
    try {
        // Execute all database operations within a transaction
        // If any operation fails, all changes are rolled back automatically
        await session.withTransaction(async () => {
            // Extract data from incoming HTTP request
            const authenticatedUserId = req.userId; // User ID from authentication middleware
            const { docId, userId, slotDate, slotTime } = req.body; // Body of the request, can be used for additional data
            //   // Verify that authenticated user is booking for themselves (prevent unauthorized bookings)
            if (authenticatedUserId !== userId) {
                res.status(403).json({
                    success: false,
                    message: "You can only book appointments for yourself"
                });
            }
            // Check if all required fields are provided
            if (!userId || !docId || !slotDate || !slotTime) {
                res.status(400).json({
                    success: false,
                    message: "All fields are required"
                });
            }
            // Validate that user ID and doctor ID are valid MongoDB ObjectIds
            if (!mongoose_1.default.Types.ObjectId.isValid(userId) || !mongoose_1.default.Types.ObjectId.isValid(docId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid user or doctor ID"
                });
                return; // Reject invalid dates
            }
            // Validate appointment date (must be today or future, within 3 months)
            if (!(0, appointmentDate_1.isValidAppointmentDate)(slotDate)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid appointment date. Must be today or within 3 months."
                });
                return;
            }
            // Validate time slot (must be within business hours and 30-minute intervals)
            if (!(0, timeSlot_1.isValidTimeSlot)(slotTime)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid time slot. Please select a valid time between 9:00 AM and 5:00 PM"
                });
                return; // Reject invalid time slots
            }
            // Retrieve user document from database and include in transaction session  
            const user = await userModel_1.default.findById(userId).session(session);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: "User not found"
                });
                return; // Stop further processing if user not found
            }
            //   Retrieve doctor document from database and include in transaction session  
            const doctor = await doctorModel_1.default.findById(docId).session(session);
            if (!doctor) {
                res.status(404).json({
                    success: false,
                    message: "Doctor not found"
                });
                return; // Stop further processing if doctor not found
            }
            // Check if doctor is currently accepting appointments
            if (!doctor.available) {
                res.status(400).json({
                    success: false,
                    message: "Doctor is currently unavailable for appointments"
                });
                return; // Cannot book with unavailable doctor
            }
            // Get doctor's booked slots (object with dates as keys, time arrays as values)
            const doctorSlotsBooked = doctor.slots_booked || {};
            // Get already booked slots for the requested date (empty array if no bookings)
            const bookedSlotsForDate = doctorSlotsBooked[slotDate] || [];
            // Check if requested time slot is already booked
            if (bookedSlotsForDate.includes(slotTime)) {
                res.status(409).json({
                    success: false,
                    message: "This time slot is already booked. Please select another time."
                });
                return; // Cannot double-book same slot
            }
            // Check for existing appointment with same parameters (prevent duplicate bookings)
            // Check for existing appointment with same parameters (prevent duplicate bookings)
            const existingAppointment = await appointmentModel_1.default.findOne({
                userId, // Same user
                docId, // Same doctor
                slotDate, // Same date
                slotTime, // Same time
                cancelled: false // Only check non-cancelled appointments
            }).session(session); // Include in transaction
            // If duplicate appointment found, reject the request
            if (existingAppointment) {
                res.status(409).json({
                    success: false,
                    message: "You already have an appointment with this doctor at this time"
                });
                return; // Prevent duplicate bookings
            }
            // Prepare appointment data object with all required information
            const appointmentData = {
                userId, // User ID from authenticated request
                docId, // Doctor ID from request body
                slotDate, // Date of the appointment
                slotTime, // Time of the appointment
                userData: {
                    name: user.name, // User's name
                    email: user.email, // User's email
                    phone: user.phone, // User's phone number
                    address: user.address // User's address
                },
                docData: {
                    name: doctor.name, // Doctor's name
                    specialty: doctor.specialty, // Doctor's specialty
                    degree: doctor.degree, // Doctor's degree    
                    fees: doctor.fees // Doctor's consultation fees
                },
                amount: doctor.fees, // Appointment fee based on doctor's fees
                date: Date.now(), // Current timestamp for appointment creation
                cancelled: false, // Initially not cancelled
                payment: false, // Initially not paid
                isCompleted: false // Initially not completed
            };
            // Create new appointment document with prepared data
            const newAppointment = new appointmentModel_1.default(appointmentData);
            // Save appointment to database within transaction
            await newAppointment.save({ session });
            // Create copy of doctor's existing booked slots to avoid mutation
            const updatedBookedSlots = { ...doctorSlotsBooked };
            // If no slots exist for this date, initialize empty array
            if (!updatedBookedSlots[slotDate]) {
                updatedBookedSlots[slotDate] = [];
            }
            // Add the newly booked time slot to the date's array
            updatedBookedSlots[slotDate].push(slotTime);
            // Update doctor document with new booked slots within transaction
            await doctorModel_1.default.findByIdAndUpdate(docId, // Find doctor by ID
            { slots_booked: updatedBookedSlots }, // Update slots_booked field
            { session } // Include in transaction
            );
            // Send successful response with appointment details
            res.status(201).json({
                success: true,
                message: "Appointment booked successfully",
                appointment: {
                    appointmentId: newAppointment._id, // MongoDB-generated appointment ID
                    doctorName: doctor.name, // Doctor's name for confirmation
                    speciality: doctor.specialty, // Doctor's specialty for confirmation
                    slotDate, // Booked date for confirmation
                    slotTime, // Booked time for confirmation
                    fees: doctor.fees, // Amount to be paid
                    status: "confirmed" // Appointment status
                }
            });
        });
    }
    catch (error) {
        // Log error details for debugging purposes
        console.error("Book appointment error:", error);
        // Handle specific MongoDB validation errors
        if (error.name === 'ValidationError') {
            res.status(400).json({
                success: false,
                message: "Validation error: Please check your input data"
            });
            return;
        }
        // Handle MongoDB ObjectId casting errors
        if (error.name === 'CastError') {
            res.status(400).json({
                success: false,
                message: "Invalid ID format"
            });
            return;
        }
        // Pass unhandled errors to Express error middleware
        next(error);
    }
    finally {
        // Always end the MongoDB session to prevent memory leaks
        await session.endSession();
    }
};
exports.bookAppointment = bookAppointment;
const listAppointment = async (req, res, next) => {
    try {
        const { userId } = req.body;
        // Validate that user ID and doctor ID are valid MongoDB ObjectIds
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
            return; // Reject invalid dates
        }
        const userAppointment = await appointmentModel_2.default.find({ userId });
        res.status(200).json({
            success: true,
            message: "Appointment details successfully retrieved",
            userAppointment
        });
    }
    catch (error) {
        next(error);
    }
};
exports.listAppointment = listAppointment;
// Cancel an existing appointment
const cancelAppointment = async (req, res, next) => {
    // Start MongoDB session for transaction support
    const session = await mongoose_1.default.startSession();
    try {
        // Execute cancellation within transaction
        await session.withTransaction(async () => {
            // Get authenticated user ID from middleware
            const userId = req.userId;
            // Get appointment ID from request body
            const { appointmentId } = req.body;
            // Find appointment that belongs to user and is not already cancelled
            const appointment = await appointmentModel_1.default.findOne({
                _id: appointmentId, // Match appointment ID
                userId, // Ensure appointment belongs to authenticated user
                cancelled: false // Only find non-cancelled appointments
            }).session(session); // Include in transaction
            // Check if appointment exists and is cancellable
            if (!appointment) {
                res.status(404).json({
                    success: false,
                    message: "Appointment not found or already cancelled"
                });
                return; // Cannot cancel non-existent or already cancelled appointment
            }
            // Mark appointment as cancelled in database
            await appointmentModel_1.default.findByIdAndUpdate(appointmentId, // Find appointment by ID
            { cancelled: true }, // Set cancelled field to true
            { session } // Include in transaction
            );
            // Find doctor and update their available slots
            const doctor = await doctorModel_1.default.findById(appointment.docId).session(session);
            if (doctor) { // Only update if doctor still exists
                // Create copy of doctor's booked slots
                const updatedSlots = { ...doctor.slots_booked };
                // Get current booked slots for appointment date
                const dateSlots = updatedSlots[appointment.slotDate] || [];
                // Remove cancelled appointment time from booked slots
                updatedSlots[appointment.slotDate] = dateSlots.filter((slot) => slot !== appointment.slotTime);
                // Update doctor document with modified slots
                await doctorModel_1.default.findByIdAndUpdate(appointment.docId, // Find doctor by ID
                { slots_booked: updatedSlots }, // Update slots_booked field
                { session } // Include in transaction
                );
            }
            // Send successful cancellation response
            res.status(200).json({
                success: true,
                message: "Appointment cancelled successfully"
            });
        });
    }
    catch (error) {
        // Pass any errors to Express error middleware
        next(error);
    }
    finally {
        // Always end the MongoDB session
        await session.endSession();
    }
};
exports.cancelAppointment = cancelAppointment;
// / Get available slots for a doctor on a specific date
const getAvailableSlots = async (req, res, next) => {
    try {
        // Extract doctor ID and date from URL parameters
        const { docId, date } = req.params;
        // Validate doctor ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(docId)) {
            res.status(400).json({
                success: false,
                message: "Invalid doctor ID"
            });
            return; // Stop if doctor ID is malformed
        }
        // Find doctor in database
        const doctor = await doctorModel_1.default.findById(docId);
        if (!doctor) { // Check if doctor exists
            res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
            return; // Cannot get slots for non-existent doctor
        }
        // Generate all possible time slots for the day
        const allSlots = (0, timeSlot_1.generateTimeSlots)();
        // Get booked slots for the requested date (empty array if none)
        const bookedSlots = doctor.slots_booked[date] || [];
        // Filter out booked slots to get available slots
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
        // Return availability information
        res.status(200).json({
            success: true,
            availableSlots, // Array of available time slots
            totalSlots: allSlots.length, // Total number of possible slots
            bookedSlots: bookedSlots.length // Number of already booked slots
        });
    }
    catch (error) {
        // Pass any errors to Express error middleware
        next(error);
    }
};
