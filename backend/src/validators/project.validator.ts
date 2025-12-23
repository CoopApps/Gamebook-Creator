import Joi from 'joi';

/**
 * Create project schema
 */
export const createProjectSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(255)
    .trim()
    .required()
    .messages({
      'string.min': 'Title must not be empty',
      'string.max': 'Title must be less than 255 characters',
      'any.required': 'Title is required',
    }),

  description: Joi.string()
    .max(5000)
    .trim()
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description must be less than 5000 characters',
    }),

  isPublic: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      'boolean.base': 'isPublic must be a boolean',
    }),
});

/**
 * Update project schema
 */
export const updateProjectSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(255)
    .trim()
    .optional()
    .messages({
      'string.min': 'Title must not be empty',
      'string.max': 'Title must be less than 255 characters',
    }),

  description: Joi.string()
    .max(5000)
    .trim()
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description must be less than 5000 characters',
    }),

  isPublic: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isPublic must be a boolean',
    }),

  thumbnailUrl: Joi.string()
    .uri()
    .max(500)
    .optional()
    .allow(null)
    .messages({
      'string.uri': 'Thumbnail URL must be a valid URI',
      'string.max': 'Thumbnail URL must be less than 500 characters',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Query parameters schema for listing projects
 */
export const listProjectsSchema = Joi.object({
  search: Joi.string()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Search query must be less than 255 characters',
    }),

  isPublic: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isPublic must be a boolean',
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must be at most 100',
    }),

  offset: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0)
    .messages({
      'number.base': 'Offset must be a number',
      'number.integer': 'Offset must be an integer',
      'number.min': 'Offset must be at least 0',
    }),

  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'lastAccessed', 'title')
    .optional()
    .default('lastAccessed')
    .messages({
      'any.only': 'sortBy must be one of: createdAt, updatedAt, lastAccessed, title',
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('desc')
    .messages({
      'any.only': 'sortOrder must be either asc or desc',
    }),
});

/**
 * Search query schema
 */
export const searchProjectsSchema = Joi.object({
  q: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Search query must not be empty',
      'string.max': 'Search query must be less than 255 characters',
      'any.required': 'Search query (q) is required',
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must be at most 100',
    }),

  offset: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0)
    .messages({
      'number.base': 'Offset must be a number',
      'number.integer': 'Offset must be an integer',
      'number.min': 'Offset must be at least 0',
    }),
});
