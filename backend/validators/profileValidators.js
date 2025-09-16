// backend/validators/profileValidators.js
const { body } = require('express-validator');

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,30}$/;

const toBool = (val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const v = val.trim().toLowerCase();
    if (v === 'true' || v === '1') return true;
    if (v === 'false' || v === '0') return false;
  }
  return undefined;
};

const updateProfile = [
  // Block direct email changes via this endpoint
  body('email').not().exists().withMessage('Email cannot be changed via this endpoint'),

  // username optional — allow only valid pattern
  body('username')
    .optional()
    .trim()
    .matches(USERNAME_RE)
    .withMessage('Username must be 3-30 chars and use letters, numbers, ._-'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be 1-100 characters'),

  body('bio')
    .optional({ nullable: true })
    .isLength({ max: 1000 })
    .withMessage('Bio must be 1000 characters or fewer'),

  body('website')
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null) return true;
      // allow empty string -> null higher up, but ensure protocol if present
      if (typeof val !== 'string' || val.trim() === '') return true;
      // simple check: require protocol
      return /^https?:\/\//i.test(val);
    })
    .withMessage('Website must be a valid URL starting with http:// or https://'),

  body('dob')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('DOB must be a valid date'),

  // Accept "true"/"false" strings for booleans and convert them
  body('dob_visible')
    .optional()
    .customSanitizer(toBool)
    .isBoolean()
    .withMessage('dob_visible must be boolean'),

  body('email_visible')
    .optional()
    .customSanitizer(toBool)
    .isBoolean()
    .withMessage('email_visible must be boolean'),

  body('location_visible')
    .optional()
    .customSanitizer(toBool)
    .isBoolean()
    .withMessage('location_visible must be boolean'),

  body('location')
    .optional({ nullable: true })
    .isLength({ max: 200 })
    .withMessage('Location too long'),

  body('profile_pic')
    .optional({ nullable: true })
    .isString()
    .withMessage('profile_pic must be a string'),
];

module.exports = { updateProfile };
