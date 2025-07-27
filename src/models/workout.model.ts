import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkout extends Document {
  user_id: string;
  plan_id: string;
  day_number: number;
  week_number: number;
  workout_date: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  exercises: {
    name: string;
    sets: number;
    reps: string;
    weight?: number;
    rest_seconds: number;
    muscle_groups: string[];
    completed_sets: number;
    notes?: string;
  }[];
  total_duration_minutes?: number;
  calories_burned?: number;
  difficulty_rating?: number; // 1-10 scale
  notes?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const exerciseSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sets: {
    type: Number,
    required: true,
    min: 1
  },
  reps: {
    type: String,
    required: true,
    trim: true
  },
  weight: {
    type: Number,
    min: 0
  },
  rest_seconds: {
    type: Number,
    required: true,
    min: 0
  },
  muscle_groups: [{
    type: String,
    required: true,
    trim: true
  }],
  completed_sets: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: true });

const workoutSchema = new Schema({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  plan_id: {
    type: String,
    required: true,
    index: true
  },
  day_number: {
    type: Number,
    required: true,
    min: 1
  },
  week_number: {
    type: Number,
    required: true,
    min: 1
  },
  workout_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'skipped'],
    default: 'pending'
  },
  exercises: [exerciseSchema],
  total_duration_minutes: {
    type: Number,
    min: 0
  },
  calories_burned: {
    type: Number,
    min: 0
  },
  difficulty_rating: {
    type: Number,
    min: 1,
    max: 10
  },
  notes: {
    type: String,
    trim: true
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
workoutSchema.index({ user_id: 1, plan_id: 1, day_number: 1 });
workoutSchema.index({ user_id: 1, workout_date: 1 });
workoutSchema.index({ user_id: 1, status: 1 });

// Virtual for completion percentage
workoutSchema.virtual('completion_percentage').get(function() {
  if (!this.exercises || this.exercises.length === 0) return 0;
  
  const totalSets = this.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const completedSets = this.exercises.reduce((sum, exercise) => sum + exercise.completed_sets, 0);
  
  return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
});

// Method to mark workout as completed
workoutSchema.methods.completeWorkout = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  
  // Mark all exercises as completed
  this.exercises.forEach(exercise => {
    exercise.completed_sets = exercise.sets;
  });
  
  return this.save();
};

// Method to start workout
workoutSchema.methods.startWorkout = function() {
  this.status = 'in_progress';
  return this.save();
};

// Method to skip workout
workoutSchema.methods.skipWorkout = function() {
  this.status = 'skipped';
  return this.save();
};

// Static method to get workouts by date range
workoutSchema.statics.getWorkoutsByDateRange = function(userId: string, startDate: Date, endDate: Date) {
  return this.find({
    user_id: userId,
    workout_date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ workout_date: 1 });
};

// Static method to get current week workouts
workoutSchema.statics.getCurrentWeekWorkouts = function(userId: string, planId: string, weekNumber: number) {
  return this.find({
    user_id: userId,
    plan_id: planId,
    week_number: weekNumber
  }).sort({ day_number: 1 });
};

export const Workout = mongoose.model<IWorkout>('Workout', workoutSchema); 