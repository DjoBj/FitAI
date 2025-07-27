import rateLimit from 'express-rate-limit';

export class RateLimiter {
  public static general = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.'
  });

  public static auth = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: 'Too many auth attempts, please try again later.'
  });
}