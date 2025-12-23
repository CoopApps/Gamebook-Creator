import Joi from 'joi';

const progressSystemTypes = ['web_marks', 'skills', 'inventory', 'relationships'];

/**
 * Web Marks Configuration Schema
 */
const webMarksConfigSchema = Joi.object({
  marks: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().max(100).required(),
        description: Joi.string().max(500).optional(),
        defaultValue: Joi.boolean().required(),
      })
    )
    .min(1)
    .required(),
});

/**
 * Skills Configuration Schema
 */
const skillsConfigSchema = Joi.object({
  skills: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().max(100).required(),
        description: Joi.string().max(500).optional(),
        minValue: Joi.number().integer().required(),
        maxValue: Joi.number().integer().required(),
        defaultValue: Joi.number().integer().required(),
      })
    )
    .min(1)
    .required(),
});

/**
 * Inventory Configuration Schema
 */
const inventoryConfigSchema = Joi.object({
  maxSlots: Joi.number().integer().min(1).optional().allow(null),
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().max(100).required(),
        name: Joi.string().max(200).required(),
        description: Joi.string().max(1000).optional(),
        maxStack: Joi.number().integer().min(1).optional().allow(null),
        properties: Joi.object().optional(),
      })
    )
    .min(1)
    .required(),
});

/**
 * Relationships Configuration Schema
 */
const relationshipsConfigSchema = Joi.object({
  relationships: Joi.array()
    .items(
      Joi.object({
        npcId: Joi.string().max(100).required(),
        name: Joi.string().max(200).required(),
        description: Joi.string().max(500).optional(),
        minValue: Joi.number().integer().required(),
        maxValue: Joi.number().integer().required(),
        defaultValue: Joi.number().integer().required(),
      })
    )
    .min(1)
    .required(),
});

/**
 * Configuration schema that validates based on systemType
 */
const configurationSchema = Joi.alternatives().conditional(
  Joi.ref('...systemType'),
  {
    switch: [
      { is: 'web_marks', then: webMarksConfigSchema },
      { is: 'skills', then: skillsConfigSchema },
      { is: 'inventory', then: inventoryConfigSchema },
      { is: 'relationships', then: relationshipsConfigSchema },
    ],
  }
);

/**
 * Create Progress System Schema
 */
export const createProgressSystemSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  systemType: Joi.string()
    .valid(...progressSystemTypes)
    .required(),
  systemName: Joi.string().min(1).max(100).required(),
  configuration: configurationSchema.required(),
});

/**
 * Update Progress System Schema
 */
export const updateProgressSystemSchema = Joi.object({
  systemName: Joi.string().min(1).max(100).optional(),
  configuration: Joi.alternatives()
    .try(
      webMarksConfigSchema,
      skillsConfigSchema,
      inventoryConfigSchema,
      relationshipsConfigSchema
    )
    .optional(),
}).min(1);

/**
 * List Progress Systems Schema
 */
export const listProgressSystemsSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  systemType: Joi.string()
    .valid(...progressSystemTypes)
    .optional(),
});
