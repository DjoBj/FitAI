import mongoose, { Document, Schema } from 'mongoose';

export interface IMeal extends Document {
  user_id: string;
  plan_id: string;
  day_number: number;
  week_number: number;
  meal_date: Date;
  meal_type: 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'evening_snack';
  status: 'pending' | 'prepared' | 'consumed' | 'skipped';
  meal_data: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    ingredients: string[];
    prep_time_minutes: number;
    instructions?: string;
  };
  actual_consumption?: {
    calories_consumed: number;
    protein_consumed: number;
    carbs_consumed: number;
    fats_consumed: number;
    portion_eaten: number; // percentage 0-100
    notes?: string;
  };
  prep_started_at?: Date;
  consumed_at?: Date;
  notes?: string;
  rating?: number; // 1-5 scale
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  prepareMeal(): Promise<IMeal>;
  consumeMeal(consumptionData?: any): Promise<IMeal>;
  skipMeal(): Promise<IMeal>;
}

const mealDataSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  calories: {
    type: Number,
    required: true,
    min: 0
  },
  protein: {
    type: Number,
    required: true,
    min: 0
  },
  carbs: {
    type: Number,
    required: true,
    min: 0
  },
  fats: {
    type: Number,
    required: true,
    min: 0
  },
  ingredients: [{
    type: String,
    required: true,
    trim: true
  }],
  prep_time_minutes: {
    type: Number,
    required: true,
    min: 0
  },
  instructions: {
    type: String,
    trim: true
  }
}, { _id: false });

const actualConsumptionSchema = new Schema({
  calories_consumed: {
    type: Number,
    min: 0
  },
  protein_consumed: {
    type: Number,
    min: 0
  },
  carbs_consumed: {
    type: Number,
    min: 0
  },
  fats_consumed: {
    type: Number,
    min: 0
  },
  portion_eaten: {
    type: Number,
    min: 0,
    max: 100
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const mealSchema = new Schema({
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
  meal_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  meal_type: {
    type: String,
    enum: ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'prepared', 'consumed', 'skipped'],
    default: 'pending'
  },
  meal_data: {
    type: mealDataSchema,
    required: true
  },
  actual_consumption: {
    type: actualConsumptionSchema
  },
  prep_started_at: {
    type: Date
  },
  consumed_at: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
mealSchema.index({ user_id: 1, plan_id: 1, day_number: 1, meal_type: 1 });
mealSchema.index({ user_id: 1, meal_date: 1 });
mealSchema.index({ user_id: 1, status: 1 });

// Virtual for completion percentage
mealSchema.virtual('completion_percentage').get(function() {
  if (this.status === 'consumed') return 100;
  if (this.status === 'prepared') return 50;
  if (this.status === 'skipped') return 0;
  return 0;
});

// Virtual for total nutrition consumed
mealSchema.virtual('total_nutrition_consumed').get(function() {
  if (!this.actual_consumption) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0
    };
  }
  
  return {
    calories: this.actual_consumption.calories_consumed || 0,
    protein: this.actual_consumption.protein_consumed || 0,
    carbs: this.actual_consumption.carbs_consumed || 0,
    fats: this.actual_consumption.fats_consumed || 0
  };
});

// Method to mark meal as prepared
mealSchema.methods.prepareMeal = function() {
  this.status = 'prepared';
  this.prep_started_at = new Date();
  return this.save();
};

// Method to mark meal as consumed
mealSchema.methods.consumeMeal = function(consumptionData?: any) {
  this.status = 'consumed';
  this.consumed_at = new Date();
  
  if (consumptionData) {
    this.actual_consumption = {
      calories_consumed: consumptionData.calories_consumed || this.meal_data.calories,
      protein_consumed: consumptionData.protein_consumed || this.meal_data.protein,
      carbs_consumed: consumptionData.carbs_consumed || this.meal_data.carbs,
      fats_consumed: consumptionData.fats_consumed || this.meal_data.fats,
      portion_eaten: consumptionData.portion_eaten || 100,
      notes: consumptionData.notes
    };
  }
  
  return this.save();
};

// Method to skip meal
mealSchema.methods.skipMeal = function() {
  this.status = 'skipped';
  return this.save();
};

// Static method to get daily meals
mealSchema.statics.getDailyMeals = function(userId: string, planId: string, dayNumber: number) {
  return this.find({
    user_id: userId,
    plan_id: planId,
    day_number: dayNumber
  }).sort({ meal_type: 1 });
};

// Static method to get meals by date range
mealSchema.statics.getMealsByDateRange = function(userId: string, startDate: Date, endDate: Date) {
  return this.find({
    user_id: userId,
    meal_date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ meal_date: 1, meal_type: 1 });
};

// Static method to get weekly nutrition summary
mealSchema.statics.getWeeklyNutritionSummary = function(userId: string, planId: string, weekNumber: number) {
  return this.aggregate([
    {
      $match: {
        user_id: userId,
        plan_id: planId,
        week_number: weekNumber,
        status: 'consumed'
      }
    },
    {
      $group: {
        _id: null,
        total_calories: { $sum: '$actual_consumption.calories_consumed' },
        total_protein: { $sum: '$actual_consumption.protein_consumed' },
        total_carbs: { $sum: '$actual_consumption.carbs_consumed' },
        total_fats: { $sum: '$actual_consumption.fats_consumed' },
        meals_consumed: { $sum: 1 }
      }
    }
  ]);
};

// Interface for static methods
interface IMealModel extends mongoose.Model<IMeal> {
  getDailyMeals(userId: string, planId: string, dayNumber: number): Promise<IMeal[]>;
  getMealsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<IMeal[]>;
  getWeeklyNutritionSummary(userId: string, planId: string, weekNumber: number): Promise<any[]>;
}

export const Meal = mongoose.model<IMeal, IMealModel>('Meal', mealSchema); 