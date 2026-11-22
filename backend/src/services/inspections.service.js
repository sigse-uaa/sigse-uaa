const { ApiError } = require('../errors');
const {
  serializeInspection, serializeInspectionDetail, serializeEvidence, serializeHistory,
} = require('../serializers');
const { STATUSES } = require('../validators/inspections.validators');

const TRANSITIONS = {
  pendiente: ['asignada', 'cancelada'],
  asignada: ['en_proceso', 'cancelada'],
  en_proceso: ['finalizada', 'cancelada'],
  finalizada: [],
  cancelada: [],
};

function requireInspection(inspection) {
  if (!inspection) throw new ApiError(404, 'INSPECTION_NOT_FOUND', 'La inspección no existe.');
  return inspection;
}

function canRead(inspection, user) {
  return user.role === 'operador' || Number(inspection.created_by) === user.id;
}

function forbidden() {
  return new ApiError(403, 'FORBIDDEN', 'No tienes permiso para esta acción.');
}

function requireReadAccess(inspection, user) {
  requireInspection(inspection);
  if (!canRead(inspection, user)) throw forbidden();
}

function requireUploadAccess(inspection, user) {
  requireReadAccess(inspection, user);
  if (inspection.status === 'cancelada') {
    throw new ApiError(422, 'INSPECTION_CANCELLED', 'No se pueden agregar evidencias a una inspección cancelada.');
  }
}

async function validateCategory(db, id) {
  if (id !== undefined && !(await db.hasActiveCategory(id))) {
    throw new ApiError(422, 'INVALID_CATEGORY', 'Selecciona una categoría activa.');
  }
}

async function applyTransition(db, inspection, change) {
  const { id } = inspection;
  switch (change.status) {
    case 'asignada':
      if (!change.assignedTo || !(await db.hasActiveOperator(change.assignedTo))) {
        throw new ApiError(422, 'INVALID_ASSIGNEE', 'Selecciona un operador activo.');
      }
      await db.assign(id, change.assignedTo);
      return 'asignacion';
    case 'en_proceso':
      if (!inspection.assigned_to) {
        throw new ApiError(422, 'MISSING_ASSIGNEE', 'Asigna un operador antes de iniciar la inspección.');
      }
      await db.start(id);
      return 'cambio_estado';
    case 'finalizada':
      if (!change.reviewResult || change.reviewResult.length < 10 || !change.finalCondition) {
        throw new ApiError(422, 'FINALIZATION_REQUIRED_FIELDS',
          'Indica el resultado de la revisión (mínimo 10 caracteres) y la condición final.');
      }
      await db.finish(id, change.reviewResult, change.finalCondition);
      return 'finalizacion';
    case 'cancelada':
      await db.cancel(id);
      return 'cancelacion';
  }
}

function createInspectionsService(repository, storage) {
  return {
    async list(filters, user) {
      const { rows, total } = await repository.transaction((db) => db.list(filters, user));
      return {
        data: rows.map(serializeInspection),
        pagination: {
          page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit),
        },
      };
    },

    async get(id, user) {
      return repository.transaction(async (db) => {
        const inspection = await db.findById(id);
        requireReadAccess(inspection, user);
        const evidences = await db.evidences(id);
        const history = await db.history(id);
        return {
          ...serializeInspectionDetail(inspection),
          evidences: evidences.map(serializeEvidence),
          history: history.map(serializeHistory),
        };
      });
    },

    async create(fields, user) {
      return repository.transaction(async (db) => {
        await validateCategory(db, fields.categoryId);
        const id = await db.insert(fields, user.id);
        const folio = 'SIG-' + new Date().getUTCFullYear() + '-' + String(id).padStart(5, '0');
        await db.setFolio(id, folio);
        await db.addHistory({ id, changedBy: user.id, action: 'creacion', newStatus: 'pendiente' });
        return serializeInspectionDetail(await db.findById(id));
      });
    },

    async update(id, fields, user) {
      return repository.transaction(async (db) => {
        const inspection = requireInspection(await db.lockById(id));
        if (user.role !== 'operador' && (!canRead(inspection, user) || inspection.status !== 'pendiente')) {
          throw forbidden();
        }
        if (TRANSITIONS[inspection.status].length === 0) {
          throw new ApiError(422, 'INSPECTION_TERMINAL', 'No se puede editar una inspección finalizada o cancelada.');
        }
        await validateCategory(db, fields.categoryId);
        await db.update(id, fields);
        await db.addHistory({ id, changedBy: user.id, action: 'actualizacion' });
        return serializeInspectionDetail(await db.findById(id));
      });
    },

    async transition(id, change, user) {
      return repository.transaction(async (db) => {
        const inspection = requireInspection(await db.lockById(id));
        if (user.role !== 'operador' && (
          !canRead(inspection, user) || change.status !== 'cancelada' || inspection.status !== 'pendiente'
        )) {
          throw forbidden();
        }
        if (!TRANSITIONS[inspection.status].includes(change.status)) {
          throw new ApiError(422, 'INVALID_TRANSITION', 'El cambio de estado no está permitido.');
        }
        const action = await applyTransition(db, inspection, change);
        await db.addHistory({
          id, changedBy: user.id, action, previousStatus: inspection.status,
          newStatus: change.status, comment: change.comment,
        });
        return serializeInspectionDetail(await db.findById(id));
      });
    },

    async history(id, user) {
      return repository.transaction(async (db) => {
        requireReadAccess(await db.findById(id), user);
        return (await db.history(id)).map(serializeHistory);
      });
    },

    async summary(user) {
      const summary = {
        total: 0,
        byStatus: Object.fromEntries(STATUSES.map((status) => [status, 0])),
        byPriority: { baja: 0, media: 0, alta: 0 },
        last7Days: 0,
        pendingAssignedToMe: 0,
      };
      for (const row of await repository.summary(user)) {
        const total = Number(row.total);
        summary.total += total;
        summary.byStatus[row.status] += total;
        summary.byPriority[row.priority] += total;
        summary.last7Days += Number(row.last_7_days);
        summary.pendingAssignedToMe += Number(row.pending_assigned);
      }
      return summary;
    },

    async checkUploadAccess(id, user) {
      requireUploadAccess(await repository.findById(id), user);
    },

    async addEvidence(id, file, description, user) {
      const evidence = await storage.inspect(file);
      let saved = false;
      try {
        return await repository.transaction(async (db) => {
          requireUploadAccess(await db.lockById(id), user);
          const evidenceId = await db.insertEvidence(id, user.id, evidence, description);
          await db.addHistory({ id, changedBy: user.id, action: 'evidencia', comment: 'Evidencia agregada.' });
          const row = await db.findEvidence(id, evidenceId);
          await storage.save(file, evidence);
          saved = true;
          return serializeEvidence(row);
        });
      } catch (error) {
        if (saved) await storage.remove(evidence.filePath);
        throw error;
      }
    },

    async deleteEvidence(id, evidenceId, user) {
      const filePath = await repository.transaction(async (db) => {
        requireInspection(await db.lockById(id));
        const evidence = await db.findEvidence(id, evidenceId);
        if (!evidence) throw new ApiError(404, 'EVIDENCE_NOT_FOUND', 'La evidencia no existe.');
        if (user.role !== 'operador' && Number(evidence.uploaded_by) !== user.id) throw forbidden();
        await db.deleteEvidence(id, evidenceId);
        await db.addHistory({ id, changedBy: user.id, action: 'evidencia', comment: 'Evidencia eliminada.' });
        return evidence.file_path;
      });
      await storage.remove(filePath);
    },

    async evidenceToDownload(filename, user) {
      const evidence = await repository.findEvidenceByPath('/uploads/' + filename);
      if (!evidence) throw new ApiError(404, 'EVIDENCE_NOT_FOUND', 'La evidencia no existe.');
      if (!canRead(evidence, user)) throw forbidden();
      return { location: storage.location(filename), mimeType: evidence.mime_type };
    },
  };
}

module.exports = { createInspectionsService };
