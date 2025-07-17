import { timeStamp } from "console";
import mongoose, { Document, Schema, Model } from "mongoose";

export interface IDoctor extends Document {
  name: string;
  email: string;
  password: string;
  image: string;
  specialty: string;
  degree: string;
  experience: string;
  about: string;
  available: boolean;
  fees: number;
  address: {
    [key: string]: any;
  };
  date: number;
  slots_booked: {
    [key: string]: any;
  };
}

const doctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    specialty: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    fees: { type: Number, required: true },
    address: { type: Object, required: true },
    date: { type: Number, required: true },
    slots_booked: { type: Object, default: {} },
  },
  { minimize: false, // Prevents mongoose from removing empty objects
    timestamps: true   // Automatically adds createdAt and updatedAt fields
  }, 
  

);

const DoctorModel: Model<IDoctor> =
  mongoose.models.doctor || mongoose.model<IDoctor>("doctor", doctorSchema);

export default DoctorModel;
