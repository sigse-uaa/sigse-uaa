// Convención: columnas en snake_case (MySQL) y respuestas en camelCase (API).
// Toda traducción fila -> JSON pasa por este archivo.

function serializeUser(row) {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
  };
}
function serializeUserPorfile(user, isActive_ = Boolean(user.is_active)) {
  return{
    id: Number(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: isActive_
  };
}

function serializeCategory(row) {
  return {
    id: Number(row.id),
    name: row.name,
    description: row.description,
    color: row.color,
    icon: row.icon,
    isActive: Boolean(row.is_active),
  };
}

function serializePerson(id, name) {
  return { id: Number(id), name };
}

function decimal(value) {
  return value === null ? null : Number(value);
}

function serializeInspection(row) {
  return {
    id: Number(row.id),
    folio: row.folio,
    title: row.title,
    status: row.status,
    priority: row.priority,
    category: { id: Number(row.category_id), name: row.category_name },
    createdBy: serializePerson(row.created_by, row.creator_name),
    assignedTo: row.assigned_to === null ? null : serializePerson(row.assigned_to, row.assignee_name),
    building: row.building,
    area: row.area,
    latitude: decimal(row.latitude),
    longitude: decimal(row.longitude),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializeInspectionDetail(row) {
  return {
    ...serializeInspection(row),
    description: row.description,
    reference: row.reference,
    tiltDegrees: decimal(row.tilt_degrees),
    reviewResult: row.review_result,
    finalCondition: row.final_condition,
    assignedAt: row.assigned_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    cancelledAt: row.cancelled_at,
  };
}

function serializeEvidence(row) {
  return {
    id: Number(row.id),
    type: row.type,
    filePath: row.file_path,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    description: row.description,
    uploadedBy: serializePerson(row.uploaded_by, row.uploader_name),
    createdAt: row.created_at,
  };
}

function serializeHistory(row) {
  return {
    id: Number(row.id),
    action: row.action,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    comment: row.comment,
    changedBy: serializePerson(row.changed_by, row.actor_name),
    createdAt: row.created_at,
  };
}

module.exports = {
  serializeUser,
  serializeUserPorfile,
  serializeCategory,
  serializeInspection,
  serializeInspectionDetail,
  serializeEvidence,
  serializeHistory,
};
