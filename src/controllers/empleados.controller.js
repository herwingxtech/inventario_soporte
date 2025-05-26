// src/controllers/empleados.controller.js
// Controlador para manejar las operaciones CRUD de la entidad Empleados.

// Importamos la función de ayuda para ejecutar consultas a la base de datos.
const { query } = require('../config/db');

// ===============================================================
// FUNCIONES CONTROLADORAS
// ===============================================================

// [GET] /api/empleados
// Obtiene y devuelve todos los registros de la tabla 'empleados'.
// Incluye los nombres de la sucursal, área y estado asociados mediante JOINs.
const getAllEmpleados = async (req, res, next) => { // 'next' para manejo de errores.
  try {
    // Consulta SQL para seleccionar empleados.
    // Hacemos JOIN con 'sucursales', 'areas' y 'status'.
    // Usamos LEFT JOIN para `sucursales` y `areas` porque `id_sucursal` y `id_area` son NULLable.
    // Si usamos INNER JOIN, solo obtendríamos empleados que tienen SUCURSAL Y AREA asignadas,
    // lo cual no queremos si esos campos son opcionales.
    const sql = `
      SELECT
        e.id,
        e.numero_empleado,
        e.nombres,
        e.apellidos,
        e.email_personal,
        e.telefono,
        e.puesto,
        e.fecha_nacimiento,
        e.fecha_ingreso,
        e.id_sucursal,
        s.nombre AS nombre_sucursal, -- Nombre de la sucursal (puede ser NULL si no tiene).
        e.id_area,
        a.nombre AS nombre_area, -- Nombre del área (puede ser NULL si no tiene).
        e.fecha_registro,
        e.fecha_actualizacion, -- Incluido el campo de última actualización.
        e.id_status,
        st.nombre_status AS status_nombre -- Nombre del status.
      FROM empleados AS e
      LEFT JOIN sucursales AS s ON e.id_sucursal = s.id -- LEFT JOIN porque id_sucursal es NULLable.
      LEFT JOIN areas AS a ON e.id_area = a.id -- LEFT JOIN porque id_area es NULLable.
      JOIN status AS st ON e.id_status = st.id -- INNER JOIN porque id_status NO es NULLable.
    `;
    // Ejecutamos la consulta.
    const empleados = await query(sql);

    // Enviamos la lista de empleados como respuesta JSON (200 OK).
    res.status(200).json(empleados);

  } catch (error) {
    console.error('Error al obtener todos los empleados:', error);
    next(error); // Pasar error al middleware global.
  }
};

// [GET] /api/empleados/:id
// Obtiene y devuelve un empleado específico por su ID.
// Incluye nombres de entidades relacionadas.
const getEmpleadoById = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID del empleado desde los parámetros de la URL.
    const { id } = req.params;

    // Consulta SQL para seleccionar un empleado por ID con JOINs (usando LEFT JOIN).
    const sql = `
      SELECT
        e.id,
        e.numero_empleado,
        e.nombres,
        e.apellidos,
        e.email_personal,
        e.telefono,
        e.puesto,
        e.fecha_nacimiento,
        e.fecha_ingreso,
        e.id_sucursal,
        s.nombre AS nombre_sucursal,
        e.id_area,
        a.nombre AS nombre_area,
        e.fecha_registro,
        e.fecha_actualizacion, -- Incluido.
        e.id_status,
        st.nombre_status AS status_nombre
      FROM empleados AS e
      LEFT JOIN sucursales AS s ON e.id_sucursal = s.id
      LEFT JOIN areas AS a ON e.id_area = a.id
      JOIN status AS st ON e.id_status = st.id
      WHERE e.id = ? -- Filtrar por el ID proporcionado.
    `;
    const params = [id]; // El ID a buscar.
    const empleados = await query(sql, params); // query siempre devuelve un array.

    // === Verificación de Resultado ===
    if (empleados.length === 0) {
      // Si el array está vacío, el empleado no fue encontrado (404 Not Found).
      res.status(404).json({ message: `Empleado con ID ${id} no encontrado.` });
    } else {
      // Si se encontró, devolvemos el primer (y único) resultado (200 OK).
      res.status(200).json(empleados[0]);
    }

  } catch (error) {
    console.error(`Error al obtener empleado con ID ${req.params.id}:`, error);
    next(error); // Pasar error al manejador global.
  }
};

// [POST] /api/empleados
// Crea un nuevo registro en la tabla 'empleados'.
// Incluye validaciones para campos obligatorios y FKs.
const createEmpleado = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos los datos del body.
    // nombres y apellidos son obligatorios. Los demás son opcionales (salvo id_status que tiene DEFAULT).
    const {
        numero_empleado, nombres, apellidos, email_personal,
        telefono, puesto, fecha_nacimiento, fecha_ingreso,
        id_sucursal, id_area, id_status
    } = req.body;

    // === Validaciones ===
    // Validar campos obligatorios.
    if (!nombres || !apellidos) {
      return res.status(400).json({ message: 'Los campos nombres y apellidos son obligatorios.' });
    }
    // Validar que si numero_empleado se envía, no esté vacío (aunque la DB UNIQUE lo maneja, es buena práctica validar antes).
    if (numero_empleado !== undefined && numero_empleado !== null && numero_empleado.trim() === '') {
         return res.status(400).json({ message: 'El campo numero_empleado no puede estar vacío si se proporciona.' });
    }
     // Validar formato básico de email si se proporciona.
     if (email_personal !== undefined && email_personal !== null && email_personal.trim() !== '') {
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex simple para email
         if (!emailRegex.test(email_personal)) {
             return res.status(400).json({ message: 'El formato del campo email_personal no es válido.' });
         }
     }
     // Validar formatos de fecha si se proporcionan. Las fechas DATE en MySQL esperan 'YYYY-MM-DD'.
     // Podemos validar el formato de string básico aquí. La DB fallará si no es un formato de fecha válido.
     if (fecha_nacimiento !== undefined && fecha_nacimiento !== null && fecha_nacimiento.trim() !== '') {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_nacimiento)) {
              return res.status(400).json({ message: 'El formato de fecha_nacimiento debe ser YYYY-MM-DD.' });
          }
     }
     if (fecha_ingreso !== undefined && fecha_ingreso !== null && fecha_ingreso.trim() !== '') {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_ingreso)) {
              return res.status(400).json({ message: 'El formato de fecha_ingreso debe ser YYYY-MM-DD.' });
          }
     }


    // Validar si id_sucursal proporcionado existe (si el usuario lo envió y no es NULL).
    if (id_sucursal !== undefined && id_sucursal !== null) {
        const sucursalExists = await query('SELECT id FROM sucursales WHERE id = ?', [id_sucursal]);
        if (sucursalExists.length === 0) {
            return res.status(400).json({ message: `El ID de sucursal ${id_sucursal} no es válido.` });
        }
    }

    // Validar si id_area proporcionado existe (si el usuario lo envió y no es NULL).
    if (id_area !== undefined && id_area !== null) {
        const areaExists = await query('SELECT id FROM areas WHERE id = ?', [id_area]);
        if (areaExists.length === 0) {
            return res.status(400).json({ message: `El ID de área ${id_area} no es válido.` });
        }
    }
     // NOTA: No validamos aquí si el área pertenece a una sucursal específica. La FK en la DB
     // asegura que si id_area está lleno, ese ID existe en la tabla areas. La lógica
     // de si esa área *debería* estar asociada a una sucursal de tipo corporativo
     // está en el controlador de áreas. Aquí simplemente validamos la FK.

    // Validar si id_status proporcionado existe (si el usuario lo envió y no es NULL).
    // Recordemos que id_status NO es NULLable y tiene un DEFAULT en la DB. Si no se envía, la DB usa DEFAULT.
    // Si se envía y es null, la DB podría quejarse dependiendo del modo SQL, o simplemente usar DEFAULT.
    // Para ser estrictos, si se envía, debe ser un ID válido.
    if (id_status !== undefined && id_status !== null) {
         const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
         if (statusExists.length === 0) {
             return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
         }
    } else if (id_status === null) {
         // Si envían `id_status: null`, pero la columna no es NULLable, es un 400.
         return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
    }


    // Consulta SQL para insertar. Construimos dinámicamente.
    let sql = 'INSERT INTO empleados (nombres, apellidos';
    const values = [nombres, apellidos];
    const placeholders = ['?', '?'];

    // Añadir campos opcionales si están presentes en el body (y no son undefined/null o vacíos si no se permiten)
    // Nota: algunos campos opcionales permiten NULL o cadena vacía según la DB.
    // Aquí añadimos si son !== undefined y no son nulos.
    if (numero_empleado !== undefined && numero_empleado !== null) { sql += ', numero_empleado'; placeholders.push('?'); values.push(numero_empleado); }
    if (email_personal !== undefined && email_personal !== null) { sql += ', email_personal'; placeholders.push('?'); values.push(email_personal); }
    if (telefono !== undefined && telefono !== null) { sql += ', telefono'; placeholders.push('?'); values.push(telefono); }
    if (puesto !== undefined && puesto !== null) { sql += ', puesto'; placeholders.push('?'); values.push(puesto); }
    if (fecha_nacimiento !== undefined && fecha_nacimiento !== null) { sql += ', fecha_nacimiento'; placeholders.push('?'); values.push(fecha_nacimiento); }
    if (fecha_ingreso !== undefined && fecha_ingreso !== null) { sql += ', fecha_ingreso'; placeholders.push('?'); values.push(fecha_ingreso); }
    if (id_sucursal !== undefined && id_sucursal !== null) { sql += ', id_sucursal'; placeholders.push('?'); values.push(id_sucursal); }
    if (id_area !== undefined && id_area !== null) { sql += ', id_area'; placeholders.push('?'); values.push(id_area); }
    if (id_status !== undefined && id_status !== null) { sql += ', id_status'; placeholders.push('?'); values.push(id_status); }
     // Si id_status es undefined, la DB usa el DEFAULT.

    sql += ') VALUES (' + placeholders.join(', ') + ')';

    // Ejecutamos la consulta.
    const result = await query(sql, values);
    const newEmpleadoId = result.insertId; // ID del registro insertado.

    // Enviamos respuesta de éxito (201 Created).
    res.status(201).json({
      message: 'Empleado creado exitosamente',
      id: newEmpleadoId,
      nombres: nombres,
      apellidos: apellidos
    });

  } catch (error) {
    console.error('Error al crear empleado:', error);
    // === Manejo de Errores Específicos ===
    // Si hay duplicación del numero_empleado (UNIQUE constraint).
    if (error.code === 'ER_DUP_ENTRY') {
       // Se podría ser más específico si el error indica qué UNIQUE constraint falló (numero_empleado o email_personal si fuera unique).
       // MySQL error message usually includes the key name.
       res.status(409).json({ // 409 Conflict.
           message: `Ya existe un empleado con este número o datos únicos.`, // Mensaje genérico si hay varios unique.
           // message: `El número de empleado "${req.body.numero_empleado}" ya existe.`, // Si solo numero_empleado es UNIQUE.
           error: error.message // Incluir mensaje de DB para debug.
       });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// [PUT] /api/empleados/:id
// Actualiza un registro existente en la tabla 'empleados' por su ID.
// Incluye validaciones para FKs y campos únicos.
const updateEmpleado = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos ID y datos del body.
    const { id } = req.params;
    const {
        numero_empleado, nombres, apellidos, email_personal,
        telefono, puesto, fecha_nacimiento, fecha_ingreso,
        id_sucursal, id_area, id_status
    } = req.body;

    // === Validaciones ===
    // Validar si se envió al menos un campo para actualizar.
    const updatesCount = Object.keys(req.body).length;
    if (updatesCount === 0) {
         return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
    }
    // Validar que si numero_empleado se envía, no esté vacío.
     if (numero_empleado !== undefined && numero_empleado !== null && numero_empleado.trim() === '') {
         return res.status(400).json({ message: 'El campo numero_empleado no puede estar vacío si se proporciona.' });
    }
    // Validar formato básico de email si se proporciona.
     if (email_personal !== undefined && email_personal !== null && email_personal.trim() !== '') {
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailRegex.test(email_personal)) {
             return res.status(400).json({ message: 'El formato del campo email_personal no es válido.' });
         }
     }
      // Validar formatos de fecha si se proporcionan.
     if (fecha_nacimiento !== undefined && fecha_nacimiento !== null && fecha_nacimiento.trim() !== '') {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_nacimiento)) {
              return res.status(400).json({ message: 'El formato de fecha_nacimiento debe ser YYYY-MM-DD.' });
          }
     }
     if (fecha_ingreso !== undefined && fecha_ingreso !== null && fecha_ingreso.trim() !== '') {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_ingreso)) {
              return res.status(400).json({ message: 'El formato de fecha_ingreso debe ser YYYY-MM-DD.' });
          }
     }

    // Validar si id_sucursal existe (si se intenta actualizar y no es NULL).
    if (id_sucursal !== undefined && id_sucursal !== null) {
        const sucursalExists = await query('SELECT id FROM sucursales WHERE id = ?', [id_sucursal]);
        if (sucursalExists.length === 0) {
            return res.status(400).json({ message: `El ID de sucursal ${id_sucursal} no es válido.` });
        }
    } else if (id_sucursal === null) {
        // Si intentan poner null, y la columna lo permite, no hay validación de existencia, solo permitir el null.
        // No hacemos nada aquí, se manejará en la construcción del SQL.
    }

    // Validar si id_area existe (si se intenta actualizar y no es NULL).
    if (id_area !== undefined && id_area !== null) {
        const areaExists = await query('SELECT id FROM areas WHERE id = ?', [id_area]);
        if (areaExists.length === 0) {
            return res.status(400).json({ message: `El ID de área ${id_area} no es válido.` });
        }
    } else if (id_area === null) {
        // Si intentan poner null, y la columna lo permite, no hay validación de existencia.
        // No hacemos nada aquí.
    }

     // Validar si id_status existe (si se intenta actualizar y no es NULL).
     if (id_status !== undefined && id_status !== null) {
          const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
          if (statusExists.length === 0) {
              return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
          }
     } else if (id_status === null) {
         // Si envían `id_status: null`, pero la columna no es NULLable, es un 400.
         // Aunque en update dinámico `null` se manejaría si se incluye en `updates`.
         // Para ser explícitos:
         // return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
         // O, si la DB lo maneja bien (usando DEFAULT), podrías omitir esta validación si el default es aceptable.
         // Mantengamos la validación si se intenta poner null explícitamente.
         return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
     }


    // fecha_actualizacion se actualiza automáticamente en la DB.

    // Construir la consulta UPDATE dinámicamente.
    let sql = 'UPDATE empleados SET ';
    const params = [];
    const updates = []; // Partes de la sentencia SET (ej. 'campo = ?' o 'campo = NULL').

    // Añadir campos a actualizar si están presentes en el body.
    // Para campos NULLable, debemos manejar explícitamente el valor `null`.
    if (nombres !== undefined) { updates.push('nombres = ?'); params.push(nombres); }
    if (apellidos !== undefined) { updates.push('apellidos = ?'); params.push(apellidos); }
    if (numero_empleado !== undefined) { updates.push('numero_empleado = ?'); params.push(numero_empleado); } // Si se envía null, se actualiza a null
    if (email_personal !== undefined) { updates.push('email_personal = ?'); params.push(email_personal); }
    if (telefono !== undefined) { updates.push('telefono = ?'); params.push(telefono); }
    if (puesto !== undefined) { updates.push('puesto = ?'); params.push(puesto); }
    if (fecha_nacimiento !== undefined) { updates.push('fecha_nacimiento = ?'); params.push(fecha_nacimiento); }
    if (fecha_ingreso !== undefined) { updates.push('fecha_ingreso = ?'); params.push(fecha_ingreso); }
    if (id_sucursal !== undefined) { updates.push('id_sucursal = ?'); params.push(id_sucursal); } // Si se envía null, se actualiza a null
    if (id_area !== undefined) { updates.push('id_area = ?'); params.push(id_area); } // Si se envía null, se actualiza a null
    if (id_status !== undefined) { updates.push('id_status = ?'); params.push(id_status); } // Si se envía null, el 400 de arriba lo atrapó.

    // Si no hay campos para actualizar, ya se manejó al inicio con `updatesCount`.
    // Pero si llegamos aquí y por alguna razón `updates` está vacío, es un error interno.
     if (updates.length === 0) {
         // Esto no debería pasar si la validación inicial funciona, pero como fallback:
         return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
     }


    // Unir las partes SET y añadir la cláusula WHERE.
    sql += updates.join(', '); // une con comas.
    sql += ' WHERE id = ?';
    params.push(id); // ID del registro a actualizar.

    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no fue encontrado.
      res.status(404).json({ message: `Empleado con ID ${id} no encontrado.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Empleado con ID ${id} actualizado exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al actualizar empleado con ID ${req.params.id}:`, error);
    // === Manejo de Errores Específicos ===
    // Si hay duplicación del numero_empleado o email_personal (si email_personal fuera unique).
     if (error.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ // 409 Conflict.
           message: `Ya existe un empleado con este número de empleado o email personal.`, // Mensaje genérico.
           error: error.message
       });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// [DELETE] /api/empleados/:id
// Elimina un registro de la tabla 'empleados' por su ID.
const deleteEmpleado = async (req, res, next) => { // Añadimos 'next'.
  try {
    // Obtenemos el ID del empleado a eliminar.
    const { id } = req.params;

    // Consulta SQL para eliminar por ID.
    const sql = 'DELETE FROM empleados WHERE id = ?';
    const params = [id];
    // Ejecutamos la consulta.
    const result = await query(sql, params);

    // === Verificación de Resultado ===
    if (result.affectedRows === 0) {
      // Si 0 filas afectadas, el ID no existía.
      res.status(404).json({ message: `Empleado con ID ${id} no encontrado.` });
    } else {
      // Éxito (200 OK).
      res.status(200).json({ message: `Empleado con ID ${id} eliminado exitosamente.` });
    }

  } catch (error) {
    console.error(`Error al eliminar empleado con ID ${req.params.id}:`, error);
     // === Manejo de Errores Específicos ===
     // Manejar el error si está siendo usada por otras tablas (asignaciones, cuentas_email_corporativo, usuarios_sistema).
     // Las FKs son ON DELETE SET NULL, así que la eliminación del empleado *debería* funcionar y poner NULL en las tablas referenciadas.
     // Sin embargo, si hay algún otro problema (ej. cascada muy profunda, error en la DB), este catch lo atraparía.
     if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({ // 409 Conflict.
            message: `No se puede eliminar el empleado con ID ${req.params.id} porque está siendo utilizado en asignaciones, cuentas de email o usuarios del sistema.`,
            error: error.message
        });
     } else {
        next(error); // Para cualquier otro error, pasar al manejador global.
     }
  }
};

// Exportamos las funciones del controlador.
module.exports = {
  getAllEmpleados,
  getEmpleadoById,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
};