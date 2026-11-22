const express = require('express');
const { receiveEvidence } = require('../middleware/evidence-upload');
const { validateBody, validateParams, validateQuery } = require('../middleware/validate');
const {
  createInspectionSchema, updateInspectionSchema, listInspectionsSchema, inspectionParams,
  evidenceParams, transitionSchema,
} = require('../validators/inspections.validators');

function createInspectionsRouter(controller, authenticate) {
  const router = express.Router();
  const validateInspectionId = validateParams(inspectionParams);
  router.use(authenticate);

  router.get('/stats/summary', controller.summary);
  router.get('/', validateQuery(listInspectionsSchema), controller.list);
  router.post('/', validateBody(createInspectionSchema), controller.create);
  router.get('/:id', validateInspectionId, controller.get);
  router.patch('/:id', validateInspectionId, validateBody(updateInspectionSchema), controller.update);
  router.patch('/:id/status', validateInspectionId, validateBody(transitionSchema), controller.transition);
  router.get('/:id/history', validateInspectionId, controller.history);
  router.post('/:id/evidences', validateInspectionId, controller.checkUploadAccess, receiveEvidence, controller.addEvidence);
  router.delete('/:id/evidences/:evidenceId', validateParams(evidenceParams), controller.deleteEvidence);

  return router;
}

module.exports = { createInspectionsRouter };
