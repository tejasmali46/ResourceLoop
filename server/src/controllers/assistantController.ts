import { Request, Response, NextFunction } from 'express';
import { processAIQuery } from '../services/aiIntelligenceService.js';
import { AuthRequest } from '../middleware/auth.js';

export async function askAssistant(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { query, context } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ success: false, message: 'A text query is required' });
      return;
    }

    const result = await processAIQuery({
      query: query.trim(),
      context: context || {},
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
