# FitAI Backend API Testing Guide

## 🚀 Overview

This guide explains how to test the complete FitAI backend API flow using the updated Postman collection. The system provides AI-powered fitness and nutrition planning with comprehensive user management and progress tracking.

## 📋 Prerequisites

1. **Server Running**: Ensure the FitAI backend server is running on `http://localhost:5000`
2. **MongoDB**: Database should be connected and running
3. **AI Configuration**: Ensure `GOOGLE_API_KEY` is set in your environment
4. **Postman**: Import the `postman_collection.json` file

## 🔄 Complete User Flow

### 1. **🏥 Health & Status Check**
- **Health Check**: Verify server is running
- **API Documentation**: Get endpoint documentation

### 2. **🔐 Authentication**
- **Register User**: Create new user account
- **Login User**: Authenticate and get access token
- **Refresh Token**: Renew expired tokens
- **Logout**: End user session

### 3. **👤 User Profile Management**
- **Get User Profile**: Retrieve user information
- **Update User Profile**: Modify user details

### 4. **🎯 Fitness Profile Setup**
- **Setup Fitness Profile**: Configure fitness goals, training level, equipment
- **Get Fitness Profile**: Retrieve fitness configuration
- **Update Fitness Profile**: Modify fitness preferences

### 5. **🤖 AI Services**
- **Generate AI Plan**: Create personalized fitness plan using AI
- **Get My Plan**: Retrieve current plan (active or draft)
- **Get All Plans**: View all user's plans
- **Confirm Plan**: Activate generated plan (updates user.currentPlanId)
- **Chat with AI**: Ask questions about fitness, nutrition, and progress

### 6. **📊 Progress Tracking**
- **Get Current Progress**: View current workout day (auto-creates day 1 if none exists)
- **Complete Today's Workout**: Mark day as complete
- **Get Progress History**: View past progress
- **Shift Day**: Navigate between workout days

## 🧪 Testing Scenarios

### **Scenario 1: Complete Weight Loss Journey**
1. Register user with weight loss goal
2. Setup fitness profile for weight loss
3. Generate AI plan
4. Get My Plan (verify plan exists)
5. Confirm and activate plan
6. Get Current Progress (should auto-create day 1)
7. Track progress through workouts
8. Chat with AI for guidance

### **Scenario 2: Muscle Gain Journey**
1. Register user with muscle gain goal
2. Setup fitness profile for strength training
3. Generate AI plan
4. Get My Plan (verify plan exists)
5. Confirm and activate plan
6. Get Current Progress (should auto-create day 1)
7. Track progress through workouts
8. Chat with AI for nutrition advice

### **Scenario 3: Error Handling**
1. Test invalid plan ID in chat
2. Test missing profile for plan generation
3. Test unauthorized access
4. Test invalid authentication tokens

## 📝 Postman Collection Variables

The collection uses these variables that are automatically set:

- `{{baseUrl}}`: Server URL (http://localhost:5000)
- `{{accessToken}}`: JWT access token (auto-set on login/register)
- `{{userId}}`: User ID (auto-set on login/register)
- `{{planId}}`: Generated plan ID (auto-set on plan generation)

## 🔧 Key Endpoints Explained

### **Authentication Endpoints**

#### `POST /api/auth/register`
- **Purpose**: Create new user account
- **Required Fields**: email, firstName, lastName, phoneNumber, birthDate, password, gender
- **Response**: Returns access token and user data
- **Auto-sets**: `accessToken`, `userId`

#### `POST /api/auth/login`
- **Purpose**: Authenticate existing user
- **Required Fields**: email, password
- **Response**: Returns access token and user data
- **Auto-sets**: `accessToken`, `userId`

### **AI Service Endpoints**

#### `POST /api/v1/ai/generate-plan`
- **Purpose**: Generate personalized fitness plan using AI
- **Authentication**: Required
- **Prerequisites**: User must have completed fitness profile setup
- **AI Integration**: Uses Gemini 2.0 to create comprehensive plan
- **Response**: Complete plan with workout, meal, and supplement data
- **Auto-sets**: `planId`

#### `GET /api/v1/ai/my-plan`
- **Purpose**: Get user's current plan (active or draft)
- **Authentication**: Required
- **Logic**: First tries user.currentPlanId, then gets most recent plan
- **Response**: Plan data or error if no plan exists

#### `GET /api/v1/ai/plans`
- **Purpose**: Get all user's plans
- **Authentication**: Required
- **Response**: Array of all user's plans sorted by creation date

#### `POST /api/v1/ai/confirm-plan/:id`
- **Purpose**: Activate a generated plan
- **Authentication**: Required
- **Parameters**: plan ID in URL
- **Effect**: 
  - Changes plan status from 'draft' to 'active'
  - Updates user.currentPlanId to reference this plan
- **Database Updates**: Updates both Plan and User documents

#### `POST /api/v1/ai/chat`
- **Purpose**: Chat with AI about fitness and nutrition
- **Authentication**: Required
- **Required Fields**: plan_id, message
- **AI Integration**: Contextual responses based on user's plan
- **Response**: AI answer and suggestions

### **Progress Tracking Endpoints**

#### `GET /api/v1/progress/current`
- **Purpose**: Get current workout day status
- **Authentication**: Required
- **Logic**: 
  - Fetches user from database to get currentPlanId
  - Verifies plan exists and is active
  - Auto-creates day 1 progress if none exists
- **Response**: Current day information or newly created day 1

#### `POST /api/v1/progress/complete`
- **Purpose**: Mark current day as complete
- **Authentication**: Required
- **Effect**: Completes current day and starts next day
- **Logic**: Uses user.currentPlanId from database

#### `GET /api/v1/progress/history`
- **Purpose**: Get complete progress history
- **Authentication**: Required
- **Response**: Array of all completed days for current plan

## 🎯 Testing Best Practices

### **1. Sequential Testing**
Always test endpoints in the correct order:
1. Health check
2. Register/Login
3. Setup fitness profile
4. Generate AI plan
5. Get My Plan (verify plan exists)
6. Confirm plan
7. Get Current Progress (should auto-create day 1)
8. Track progress
9. Chat with AI

### **2. Variable Management**
- Let Postman auto-set variables (accessToken, userId, planId)
- Don't manually edit these variables
- Use the collection runner for automated testing

### **3. Error Testing**
- Test with invalid tokens
- Test with missing required fields
- Test with invalid plan IDs
- Verify proper error responses

### **4. AI Response Validation**
- Check that AI-generated plans have all required fields
- Verify workout, meal, and supplement data structure
- Test AI chat responses for relevance

## 🔍 Expected Responses

### **Successful Plan Generation**
```json
{
  "success": true,
  "message": "Plan generated successfully",
  "data": {
    "_id": "plan_id_here",
    "user": "user_id_here",
    "status": "draft",
    "goal": "weight_loss",
    "workoutPlan": { /* comprehensive workout data */ },
    "mealPlan": { /* comprehensive meal data */ },
    "supplementPlan": { /* supplement recommendations */ },
    "weeklyInstructions": [ /* weekly guidance */ ]
  }
}
```

### **Successful Plan Retrieval**
```json
{
  "success": true,
  "message": "Plan retrieved successfully",
  "data": {
    "_id": "plan_id_here",
    "user": "user_id_here",
    "status": "active",
    "goal": "weight_loss",
    "workoutPlan": { /* comprehensive workout data */ },
    "mealPlan": { /* comprehensive meal data */ },
    "supplementPlan": { /* supplement recommendations */ },
    "weeklyInstructions": [ /* weekly guidance */ ]
  }
}
```

### **Successful Plan Confirmation**
```json
{
  "success": true,
  "message": "Plan confirmed and activated",
  "data": {
    "_id": "plan_id_here",
    "user": "user_id_here",
    "status": "active",
    "goal": "weight_loss",
    /* ... rest of plan data ... */
  }
}
```

### **Successful Progress Retrieval**
```json
{
  "success": true,
  "data": {
    "_id": "progress_id_here",
    "user_id": "user_id_here",
    "plan_id": "plan_id_here",
    "day_number": 1,
    "status": "in_progress",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### **Successful AI Chat**
```json
{
  "success": true,
  "message": "AI response generated successfully",
  "data": {
    "answer": "Personalized AI response...",
    "suggestions": ["suggestion1", "suggestion2"],
    "updatedPlan": null
  }
}
```

## 🚨 Common Issues & Solutions

### **1. "User profile incomplete" Error**
- **Cause**: User hasn't completed fitness profile setup
- **Solution**: Call `/api/profile/setup` first with required fitness data

### **2. "No active plan found" Error**
- **Cause**: User hasn't confirmed a plan yet
- **Solution**: Generate a plan and then confirm it using `/api/v1/ai/confirm-plan/:id`

### **3. "Plan not found" Error**
- **Cause**: Invalid plan ID or plan doesn't belong to user
- **Solution**: Generate a new plan or use correct plan ID

### **4. "Unauthorized" Error**
- **Cause**: Missing or invalid access token
- **Solution**: Re-authenticate using login endpoint

### **5. "Active plan not found" Error**
- **Cause**: Plan was deleted or user.currentPlanId is invalid
- **Solution**: Generate and confirm a new plan

### **6. AI Service Errors**
- **Cause**: Missing Google API key or AI service issues
- **Solution**: Check environment variables and AI service configuration

## 🔄 **Fixed Flow Explanation**

### **Before Fix:**
1. ✅ Generate plan → Plan created with 'draft' status
2. ✅ Confirm plan → Plan status changed to 'active' 
3. ❌ Get progress → "No active plan found" (user.currentPlanId not updated)

### **After Fix:**
1. ✅ Generate plan → Plan created with 'draft' status
2. ✅ Confirm plan → Plan status changed to 'active' + user.currentPlanId updated
3. ✅ Get progress → Successfully finds active plan and creates day 1 progress

### **Key Changes:**
- **confirmPlan.controller.ts**: Now updates `user.currentPlanId` when confirming
- **progress.controller.ts**: Fetches user from database to get `currentPlanId`
- **New endpoints**: `GET /api/v1/ai/my-plan` and `GET /api/v1/ai/plans`
- **Auto-progress creation**: `GET /progress/current` auto-creates day 1 if none exists

## 📊 Performance Testing

### **Load Testing Scenarios**
1. **Concurrent Users**: Test with multiple users generating plans
2. **AI Response Time**: Monitor AI service response times
3. **Database Performance**: Check MongoDB query performance
4. **Memory Usage**: Monitor server memory consumption

### **Stress Testing**
1. **Rapid Plan Generation**: Generate multiple plans quickly
2. **Concurrent AI Chats**: Multiple users chatting simultaneously
3. **Large Data Sets**: Test with users having extensive progress history

## 🔐 Security Testing

### **Authentication Tests**
1. **Token Validation**: Test with expired/invalid tokens
2. **Authorization**: Ensure users can only access their own data
3. **Rate Limiting**: Test API rate limits
4. **Input Validation**: Test with malicious input data

## 📈 Monitoring & Logging

### **Key Metrics to Monitor**
1. **API Response Times**: Track endpoint performance
2. **AI Service Availability**: Monitor Gemini API status
3. **Error Rates**: Track failed requests
4. **User Engagement**: Monitor plan generation and chat usage

### **Log Analysis**
- Check server logs for errors
- Monitor AI service logs
- Track user activity patterns
- Analyze performance bottlenecks

## 🎉 Success Criteria

A successful test run should demonstrate:
1. ✅ Complete user registration and authentication
2. ✅ Fitness profile setup and management
3. ✅ AI-powered plan generation with comprehensive data
4. ✅ Plan retrieval and confirmation (updates user.currentPlanId)
5. ✅ Progress tracking functionality (auto-creates day 1)
6. ✅ AI chat with contextual responses
7. ✅ Proper error handling and validation
8. ✅ Security and authorization controls

---

## 📞 Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify environment configuration
3. Test individual endpoints in isolation
4. Review this documentation for common solutions

**Happy Testing! 🚀** 