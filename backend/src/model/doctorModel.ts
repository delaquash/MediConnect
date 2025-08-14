import bcrypt from "bcryptjs";
import mongoose, { Document, Schema, Model } from "mongoose";

export interface IDoctor extends Document {
  name: string;
  email: string;
  password: string;
  image?: string;
  specialty: string;
  degree: string;
  experience: string;
  about: string;
  available: boolean;
  fees: number;
  address: {
    [key: string]: any;
  };
  date: Date;
  slots_booked: {
    [key: string]: any;
  };

  profileComplete: boolean;
  profileCompletedAt: Date | null;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationOTP?: string | null;         
  emailVerificationOTPExpires?: Date | null;    
  emailVerificationOTPAttempts?: number;        
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;

  checkProfileCompletion(): boolean;
  comparePassword(candidatePassword: string): Promise<boolean>
}

const doctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String  },
    specialty: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    fees: { type: Number, required: true },
    address: { type: Object, required: true },
    date: {type: Date, default: Date.now },

    slots_booked: { type: Object, default: {} },
  },
  { minimize: false, // Prevents mongoose from removing empty objects
    timestamps: true   // Automatically adds createdAt and updatedAt fields
  }, 
);

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

// to compare password

doctorSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean>{
  return await bcrypt.compare(candidatePassword, this.password);
  }


const DoctorModel: Model<IDoctor> =
  mongoose.models.doctor || mongoose.model<IDoctor>("doctor", doctorSchema);

export default DoctorModel;
