import multer, { FileFilterCallback } from "multer";
import path from "path";

// Configure disk storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
        cb(null, './uploads/'); // Save files to 'uploads' directory
    },
    filename: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
        // Create unique filename by prepending timestamp to original name
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

// File filter function to validate file types
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Define allowed file extensions using regex
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    
    // Check if file extension is allowed
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    // Check if MIME type is allowed
    const mimetype = allowedTypes.test(file.mimetype);
    
    // Accept file only if both extension and MIME type are valid
    if (mimetype && extname) {
        return cb(null, true); // Accept the file
    } else {
        cb(new Error('Only images and PDF files are allowed!')); // Reject the file
    }
};

// Create multer instance with configuration
const upload = multer({ 
    storage,                                    // Use the disk storage configuration
    fileFilter,                                 // Apply file type validation
    limits: { fileSize: 5 * 1024 * 1024 }     // Limit file size to 5MB
});

export default upload;