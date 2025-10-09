import mongoose, { Document, Schema, Model } from "mongoose";

export interface IAppointment extends Document {
  userId: any;
  docId: any;
  email?: string;
  slotDate: string;
  slotTime: string;
  userData: Record<string, any>;
  docData: Record<string, any>;
  amount?: number;
  date: number;
  payment: boolean;
  isCompleted: boolean;
  cancelled?: boolean;
  cancelledBy?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  paymentMethod?: 'paystack' | 'cash' | null;
  paymentReference?: string | null;
  paidAt?: Date | null;
}

const appointmentSchema = new Schema<IAppointment>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  docId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  email:{type: String},
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userData: { type: Object, required: true },
  docData: { type: Object, required: true },
  amount: { type: Number},
  date: { type: Number, required: true },
  cancelled: { type: Boolean, default: false },
  payment: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  paymentMethod: { type: String, enum: ['paystack', 'cash'], default: null },
  paymentReference: { type: String, default: null },
  paidAt: { type: Date, default: null }
});

const AppointmentModel: Model<IAppointment> =
  mongoose.models.appointment ||
  mongoose.model<IAppointment>("appointment", appointmentSchema);

export default AppointmentModel;
