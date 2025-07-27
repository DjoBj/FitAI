import { Request, Response, NextFunction } from 'express';
import { chatWithAI as chatWithAIService } from '../../services/ai.service';

/**
 * AI Chat controller
 * Handles user questions about a generated plan.
 * 
 * POST /api/v1/ai/chat
 * Required fields: plan_id, chat_session_id, message
 */
export const chatWithAI = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { plan_id, message } = req.body;
    const userId = req.user?._id;

    if (!plan_id || !message || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: plan_id, message, or userId',
      });
    }

    const response = await chatWithAIService({ userId: userId.toString(), planId: plan_id, message });

    return res.status(200).json({
      success: true,
      message: 'AI response generated successfully',
      data: response,
    });
  } catch (error) {
    next(error);
    return;
  }
};
