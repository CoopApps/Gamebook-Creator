import Joi from 'joi';

const connectionTypes = ['normal', 'conditional', 'backward', 'combat'];

export const createConnectionSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  fromNodeId: Joi.string().uuid().required(),
  toNodeId: Joi.string().uuid().required(),
  connectionType: Joi.string().valid(...connectionTypes).required(),
  conditionText: Joi.string().max(1000).optional().allow(''),
  choiceText: Joi.string().max(500).optional().allow(''),
});

export const updateConnectionSchema = Joi.object({
  connectionType: Joi.string().valid(...connectionTypes).optional(),
  conditionText: Joi.string().max(1000).optional().allow(''),
  choiceText: Joi.string().max(500).optional().allow(''),
}).min(1);

export const listConnectionsSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  fromNodeId: Joi.string().uuid().optional(),
  toNodeId: Joi.string().uuid().optional(),
  connectionType: Joi.string().valid(...connectionTypes).optional(),
});
