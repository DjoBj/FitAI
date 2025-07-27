# Plan Activation and Modification API

This document describes the new API endpoints for automatically activating plans and modifying workouts/meals after user confirmation.

## Overview

When a user confirms an AI-generated plan, the system automatically:
1. Creates all workout entries for the entire plan duration
2. Creates all meal entries for the entire plan duration
3. Schedules workouts and meals on appropriate dates
4. Updates the plan status to 'active'

## API Endpoints

### 1. Confirm and Activate Plan

**POST** `/api/v1/ai/confirm-plan/:id`

Confirms an AI-generated plan and automatically creates all workouts and meals.

#### Request
```json
{
  "planId": "507f1f77bcf86cd799439011"
}
```

#### Response
```json
{
  "success": true,
  "message": "Plan activated successfully",
  "data": {
    "plan": {
      "_id": "507f1f77bcf86cd799439011",
      "user": "507f1f77bcf86cd799439012",
      "status": "active",
      "goal": "muscle_gain",
      "workoutPlan": { /* workout plan data */ },
      "mealPlan": { /* meal plan data */ }
    },
    "activationDetails": {
      "workoutsCreated": 24,
      "mealsCreated": 175,
      "startDate": "2024-01-15T00:00:00.000Z"
    }
  }
}
```

### 2. Get User Schedule

**GET** `/api/v1/ai/schedule?days=7`

Retrieves upcoming workouts and meals for the authenticated user.

#### Query Parameters
- `days` (optional): Number of days to look ahead (default: 7)

#### Response
```json
{
  "success": true,
  "message": "Schedule retrieved successfully",
  "data": {
    "scheduleByDate": {
      "2024-01-15": {
        "workouts": [
          {
            "id": "507f1f77bcf86cd799439013",
            "day_number": 1,
            "week_number": 1,
            "status": "pending",
            "exercises": [
              {
                "name": "Push-ups",
                "sets": 3,
                "reps": "8-12",
                "rest_seconds": 60,
                "muscle_groups": ["chest", "triceps", "shoulders"],
                "completed_sets": 0
              }
            ],
            "total_duration_minutes": 25,
            "workout_date": "2024-01-15T00:00:00.000Z"
          }
        ],
        "meals": [
          {
            "id": "507f1f77bcf86cd799439014",
            "day_number": 1,
            "week_number": 1,
            "meal_type": "breakfast",
            "status": "pending",
            "meal_data": {
              "name": "Mediterranean Oatmeal",
              "calories": 400,
              "protein": 15,
              "carbs": 60,
              "fats": 12,
              "ingredients": ["oats", "almonds", "dates", "cinnamon"],
              "prep_time_minutes": 10
            },
            "meal_date": "2024-01-15T00:00:00.000Z"
          }
        ]
      }
    },
    "summary": {
      "totalWorkouts": 5,
      "totalMeals": 35,
      "daysRequested": 7
    }
  }
}
```

### 3. Modify Plan

**PUT** `/api/v1/ai/modify-plan/:id`

Modifies specific workouts or meals in an active plan.

#### Request Body
```json
{
  "modifications": {
    "workouts": [
      {
        "weekNumber": 1,
        "dayNumber": 1,
        "exercises": [
          {
            "name": "Modified Push-ups",
            "sets": 4,
            "reps": "10-15",
            "rest_seconds": 90,
            "muscle_groups": ["chest", "triceps", "shoulders"]
          }
        ]
      }
    ],
    "meals": [
      {
        "weekNumber": 1,
        "dayNumber": 1,
        "mealType": "breakfast",
        "mealData": {
          "name": "Modified Breakfast",
          "calories": 450,
          "protein": 18,
          "carbs": 65,
          "fats": 15,
          "ingredients": ["oats", "protein powder", "banana", "almonds"],
          "prep_time_minutes": 8
        }
      }
    ]
  }
}
```

#### Response
```json
{
  "success": true,
  "message": "Plan modified successfully",
  "data": {
    "modifications": {
      "workouts": {
        "updated": 1,
        "created": 0
      },
      "meals": {
        "updated": 1,
        "created": 0
      }
    },
    "summary": {
      "totalWorkoutsModified": 1,
      "totalMealsModified": 1
    }
  }
}
```

### 4. Get Plan History

**GET** `/api/v1/ai/modify-plan/:id/history`

Retrieves the complete history of workouts and meals for a plan.

#### Response
```json
{
  "success": true,
  "message": "Plan history retrieved successfully",
  "data": {
    "historyByWeek": {
      "1": {
        "workouts": [
          {
            "id": "507f1f77bcf86cd799439013",
            "day_number": 1,
            "status": "completed",
            "exercises": [/* exercise data */],
            "total_duration_minutes": 25,
            "workout_date": "2024-01-15T00:00:00.000Z"
          }
        ],
        "meals": [
          {
            "id": "507f1f77bcf86cd799439014",
            "day_number": 1,
            "meal_type": "breakfast",
            "status": "consumed",
            "meal_data": {/* meal data */},
            "meal_date": "2024-01-15T00:00:00.000Z"
          }
        ]
      }
    },
    "summary": {
      "totalWeeks": 4,
      "totalWorkouts": 24,
      "totalMeals": 175
    }
  }
}
```

## Workflow

### 1. Plan Generation
1. User requests AI plan generation
2. AI generates comprehensive plan with workouts and meals
3. Plan is saved with status 'draft'

### 2. Plan Confirmation
1. User reviews the generated plan
2. User confirms the plan via `/confirm-plan/:id`
3. System automatically:
   - Creates all workout entries for the entire plan duration
   - Creates all meal entries for the entire plan duration
   - Schedules everything on appropriate dates
   - Updates plan status to 'active'

### 3. Plan Execution
1. User can view their schedule via `/schedule`
2. User can track progress on workouts and meals
3. User can modify specific workouts/meals via `/modify-plan/:id`

## Data Structure

### Workout Entry
```typescript
{
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
  difficulty_rating?: number;
  notes?: string;
  completedAt?: Date;
}
```

### Meal Entry
```typescript
{
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
    portion_eaten: number;
    notes?: string;
  };
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common error scenarios:
- Plan not found
- Plan already active
- Invalid modification format
- User not authorized
- Database connection issues

## Notes

1. **Date Calculation**: The system automatically calculates appropriate dates for workouts and meals based on the plan start date (typically next Monday).

2. **Status Tracking**: Each workout and meal has a status that can be updated as the user progresses through their plan.

3. **Modifications**: Users can modify specific workouts or meals without affecting the entire plan structure.

4. **History**: All modifications are tracked and can be viewed through the history endpoint.

5. **Validation**: All inputs are validated to ensure data integrity and proper plan structure. 