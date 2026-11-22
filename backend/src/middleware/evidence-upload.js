const os = require('node:os');
const path = require('node:path');
const { mkdtempSync, rmSync } = require('node:fs');
const multer = require('multer');
const { ApiError } = require('../errors');
const { MAX_FILE_BYTES } = require('../storage/evidences');

let tempDirectory;
const storage = multer.diskStorage({
  destination(_request, _file, callback) {
    try {
      if (!tempDirectory) {
        tempDirectory = mkdtempSync(path.join(os.tmpdir(), 'sigse-evidence-'));
        process.once('exit', () => {
          try {
            rmSync(tempDirectory, { recursive: true, force: true });
          } catch (error) {
            console.error('No se pudo limpiar el directorio temporal de evidencias.', { code: error.code });
          }
        });
      }
      callback(null, tempDirectory);
    } catch (error) {
      callback(error);
    }
  },
});

const receiveFile = multer({
  storage,
  // Busboy puede rechazar en el límite exacto. La validación final permite hasta 8 MiB inclusive.
  limits: { fileSize: MAX_FILE_BYTES + 1, files: 1, fields: 1, parts: 3, fieldSize: 4096 },
}).single('file');

function receiveEvidence(request, response, next) {
  receiveFile(request, response, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(413, 'FILE_TOO_LARGE', 'El archivo no puede superar 8 MB.'));
    }
    if (error instanceof multer.MulterError || !error.code) {
      return next(new ApiError(400, 'INVALID_MULTIPART', 'Envía un archivo en el campo file y una descripción opcional.'));
    }
    return next(error);
  });
}

module.exports = { receiveEvidence };
