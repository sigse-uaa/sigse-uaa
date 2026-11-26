const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { mkdtemp, readFile, readdir, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const mysql = require('mysql2/promise');
const { createApp } = require('../src/app');
const { createInspectionsRepository } = require('../src/repositories/inspections.repository');
const { createUsersRepository } = require('../src/repositories/users.repository');
const { createCategoriesRepository } = require('../src/repositories/categories.repository');
const { createAuthService } = require('../src/services/auth.service');
const { createUsersService } = require('../src/services/users.service');
const { createCategoriesService } = require('../src/services/categories.service');
const { createInspectionsService } = require('../src/services/inspections.service');
const { createEvidenceStorage, MAX_FILE_BYTES } = require('../src/storage/evidences');
const { listen, postJson, SEED_PASSWORD } = require('../testing/helpers');

const MYSQL_PORT = process.env.TEST_MYSQL_PORT;
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jfZkAAAAASUVORK5CYII=',
  'base64',
);

async function startApi(t) {
  const options = {
    host: '127.0.0.1',
    port: Number(MYSQL_PORT),
    user: 'root',
    password: process.env.TEST_MYSQL_PASSWORD,
    timezone: 'Z',
    connectTimeout: 5000,
  };
  const database = 'sigse_a1_' + randomBytes(6).toString('hex');
  const admin = await mysql.createConnection(options);
  t.after(async () => {
    try {
      await admin.query('DROP DATABASE IF EXISTS ' + database);
    } finally {
      await admin.end();
    }
  });
  await admin.query('CREATE DATABASE ' + database);

  const fixtures = await mysql.createConnection({ ...options, database, multipleStatements: true });
  try {
    for (const filename of ['schema.sql', 'seed.sql']) {
      await fixtures.query(await readFile(path.join(__dirname, '../../database', filename), 'utf8'));
    }
  } finally {
    await fixtures.end();
  }

  const pool = mysql.createPool({ ...options, database });
  t.after(() => pool.end());
  const uploads = await mkdtemp(path.join(os.tmpdir(), 'sigse-a1-uploads-'));
  t.after(() => rm(uploads, { recursive: true, force: true }));
  const app = createApp({
    usersService: createUsersService(createUsersRepository(pool)),
    categoriesService: createCategoriesService(createCategoriesRepository(pool)),
    authService: createAuthService({
      users: createUsersRepository(pool),
      jwtSecret: randomBytes(32).toString('hex'),
      jwtExpiresIn: '8h',
    }),
    inspectionsService: createInspectionsService(createInspectionsRepository(pool), createEvidenceStorage(uploads)),
  });
  const url = await listen(t, app);
  return { url, uploads, pool };
}

async function login(url, email) {
  const response = await postJson(url + '/api/auth/login', { email, password: SEED_PASSWORD });
  assert.equal(response.status, 200);
  return response.json();
}

function request(url, token, pathname, { method = 'GET', json, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  if (json) headers['Content-Type'] = 'application/json';
  return fetch(url + pathname, { method, headers, body: json ? JSON.stringify(json) : form });
}

async function expectJson(response, status, code) {
  const body = await response.json();
  assert.equal(response.status, status, JSON.stringify(body));
  if (code) assert.equal(body.error.code, code);
  return body;
}

function upload(data, type = 'image/png', description = 'Vista de prueba') {
  const form = new FormData();
  form.set('file', new Blob([data], { type }), 'senal.png');
  form.set('description', description);
  return form;
}

const validFields = { title: 'Señal de prueba 50%_A', description: 'La señal requiere revisión.', categoryId: 1 };

test('identidad y categorías con MySQL', {
  skip: !MYSQL_PORT && 'Configura TEST_MYSQL_PORT para ejecutar contra MySQL 8.4.',
  timeout: 90_000,
}, async (t) => {
  const { url } = await startApi(t);
  const operator = await login(url, 'operador1@example.com');
  const owner = await login(url, 'usuario@example.com');
  const api = (session, path, method = 'GET', json) => request(url, session?.token, '/api' + path, { method, json });

  await t.test('perfil y operadores', async () => {
    await expectJson(await api(null, '/auth/me'), 401, 'MISSING_TOKEN');
    const profile = await expectJson(await api(owner, '/auth/me'), 200);
    assert.deepEqual(await expectJson(await api(owner, '/users/me'), 200), profile);
    assert.equal(profile.user.isActive, true);
    await expectJson(await api(owner, '/users/me', 'PATCH', { newPassword: 'Nueva123!' }), 422, 'VALIDATION_ERROR');
    await expectJson(await api(owner, '/users/me', 'PATCH', {
      name: 'Nombre fallido', currentPassword: 'Incorrecta123!', newPassword: 'Nueva123!',
    }), 422, 'VALIDATION_ERROR');
    assert.deepEqual(await expectJson(await api(owner, '/users/me'), 200), profile);
    const updated = await expectJson(await api(owner, '/users/me', 'PATCH', {
      name: 'Nombre actualizado', currentPassword: SEED_PASSWORD, newPassword: 'Nueva123!',
    }), 200);
    assert.equal(updated.user.name, 'Nombre actualizado');
    await expectJson(await api(null, '/auth/login', 'POST', {
      email: owner.user.email, password: 'Nueva123!',
    }), 200);

    await expectJson(await api(null, '/users'), 401, 'MISSING_TOKEN');
    await expectJson(await api(owner, '/users'), 403, 'FORBIDDEN');
    await expectJson(await api(operator, '/users?role=otro'), 422, 'VALIDATION_ERROR');
    const input = { name: 'Operador Fixture', email: 'fixture@example.invalid', password: 'Operador123!' };
    await expectJson(await api(owner, '/users', 'POST', input), 403, 'FORBIDDEN');
    await expectJson(await api(operator, '/users', 'POST', { ...input, password: 'corta' }), 422, 'VALIDATION_ERROR');
    const { user } = await expectJson(await api(operator, '/users', 'POST', input), 201);
    assert.deepEqual(user, { id: user.id, name: input.name, email: input.email, role: 'operador' });
    await expectJson(await api(null, '/auth/login', 'POST', { email: input.email, password: input.password }), 200);
    await expectJson(await api(operator, '/users', 'POST', input), 409, 'EMAIL_TAKEN');
    const list = await expectJson(await api(operator, '/users?role=operador&q=Fixture'), 200);
    assert.deepEqual(list.data, [user]);
  });

  await t.test('baja lógica conserva las inspecciones', async () => {
    const base = '/categories';
    const input = { name: 'Categoría Fixture', description: 'Una señal', color: '#1976D2', icon: 'info' };
    await expectJson(await api(null, base), 401, 'MISSING_TOKEN');
    await expectJson(await api(owner, base + '?includeInactive=true'), 403, 'FORBIDDEN');
    await expectJson(await api(owner, base, 'POST', input), 403, 'FORBIDDEN');
    await expectJson(await api(operator, base, 'POST', { ...input, color: 'rojo' }), 422, 'VALIDATION_ERROR');
    const { data: category } = await expectJson(await api(operator, base, 'POST', input), 201);
    assert.deepEqual(category, { id: category.id, ...input, isActive: true });
    await expectJson(await api(operator, base, 'POST', input), 409, 'CATEGORY_NAME_TAKEN');

    const path = base + '/' + category.id;
    await expectJson(await api(owner, path, 'PATCH', { isActive: false }), 403, 'FORBIDDEN');
    await expectJson(await api(owner, path, 'DELETE'), 403, 'FORBIDDEN');
    await expectJson(await api(operator, path, 'PATCH', {}), 422, 'VALIDATION_ERROR');
    const edited = await expectJson(await api(operator, path, 'PATCH', { description: null }), 200);
    assert.equal(edited.data.description, null);

    const inspection = { ...validFields, categoryId: category.id };
    const { data } = await expectJson(await api(owner, '/inspections', 'POST', inspection), 201);
    const removed = await api(operator, path, 'DELETE');
    assert.equal(removed.status, 204);
    const active = await expectJson(await api(owner, base), 200);
    assert.equal(active.data.some((row) => row.id === category.id), false);
    const all = await expectJson(await api(operator, base + '?includeInactive=true'), 200);
    assert.equal(all.data.find((row) => row.id === category.id).isActive, false);
    await expectJson(await api(owner, '/inspections/' + data.id), 200);
    await expectJson(await api(owner, '/inspections', 'POST', inspection), 422, 'INVALID_CATEGORY');
  });
});

test('A1 con MySQL: inspecciones, permisos, transiciones, historia, evidencias y conteos', {
  skip: !MYSQL_PORT && 'Configura TEST_MYSQL_PORT para ejecutar contra MySQL 8.4.',
  timeout: 90_000,
}, async (t) => {
  const { url, uploads, pool } = await startApi(t);
  const owner = await login(url, 'usuario@example.com');
  const operator = await login(url, 'operador1@example.com');
  const stranger = await expectJson(await postJson(url + '/api/auth/register', {
    name: 'Otro usuario',
    email: 'otra-persona@example.invalid',
    password: 'SoloFixture2026',
  }), 201);
  const base = '/api/inspections';
  const api = (session, suffix = '', options) => request(url, session?.token, base + suffix, options);
  const create = (session, json = validFields) => api(session, '', { method: 'POST', json });
  const change = (session, id, json) => api(session, '/' + id + '/status', { method: 'PATCH', json });
  let id;

  await t.test('crea el folio y el historial con el usuario del JWT', async () => {
    await expectJson(await api(null), 401);
    await expectJson(await create(owner, { ...validFields, title: '  ' }), 422, 'VALIDATION_ERROR');
    await expectJson(await create(owner, { ...validFields, categoryId: 99999 }), 422, 'INVALID_CATEGORY');
    await pool.execute('UPDATE categories SET is_active = 0 WHERE id = 5');
    await expectJson(await create(owner, { ...validFields, categoryId: 5 }), 422, 'INVALID_CATEGORY');

    const response = await create(owner, { ...validFields, latitude: 21.88, createdBy: operator.user.id, status: 'finalizada' });
    const { data } = await expectJson(response, 201);
    id = data.id;
    assert.match(data.folio, /^SIG-\d{4}-\d{5,}$/);
    assert.equal(response.headers.get('location'), base + '/' + id);
    assert.equal(data.status, 'pendiente');
    assert.equal(data.priority, 'media');
    assert.equal(data.createdBy.id, owner.user.id);
    assert.equal(data.latitude, 21.88);
    const detail = await expectJson(await api(owner, '/' + id), 200);
    assert.equal(detail.data.history[0].action, 'creacion');
    assert.equal(detail.data.history[0].changedBy.id, owner.user.id);
    assert.deepEqual(detail.data.evidences, []);
  });

  await t.test('lista y edita con filtros, paginación y autorización', async () => {
    await expectJson(await api(stranger, '/' + id), 403);
    await expectJson(await api(stranger, '/' + id + '/history'), 403);
    await expectJson(await api(owner, '/999999'), 404);
    await expectJson(await api(owner, '?limit=51'), 422);
    await expectJson(await api(owner, '?from=2026-12-01&to=2026-11-01'), 422);

    const search = '?q=' + encodeURIComponent('50%_A') + '&status=pendiente&categoryId=1&priority=media';
    const first = await expectJson(await api(operator, search + '&page=1&limit=1&sort=updatedAt'), 200);
    assert.equal(first.data[0].id, id);
    assert.deepEqual(first.pagination, { page: 1, limit: 1, total: 1, totalPages: 1 });
    const second = await expectJson(await api(operator, search + '&page=2&limit=1'), 200);
    assert.deepEqual(second.data, []);
    assert.equal((await expectJson(await api(stranger), 200)).pagination.total, 0);
    const dateAndOrder = await expectJson(await api(operator,
      search + '&from=2000-01-01&to=2099-01-01&order=asc&sort=created_at'), 200);
    assert.equal(dateAndOrder.data[0].id, id);

    const patch = (session, json) => api(session, '/' + id, { method: 'PATCH', json });
    await expectJson(await patch(stranger, { title: 'Cambio ajeno' }), 403);
    await expectJson(await patch(owner, { status: 'en_proceso' }), 422);
    const changed = await expectJson(await patch(owner, { priority: 'alta', area: 'Entrada' }), 200);
    assert.equal(changed.data.priority, 'alta');
    assert.equal(changed.data.area, 'Entrada');
  });

  await t.test('impone las transiciones y deja un historial consistente', async () => {
    await expectJson(await change(owner, id, { status: 'asignada', assignedTo: operator.user.id }), 403);
    await expectJson(await change(operator, id, { status: 'en_proceso' }), 422, 'INVALID_TRANSITION');
    await expectJson(await change(operator, id, { status: 'asignada', assignedTo: owner.user.id }), 422, 'INVALID_ASSIGNEE');

    const assign = () => change(operator, id, { status: 'asignada', assignedTo: operator.user.id });
    const attempts = await Promise.all([assign(), assign()]);
    assert.deepEqual(attempts.map((response) => response.status).sort(), [200, 422]);
    for (const response of attempts) await response.json();

    await expectJson(await change(owner, id, { status: 'cancelada' }), 403);
    await expectJson(await api(owner, '/' + id, { method: 'PATCH', json: { area: 'Cambio tardío' } }), 403);
    const started = await expectJson(await change(operator, id, { status: 'en_proceso' }), 200);
    assert.ok(started.data.assignedAt && started.data.startedAt);
    await expectJson(await change(operator, id, { status: 'finalizada', finalCondition: 'buena' }), 422, 'FINALIZATION_REQUIRED_FIELDS');
    await expectJson(await change(operator, id, { status: 'finalizada', reviewResult: 'La señal está en buen estado.' }), 422, 'FINALIZATION_REQUIRED_FIELDS');
    await expectJson(await change(operator, id, {
      status: 'finalizada', reviewResult: 'La señal está en buen estado.', finalCondition: 'excelente',
    }), 422, 'VALIDATION_ERROR');
    assert.equal((await expectJson(await api(owner, '/' + id), 200)).data.status, 'en_proceso');

    const finished = await expectJson(await change(operator, id, {
      status: 'finalizada', reviewResult: 'La señal está en buen estado.', finalCondition: 'buena',
    }), 200);
    assert.equal(finished.data.finalCondition, 'buena');
    assert.ok(finished.data.finishedAt);
    await expectJson(await change(operator, id, { status: 'cancelada' }), 422, 'INVALID_TRANSITION');
    await expectJson(await api(operator, '/' + id, { method: 'PATCH', json: { title: 'Terminal' } }), 422);
    const history = await expectJson(await api(owner, '/' + id + '/history'), 200);
    assert.deepEqual(history.data.map((event) => event.action),
      ['creacion', 'actualizacion', 'asignacion', 'cambio_estado', 'finalizacion']);
    assert.equal(history.data.at(-1).previousStatus, 'en_proceso');
    assert.equal(history.data.at(-1).newStatus, 'finalizada');
  });

  await t.test('sube, descarga y elimina archivos aplicando permisos y límites', async () => {
    const { data: inspection } = await expectJson(await create(owner), 201);
    const inspectionPath = '/' + inspection.id;
    const evidences = inspectionPath + '/evidences';
    const send = (session, form) => api(session, evidences, { method: 'POST', form });
    await expectJson(await send(stranger, upload(PNG)), 403);
    await expectJson(await send(owner, upload('texto sin formato de imagen')), 415);
    await expectJson(await send(owner, upload(Buffer.alloc(MAX_FILE_BYTES + 1))), 413);
    await expectJson(await send(owner, upload(PNG, 'image/png', 'x'.repeat(256))), 422);
    assert.deepEqual(await readdir(uploads), []);

    const { data: evidence } = await expectJson(await send(operator, upload(PNG)), 201);
    assert.equal(evidence.mimeType, 'image/png');
    assert.equal(evidence.uploadedBy.id, operator.user.id);
    await expectJson(await request(url, null, evidence.filePath), 401);
    await expectJson(await request(url, stranger.token, evidence.filePath), 403);
    const download = await request(url, owner.token, evidence.filePath);
    assert.equal(download.status, 200);
    assert.equal(download.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), PNG);
    const unlink = (session) => api(session, evidences + '/' + evidence.id, { method: 'DELETE' });
    await expectJson(await unlink(owner), 403);
    assert.equal((await unlink(operator)).status, 204);
    assert.deepEqual(await readdir(uploads), []);
    await expectJson(await request(url, owner.token, evidence.filePath), 404);

    const own = await expectJson(await send(owner, upload(PNG)), 201);
    assert.equal((await api(owner, evidences + '/' + own.data.id, { method: 'DELETE' })).status, 204);
    await expectJson(await change(owner, inspection.id, { status: 'cancelada' }), 200);
    await expectJson(await send(owner, upload(PNG)), 422, 'INSPECTION_CANCELLED');
    const history = await expectJson(await api(owner, inspectionPath + '/history'), 200);
    assert.equal(history.data.filter((event) => event.action === 'evidencia').length, 4);
  });

  await t.test('entrega conteos según el alcance del usuario', async () => {
    const empty = await expectJson(await api(stranger, '/stats/summary'), 200);
    assert.equal(empty.data.total, 0);
    assert.ok(Object.values(empty.data.byStatus).every((count) => count === 0));
    await expectJson(await create(stranger, { ...validFields, title: 'Inspección de otro usuario' }), 201);

    const { data: active } = await expectJson(await create(owner), 201);
    await expectJson(await change(operator, active.id, { status: 'asignada', assignedTo: operator.user.id }), 200);
    const mine = await expectJson(await api(owner, '/stats/summary'), 200);
    const global = await expectJson(await api(operator, '/stats/summary'), 200);
    assert.equal(mine.data.total, (await expectJson(await api(owner), 200)).pagination.total);
    assert.equal(global.data.total, (await expectJson(await api(operator), 200)).pagination.total);
    assert.ok(global.data.total > mine.data.total);
    assert.ok(global.data.pendingAssignedToMe >= 1);
  });
});
