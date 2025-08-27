"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// Configure disk storage for uploaded files
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/'); // Save files to 'uploads' directory
    },
    filename: function (req, file, cb) {
        // Create unique filename by prepending timestamp to original name
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});
// File filter function to validate file types
const fileFilter = (req, file, cb) => {
    // Define allowed file extensions using regex
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    // Check if file extension is allowed
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    // Check if MIME type is allowed
    const mimetype = allowedTypes.test(file.mimetype);
    // Accept file only if both extension and MIME type are valid
    if (mimetype && extname) {
        return cb(null, true); // Accept the file
    }
    else {
        cb(new Error('Only images and PDF files are allowed!')); // Reject the file
    }
};
// Create multer instance with configuration
const upload = (0, multer_1.default)({
    storage, // Use the disk storage configuration
    fileFilter, // Apply file type validation
    limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
});
exports.default = upload;
