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

module.exports = { serializeUser };
