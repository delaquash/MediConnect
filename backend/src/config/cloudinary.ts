
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Debug log to verify (remove after fixing)
console.log('Cloudinary configured with:', {
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? '***exists***' : 'MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '***exists***' : 'MISSING'
});

export default cloudinary;