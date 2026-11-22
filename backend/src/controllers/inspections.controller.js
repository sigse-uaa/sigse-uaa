const { ApiError } = require('../errors');
const { parseRequest } = require('../middleware/validate');
const { removeFile } = require('../storage/evidences');
const { evidenceDescriptionSchema } = require('../validators/inspections.validators');

function createInspectionsController(service) {
  return {
    async list(request, response) {
      response.json(await service.list(request.validated.query, request.user));
    },
    async get(request, response) {
      response.json({ data: await service.get(request.validated.params.id, request.user) });
    },
    async create(request, response) {
      const data = await service.create(request.body, request.user);
      response.status(201).location('/api/inspections/' + data.id).json({ data });
    },
    async update(request, response) {
      const data = await service.update(request.validated.params.id, request.body, request.user);
      response.json({ data });
    },
    async transition(request, response) {
      const data = await service.transition(request.validated.params.id, request.body, request.user);
      response.json({ data });
    },
    async history(request, response) {
      response.json({ data: await service.history(request.validated.params.id, request.user) });
    },
    async summary(request, response) {
      response.json({ data: await service.summary(request.user) });
    },
    async checkUploadAccess(request, _response, next) {
      await service.checkUploadAccess(request.validated.params.id, request.user);
      next();
    },
    async addEvidence(request, response) {
      const file = request.file;
      try {
        const { description } = parseRequest(evidenceDescriptionSchema, request.body);
        const data = await service.addEvidence(request.validated.params.id, file, description, request.user);
        response.status(201).json({ data });
      } finally {
        if (file) await removeFile(file.path);
      }
    },
    async deleteEvidence(request, response) {
      const { id, evidenceId } = request.validated.params;
      await service.deleteEvidence(id, evidenceId, request.user);
      response.status(204).end();
    },
    async download(request, response, next) {
      const { filename } = request.validated.params;
      const { location, mimeType } = await service.evidenceToDownload(filename, request.user);
      response.set('Cache-Control', 'private, no-store');
      response.type(mimeType);
      if (mimeType === 'application/pdf') response.attachment(filename);
      response.sendFile(location, { cacheControl: false }, (error) => {
        if (!error) return;
        if (!response.headersSent) {
          response.removeHeader('Content-Disposition');
          response.removeHeader('Content-Type');
          if (error.status === 404) {
            return next(new ApiError(404, 'EVIDENCE_NOT_FOUND', 'El archivo de evidencia no existe.'));
          }
        }
        next(error);
      });
    },
  };
}

module.exports = { createInspectionsController };
