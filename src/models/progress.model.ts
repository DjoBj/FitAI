import mongoose, { Document, Schema } from 'mongoose';

export interface IProgress extends Document {
  user_id: string;
  plan_id: string;
  day_number: number;
  status: 'in_progress' | 'completed';
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const progressSchema = new Schema<IProgress>({
  user_id: { type: String, required: true },
  plan_id: { type: String, required: true },
  day_number: { type: Number, required: true },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    default: 'in_progress'
  },
  completedAt: { type: Date }
}, {
  timestamps: true
});

export const Progress = mongoose.model<IProgress>('Progress', progressSchema); 