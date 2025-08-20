import bcrypt from "bcryptjs";
import { profile } from "console";
import mongoose, { Document, Schema, Model } from "mongoose";

export interface IDoctor extends Document {
  name: string;
  email: string;
  password: string;
  image?: string;
  specialty?: string;
  degree?: string;
  experience?: string;
  about?: string;
  available?: boolean;
  fees?: number;
  address?: {
    [key: string]: any;
  };
  date: Date;
  slots_booked?: {
    [key: string]: any;
  };

  profileComplete?: boolean;
  profileCompletedAt?: Date | null;
  isActive?: boolean;
  isEmailVerified?: boolean;
  emailVerificationOTP?: string | null;         
  emailVerificationOTPExpires?: Date | null;    
  emailVerificationOTPAttempts?: number;        
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date | null;

  checkProfileCompletion(): boolean;
  comparePassword(candidatePassword: string): Promise<boolean>
}

const doctorSchema = new Schema<IDoctor>(
  {
    name: { 
      type: String, 
      required: true,
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name must be less than 50 characters"]  
    },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    isLowercase: true,
    lowercase: true,
    validate: {
      validator: function(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: "Please provide a valid email address"
    }
  },
    password: { 
    type: String, 
    required: [true, "Password is required." ],
    minlength: [8, "Password must be at least 8 characters long"]
  },
    image: { type: String  },
    specialty: { type: String },
    degree: { type: String},
    experience: { type: String },
    about: { type: String},
    available: { type: Boolean, default: true },
    fees: { type: Number },
    address: { type: Object, },
    date: {type: Date, default: Date.now },

    slots_booked: { type: Object, default: {} },
  },
  { minimize: false, // Prevents mongoose from removing empty objects
    timestamps: true   // Automatically adds createdAt and updatedAt fields
  }, 
);


doctorSchema.index({ createdAt: -1})
doctorSchema.index({ profileComplete: -1 })

doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); 

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt); 
    next();
  } catch (error) {
    next(error as Error);
  }
});
// method to check if profile is complete
doctorSchema.methods.checkProfileCompletion = function (){
  const requiredFields = [ "specialty", "degree", "experience", "about", "fees", "address"];
  const isComplete = requiredFields.every(field => {
    const value = field.split(".").reduce((obj, key) => obj && obj[key], this as any);
    return value !== undefined && value !== null && value !== "";
  })
  if(isComplete && !this.profileComplete) {
    this.profileComplete = true;
    this.profileCompletedAt = new Date();
  }
  return isComplete;
}
// to compare password

doctorSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean>{
  return await bcrypt.compare(candidatePassword, this.password);
  }


const DoctorModel: Model<IDoctor> =
  mongoose.models.doctor || mongoose.model<IDoctor>("doctor", doctorSchema);

export default DoctorModel;
