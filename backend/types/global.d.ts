declare global {
    namespace Express {
        // Custom file interface without Multer dependency
        interface UploadedFile {
            fieldname: string;          // Field name specified in the form
            originalname: string;       // Name of the file on the user's computer
            encoding: string;           // Encoding type of the file
            mimetype: string;           // MIME type of the file
            size: number;              // Size of the file in bytes
            destination?: string;       // Folder where file was uploaded
            filename?: string;          // Name of the file within the destination
            path?: string;             // Full path to the uploaded file
            buffer?: Buffer;           // Buffer of the entire file (for memory storage)
        }

        interface Request {
            // Single file upload
            file?: UploadedFile;
            
            // Multiple files upload
            files?: UploadedFile[] | { [fieldname: string]: UploadedFile[] };
            
            // Additional custom properties you might need
            user?: any;                // For authentication
            body: any;              
            userId?: string;// Ensure body is typed
            docId?: string;
        }
    }
}

// File upload utility types
export interface FileUploadOptions {
    destination: string;
    filename?: (file: Express.UploadedFile) => string;
    fileFilter?: (file: Express.UploadedFile) => boolean;
    limits?: {
        fileSize?: number;
        files?: number;
    };
}

export interface FileUploadResult {
    success: boolean;
    message: string;
    file?: Express.UploadedFile;
    files?: Express.UploadedFile[];
    error?: string;
}

// Define custom interface extending Request
export interface AuthenticatedRequest extends Request {
  userId?: string;
}


// Export to make this a module (required for global declarations)
export {};