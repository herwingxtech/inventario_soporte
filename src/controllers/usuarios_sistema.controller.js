// src/controllers/usuariosSistema.controller.js
// ! Controlador para la entidad Usuarios del Sistema
// * Aquí gestiono todo lo relacionado con usuarios del sistema: creación, consulta, actualización y eliminación.
// * Incluye lógica para el hashing seguro de contraseñas usando bcrypt y validaciones de negocio.

const { query } = require('../config/db'); // * Utilizo la función de consulta a la base de datos personalizada.
const bcrypt = require('bcrypt'); // * Uso bcrypt para el hashing seguro de contraseñas.

// * Defino el número de rondas de salting para bcrypt. Más alto = más seguro, pero más lento.
const saltRounds = 10;

// ===============================================================
// * Funciones controladoras para cada endpoint de usuarios del sistema
// ===============================================================

// * [GET] /api/usuarios-sistema - Trae todos los usuarios del sistema con JOINs a empleados, roles y status
const getAllUsuariosSistema = async (req, res, next) => {
  try {
    // * Consulta SQL con JOINs para traer toda la info relevante de cada usuario, sin exponer el password_hash
    const sql = `
      SELECT
        us.id,
        us.username,
        us.email,
        us.id_empleado,
        e.nombres AS nombre_empleado, // * Puede ser NULL si no hay empleado asociado
        e.apellidos AS apellido_empleado,
        us.id_rol,
        r.nombre_rol AS nombre_rol,
        us.fecha_registro,
        us.fecha_ultimo_login,
        us.fecha_actualizacion,
        us.id_status,
        st.nombre_status AS status_nombre
      FROM usuarios_sistema AS us
      LEFT JOIN empleados AS e ON us.id_empleado = e.id
      JOIN roles AS r ON us.id_rol = r.id
      JOIN status AS st ON us.id_status = st.id
    `;
    const usuarios = await query(sql);
    res.status(200).json(usuarios);
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todos los usuarios del sistema:', error);
    next(error);
  }
};

// * [GET] /api/usuarios-sistema/:id - Trae un usuario específico por su ID (con relaciones)
const getUsuarioSistemaById = async (req, res, next) => {
  try {
    const { id } = req.params;
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
        us.fecha_actualizacion,
        us.id_status,
        st.nombre_status AS status_nombre
      FROM usuarios_sistema AS us
      LEFT JOIN empleados AS e ON us.id_empleado = e.id
      JOIN roles AS r ON us.id_rol = r.id
      JOIN status AS st ON us.id_status = st.id
      WHERE us.id = ?
    `;
    const params = [id];
    const usuarios = await query(sql, params);
    if (usuarios.length === 0) {
      res.status(404).json({ message: `Usuario del sistema con ID ${id} no encontrado.` });
    } else {
      res.status(200).json(usuarios[0]);
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al obtener usuario del sistema con ID ${req.params.id}:`, error);
    next(error);
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

    // * Validaciones de campos obligatorios y formato
    if (!username || !password || id_rol === undefined) {
      return res.status(400).json({ message: 'Los campos username, password e id_rol son obligatorios.' });
    }
    if (username.trim() === '') {
        return res.status(400).json({ message: 'El campo username no puede estar vacío.' });
     }
     if (password.trim() === '') {
        return res.status(400).json({ message: 'El campo password no puede estar vacío.' });
     }
     if (email !== undefined && email !== null && email.trim() !== '') {
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailRegex.test(email)) {
             return res.status(400).json({ message: 'El formato del campo email no es válido.' });
         }
     }

    // * Validación de existencia de empleado si se proporciona
    if (id_empleado !== undefined && id_empleado !== null) {
        const empleadoExists = await query('SELECT id FROM empleados WHERE id = ?', [id_empleado]);
        if (empleadoExists.length === 0) {
            return res.status(400).json({ message: `El ID de empleado ${id_empleado} no es válido.` });
        }
    }

    // * Validación de existencia de rol
    const rolExists = await query('SELECT id FROM roles WHERE id = ?', [id_rol]);
    if (rolExists.length === 0) {
        return res.status(400).json({ message: `El ID de rol ${id_rol} no es válido.` });
    }

    // * Validación de existencia de status si se proporciona
    if (id_status !== undefined && id_status !== null) {
         const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
         if (statusExists.length === 0) {
             return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
         }
    } else if (id_status === null) {
         return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
    }

    // * Hasheo la contraseña antes de guardar
    const password_hash = await bcrypt.hash(password, saltRounds);
    // console.log(`Contraseña hasheada generada para usuario "${username}": ${password_hash}`); // ! Solo para debug, no dejar en producción

    // * Construyo la consulta SQL dinámicamente según los campos presentes
    let sql = 'INSERT INTO usuarios_sistema (username, password_hash, id_rol';
    const values = [username, password_hash, id_rol];
    const placeholders = ['?', '?', '?'];
    if (email !== undefined && email !== null) { sql += ', email'; placeholders.push('?'); values.push(email.trim() === '' ? null : email); }
    if (id_empleado !== undefined && id_empleado !== null) { sql += ', id_empleado'; placeholders.push('?'); values.push(id_empleado); }
    if (id_status !== undefined && id_status !== null) { sql += ', id_status'; placeholders.push('?'); values.push(id_status); }
    sql += ') VALUES (' + placeholders.join(', ') + ')';

    const result = await query(sql, values);
    const newUsuarioId = result.insertId;

    // * Devuelvo el ID y datos clave del nuevo usuario (sin contraseña ni hash)
    res.status(201).json({
      message: 'Usuario del sistema creado exitosamente',
      id: newUsuarioId,
      username: username,
      id_rol: id_rol
    });

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear usuario del sistema:', error);
    // * Manejo de errores específicos de duplicidad
    if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({
           message: `El nombre de usuario "${req.body.username}" o el empleado asociado ya existe.`,
           error: error.message
       });
     } else {
        next(error);
     }
  }
};

// * [PUT] /api/usuarios-sistema/:id - Actualiza un usuario por su ID (hashea si cambia contraseña)
const updateUsuarioSistema = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
        username, password, email, id_empleado, id_rol, id_status
    } = req.body;

    // * Validar que se envíe al menos un campo para actualizar
    const updateFields = Object.keys(req.body);
    if (updateFields.length === 0) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
    }
    if (username !== undefined && username !== null && username.trim() === '') {
        return res.status(400).json({ message: 'El campo username no puede estar vacío si se proporciona.' });
     }
     if (password !== undefined && password !== null && password.trim() === '') {
        return res.status(400).json({ message: 'El campo password no puede estar vacío si se proporciona (al actualizar).' });
     }
     if (email !== undefined && email !== null && email.trim() !== '') {
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailRegex.test(email)) {
             return res.status(400).json({ message: 'El formato del campo email no es válido.' });
         }
     }

    // * Validación de existencia de empleado si se intenta actualizar
    if (id_empleado !== undefined && id_empleado !== null) {
        const empleadoExists = await query('SELECT id FROM empleados WHERE id = ?', [id_empleado]);
        if (empleadoExists.length === 0) {
            return res.status(400).json({ message: `El ID de empleado ${id_empleado} no es válido.` });
        }
    }

    // * Validación de existencia de rol si se intenta actualizar
    if (id_rol !== undefined && id_rol !== null) {
        const rolExists = await query('SELECT id FROM roles WHERE id = ?', [id_rol]);
        if (rolExists.length === 0) {
            return res.status(400).json({ message: `El ID de rol ${id_rol} no es válido.` });
        }
    } else if (id_rol === null) {
         return res.status(400).json({ message: 'El campo id_rol no puede ser nulo.' });
    }

     // * Validación de existencia de status si se intenta actualizar
     if (id_status !== undefined && id_status !== null) {
          const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
          if (statusExists.length === 0) {
              return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
          }
     } else if (id_status === null) {
         return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
     }

    // * Si se proporciona nueva contraseña, la hasheo
    let password_hash_to_update = undefined;
    if (password !== undefined && password !== null) {
        password_hash_to_update = await bcrypt.hash(password, saltRounds);
        // console.log(`Nueva contraseña hasheada generada para usuario "${username || 'ID:'+id}": ${password_hash_to_update}`); // ! Solo para debug
    }

    // * Construyo la consulta UPDATE dinámicamente
    let sql = 'UPDATE usuarios_sistema SET ';
    const params = [];
    const updates = [];
    if (username !== undefined) { updates.push('username = ?'); params.push(username); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email === null || email.trim() === '' ? null : email); }
    if (id_empleado !== undefined) { updates.push('id_empleado = ?'); params.push(id_empleado); }
    if (id_rol !== undefined) { updates.push('id_rol = ?'); params.push(id_rol); }
    if (id_status !== undefined) { updates.push('id_status = ?'); params.push(id_status); }
    if (password_hash_to_update !== undefined) {
         updates.push('password_hash = ?');
         params.push(password_hash_to_update);
    }
    if (updates.length === 0) {
         return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
     }
    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id);

    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Usuario del sistema con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Usuario del sistema con ID ${id} actualizado exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar usuario del sistema con ID ${req.params.id}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({
           message: `El nombre de usuario o el empleado asociado ya existe en otro usuario.`,
           error: error.message
       });
     } else {
        next(error);
     }
  }
};

// * [DELETE] /api/usuarios-sistema/:id - Elimina un usuario por su ID
const deleteUsuarioSistema = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM usuarios_sistema WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Usuario del sistema con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Usuario del sistema con ID ${id} eliminado exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar usuario del sistema con ID ${req.params.id}:`, error);
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({
            message: `No se puede eliminar el usuario del sistema con ID ${req.params.id} porque ha creado notas u otros registros asociados.`,
            error: error.message
        });
     } else {
        next(error);
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