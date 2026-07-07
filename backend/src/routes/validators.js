import { body, validationResult } from 'express-validator';

export const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('fullName').trim().notEmpty(),
  body('diabetesType').optional().isIn(['type_1', 'type_1_5', 'type_2', 'gestational']),
];

export const loginValidation = [
  body('email').isEmail(),
  body('password').notEmpty(),
];

export const glucoseValidation = [
  body('value').isFloat({ min: 20, max: 600 }),
  body('readingType').optional().isIn([
    'pre_breakfast', 'post_breakfast_2h', 'pre_lunch', 'post_lunch_2h',
    'pre_dinner', 'post_dinner_2h', 'before_sleep', 'random',
  ]),
  body('recordedAt').notEmpty(),
];

export const medicationValidation = [
  body('name').trim().notEmpty(),
  body('startDate').matches(/^\d{4}-\d{2}-\d{2}$/),
  body('reminderTime').matches(/^\d{2}:\d{2}(:\d{2})?$/),
  body('frequencyType').optional().isIn([
    'daily', 'every_other_day', 'weekdays', 'multiple_daily', 'custom_interval',
  ]),
];

export const appointmentValidation = [
  body('title').trim().notEmpty(),
  body('appointmentAt').notEmpty(),
];

export const insulinValidation = [
  body('insulinType').isIn(['apidra', 'lantus']),
  body('meal').isIn(['breakfast', 'lunch', 'dinner']),
  body('units').isFloat({ min: 0.5, max: 200 }),
  body('recordedAt').notEmpty(),
];

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}
