import mongoose, { Document, Schema } from 'mongoose';

export interface IFitnessProfile extends Document {
  userId: mongoose.Types.ObjectId;
  goal: string;
  workoutPlan: string;
  mealPlan: string;
  diet: string;
  equipment: 'gym' | 'home' | 'outdoor';
  experience: 'beginner' | 'intermediate' | 'advanced';
  preferences?: string;
  daysPerWeek: number;
  createdAt: Date;
  updatedAt: Date;
}

const FitnessProfileSchema = new Schema<IFitnessProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  goal: {
    type: String,
    required: true,
    trim: true
  },
  workoutPlan: {
    type: String,
    required: true,
    trim: true
  },
  mealPlan: {
    type: String,
    required: true,
    trim: true
  },
  diet: {
    type: String,
    required: true,
    trim: true
  },
  equipment: {
    type: String,
    enum: ['gym', 'home', 'outdoor'],
    required: true
  },
  experience: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  preferences: {
    type: String,
    trim: true
  },
  daysPerWeek: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  }
}, {
  timestamps: true
});

export const FitnessProfile = mongoose.model<IFitnessProfile>('FitnessProfile', FitnessProfileSchema);
