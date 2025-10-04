// middleware/multer.ts
import multer, { FileFilterCallback } from "multer";
import path from "path";

// Configure memory storage (stores files in memory as Buffer)
const storage = multer.memoryStorage();

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
    storage,                                    
    fileFilter,                              
    limits: { fileSize: 5 * 1024 * 1024 }     
});

export const uploadSingle = upload.single('image');
export default upload;