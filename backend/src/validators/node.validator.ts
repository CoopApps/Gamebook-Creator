import Joi from 'joi';

const nodeTypes = ['start', 'story', 'choice', 'conditional', 'combat', 'web-mark', 'success', 'game-over', 'inventory'];

export const createNodeSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  nodeNumber: Joi.number().integer().min(1).required(),
  nodeType: Joi.string().valid(...nodeTypes).required(),
  title: Joi.string().max(255).optional().allow(''),
  content: Joi.string().max(10000).optional().allow(''),
  positionX: Joi.number().required(),
  positionY: Joi.number().required(),
  properties: Joi.object().optional(),
});

export const updateNodeSchema = Joi.object({
  nodeNumber: Joi.number().integer().min(1).optional(),
  nodeType: Joi.string().valid(...nodeTypes).optional(),
  title: Joi.string().max(255).optional().allow(''),
  content: Joi.string().max(10000).optional().allow(''),
  positionX: Joi.number().optional(),
  positionY: Joi.number().optional(),
  properties: Joi.object().optional(),
}).min(1);

export const listNodesSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  nodeType: Joi.string().valid(...nodeTypes).optional(),
  limit: Joi.number().integer().min(1).max(500).optional(),
  offset: Joi.number().integer().min(0).optional(),
});

export const batchUpdatePositionsSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  updates: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid().required(),
      positionX: Joi.number().optional(),
      positionY: Joi.number().optional(),
    })
  ).min(1).required(),
});

export const createSegmentSchema = Joi.object({
  segmentNumber: Joi.number().integer().min(1).required(),
  content: Joi.string().max(10000).required(),
});

export const updateSegmentSchema = Joi.object({
  content: Joi.string().max(10000).required(),
});
