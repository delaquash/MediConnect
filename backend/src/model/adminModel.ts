import bcrypt from "bcryptjs";
import mongoose, { Document, Schema, Model } from "mongoose";

export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  permissions:string[];
  isActive:Boolean;

  emailVerificationToken?: string | null;
  emailVerificationOTPExpires?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;

  lastLogin?: Date | null;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const adminSchema = new mongoose.Schema<IAdmin>({
  name: {
    type: String,
    required: true,
    default: "System Admin",
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: "Please provide a valid email address",
    },
  },
  password: {
     type: String,
    required: true
  },
  role: {
    type: String,
    default: 'system_admin'
  },
  permissions: [{
    type: String,
    enum: ['add_doctor', 'manage_doctors', 'view_appointments', 'cancel_appointments', 'view_dashboard', 'manage_users'],
    default: ['add_doctor', 'manage_doctors', 'view_appointments', 'cancel_appointments', 'view_dashboard', 'manage_users']
  }],
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  },

  // {
  //   name: {
  //     type: String,
  //     required: true,
  //     trim: true,
  //     minlength: [2, "Name must be at least 2 characters long"],
  //     maxlength: [50, "Name must be less than 50 characters"],
  //   },
  //   email: {
  //     type: String,
  //     required: true,
  //     unique: true,
  //     trim: true,
  //     lowercase: true,
  //     validate: {
  //       validator: function (email: string) {
  //         return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  //       },
  //       message: "Please provide a valid email address",
  //     },
  //   },
  //   password: {
  //     type: String,
  //     required: [true, "Password is required."],
  //     minlength: [8, "Password must be at least 8 characters long"],
  //   },

  //   emailVerificationToken: {
  //     type: String,
  //     default: null,
  //   },
  //   emailVerificationOTPExpires: {
  //     type: Date,
  //     default: null,
  //   },

  //   passwordResetToken: {
  //     type: String,
  //     default: null,
  //   },
  //   passwordResetExpires: {
  //     type: Date,
  //     default: null,
  //   },
  //   lastLogin: {
  //     type: Date,
  //     default: null,
  //   },
  // },

}, 
{
  timestamps: true
}

)

// Indexes for faster queries
adminSchema.index({ createdAt: -1 });

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

const AdminModel: Model<IAdmin> =
  mongoose.models.admin || mongoose.model<IAdmin>("admin", adminSchema);

export default AdminModel;
