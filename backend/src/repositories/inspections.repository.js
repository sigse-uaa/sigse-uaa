const INSPECTION_DETAILS = `
  SELECT i.*, c.name AS category_name, creator.name AS creator_name, assignee.name AS assignee_name
  FROM inspections i
  JOIN categories c ON c.id = i.category_id
  JOIN users creator ON creator.id = i.created_by
  LEFT JOIN users assignee ON assignee.id = i.assigned_to`;

const SORT_COLUMNS = {
  createdAt: 'i.created_at',
  created_at: 'i.created_at',
  updatedAt: 'i.updated_at',
  updated_at: 'i.updated_at',
  priority: 'i.priority',
};

// Solo estos nombres de columna pueden entrar en UPDATE.
const EDITABLE_COLUMNS = {
  title: 'title',
  description: 'description',
  categoryId: 'category_id',
  priority: 'priority',
  building: 'building',
  area: 'area',
  reference: 'reference',
  latitude: 'latitude',
  longitude: 'longitude',
  tiltDegrees: 'tilt_degrees',
};

function listFilters(filters, user) {
  const conditions = [];
  const values = [];

  if (user.role !== 'operador' || filters.mine) {
    conditions.push('i.created_by = ?');
    values.push(user.id);
  }
  if (filters.assignedToMe) {
    conditions.push('i.assigned_to = ?');
    values.push(user.id);
  }
  if (filters.q) {
    const pattern = '%' + filters.q.replace(/[!%_]/g, (character) => '!' + character) + '%';
    conditions.push(`(i.folio LIKE ? ESCAPE '!' OR i.title LIKE ? ESCAPE '!'
      OR i.description LIKE ? ESCAPE '!' OR i.building LIKE ? ESCAPE '!'
      OR i.reference LIKE ? ESCAPE '!')`);
    values.push(pattern, pattern, pattern, pattern, pattern);
  }
  for (const [key, condition] of [
    ['status', 'i.status = ?'],
    ['categoryId', 'i.category_id = ?'],
    ['priority', 'i.priority = ?'],
    ['from', 'i.created_at >= ?'],
  ]) {
    if (filters[key] !== undefined) {
      conditions.push(condition);
      values.push(filters[key]);
    }
  }
  if (filters.to) {
    conditions.push('i.created_at <= ?');
    values.push(filters.to + ' 23:59:59');
  }
  return { where: conditions.length ? ' WHERE ' + conditions.join(' AND ') : '', values };
}

function inspectionQueries(db) {
  return {
    async findById(id) {
      const [rows] = await db.execute(INSPECTION_DETAILS + ' WHERE i.id = ?', [id]);
      return rows[0] ?? null;
    },

    async lockById(id) {
      const [rows] = await db.execute('SELECT * FROM inspections WHERE id = ? FOR UPDATE', [id]);
      return rows[0] ?? null;
    },

    async list(filters, user) {
      const { where, values } = listFilters(filters, user);
      const column = SORT_COLUMNS[filters.sort];
      const order = filters.order === 'asc' ? 'ASC' : 'DESC';
      const [counts] = await db.execute('SELECT COUNT(*) AS total FROM inspections i' + where, values);
      const [rows] = await db.execute(
        INSPECTION_DETAILS + where + ` ORDER BY ${column} ${order}, i.id ${order} LIMIT ? OFFSET ?`,
        [...values, filters.limit, (filters.page - 1) * filters.limit],
      );
      return { rows, total: Number(counts[0].total) };
    },

    async summary(user) {
      const { where, values } = listFilters({}, user);
      const [rows] = await db.execute(`
        SELECT i.status, i.priority, COUNT(*) AS total,
          COUNT(CASE WHEN i.created_at >= CURRENT_TIMESTAMP - INTERVAL 7 DAY THEN 1 END) AS last_7_days,
          COUNT(CASE WHEN i.assigned_to = ? AND i.status IN ('asignada', 'en_proceso') THEN 1 END) AS pending_assigned
        FROM inspections i${where} GROUP BY i.status, i.priority`, [user.id, ...values]);
      return rows;
    },

    async hasActiveCategory(id) {
      const [rows] = await db.execute('SELECT id FROM categories WHERE id = ? AND is_active = 1 FOR SHARE', [id]);
      return rows.length > 0;
    },

    async hasActiveOperator(id) {
      const [rows] = await db.execute(
        "SELECT id FROM users WHERE id = ? AND role = 'operador' AND is_active = 1 FOR SHARE",
        [id],
      );
      return rows.length > 0;
    },

    async insert(fields, createdBy) {
      const [result] = await db.execute(`
        INSERT INTO inspections
          (title, description, category_id, created_by, priority, building, area, reference, latitude, longitude, tilt_degrees)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fields.title, fields.description, fields.categoryId, createdBy, fields.priority ?? 'media',
        fields.building ?? null, fields.area ?? null, fields.reference ?? null,
        fields.latitude ?? null, fields.longitude ?? null, fields.tiltDegrees ?? null,
      ]);
      return result.insertId;
    },

    async setFolio(id, folio) {
      await db.execute('UPDATE inspections SET folio = ? WHERE id = ?', [folio, id]);
    },

    async update(id, fields) {
      const assignments = [];
      const values = [];
      for (const [key, column] of Object.entries(EDITABLE_COLUMNS)) {
        if (fields[key] !== undefined) {
          assignments.push(column + ' = ?');
          values.push(fields[key]);
        }
      }
      await db.execute('UPDATE inspections SET ' + assignments.join(', ') + ' WHERE id = ?', [...values, id]);
    },

    async assign(id, assignedTo) {
      await db.execute(
        "UPDATE inspections SET status = 'asignada', assigned_to = ?, assigned_at = CURRENT_TIMESTAMP WHERE id = ?",
        [assignedTo, id],
      );
    },

    async start(id) {
      await db.execute("UPDATE inspections SET status = 'en_proceso', started_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
    },

    async finish(id, reviewResult, finalCondition) {
      await db.execute(`UPDATE inspections SET status = 'finalizada', finished_at = CURRENT_TIMESTAMP,
        review_result = ?, final_condition = ? WHERE id = ?`, [reviewResult, finalCondition, id]);
    },

    async cancel(id) {
      await db.execute("UPDATE inspections SET status = 'cancelada', cancelled_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
    },

    async addHistory({ id, changedBy, action, previousStatus = null, newStatus = null, comment = null }) {
      await db.execute(`
        INSERT INTO inspection_history (inspection_id, changed_by, action, previous_status, new_status, comment)
        VALUES (?, ?, ?, ?, ?, ?)`, [id, changedBy, action, previousStatus, newStatus, comment]);
    },

    async history(id) {
      const [rows] = await db.execute(`
        SELECT h.*, u.name AS actor_name
        FROM inspection_history h JOIN users u ON u.id = h.changed_by
        WHERE h.inspection_id = ? ORDER BY h.id`, [id]);
      return rows;
    },

    async evidences(id) {
      const [rows] = await db.execute(`
        SELECT e.*, u.name AS uploader_name FROM evidences e JOIN users u ON u.id = e.uploaded_by
        WHERE e.inspection_id = ? ORDER BY e.id`, [id]);
      return rows;
    },

    async findEvidence(id, evidenceId) {
      const [rows] = await db.execute(`
        SELECT e.*, u.name AS uploader_name FROM evidences e JOIN users u ON u.id = e.uploaded_by
        WHERE e.inspection_id = ? AND e.id = ?`, [id, evidenceId]);
      return rows[0] ?? null;
    },

    async findEvidenceByPath(filePath) {
      const [rows] = await db.execute(`
        SELECT e.*, i.created_by
        FROM evidences e JOIN inspections i ON i.id = e.inspection_id
        WHERE e.file_path = ? LIMIT 1`, [filePath]);
      return rows[0] ?? null;
    },

    async insertEvidence(id, uploadedBy, evidence, description) {
      const [result] = await db.execute(`
        INSERT INTO evidences
          (inspection_id, uploaded_by, type, file_path, original_name, mime_type, size_bytes, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, uploadedBy, evidence.type, evidence.filePath, evidence.originalName,
        evidence.mimeType, evidence.sizeBytes, description ?? null,
      ]);
      return result.insertId;
    },

    async deleteEvidence(id, evidenceId) {
      await db.execute('DELETE FROM evidences WHERE inspection_id = ? AND id = ?', [id, evidenceId]);
    },
  };
}

function createInspectionsRepository(pool) {
  return {
    ...inspectionQueries(pool),
    async transaction(work) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const result = await work(inspectionQueries(connection));
        await connection.commit();
        return result;
      } catch (error) {
        try {
          await connection.rollback();
        } catch {
          connection.destroy();
        }
        throw error;
      } finally {
        connection.release();
      }
    },
  };
}

module.exports = { createInspectionsRepository };
