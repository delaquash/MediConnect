import mongoose, { Document, Schema, Model } from "mongoose";

export interface IAppointment extends Document {
  userId: any;
  docId: any;
  email?: string;
  slotDate: string;
  slotTime: string;
  userData: Record<string, any>;
  docData: Record<string, any>;
  amount: number;
  date: number;
  payment: boolean;
  isCompleted: boolean;
  cancelled?: boolean;
  cancelledBy?: string;
  cancellationReason?: string;
  cancelledAt?: Date;

}

const appointmentSchema = new Schema<IAppointment>({
  userId: { type: String, required: true },
  docId: { type: String, required: true },
  email:{type: String, required: true},
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userData: { type: Object, required: true },
  docData: { type: Object, required: true },
  amount: { type: Number, required: true },
  date: { type: Number, required: true },
  cancelled: { type: Boolean, default: false },
  payment: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
});

const AppointmentModel: Model<IAppointment> =
  mongoose.models.appointment ||
  mongoose.model<IAppointment>("appointment", appointmentSchema);

export default AppointmentModel;
