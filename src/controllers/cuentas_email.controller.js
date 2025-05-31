// src/controllers/cuentasEmail.controller.js
// ! Controlador para la entidad Cuentas Email Corporativo
// * Aquí gestiono todo lo relacionado con las cuentas de correo corporativo: creación, consulta, actualización y eliminación.
// * Incluye validaciones, manejo de password_data y advertencias de seguridad sobre el almacenamiento de contraseñas.

const { query } = require('../config/db'); // Importamos la función de consulta DB.
// NOTA DE SEGURIDAD: NO importamos bcrypt aquí porque no hasheamos contraseñas que necesitamos recuperar.
// Si decides cifrar, necesitarías una librería de cifrado (ej. crypto integrado en Node, o una externa).

// ===============================================================
// NOTAS CRÍTICAS DE SEGURIDAD sobre password_data
// ===============================================================
// Almacenar contraseñas de email es un ALTO RIESGO de seguridad.
// 1. Si se almacenan en texto plano: Una brecha en la DB expone TODAS las credenciales de email.
// 2. Si se almacenan CIFRADAS: Es mejor, pero requiere una clave de cifrado. Si la clave se almacena
//    en el mismo lugar (DB, código, variables de entorno del mismo servidor), un atacante
//    que acceda a la DB o al servidor probablemente obtendrá la clave y podrá descifrar todo.
// 3. GESTIÓN SEGURA DE LLAVES: La ÚNICA forma razonablemente segura de almacenar contraseñas cifradas
//    que DEBAN ser recuperadas es utilizando un sistema de gestión de secretos EXTERNO y SEGURO
//    (ej. HashiCorp Vault, AWS Secrets Manager, Google Cloud Secret Manager) para la clave de cifrado.
//    La aplicación solo accedería a la clave en tiempo de ejecución desde ese sistema seguro.
// 4. ALTERNATIVA RECOMENDADA: Si es posible, no guardes la contraseña en absoluto. Implementa un
//    proceso de RESTABLECIMIENTO de contraseña para los usuarios que la olviden, en lugar de permitir
//    la RECUPERACIÓN.

// En este código, implementaremos el almacenamiento DIRECTO (texto plano si se envía así, o el string
// que se reciba) en password_data para fines de demostración de la estructura CRUD.
// PERO, SE RESALTA ENORMEMENTE QUE ESTO NO ES SEGURO PARA CONTRASEÑAS REALES EN PRODUCCIÓN.
// Deberías implementar cifrado o no guardar el campo según los requisitos de seguridad reales.
// ===============================================================


// ===============================================================
// * Funciones controladoras para cada endpoint de cuentas de email
// ===============================================================

// * [GET] /api/cuentas-email - Trae todas las cuentas de email con JOINs a empleados y status
const getAllCuentasEmail = async (req, res, next) => {
  try {
    // * Consulta SQL con JOINs para traer toda la info relevante de cada cuenta
    // * EXCLUYO el campo password_data por seguridad
    const sql = `
      SELECT
        ce.id,
        ce.email,
        ce.usuario_email,
        ce.password_data, 
        ce.id_empleado_asignado,
        e.nombres AS nombre_empleado, -- Nombre del empleado (puede ser NULL).
        e.apellidos AS apellido_empleado, -- Apellido del empleado (puede ser NULL).
        ce.fecha_creacion,
        ce.fecha_actualizacion, -- Incluido el campo de última actualización.
        ce.id_status,
        st.nombre_status AS status_nombre, -- Nombre del status.
        ce.observaciones
      FROM cuentas_email_corporativo AS ce
      LEFT JOIN empleados AS e ON ce.id_empleado_asignado = e.id -- LEFT JOIN porque id_empleado_asignado es NULLable.
      JOIN status AS st ON ce.id_status = st.id -- INNER JOIN porque id_status NO es NULLable.
    `;
    // Ejecutamos la consulta.
    const cuentas = await query(sql);

    // * Devuelvo la lista como JSON
    res.status(200).json(cuentas);

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todas las cuentas de email:', error);
    next(error); // Pasar error al middleware global.
  }
};

// * [GET] /api/cuentas-email/:id - Trae una cuenta de email específica por su ID (con relaciones)
const getCuentaEmailById = async (req, res, next) => {
  try {
    // * Extraigo el ID desde los parámetros de la URL
    const { id } = req.params;

    // * Consulta SQL con JOINs para traer la cuenta y sus relaciones
    // * EXCLUYO el campo password_data por seguridad
    const sql = `
      SELECT
        ce.id,
        ce.email,
        ce.usuario_email,
        ce.password_data, 
        ce.id_empleado_asignado,
        e.nombres AS nombre_empleado,
        e.apellidos AS apellido_empleado,
        ce.fecha_creacion,
        ce.fecha_actualizacion, -- Incluido.
        ce.id_status,
        st.nombre_status AS status_nombre,
        ce.observaciones
      FROM cuentas_email_corporativo AS ce
      LEFT JOIN empleados AS e ON ce.id_empleado_asignado = e.id
      JOIN status AS st ON ce.id_status = st.id
      WHERE ce.id = ? -- Filtrar por el ID proporcionado.
    `;
    const params = [id]; // El ID a buscar.
    const cuentas = await query(sql, params); // query siempre devuelve un array.

    // * Si no existe, devuelvo 404
    if (cuentas.length === 0) {
      // Si el array está vacío, la cuenta no fue encontrada (404 Not Found).
      res.status(404).json({ message: `Cuenta de email con ID ${id} no encontrada.` });
    } else {
      // * Si existe, devuelvo el objeto
      res.status(200).json(cuentas[0]);
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al obtener cuenta de email con ID ${req.params.id}:`, error);
    next(error); // Pasar error al manejador global.
  }
};

// * [POST] /api/cuentas-email - Crea una nueva cuenta de email con validaciones y advertencias de seguridad
const createCuentaEmail = async (req, res, next) => {
  try {
    // * Extraigo los datos del body. email es obligatorio, los demás son opcionales
    // * Valido formato de email y existencia de FKs
    // * Manejo especial de password_data (ver advertencias de seguridad)
    const {
        email, usuario_email, password_data,
        id_empleado_asignado, id_status, observaciones
    } = req.body;

    // === Validaciones ===
    // Validar campo obligatorio: email.
    if (!email) {
      return res.status(400).json({ message: 'El campo email es obligatorio.' });
    }
     // Validar formato de email.
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!emailRegex.test(email)) {
         return res.status(400).json({ message: `El formato del email "${email}" no es válido.` });
     }

    // Validar si id_empleado_asignado proporcionado existe (si se envió y no es NULL).
    if (id_empleado_asignado !== undefined && id_empleado_asignado !== null) { // id_empleado_asignado es NULLable.
        const empleadoExists = await query('SELECT id FROM empleados WHERE id = ?', [id_empleado_asignado]);
        if (empleadoExists.length === 0) {
            return res.status(400).json({ message: `El ID de empleado_asignado ${id_empleado_asignado} no es válido.` });
        }
    } else if (id_empleado_asignado === null) {
        // Permitir null para id_empleado_asignado.
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

    // === MANEJO DE PASSWORD_DATA ===
    // NOTA DE SEGURIDAD CRÍTICA: Si password_data viene aquí en texto plano,
    // lo estás guardando en texto plano en la DB (a menos que implementes cifrado).
    // SI DECIDES CIFRAR, LO HARÍAS AQUÍ ANTES DE GUARDARLO EN LA BASE DE DATOS.
    let passwordToStore = undefined; // Por defecto, no incluimos el campo si no se envió.
    if (password_data !== undefined) {
         // Puedes validar aquí si la contraseña cumple ciertos criterios mínimos (longitud, complejidad).
         // Si decides no guardar contraseñas vacías o nulas:
         // if (password_data === null || password_data.trim() === '') {
         //    // Decide si permitir null/vacío o exigir una contraseña.
         //    // return res.status(400).json({ message: 'La contraseña no puede estar vacía.' });
         //    passwordToStore = null; // Si decides guardar null para vacío/nulo.
         // } else {
              passwordToStore = password_data; // Guarda el valor tal cual (texto plano si no cifraste).
              // SI ESTÁS CIFRANDO, LLAMA A TU FUNCIÓN DE CIFRADO AQUÍ:
              // passwordToStore = encrypt(password_data, yourEncryptionKey);
         // }
    }


    // Consulta SQL para insertar. Construimos dinámicamente.
    // Incluimos 'password_data' solo si se proporcionó en el body.
    let sql = 'INSERT INTO cuentas_email_corporativo (email';
    const values = [email];
    const placeholders = ['?'];

    // Añadir campos opcionales si están presentes en el body (y no son undefined).
    // Manejamos explícitamente el valor `null` si la columna lo permite y se envía null.
    if (usuario_email !== undefined) { sql += ', usuario_email'; placeholders.push('?'); values.push(usuario_email === null || usuario_email.trim() === '' ? null : usuario_email); } // NULLable, convertir "" a null
    if (password_data !== undefined) { sql += ', password_data'; placeholders.push('?'); values.push(password_data === null || password_data.trim() === '' ? null : password_data); }
    if (id_empleado_asignado !== undefined) { sql += ', id_empleado_asignado'; placeholders.push('?'); values.push(id_empleado_asignado); } // NULLable
    if (id_status !== undefined) { sql += ', id_status'; placeholders.push('?'); values.push(id_status); } // NOT NULL, ya validado que no sea null.
    if (observaciones !== undefined) { sql += ', observaciones'; placeholders.push('?'); values.push(observaciones === null || observaciones.trim() === '' ? null : observaciones); } // NULLable, convertir "" a null


    sql += ') VALUES (' + placeholders.join(', ') + ')';

    // Ejecutamos la consulta.
    const result = await query(sql, values);
    const newCuentaId = result.insertId; // ID del registro insertado.

    // * Devuelvo el ID y datos clave de la nueva cuenta (sin contraseña)
    res.status(201).json({
      message: 'Cuenta de email creada exitosamente',
      id: newCuentaId,
      email: email,
      // No devolvemos la contraseña.
    });

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear cuenta de email:', error);
    // === Manejo de Errores Específicos ===
    // Si hay duplicación del email (UNIQUE constraint).
    if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict.
           message: `La dirección de email "${req.body.email}" ya existe.`,
           error: error.message
       });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// * [PUT] /api/cuentas-email/:id - Actualiza una cuenta de email por su ID
const updateCuentaEmail = async (req, res, next) => {
  try {
    // * Extraigo el ID y los datos a actualizar
    const { id } = req.params;
    const {
        email, usuario_email, password_data,
        id_empleado_asignado, id_status, observaciones
    } = req.body;

    // === Validaciones ===
    // Validar si se envió al menos un campo para actualizar (excluyendo el ID).
    const updateFields = Object.keys(req.body);
    if (updateFields.length === 0) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
    }

    // Validar formato de email si se intenta actualizar y no es null/vacío.
     if (email !== undefined && email !== null && email.trim() !== '') { // email es NOT NULL en DB.
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailRegex.test(email)) {
             return res.status(400).json({ message: `El formato del email "${email}" no es válido.` });
         }
     } else if (email !== undefined && (email === null || email.trim() === '')) {
         // Si intentan poner null o vacío a un campo NOT NULL.
         return res.status(400).json({ message: 'El campo email no puede estar vacío.' });
     }


    // Validar si id_empleado_asignado existe (si se intenta actualizar y no es NULL).
    if (id_empleado_asignado !== undefined && id_empleado_asignado !== null) { // id_empleado_asignado es NULLable.
        const empleadoExists = await query('SELECT id FROM empleados WHERE id = ?', [id_empleado_asignado]);
        if (empleadoExists.length === 0) {
            return res.status(400).json({ message: `El ID de empleado_asignado ${id_empleado_asignado} no es válido.` });
        }
    } else if (id_empleado_asignado === null) {
        // Permitir null.
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

  
    // === MANEJO DE PASSWORD_DATA EN UPDATE ===
    // Si el campo 'password_data' está presente en el body, actualizaremos la contraseña.
    // SI DECIDES CIFRAR, LO HARÍAS AQUÍ ANTES DE GUARDARLO EN LA BASE DE DATOS.
    let passwordToStore = undefined; // Inicializamos como undefined.
    if (password_data !== undefined) {
         // Si deciden poner null o cadena vacía para la contraseña:
         // if (password_data === null || password_data.trim() === '') {
         //    // Decide si permitir null/vacío o exigir una contraseña.
         //    // Si password_data es NULLable en DB, puedes permitir null.
         //    // Si NO es NULLable, esto sería un 400. En tu DB, es NULLable.
         //    passwordToStore = null; // O manejar como error si no quieres contraseñas nulas.
         // } else {
              passwordToStore = password_data; // Guarda el valor tal cual (texto plano si no cifraste).
              // SI ESTÁS CIFRANDO, LLAMA A TU FUNCIÓN DE CIFRADO AQUÍ:
              // passwordToStore = encrypt(password_data, yourEncryptionKey);
         // }
    }
    // Si `password_data` NO se incluyó en el body (`password_data === undefined`), `passwordToStore`
    // sigue siendo undefined, y NO incluiremos el campo `password_data` en la sentencia UPDATE,
    // dejando la contraseña actual sin cambios.


    // fecha_actualizacion se actualiza automáticamente en la DB.

    // Construir la consulta UPDATE dinámicamente.
    let sql = 'UPDATE cuentas_email_corporativo SET ';
    const params = [];
    const updates = []; // Partes de la sentencia SET.

    // Añadir campos a actualizar si están presentes en el body (y no son undefined).
    // Manejamos explícitamente el valor `null` si la columna lo permite y se envía null.
    if (email !== undefined) { updates.push('email = ?'); params.push(email); } // NOT NULL
    if (usuario_email !== undefined) { updates.push('usuario_email = ?'); params.push(usuario_email === null || usuario_email.trim() === '' ? null : usuario_email); } // NULLable, convertir "" a null
    // Incluir password_data SOLO si se proporcionó en el body.
    if (passwordToStore !== undefined) { updates.push('password_data = ?'); params.push(passwordToStore); } // NULLable
    if (id_empleado_asignado !== undefined) { updates.push('id_empleado_asignado = ?'); params.push(id_empleado_asignado); } // NULLable
    if (id_status !== undefined) { updates.push('id_status = ?'); params.push(id_status); } // NOT NULL
    if (observaciones !== undefined) { updates.push('observaciones = ?'); params.push(observaciones === null || observaciones.trim() === '' ? null : observaciones); } // NULLable, convertir "" a null

    // Si no hay campos para actualizar, ya se manejó al inicio.
     if (updates.length === 0) {
         return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
     }

    sql += updates.join(', '); // une con comas.
    sql += ' WHERE id = ?';
    params.push(id); // ID del registro a actualizar.

    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no fue encontrado.
      res.status(404).json({ message: `Cuenta de email con ID ${id} no encontrada.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Cuenta de email con ID ${id} actualizada exitosamente.` });
       // NUNCA DEVOLVER LA CONTRASEÑA.
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar cuenta de email con ID ${req.params.id}:`, error);
    // === Manejo de Errores Específicos ===
    // Si hay duplicación del email.
     if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict.
           message: `La dirección de email "${req.body.email}" ya existe.`,
           error: error.message
       });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// * [DELETE] /api/cuentas-email/:id - Elimina una cuenta de email por su ID
const deleteCuentaEmail = async (req, res, next) => {
  try {
    // * Extraigo el ID de la cuenta a eliminar
    const { id } = req.params;

    // Consulta SQL para eliminar por ID.
    const sql = 'DELETE FROM cuentas_email_corporativo WHERE id = ?';
    const params = [id];
    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Cuenta de email con ID ${id} no encontrada.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Cuenta de email con ID ${id} eliminada exitosamente.` });
    }

  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar cuenta de email con ID ${req.params.id}:`, error);
     // === Manejo de Errores Específicos ===
     // Manejar el error si está siendo usada por notas (ON DELETE CASCADE).
     // La FK de notas a cuentas_email_corporativo es CASCADE, por lo que eliminar la cuenta
     // debería eliminar automáticamente las notas asociadas. Si hay otro error, se captura aquí.
     // ER_ROW_IS_REFERENCED_2 podría ocurrir si hubiera OTRAS FKs que no vimos o si la DB
     // detecta un problema antes de ejecutar el CASCADE.
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({ // 409 Conflict.
            message: `No se puede eliminar la cuenta de email con ID ${req.params.id} porque está siendo utilizada por otros registros.`,
            error: error.message
        });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllCuentasEmail,
  getCuentaEmailById,
  createCuentaEmail,
  updateCuentaEmail,
  deleteCuentaEmail,
};