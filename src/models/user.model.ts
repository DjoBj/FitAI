import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  birthDate: Date;
  password: string;
  isEmailVerified: boolean;
  isPremium: boolean;
  premiumExpiresAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  gender: 'male' | 'female' | 'other';
  fitnessGoal?: string;
  trainingLevel?: string;
  planDuration?: number;
  focusAreas?: string[];
  equipmentAvailable?: string[];
  currentPlanId?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
  getAge(): number;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  birthDate: { type: Date, required: true },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  isEmailVerified: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
  premiumExpiresAt: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: false,
    default: 'other',
  },
  fitnessGoal: { type: String },
  trainingLevel: { type: String },
  planDuration: { type: Number, default: 8 },
  focusAreas: [{ type: String }],
  equipmentAvailable: [{ type: String }],
  currentPlanId: { type: String }
}, {
  timestamps: true,
  toJSON: {
    transform: function (_, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getFullName = function (): string {
  return `${this.firstName} ${this.lastName}`;
};

userSchema.methods.getAge = function (): number {
  const now = new Date();
  const dob = new Date(this.birthDate);
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};


userSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model<IUser>('User', userSchema);