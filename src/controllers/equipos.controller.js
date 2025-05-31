// src/controllers/equipos.controller.js
// ! Controlador para la entidad Equipos
// * Aquí gestiono todo lo relacionado con los equipos físicos del inventario: creación, consulta, actualización y eliminación.
// * Incluye validaciones de negocio y relaciones con sucursales, tipos y status.

// Importamos la función de ayuda para ejecutar consultas a la base de datos.
const { query } = require('../config/db');

// ===============================================================
// FUNCIONES DE VALIDACIÓN (Ayuda a mantener el código limpio)
// ===============================================================

// Función de ayuda para validar formato básico de fecha (YYYY-MM-DD) de forma segura (UTC).
// DEVUELVE true si el string coincide con el formato YYYY-MM-DD y representa una fecha válida.
function isValidDate(dateString) {
  // --- INICIO DE DEBUGGING ---
  console.log('--- Validando Fecha ---');
  console.log('Valor recibido:', dateString);
  console.log('Tipo de dato:', typeof dateString);
  // --- FIN DE DEBUGGING ---

  // Permitir null o cadena vacía si el campo no es obligatorio.
  if (!dateString) {
      console.log('La fecha está vacía o nula. Retorna true.');
      return true;
  }

  // === PRIMER CHECK: Formato con Regex ===
  // Regex para validar formato YYYY-MM-DD estricto.
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  const regexTestResult = regex.test(dateString);
  console.log(`Test de Regex /^\d{4}-\d{2}-\d{2}$/:`, regexTestResult);

  if (!regexTestResult) {
      console.log('El formato NO coincide con YYYY-MM-DD. Retorna false.');
      return false; // El formato no coincide, es inválido.
  }

  // === SEGUNDO CHECK: Validar si la fecha es Real y coincide con componentes UTC ===
  // Si el formato pasa la regex, intentamos crear un objeto Date.
  // `new Date('YYYY-MM-DD')` a menudo parsea como UTC.
  const date = new Date(dateString);
   console.log('Objeto Date creado:', date);
   console.log('Fecha válida según Date.parse (!isNaN(date.getTime())):', !isNaN(date.getTime()));

  // Verificamos si el objeto Date es un objeto de fecha válido (no "Invalid Date").
  if (isNaN(date.getTime())) {
      console.log('new Date() creó un objeto Invalid Date. Retorna false.');
      return false;
  }

  // Validamos si los componentes parseados usando MÉTODOS UTC coinciden con los originales.
  // Esto evita problemas de zona horaria al comparar YYYY-MM-DD.
  const [year, month, day] = dateString.split('-').map(Number); // Extraemos los componentes como números.
   console.log('Componentes originales (split, numbers) - Año:', year, 'Mes:', month, 'Día:', day);

  // --- CAMBIO CLAVE: Usar métodos UTC ---
  const parsedYear = date.getUTCFullYear(); // <-- Usamos getUTCFullYear()
  const parsedMonth = date.getUTCMonth();   // <-- Usamos getUTCMonth() (0-indexado para UTC)
  const parsedDay = date.getUTCDate();      // <-- Usamos getUTCDate()
  console.log('Componentes parseados por Date (UTC) - Año:', parsedYear, 'Mes (0-index):', parsedMonth, 'Día:', parsedDay);
  // -----------------------------------

  // Comprobamos si los componentes parseados en UTC coinciden con los originales.
  // Para el mes parseado (0-indexado), lo comparamos con el mes original - 1.
  const componentsMatch = parsedYear === year && parsedMonth === month - 1 && parsedDay === day;
  console.log('Coincidencia de componentes (Date UTC vs Original):', componentsMatch);

  if (!componentsMatch) {
       console.log('Los componentes parseados (UTC) no coinciden con el original. Retorna false.');
       return false; // Indica que la fecha no es válida (ej. 2023-02-30) aunque el formato sea YYYY-MM-DD.
  }

  // Si llega aquí, el formato es YYYY-MM-DD, es una fecha real válida Y los componentes coinciden en UTC.
  console.log('Validación de fecha exitosa (UTC). Retorna true.');
  return true;
}

// ===============================================================
// FUNCIONES CONTROLADORAS
// ===============================================================

// [GET] /api/equipos
// Obtiene y devuelve todos los registros de la tabla 'equipos'.
// Incluye nombres de tipo de equipo, sucursal y estado asociados mediante JOINs.
const getAllEquipos = async (req, res, next) => { // 'next' para manejo de errores.
  try {
    // Consulta SQL para seleccionar equipos.
    // Hacemos JOINs con 'tipos_equipo', 'sucursales' y 'status'.
    const sql = `
      SELECT
        e.id,
        e.numero_serie,
        e.nombre_equipo,
        e.marca,
        e.modelo,
        e.id_tipo_equipo,
        te.nombre_tipo AS nombre_tipo_equipo, -- Nombre del tipo de equipo.
        e.id_sucursal_actual,
        s.nombre AS nombre_sucursal_actual, -- Nombre de la sucursal actual.
        e.procesador,
        e.ram,
        e.disco_duro,
        e.sistema_operativo,
        e.mac_address,
        e.otras_caracteristicas,
        e.fecha_compra,
        e.fecha_registro,
        e.fecha_actualizacion, -- Incluido el campo de última actualización.
        e.id_status,
        st.nombre_status AS status_nombre -- Nombre del status.
      FROM equipos AS e
      JOIN tipos_equipo AS te ON e.id_tipo_equipo = te.id -- Unir con tipos_equipo (obligatorio).
      JOIN sucursales AS s ON e.id_sucursal_actual = s.id -- Unir con sucursales (obligatorio).
      JOIN status AS st ON e.id_status = st.id -- Unir con status (obligatorio).
    `;
    // Ejecutamos la consulta.
    const equipos = await query(sql);

    // Enviamos la lista de equipos como respuesta JSON (200 OK).
    res.status(200).json(equipos);

  } catch (error) {
    console.error('Error al obtener todos los equipos:', error);
    next(error); // Pasar error al middleware global.
  }
};

// [GET] /api/equipos/:id
// Obtiene y devuelve un equipo específico por su ID.
// Incluye nombres de entidades relacionadas.
const getEquipoById = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID del equipo desde los parámetros de la URL.
    const { id } = req.params;

    // Consulta SQL para seleccionar un equipo por ID con JOINs.
    const sql = `
      SELECT
        e.id,
        e.numero_serie,
        e.nombre_equipo,
        e.marca,
        e.modelo,
        e.id_tipo_equipo,
        te.nombre_tipo AS nombre_tipo_equipo,
        e.id_sucursal_actual,
        s.nombre AS nombre_sucursal_actual,
        e.procesador,
        e.ram,
        e.disco_duro,
        e.sistema_operativo,
        e.mac_address,
        e.otras_caracteristicas,
        e.fecha_compra,
        e.fecha_registro,
        e.fecha_actualizacion, -- Incluido.
        e.id_status,
        st.nombre_status AS status_nombre
      FROM equipos AS e
      JOIN tipos_equipo AS te ON e.id_tipo_equipo = te.id
      JOIN sucursales AS s ON e.id_sucursal_actual = s.id
      JOIN status AS st ON e.id_status = st.id
      WHERE e.id = ? -- Filtrar por el ID proporcionado.
    `;
    const params = [id]; // El ID a buscar.
    const equipos = await query(sql, params); // query siempre devuelve un array.

    // === Verificación de Resultado ===
    if (equipos.length === 0) {
      // Si el array está vacío, el equipo no fue encontrado (404 Not Found).
      res.status(404).json({ message: `Equipo con ID ${id} no encontrado.` });
    } else {
      // Si se encontró, devolvemos el primer (y único) resultado (200 OK).
      res.status(200).json(equipos[0]);
    }

  } catch (error) {
    console.error(`Error al obtener equipo con ID ${req.params.id}:`, error);
    next(error); // Pasar error al manejador global.
  }
};

// * [POST] /api/equipos - Crea un nuevo equipo con validaciones
const createEquipo = async (req, res, next) => {
  try {
    // * Construyo la consulta SQL dinámicamente según los campos presentes en el body
    // * Valido y agrego cada campo opcional si está presente
    // Obtenemos los datos del body.
    // numero_serie, id_tipo_equipo, id_sucursal_actual son obligatorios.
    // Los demás son opcionales (id_status tiene DEFAULT).
    const {
        numero_serie, nombre_equipo, marca, modelo, id_tipo_equipo,
        id_sucursal_actual, procesador, ram, disco_duro, sistema_operativo,
        mac_address, otras_caracteristicas, fecha_compra, id_status
    } = req.body;

    // === Validaciones ===
    // Validar campos obligatorios.
    if (!numero_serie || id_tipo_equipo === undefined || id_sucursal_actual === undefined) {
      return res.status(400).json({ message: 'Los campos numero_serie, id_tipo_equipo e id_sucursal_actual son obligatorios.' });
    }
    // Validar que numero_serie no esté vacío si es obligatorio.
     if (numero_serie.trim() === '') {
        return res.status(400).json({ message: 'El campo numero_serie no puede estar vacío.' });
     }
    // Validar que mac_address si se proporciona, no esté vacío (la DB Unique lo maneja si no es NULL, pero validamos formato/presencia).
     if (mac_address !== undefined && mac_address !== null && mac_address.trim() === '') {
         return res.status(400).json({ message: 'El campo mac_address no puede estar vacío si se proporciona.' });
     }
     // Opcional: Añadir validación básica del formato de MAC address si es relevante.
     // Ejemplo regex simple (XX:XX:XX:XX:XX:XX o XX-XX-XX-XX-XX-XX): /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/

     // Validar formato de fecha_compra si se proporciona.
     if (!isValidDate(fecha_compra)) {
          return res.status(400).json({ message: 'El formato de fecha_compra debe ser YYYY-MM-DD.' });
     }


    // Validar si id_tipo_equipo proporcionado existe (FK).
    const tipoEquipoExists = await query('SELECT id FROM tipos_equipo WHERE id = ?', [id_tipo_equipo]);
    if (tipoEquipoExists.length === 0) {
        return res.status(400).json({ message: `El ID de tipo_equipo ${id_tipo_equipo} no es válido.` });
    }

    // Validar si id_sucursal_actual proporcionado existe (FK).
    const sucursalExists = await query('SELECT id FROM sucursales WHERE id = ?', [id_sucursal_actual]);
    if (sucursalExists.length === 0) {
        return res.status(400).json({ message: `El ID de sucursal_actual ${id_sucursal_actual} no es válido.` });
    }

    // Validar si id_status proporcionado existe (si se envió y no es NULL).
    if (id_status !== undefined && id_status !== null) { // id_status es NOT NULL en DB.
         const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
         if (statusExists.length === 0) {
             return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
         }
    } else if (id_status === null) {
        // Si envían `id_status: null`, pero la columna no es NULLable, es un 400.
        return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
    }
    // Si id_status es undefined, la DB usa el DEFAULT.


    // Consulta SQL para insertar. Construimos dinámicamente.
    let sql = 'INSERT INTO equipos (numero_serie, id_tipo_equipo, id_sucursal_actual';
    const values = [numero_serie, id_tipo_equipo, id_sucursal_actual];
    const placeholders = ['?', '?', '?'];

    // Añadir campos opcionales si están presentes en el body (y no son undefined/null o vacíos si no se permiten).
    // Nota: mac_address y fecha_compra son NULLable en la DB.
    if (nombre_equipo !== undefined && nombre_equipo !== null) { sql += ', nombre_equipo'; placeholders.push('?'); values.push(nombre_equipo); }
    if (marca !== undefined && marca !== null) { sql += ', marca'; placeholders.push('?'); values.push(marca); }
    if (modelo !== undefined && modelo !== null) { sql += ', modelo'; placeholders.push('?'); values.push(modelo); }
    if (procesador !== undefined && procesador !== null) { sql += ', procesador'; placeholders.push('?'); values.push(procesador); }
    if (ram !== undefined && ram !== null) { sql += ', ram'; placeholders.push('?'); values.push(ram); }
    if (disco_duro !== undefined && disco_duro !== null) { sql += ', disco_duro'; placeholders.push('?'); values.push(disco_duro); }
    if (sistema_operativo !== undefined && sistema_operativo !== null) { sql += ', sistema_operativo'; placeholders.push('?'); values.push(sistema_operativo); }
    if (mac_address !== undefined) { // mac_address puede ser null, permitimos enviar null explícitamente.
        sql += ', mac_address';
        placeholders.push('?');
        values.push(mac_address === null ? null : mac_address.trim() === '' ? null : mac_address); // Convertir "" a null
    }
    if (otras_caracteristicas !== undefined && otras_caracteristicas !== null) { sql += ', otras_caracteristicas'; placeholders.push('?'); values.push(otras_caracteristicas); }
    if (fecha_compra !== undefined && fecha_compra !== null) { sql += ', fecha_compra'; placeholders.push('?'); values.push(fecha_compra); }
    if (id_status !== undefined && id_status !== null) { sql += ', id_status'; placeholders.push('?'); values.push(id_status); }

    sql += ') VALUES (' + placeholders.join(', ') + ')';

    // Ejecutamos la consulta.
    const result = await query(sql, values);
    const newEquipoId = result.insertId; // ID del registro insertado.

    // * Devuelvo el ID y datos clave del nuevo equipo
    res.status(201).json({
      message: 'Equipo creado exitosamente',
      id: newEquipoId,
      numero_serie: numero_serie,
      id_tipo_equipo: id_tipo_equipo
    });

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear equipo:', error);
    // * Manejo específico de errores de duplicidad
    // Si hay duplicación de numero_serie o mac_address (UNIQUE constraints).
    if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict.
           message: `El número de serie o MAC address ya existe.`, // Mensaje genérico.
           error: error.message // Incluir mensaje de DB para debug.
       });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// * [PUT] /api/equipos/:id - Actualiza un equipo por su ID
const updateEquipo = async (req, res, next) => {
  try {
    // * Extraigo el ID y los datos a actualizar
    const { id } = req.params;
    const {
        numero_serie, nombre_equipo, marca, modelo, id_tipo_equipo,
        id_sucursal_actual, procesador, ram, disco_duro, sistema_operativo,
        mac_address, otras_caracteristicas, fecha_compra, id_status
    } = req.body;

    // * Valido que al menos un campo sea enviado
    const updatesCount = Object.keys(req.body).length;
    if (updatesCount === 0) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
    }
    // Validar que numero_serie si se intenta actualizar, no esté vacío.
     if (numero_serie !== undefined && numero_serie !== null && numero_serie.trim() === '') { // numero_serie es NOT NULL en DB.
        return res.status(400).json({ message: 'El campo numero_serie no puede estar vacío.' });
     }
     // Validar que mac_address si se intenta actualizar, no esté vacío.
     if (mac_address !== undefined && mac_address !== null && mac_address.trim() === '') {
         return res.status(400).json({ message: 'El campo mac_address no puede estar vacío si se proporciona.' });
     }
      // Opcional: Validar formato básico de MAC address si se intenta actualizar.

     // Validar formato de fecha_compra si se intenta actualizar.
     if (fecha_compra !== undefined && fecha_compra !== null) { // Permite actualizar a null.
         if (!isValidDate(fecha_compra)) {
              return res.status(400).json({ message: 'El formato de fecha_compra debe ser YYYY-MM-DD.' });
         }
     }


    // Validar si id_tipo_equipo existe (si se intenta actualizar y no es NULL).
    if (id_tipo_equipo !== undefined && id_tipo_equipo !== null) { // id_tipo_equipo es NOT NULL en DB.
        const tipoEquipoExists = await query('SELECT id FROM tipos_equipo WHERE id = ?', [id_tipo_equipo]);
        if (tipoEquipoExists.length === 0) {
            return res.status(400).json({ message: `El ID de tipo_equipo ${id_tipo_equipo} no es válido.` });
        }
    } else if (id_tipo_equipo === null) {
         return res.status(400).json({ message: 'El campo id_tipo_equipo no puede ser nulo.' });
    }

    // Validar si id_sucursal_actual existe (si se intenta actualizar y no es NULL).
    if (id_sucursal_actual !== undefined && id_sucursal_actual !== null) { // id_sucursal_actual es NOT NULL en DB.
        const sucursalExists = await query('SELECT id FROM sucursales WHERE id = ?', [id_sucursal_actual]);
        if (sucursalExists.length === 0) {
            return res.status(400).json({ message: `El ID de sucursal_actual ${id_sucursal_actual} no es válido.` });
        }
    } else if (id_sucursal_actual === null) {
         return res.status(400).json({ message: 'El campo id_sucursal_actual no puede ser nulo.' });
    }

    // Validar si id_status existe (si se intenta actualizar y no es NULL).
     if (id_status !== undefined && id_status !== null) { // id_status es NOT NULL en DB.
          const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
          if (statusExists.length === 0) {
              return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
          }
     } else if (id_status === null) {
         return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
     }


    // fecha_actualizacion se actualiza automáticamente en la DB.

    // * Construyo la consulta UPDATE dinámicamente
    let sql = 'UPDATE equipos SET ';
    const params = [];
    const updates = []; // Partes de la sentencia SET.

    // Añadir campos a actualizar si están presentes en el body.
    // Manejamos explícitamente el valor `null` si la columna lo permite y se envía null.
    // Para columnas NOT NULL, ya validamos que no se envíe null arriba.
    if (numero_serie !== undefined) { updates.push('numero_serie = ?'); params.push(numero_serie); }
    if (nombre_equipo !== undefined) { updates.push('nombre_equipo = ?'); params.push(nombre_equipo); } // NULLable
    if (marca !== undefined) { updates.push('marca = ?'); params.push(marca); } // NULLable
    if (modelo !== undefined) { updates.push('modelo = ?'); params.push(modelo); } // NULLable
    if (id_tipo_equipo !== undefined) { updates.push('id_tipo_equipo = ?'); params.push(id_tipo_equipo); }
    if (id_sucursal_actual !== undefined) { updates.push('id_sucursal_actual = ?'); params.push(id_sucursal_actual); }
    if (procesador !== undefined) { updates.push('procesador = ?'); params.push(procesador); } // NULLable
    if (ram !== undefined) { updates.push('ram = ?'); params.push(ram); } // NULLable
    if (disco_duro !== undefined) { updates.push('disco_duro = ?'); params.push(disco_duro); } // NULLable
    if (sistema_operativo !== undefined) { updates.push('sistema_operativo = ?'); params.push(sistema_operativo); } // NULLable
    if (mac_address !== undefined) { // UNIQUE NULLable, permite actualizar a NULL.
         updates.push('mac_address = ?');
         // Si se envía null o cadena vacía, actualizamos a null. De lo contrario, usamos el valor.
         params.push(mac_address === null || mac_address.trim() === '' ? null : mac_address);
    }
    if (otras_caracteristicas !== undefined) { updates.push('otras_caracteristicas = ?'); params.push(otras_caracteristicas); } // NULLable
    if (fecha_compra !== undefined) { updates.push('fecha_compra = ?'); params.push(fecha_compra); } // NULLable, permite actualizar a NULL.
    if (id_status !== undefined) { updates.push('id_status = ?'); params.push(id_status); }

    // Si no hay campos para actualizar, ya se manejó al inicio.
     if (updates.length === 0) {
         return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
     }

    sql += updates.join(', '); // une con comas.
    sql += ' WHERE id = ?';
    params.push(id); // ID del registro a actualizar.

    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // * Devuelvo mensaje de éxito o 404 si no existía
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no fue encontrado.
      res.status(404).json({ message: `Equipo con ID ${id} no encontrado.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Equipo con ID ${id} actualizado exitosamente.` });
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar equipo con ID ${req.params.id}:`, error);
    // * Manejo específico de errores de duplicidad
    // Si hay duplicación de numero_serie o mac_address.
     if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict.
           message: `El número de serie o MAC address proporcionado ya existe en otro equipo.`, // Mensaje genérico.
           error: error.message
       });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// * [DELETE] /api/equipos/:id - Elimina un equipo por su ID
const deleteEquipo = async (req, res, next) => {
  try {
    // * Extraigo el ID del equipo a eliminar
    const { id } = req.params;

    // Consulta SQL para eliminar por ID.
    const sql = 'DELETE FROM equipos WHERE id = ?';
    const params = [id];
    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // * Ejecuto el DELETE y reviso si realmente existía
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Equipo con ID ${id} no encontrado.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Equipo con ID ${id} eliminado exitosamente.` });
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar equipo con ID ${req.params.id}:`, error);
     // * Manejo específico de errores de integridad referencial
     // Manejar el error si está siendo usado por otras tablas (asignaciones, mantenimientos, notas, o como equipo padre en asignaciones).
     // La mayoría de las FKs a equipos son ON DELETE CASCADE (mantenimientos, notas, asignaciones.id_equipo_padre),
     // lo que significa que al eliminar el equipo, esos registros dependientes también se eliminan automáticamente.
     // Sin embargo, asignaciones.id_equipo es ON DELETE RESTRICT.
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({ // 409 Conflict.
            message: `No se puede eliminar el equipo con ID ${req.params.id} porque tiene asignaciones activas o históricas asociadas.`,
            error: error.message
        });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllEquipos,
  getEquipoById,
  createEquipo,
  updateEquipo,
  deleteEquipo,
};