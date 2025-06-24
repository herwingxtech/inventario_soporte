// seedAdmin.js
// * Este script es para crear un usuario administrador inicial en la base de datos.
// * Su contraseña se hasheará antes de insertarla.
// ! Ejecutar con node seedAdmin.js

const bcrypt = require('bcrypt'); // Necesito bcrypt para hashear la contraseña.
const mysql = require('mysql2/promise'); // Necesito el cliente de MySQL.
require('dotenv').config(); // Necesito las variables de entorno para la conexión.

// * Defino los datos del usuario administrador que quiero crear.
const adminUser = {
    username: '', // O el nombre de usuario que prefieras
    password: '', // La contraseña en texto plano que usaré para iniciar sesión
    email: '',
    id_rol: 1, // Asumo que el ID 1 corresponde al rol 'Admin'
    id_status: 1 // Asumo que el ID 1 corresponde al status 'Activo'
};

// * Configuración de la conexión a la DB (la misma que en db.js).
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
};

// * Función principal asíncrona para ejecutar el proceso.
async function seedAdminUser() {
    let connection;
    try {
        console.log('Herwing está iniciando el script para crear el usuario admin...');
        // * Me conecto a la base de datos.
        connection = await mysql.createConnection(dbConfig);
        console.log('Conexión a la base de datos establecida.');

        // * Verifico si el usuario 'admin' ya existe para no duplicarlo.
        const [existingUsers] = await connection.execute('SELECT id FROM usuarios_sistema WHERE username = ?', [adminUser.username]);
        if (existingUsers.length > 0) {
            console.log(`El usuario "${adminUser.username}" ya existe. No se creará uno nuevo.`);
            return; // Salgo del script si ya existe.
        }

        // * Hasheo la contraseña en texto plano.
        console.log(`Hasheando la contraseña: "${adminUser.password}"...`);
        const saltRounds = 10; // Debe coincidir con el valor de tu auth.controller.js
        const hashedPassword = await bcrypt.hash(adminUser.password, saltRounds);
        console.log('Contraseña hasheada generada:', hashedPassword);

        // * Preparo la consulta SQL para insertar el nuevo usuario.
        const sql = `
            INSERT INTO usuarios_sistema (username, email, password_hash, id_rol, id_status)
            VALUES (?, ?, ?, ?, ?)
        `;
        const params = [
            adminUser.username,
            adminUser.email,
            hashedPassword, // Guardo la contraseña hasheada, no la original.
            adminUser.id_rol,
            adminUser.id_status
        ];

        // * Ejecuto la inserción.
        const [result] = await connection.execute(sql, params);
        console.log('----------------------------------------------------');
        console.log('¡USUARIO ADMINISTRADOR CREADO EXITOSAMENTE!');
        console.log(`ID del nuevo usuario: ${result.insertId}`);
        console.log(`Username: ${adminUser.username}`);
        console.log(`Password (para login): ${adminUser.password}`);
        console.log('----------------------------------------------------');

    } catch (error) {
        // ! Si ocurre un error, lo muestro.
        console.error('ERROR DURANTE LA CREACIÓN DEL USUARIO ADMIN:', error);
    } finally {
        // * Me aseguro de cerrar la conexión, haya o no error.
        if (connection) {
            await connection.end();
            console.log('Conexión a la base de datos cerrada.');
        }
    }
}

// * Ejecuto la función principal.
seedAdminUser();