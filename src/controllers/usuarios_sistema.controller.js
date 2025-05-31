// src/controllers/usuariosSistema.controller.js
// ! Controlador para la entidad Usuarios del Sistema
// * Aquí gestiono todo lo relacionado con usuarios del sistema: creación, consulta, actualización y eliminación.
// * Incluye lógica para el hashing seguro de contraseñas usando bcrypt y validaciones de negocio.

const { query } = require('../config/db'); // Importamos la función de consulta DB.
const bcrypt = require('bcrypt'); // Importamos la librería bcrypt para hashing.

// Número de rondas de salting para bcrypt. Un valor más alto es más seguro pero más lento.
// 10 es un buen valor por defecto. Aumentar si la potencia de cómputo mejora significativamente.
const saltRounds = 10;

// ===============================================================
// * Funciones controladoras para cada endpoint de usuarios del sistema
// ===============================================================

// * [GET] /api/usuarios-sistema - Trae todos los usuarios del sistema con JOINs a empleados, roles y status
const getAllUsuariosSistema = async (req, res, next) => {
  try {
    // * Consulta SQL con JOINs para traer toda la info relevante de cada usuario
    // * NUNCA devuelvo el password_hash
    // Consulta SQL para seleccionar usuarios.
    // Hacemos JOINs con 'empleados', 'roles' y 'status'.
    // Usamos LEFT JOIN para `empleados` porque `id_empleado` es NULLable.
    // SE EXCLUYE EXPLICITAMENTE el campo `password_hash`.
    const sql = `
      SELECT
        us.id,
        us.username,
        us.email,
        us.id_empleado,
        e.nombres AS nombre_empleado, -- Nombre del empleado (puede ser NULL).
        e.apellidos AS apellido_empleado, -- Apellido del empleado (puede ser NULL).
        us.id_rol,
        r.nombre_rol AS nombre_rol, -- Nombre del rol.
        us.fecha_registro,
        us.fecha_ultimo_login,
        us.fecha_actualizacion, -- Incluido el campo de última actualización.
        us.id_status,
        st.nombre_status AS status_nombre -- Nombre del status.
      FROM usuarios_sistema AS us
      LEFT JOIN empleados AS e ON us.id_empleado = e.id -- LEFT JOIN porque id_empleado es NULLable.
      JOIN roles AS r ON us.id_rol = r.id -- INNER JOIN porque id_rol NO es NULLable.
      JOIN status AS st ON us.id_status = st.id -- INNER JOIN porque id_status NO es NULLable.
    `;
    // Ejecutamos la consulta.
    const usuarios = await query(sql);

    // * Devuelvo la lista como JSON
    // Enviamos la lista de usuarios (sin hash de contraseña) como respuesta JSON (200 OK).
    res.status(200).json(usuarios);

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todos los usuarios del sistema:', error);
    next(error); // Pasar error al middleware global.
  }
};

// * [GET] /api/usuarios-sistema/:id - Trae un usuario específico por su ID (con relaciones)
const getUsuarioSistemaById = async (req, res, next) => {
  try {
    // * Extraigo el ID desde los parámetros de la URL
    const { id } = req.params;

    // * Consulta SQL con JOINs para traer el usuario y sus relaciones
    // SE EXCLUYE EXPLICITAMENTE el campo `password_hash`.
    const sql = `
      SELECT
        us.id,
        us.username,
        us.email,
        us.id_empleado,
        e.nombres AS nombre_empleado,
        e.apellidos AS apellido_empleado,
        us.id_rol,
        r.nombre_rol AS nombre_rol,
        us.fecha_registro,
        us.fecha_ultimo_login,
        us.fecha_actualizacion, -- Incluido.
        us.id_status,
        st.nombre_status AS status_nombre
      FROM usuarios_sistema AS us
      LEFT JOIN empleados AS e ON us.id_empleado = e.id
      JOIN roles AS r ON us.id_rol = r.id
      JOIN status AS st ON us.id_status = st.id
      WHERE us.id = ? -- Filtrar por el ID proporcionado.
    `;
    const params = [id]; // El ID a buscar.
    const usuarios = await query(sql, params); // query siempre devuelve un array.

    // * Si no existe, devuelvo 404
    if (usuarios.length === 0) {
      // Si el array está vacío, el usuario no fue encontrado (404 Not Found).
      res.status(404).json({ message: `Usuario del sistema con ID ${id} no encontrado.` });
    } else {
      // * Si existe, devuelvo el objeto
      // Si se encontró, devolvemos el primer (y único) resultado (200 OK).
      res.status(200).json(usuarios[0]);
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al obtener usuario del sistema con ID ${req.params.id}:`, error);
    next(error); // Pasar error al manejador global.
  }
};

// * [POST] /api/usuarios-sistema - Crea un nuevo usuario con hashing seguro de contraseña
const createUsuarioSistema = async (req, res, next) => {
  try {
    // * Extraigo los datos del body. username, password e id_rol son obligatorios
    // * Valido existencia de FKs y formato de email
    const {
        username, password, email, id_empleado, id_rol, id_status
    } = req.body;

    // === Validaciones ===
    // Validar campos obligatorios.
    if (!username || !password || id_rol === undefined) {
      return res.status(400).json({ message: 'Los campos username, password e id_rol son obligatorios.' });
    }
    // Validar que username y password no estén vacíos.
     if (username.trim() === '') {
        return res.status(400).json({ message: 'El campo username no puede estar vacío.' });
     }
     if (password.trim() === '') {
        return res.status(400).json({ message: 'El campo password no puede estar vacío.' });
     }
     // Validar formato básico de email si se proporciona y no es null/vacío.
     if (email !== undefined && email !== null && email.trim() !== '') {
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex simple para email
         if (!emailRegex.test(email)) {
             return res.status(400).json({ message: 'El formato del campo email no es válido.' });
         }
     }

    // Validar si id_empleado proporcionado existe (si el usuario lo envió y no es NULL).
    if (id_empleado !== undefined && id_empleado !== null) {
        const empleadoExists = await query('SELECT id FROM empleados WHERE id = ?', [id_empleado]);
        if (empleadoExists.length === 0) {
            return res.status(400).json({ message: `El ID de empleado ${id_empleado} no es válido.` });
        }
        // NOTA: La DB tiene un UNIQUE constraint en id_empleado en usuarios_sistema,
        // lo que asegura que un empleado solo pueda tener UNA cuenta de sistema.
        // Si intentas crear un usuario para un empleado que ya tiene cuenta, la DB lanzará ER_DUP_ENTRY.
    }

    // Validar si id_rol proporcionado existe (FK).
    const rolExists = await query('SELECT id FROM roles WHERE id = ?', [id_rol]);
    if (rolExists.length === 0) {
        return res.status(400).json({ message: `El ID de rol ${id_rol} no es válido.` });
    }

    // Validar si id_status proporcionado existe (si se envió y no es NULL).
    if (id_status !== undefined && id_status !== null) { // id_status es NOT NULL en DB.
         const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
         if (statusExists.length === 0) {
             return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
         }
    } else if (id_status === null) {
         return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
    }
    // Si id_status es undefined, la DB usa el DEFAULT.


    // === HASHING DE LA CONTRASEÑA ===
    // Utilizamos bcrypt.hash() para hashear la contraseña de forma asíncrona.
    // El primer argumento es la contraseña en texto plano.
    // El segundo argumento es el costo (saltRounds), que determina la complejidad del hashing.
    const password_hash = await bcrypt.hash(password, saltRounds);
    console.log(`Contraseña hasheada generada para usuario "${username}": ${password_hash}`); // Para fines de demostración, no lo hagas en producción.


    // Consulta SQL para insertar. Construimos dinámicamente.
    // Insertamos el password_hash, NO la contraseña en texto plano original.
    let sql = 'INSERT INTO usuarios_sistema (username, password_hash, id_rol';
    const values = [username, password_hash, id_rol]; // password_hash ya calculado.
    const placeholders = ['?', '?', '?'];

    // Añadir campos opcionales si están presentes en el body (y no son undefined/null o vacíos si no se permiten).
    // email, id_empleado son NULLable en la DB.
    if (email !== undefined && email !== null) { sql += ', email'; placeholders.push('?'); values.push(email.trim() === '' ? null : email); } // Convertir "" a null si se permite
    if (id_empleado !== undefined && id_empleado !== null) { sql += ', id_empleado'; placeholders.push('?'); values.push(id_empleado); }
    if (id_status !== undefined && id_status !== null) { sql += ', id_status'; placeholders.push('?'); values.push(id_status); }

    sql += ') VALUES (' + placeholders.join(', ') + ')';

    // Ejecutamos la consulta.
    const result = await query(sql, values);
    const newUsuarioId = result.insertId; // ID del registro insertado.

    // * Devuelvo el ID y datos clave del nuevo usuario (sin contraseña ni hash)
    // NUNCA DEVOLVER LA CONTRASEÑA (texto plano o hash) en la respuesta.
    res.status(201).json({
      message: 'Usuario del sistema creado exitosamente',
      id: newUsuarioId,
      username: username,
      id_rol: id_rol
      // No devolvemos la contraseña ni el hash.
    });

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear usuario del sistema:', error);
    // === Manejo de Errores Específicos ===
    // Si hay duplicación del username o id_empleado (UNIQUE constraints).
    if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict.
           message: `El nombre de usuario "${req.body.username}" o el empleado asociado ya existe.`, // Mensaje genérico para ambos unique.
           error: error.message // Incluir mensaje de DB para debug.
       });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// * [PUT] /api/usuarios-sistema/:id - Actualiza un usuario por su ID (hashea si cambia contraseña)
const updateUsuarioSistema = async (req, res, next) => {
  try {
    // * Extraigo el ID y los datos a actualizar
    const { id } = req.params;
    // Separamos 'password' del resto de campos.
    const {
        username, password, email, id_empleado, id_rol, id_status
    } = req.body;

    // === Validaciones ===
    // Validar si se envió al menos un campo para actualizar (excluyendo el ID).
    const updateFields = Object.keys(req.body);
    if (updateFields.length === 0) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
    }

    // Validar que username si se intenta actualizar, no esté vacío.
     if (username !== undefined && username !== null && username.trim() === '') { // username es NOT NULL en DB.
        return res.status(400).json({ message: 'El campo username no puede estar vacío si se proporciona.' });
     }
     // Validar que password si se intenta actualizar, no esté vacío.
     if (password !== undefined && password !== null && password.trim() === '') { // password_hash es NOT NULL en DB (aunque guardemos el hash).
        return res.status(400).json({ message: 'El campo password no puede estar vacío si se proporciona (al actualizar).' });
     }
     // Validar formato básico de email si se proporciona y no es null/vacío.
     if (email !== undefined && email !== null && email.trim() !== '') {
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailRegex.test(email)) {
             return res.status(400).json({ message: 'El formato del campo email no es válido.' });
         }
     }


    // Validar si id_empleado existe (si se intenta actualizar y no es NULL).
    if (id_empleado !== undefined && id_empleado !== null) { // id_empleado es UNIQUE NULLable.
        const empleadoExists = await query('SELECT id FROM empleados WHERE id = ?', [id_empleado]);
        if (empleadoExists.length === 0) {
            return res.status(400).json({ message: `El ID de empleado ${id_empleado} no es válido.` });
        }
        // La validación de unicidad (que otro usuario no tenga ya este empleado) la manejará la DB con ER_DUP_ENTRY.
    } else if (id_empleado === null) {
        // Si intentan poner id_empleado = null, y la columna lo permite, no hay validación de existencia.
    }

    // Validar si id_rol existe (si se intenta actualizar y no es NULL).
    if (id_rol !== undefined && id_rol !== null) { // id_rol es NOT NULL en DB.
        const rolExists = await query('SELECT id FROM roles WHERE id = ?', [id_rol]);
        if (rolExists.length === 0) {
            return res.status(400).json({ message: `El ID de rol ${id_rol} no es válido.` });
        }
    } else if (id_rol === null) {
         return res.status(400).json({ message: 'El campo id_rol no puede ser nulo.' });
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


    // === HASHING DE LA CONTRASEÑA SI SE PROPORCIONÓ ===
    let password_hash_to_update = undefined; // Inicializamos como undefined.
    if (password !== undefined && password !== null) { // Si se incluyó el campo 'password' en el body (incluso si es cadena vacía, ya validada arriba).
        // Hasheamos la nueva contraseña proporcionada.
        password_hash_to_update = await bcrypt.hash(password, saltRounds);
         console.log(`Nueva contraseña hasheada generada para usuario "${username || 'ID:'+id}": ${password_hash_to_update}`); // Log para depuración.
    }
    // Si `password` NO se incluyó en el body (`password === undefined`), `password_hash_to_update` sigue siendo undefined,
    // y NO incluiremos el campo `password_hash` en la sentencia UPDATE.

    // fecha_actualizacion se actualiza automáticamente en la DB.

    // Construir la consulta UPDATE dinámicamente.
    let sql = 'UPDATE usuarios_sistema SET ';
    const params = [];
    const updates = []; // Partes de la sentencia SET.

    // Añadir campos a actualizar si están presentes en el body (y no son undefined).
    // Manejamos explícitamente el valor `null` si la columna lo permite y se envía null.
    if (username !== undefined) { updates.push('username = ?'); params.push(username); } // NOT NULL
    if (email !== undefined) { updates.push('email = ?'); params.push(email === null || email.trim() === '' ? null : email); } // UNIQUE NULLable, convertir "" a null.
    if (id_empleado !== undefined) { updates.push('id_empleado = ?'); params.push(id_empleado); } // UNIQUE NULLable.
    if (id_rol !== undefined) { updates.push('id_rol = ?'); params.push(id_rol); } // NOT NULL
    if (id_status !== undefined) { updates.push('id_status = ?'); params.push(id_status); } // NOT NULL

    // Añadir el password_hash solo si se proporcionó una nueva contraseña.
    if (password_hash_to_update !== undefined) {
         updates.push('password_hash = ?');
         params.push(password_hash_to_update); // Usamos el hash generado.
    }


    // Si no hay campos para actualizar (aparte del ID), ya se manejó al inicio.
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
      // * Si 0 filas afectadas, el ID no fue encontrado.
      res.status(404).json({ message: `Usuario del sistema con ID ${id} no encontrado.` });
    } else {
      // * Éxito (200 OK).
      res.status(200).json({ message: `Usuario del sistema con ID ${id} actualizado exitosamente.` });
       // ! NUNCA DEVOLVER LA CONTRASEÑA NI EL HASH.
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar usuario del sistema con ID ${req.params.id}:`, error);
    // === Manejo de Errores Específicos ===
    // Si hay duplicación del username o id_empleado.
     if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict.
           message: `El nombre de usuario o el empleado asociado ya existe en otro usuario.`, // Mensaje genérico.
           error: error.message
       });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// * [DELETE] /api/usuarios-sistema/:id - Elimina un usuario por su ID
const deleteUsuarioSistema = async (req, res, next) => {
  try {
    // * Extraigo el ID del usuario a eliminar
    const { id } = req.params;

    // Consulta SQL para eliminar por ID.
    const sql = 'DELETE FROM usuarios_sistema WHERE id = ?';
    const params = [id];
    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // * Ejecuto el DELETE y reviso si realmente existía
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Usuario del sistema con ID ${id} no encontrado.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Usuario del sistema con ID ${id} eliminado exitosamente.` });
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar usuario del sistema con ID ${req.params.id}:`, error);
     // === Manejo de Errores Específicos ===
     // Manejar el error si está siendo usado por notas (ON DELETE SET NULL).
     // Similar a otros casos con SET NULL, la eliminación debería funcionar y poner NULL en notas.
     // Pero manejamos el error ER_ROW_IS_REFERENCED_2 por si acaso o si hay otras FKs que no vimos.
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({ // 409 Conflict.
            message: `No se puede eliminar el usuario del sistema con ID ${req.params.id} porque ha creado notas u otros registros asociados.`,
            error: error.message
        });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllUsuariosSistema,
  getUsuarioSistemaById,
  createUsuarioSistema,
  updateUsuarioSistema,
  deleteUsuarioSistema,
};