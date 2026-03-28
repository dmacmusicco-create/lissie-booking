import rateLimit from 'express-rate-limit';

export const bookingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 booking requests per IP per 15 min
  message: {
    error: 'Too many booking requests from this IP. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many admin requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});
