import { User, IUser } from '@/models/user.model';
import { Plan } from '@/models/plan.model';
import { generativeAIClient } from '@/config/ai';

interface AIPlanRequest {
  goal_type: string;
  duration_weeks: number;
  difficulty_level: string;
  focus_areas?: string[];
  equipment_available?: string[];
}

interface WorkoutDay {
  day: number;
  dayName: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    rest_seconds: number;
    muscle_groups: string[];
  }[];
  isRestDay: boolean;
}

interface WorkoutWeek {
  week: number;
  focus: string;
  days: WorkoutDay[];
}

interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  prep_time_minutes: number;
}

interface DailyMealPlan {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  meals: {
    breakfast: Meal;
    morning_snack: Meal;
    lunch: Meal;
    afternoon_snack: Meal;
    dinner: Meal;
  };
}

interface Supplement {
  name: string;
  dosage: string;
  timing: string;
  purpose: string;
  optional: boolean;
}

interface WeeklyInstruction {
  week: number;
  focus: string;
  habits: string[];
  adjustments: string[];
  motivation_tip: string;
}

interface AIResponse {
  supplementPlan: { supplements: Supplement[]; notes?: string; };
  workout_plan: {
    weeks: WorkoutWeek[];
    notes?: string;
  };
  meal_plan: {
    daily_template: DailyMealPlan;
    weekly_variations?: string[];
    notes?: string;
  };
  supplement_guide: {
    supplements: Supplement[];
    notes?: string;
  };
  weekly_instructions: WeeklyInstruction[];
}

/**
 * Generates a prompt for the AI based on user and plan request.
 * Enhanced with more specific formatting requirements.
 */
export const generateAIPrompt = (user: IUser, planRequest: AIPlanRequest): string => {
  const fullName = `${user.firstName} ${user.lastName}`;
  const age = user.getAge();
  const gender = user.gender;
  const goal = planRequest.goal_type;
  const level = planRequest.difficulty_level;
  const duration = planRequest.duration_weeks;
  const focus = planRequest.focus_areas?.length ? planRequest.focus_areas.join(', ') : 'General fitness';
  const equipment = planRequest.equipment_available?.length ? planRequest.equipment_available.join(', ') : 'Bodyweight only';

  return `
You are a professional fitness and nutrition coach assistant named FitAI. Create a full personalized coaching plan for the following user:

👤 User Info:
- Name: ${fullName}
- Age: ${age}
- Gender: ${gender}
- Fitness Goal: ${goal}
- Training Level: ${level}
- Plan Duration: ${duration} weeks
- Focus Areas: ${focus}
- Equipment Available: ${equipment}

📦 Deliverables:
Generate a structured fitness coaching plan that includes:

1. 📆 **Workout Program**:
   - ${duration} weeks of structured workouts
   - 4-6 training days per week with rest days
   - Each exercise with sets, reps, rest periods
   - Progressive overload built in
   - Muscle group targeting balanced across the week

2. 🥗 **Meal Plan**:
   - Daily meal template with 5 meals
   - Exact calorie and macro targets
   - North African/Mediterranean-friendly ingredients
   - Prep time estimates for each meal
   - Weekly total nutritional breakdown

3. 💊 **Supplement Guide**:
   - Evidence-based supplements only
   - Specific dosage and timing
   - Clear purpose for each supplement
   - Mark optional vs essential

4. ⏱️ **Weekly Instructions**:
   - Week-by-week progression notes
   - Habit formation guidance
   - Adjustment recommendations
   - Motivational checkpoints

📋 Format as STRICT JSON with this exact structure:
{
  "workout_plan": {
    "weeks": [
      {
        "week": 1,
        "focus": "Foundation Building",
        "days": [
          {
            "day": 1,
            "dayName": "Monday",
            "isRestDay": false,
            "exercises": [
              {
                "name": "Push-ups",
                "sets": 3,
                "reps": "8-12",
                "rest_seconds": 60,
                "muscle_groups": ["chest", "triceps", "shoulders"]
              }
            ]
          }
        ]
      }
    ],
    "notes": "Additional workout guidance"
  },
  "meal_plan": {
    "daily_template": {
      "total_calories": 2000,
      "total_protein": 150,
      "total_carbs": 200,
      "total_fats": 65,
      "meals": {
        "breakfast": {
          "name": "Mediterranean Oatmeal",
          "calories": 400,
          "protein": 15,
          "carbs": 60,
          "fats": 12,
          "ingredients": ["oats", "almonds", "dates", "cinnamon"],
          "prep_time_minutes": 10
        },
        "morning_snack": {
          "name": "Greek Yogurt with Nuts",
          "calories": 200,
          "protein": 20,
          "carbs": 15,
          "fats": 8,
          "ingredients": ["greek yogurt", "walnuts", "honey"],
          "prep_time_minutes": 2
        },
        "lunch": {
          "name": "Grilled Chicken Couscous",
          "calories": 500,
          "protein": 40,
          "carbs": 45,
          "fats": 15,
          "ingredients": ["chicken breast", "couscous", "vegetables", "olive oil"],
          "prep_time_minutes": 25
        },
        "afternoon_snack": {
          "name": "Hummus with Vegetables",
          "calories": 150,
          "protein": 8,
          "carbs": 18,
          "fats": 7,
          "ingredients": ["hummus", "carrots", "cucumbers"],
          "prep_time_minutes": 3
        },
        "dinner": {
          "name": "Grilled Fish with Quinoa",
          "calories": 450,
          "protein": 35,
          "carbs": 40,
          "fats": 12,
          "ingredients": ["white fish", "quinoa", "mixed vegetables"],
          "prep_time_minutes": 30
        }
      }
    },
    "weekly_variations": ["Substitute fish with legumes twice weekly"],
    "notes": "Adjust portions based on progress"
  },
  "supplement_guide": {
    "supplements": [
      {
        "name": "Whey Protein",
        "dosage": "25-30g",
        "timing": "Post-workout",
        "purpose": "Muscle recovery and growth",
        "optional": false
      }
    ],
    "notes": "Consult healthcare provider before starting"
  },
  "weekly_instructions": [
    {
      "week": 1,
      "focus": "Building Routine",
      "habits": ["Track all workouts", "Meal prep on Sundays"],
      "adjustments": ["Start with lighter weights", "Focus on form"],
      "motivation_tip": "Consistency beats perfection in week 1"
    }
  ]
}

CRITICAL: Respond ONLY with this JSON object. No markdown, no explanations, no additional text.
  `.trim();
};

/**
 * Sanitizes and validates AI response text to ensure clean JSON
 */
const sanitizeAIResponse = (responseText: string): string => {
  // Remove markdown code blocks if present
  let cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // Remove any text before the first { or after the last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
};

/**
 * Validates that the AI response has all required fields
 */
const validateAIResponse = (response: any): AIResponse => {
  const errors: string[] = [];
  
  if (!response.workout_plan?.weeks) {
    errors.push('Missing workout_plan.weeks');
  }
  
  if (!response.meal_plan?.daily_template) {
    errors.push('Missing meal_plan.daily_template');
  }
  
  if (!response.supplement_guide) {
    errors.push('Missing supplement_guide');
  }
  
  if (!response.weekly_instructions) {
    errors.push('Missing weekly_instructions');
  }
  
  if (errors.length > 0) {
    console.warn('AI Response validation errors:', errors);
    // Return enhanced fallback instead of throwing
    return getEnhancedFallbackResponse();
  }
  
  return response as AIResponse;
};

/**
 * Enhanced fallback response with complete structure
 */
const getEnhancedFallbackResponse = (): AIResponse => {
  return {
    supplementPlan: { supplements: [], notes: undefined },
    workout_plan: {
        weeks: [
            {
                week: 1,
                focus: "Foundation Building",
                days: [
                    {
                        day: 1,
                        dayName: "Monday",
                        isRestDay: false,
                        exercises: [
                            {
                                name: "Push-ups",
                                sets: 3,
                                reps: "8-12",
                                rest_seconds: 60,
                                muscle_groups: ["chest", "triceps", "shoulders"]
                            },
                            {
                                name: "Bodyweight Squats",
                                sets: 3,
                                reps: "12-15",
                                rest_seconds: 45,
                                muscle_groups: ["quadriceps", "glutes", "hamstrings"]
                            },
                            {
                                name: "Plank",
                                sets: 3,
                                reps: "30-60 seconds",
                                rest_seconds: 30,
                                muscle_groups: ["core", "shoulders"]
                            }
                        ]
                    },
                    {
                        day: 2,
                        dayName: "Tuesday",
                        isRestDay: true,
                        exercises: []
                    },
                    {
                        day: 3,
                        dayName: "Wednesday",
                        isRestDay: false,
                        exercises: [
                            {
                                name: "Lunges",
                                sets: 3,
                                reps: "10 each leg",
                                rest_seconds: 45,
                                muscle_groups: ["quadriceps", "glutes", "hamstrings"]
                            },
                            {
                                name: "Mountain Climbers",
                                sets: 3,
                                reps: "20",
                                rest_seconds: 30,
                                muscle_groups: ["core", "shoulders", "legs"]
                            }
                        ]
                    }
                ]
            }
        ],
        notes: "Fallback plan - start with bodyweight exercises and progress gradually"
    },
    meal_plan: {
        daily_template: {
            total_calories: 1800,
            total_protein: 120,
            total_carbs: 180,
            total_fats: 60,
            meals: {
                breakfast: {
                    name: "Mediterranean Oatmeal Bowl",
                    calories: 350,
                    protein: 12,
                    carbs: 55,
                    fats: 10,
                    ingredients: ["rolled oats", "almonds", "dates", "cinnamon", "greek yogurt"],
                    prep_time_minutes: 8
                },
                morning_snack: {
                    name: "Mixed Nuts and Fruit",
                    calories: 180,
                    protein: 6,
                    carbs: 15,
                    fats: 12,
                    ingredients: ["almonds", "walnuts", "apple"],
                    prep_time_minutes: 2
                },
                lunch: {
                    name: "Grilled Chicken with Couscous",
                    calories: 480,
                    protein: 35,
                    carbs: 45,
                    fats: 15,
                    ingredients: ["chicken breast", "couscous", "mixed vegetables", "olive oil"],
                    prep_time_minutes: 25
                },
                afternoon_snack: {
                    name: "Hummus with Vegetables",
                    calories: 140,
                    protein: 6,
                    carbs: 16,
                    fats: 8,
                    ingredients: ["chickpea hummus", "cucumber", "carrots", "bell peppers"],
                    prep_time_minutes: 3
                },
                dinner: {
                    name: "Baked Fish with Quinoa",
                    calories: 420,
                    protein: 30,
                    carbs: 35,
                    fats: 12,
                    ingredients: ["white fish fillet", "quinoa", "roasted vegetables"],
                    prep_time_minutes: 30
                }
            }
        },
        weekly_variations: [
            "Replace fish with lentils 2x per week",
            "Swap couscous for bulgur wheat occasionally",
            "Add seasonal North African vegetables"
        ],
        notes: "Adjust portions based on activity level and progress. Focus on whole foods and Mediterranean diet principles."
    },
    supplement_guide: {
        supplements: [
            {
                name: "Multivitamin",
                dosage: "1 tablet",
                timing: "With breakfast",
                purpose: "Cover basic nutritional gaps",
                optional: true
            },
            {
                name: "Omega-3",
                dosage: "1000mg",
                timing: "With dinner",
                purpose: "Heart health and inflammation reduction",
                optional: true
            }
        ],
        notes: "Focus on whole foods first. Supplements are optional and should complement, not replace, a balanced diet."
    },
    weekly_instructions: [
        {
            week: 1,
            focus: "Building Foundation Habits",
            habits: [
                "Complete all scheduled workouts",
                "Track food intake daily",
                "Get 7-8 hours of sleep"
            ],
            adjustments: [
                "Start with bodyweight exercises",
                "Focus on proper form over intensity",
                "Gradually increase water intake"
            ],
            motivation_tip: "Small consistent actions lead to big results. Focus on showing up every day this week."
        }
    ]
};
};

/**
 * Enhanced AI service call with improved JSON parsing and validation
 */
export const callAIService = async (prompt: string): Promise<AIResponse> => {
  try {
    console.log('Calling AI service with enhanced parsing...');
    
    const result = await generativeAIClient.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    });
    
    console.log('Raw AI Response received');
    
    // Extract text from various possible response structures
    let aiResponseText: string = '';
    
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      aiResponseText = result.candidates[0].content.parts[0].text;
    } else if (result.responseId) {
      aiResponseText = result.responseId;
    } else if (typeof result === 'string') {
      aiResponseText = result;
    } else {
      console.warn('Unexpected AI response structure:', result);
      aiResponseText = JSON.stringify(result);
    }

    console.log('AI Response Text Length:', aiResponseText.length);
    
    // Sanitize the response
    const sanitizedResponse = sanitizeAIResponse(aiResponseText);
    console.log('Sanitized Response Preview:', sanitizedResponse.substring(0, 200) + '...');

    // Parse JSON
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(sanitizedResponse);
      console.log('Successfully parsed AI response as JSON');
    } catch (parseError) {
      console.error('Failed to parse sanitized AI response as JSON:', parseError);
      console.log('Failed text:', sanitizedResponse.substring(0, 500));
      return getEnhancedFallbackResponse();
    }

    // Validate and return
    const validatedResponse = validateAIResponse(parsedResponse);
    console.log('AI response validated successfully');
    
    return validatedResponse;

  } catch (error) {
    console.error('Error in callAIService:', error);
    return getEnhancedFallbackResponse();
  }
};

/**
 * Creates a new plan from AI response data
 */
export const createPlanFromAIResponse = async (
  userId: string, 
  planRequest: AIPlanRequest, 
  aiResponse: AIResponse
): Promise<any> => {
  try {
    // Map AI response to Plan model structure
    const planData = {
      user: userId,
      status: 'draft' as const,
      goal: planRequest.goal_type,
      duration_weeks: planRequest.duration_weeks,
      difficulty_level: planRequest.difficulty_level,
      focus_areas: planRequest.focus_areas || [],
      equipment_available: planRequest.equipment_available || [],
      workoutPlan: {
        weeks: aiResponse.workout_plan.weeks,
        notes: aiResponse.workout_plan.notes
      },
      mealPlan: {
        daily_template: aiResponse.meal_plan.daily_template,
        weekly_variations: aiResponse.meal_plan.weekly_variations,
        notes: aiResponse.meal_plan.notes
      },
      supplementPlan: aiResponse.supplement_guide ? {
        supplements: aiResponse.supplement_guide.supplements,
        notes: aiResponse.supplement_guide.notes
      } : { supplements: [], notes: undefined },
      weeklyInstructions: aiResponse.weekly_instructions
    };

    const plan = new Plan(planData);
    await plan.save();
    
    console.log(`Created plan ${plan._id} for user ${userId}`);
    return plan;
    
  } catch (error) {
    console.error('Error creating plan from AI response:', error);
    throw new Error('Failed to create plan from AI response');
  }
};

/**
 * Generate and save a complete fitness plan
 */
export const generateAndSavePlan = async (
  userId: string,
  planRequest: AIPlanRequest
): Promise<any> => {
  try {
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate AI prompt and get response
    const prompt = generateAIPrompt(user, planRequest);
    const aiResponse = await callAIService(prompt);

    // Create and save the plan
    const plan = await createPlanFromAIResponse(userId, planRequest, aiResponse);

    return plan;
    
  } catch (error) {
    console.error('Error in generateAndSavePlan:', error);
    throw error;
  }
};

/**
 * Chat with AI about a plan with enhanced context and response handling
 */
export const chatWithAI = async ({ userId, planId, message }: {
  userId: string,
  planId?: string,
  message: string
}) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const plan = planId ? await Plan.findById(planId) : null;
    
    // Create contextual prompt for chat
    const chatPrompt = `
You are FitAI, a fitness and nutrition coach assistant. The user is asking: "${message}"

User Context:
- Name: ${user.firstName ?? ''} ${user.lastName ?? ''}
- Age: ${typeof user.getAge === 'function' ? user.getAge() : (user as any).age ?? 'unknown'}
- Gender: ${user.gender ?? 'unknown'}
${plan ? `- Current Plan: ${plan.goal ?? 'unknown'} (${(plan as any).difficulty_level ?? 'unknown'} level, ${(plan as any).duration_weeks ?? 'unknown'} weeks)` : '- No active plan'}
${plan ? `- Plan Status: ${plan.status ?? 'unknown'}` : ''}
${plan ? `- Current Week: ${(typeof (plan as any).getCurrentWeek === 'function' ? (plan as any).getCurrentWeek() : 'unknown')} of ${(plan as any).duration_weeks ?? 'unknown'}` : ''}

Provide a helpful, personalized response as a fitness coach. Keep it concise but informative.
Format as JSON: {"answer": "your response here", "suggestions": ["suggestion1", "suggestion2"]}
    `.trim();

    const result = await generativeAIClient.models.generateContent({
      model: 'gemini-2.0-flash', 
      contents: chatPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.8,
        maxOutputTokens: 1024
      }
    });

    let responseText = '';
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      responseText = result.candidates[0].content.parts[0].text;
    }

    const sanitizedResponse = sanitizeAIResponse(responseText);
    const parsedResponse = JSON.parse(sanitizedResponse);

    return {
      answer: parsedResponse.answer || `Thank you for your question: "${message}". As your AI fitness coach, I'm here to help guide you on your fitness journey.`,
      suggestions: parsedResponse.suggestions || [],
      updatedPlan: plan
    };

  } catch (error) {
    console.error('Error in chatWithAI:', error);
    return {
      answer: `I understand you're asking about: "${message}". While I'm having some technical difficulties right now, I recommend focusing on consistency with your current routine and staying hydrated.`,
      suggestions: ["Stay consistent with workouts", "Focus on proper nutrition", "Get adequate rest"],
      updatedPlan: null
    };
  }
};