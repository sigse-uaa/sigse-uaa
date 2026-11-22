const { randomUUID } = require('node:crypto');
const { constants } = require('node:fs');
const { copyFile, mkdir, rm } = require('node:fs/promises');
const path = require('node:path');
const { ApiError } = require('../errors');

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const UPLOAD_PREFIX = '/uploads/';
const ALLOWED_TYPES = new Map([
  ['image/jpeg', 'foto'],
  ['image/png', 'foto'],
  ['image/webp', 'foto'],
  ['image/heic', 'foto'],
  ['image/heif', 'foto'],
  ['application/pdf', 'documento'],
]);

async function removeFile(location) {
  try {
    await rm(location, { force: true });
  } catch (error) {
    console.error('No se pudo borrar un archivo de evidencia.', { code: error.code });
  }
}

function createEvidenceStorage(uploadDirectory) {
  const directory = path.resolve(uploadDirectory);

  return {
    async inspect(file) {
      if (!file) throw new ApiError(422, 'FILE_REQUIRED', 'Selecciona un archivo de evidencia.');
      if (file.size > MAX_FILE_BYTES) {
        throw new ApiError(413, 'FILE_TOO_LARGE', 'El archivo no puede superar 8 MB.');
      }
      const { fileTypeFromFile } = await import('file-type');
      let format;
      try {
        format = await fileTypeFromFile(file.path);
      } catch (error) {
        if (error.code) throw error;
        // Un archivo incompleto o malformado puede hacer fallar la lectura de su firma.
      }
      const type = ALLOWED_TYPES.get(format?.mime);
      if (!type) {
        throw new ApiError(415, 'UNSUPPORTED_FILE_TYPE', 'Usa una imagen JPG, PNG, WebP, HEIC o un PDF.');
      }
      const filename = randomUUID() + '.' + format.ext;
      const originalName = file.originalname.replace(/[\u0000-\u001f\u007f]/g, '');
      return {
        filename,
        type,
        filePath: UPLOAD_PREFIX + filename,
        originalName: Array.from(originalName).slice(0, 255).join('') || filename,
        mimeType: format.mime,
        sizeBytes: file.size,
      };
    },

    async save(file, evidence) {
      await mkdir(directory, { recursive: true, mode: 0o750 });
      await copyFile(file.path, path.join(directory, evidence.filename), constants.COPYFILE_EXCL);
    },

    async remove(filePath) {
      if (!filePath.startsWith(UPLOAD_PREFIX)) return;
      const filename = filePath.slice(UPLOAD_PREFIX.length);
      // El seed contiene referencias ficticias en /uploads/demo; no apuntan a archivos cargados.
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(filename)) return;
      await removeFile(path.join(directory, filename));
    },

    location(filename) {
      return path.join(directory, filename);
    },
  };
}

module.exports = { createEvidenceStorage, MAX_FILE_BYTES, removeFile };
