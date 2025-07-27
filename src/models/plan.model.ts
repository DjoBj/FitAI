import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
  user: mongoose.Types.ObjectId;
  status: 'draft' | 'active' | 'archived';
  goal: string;
  workoutPlan: any;
  mealPlan: any;
  supplementPlan?: any;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema: Schema = new Schema<IPlan>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
    goal: { type: String, required: true },
    workoutPlan: { type: Schema.Types.Mixed, required: true },
    mealPlan: { type: Schema.Types.Mixed, required: true },
    supplementPlan: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Plan = mongoose.model<IPlan>('Plan', planSchema);
