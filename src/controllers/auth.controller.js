// src/controllers/auth.controller.js
// * Este controlador maneja la lógica de autenticación, como el inicio de sesión.

const { query } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ===============================================================
// FUNCIÓN DE LOGIN
// ===============================================================

const login = async (req, res, next) => {
    // * Obtengo el username y password del cuerpo de la petición.
    const { username, password } = req.body;
    console.log(`Herwing - Backend (login): Intento de login para usuario: "${username}"`);

    try {
        // === 1. Validación de Entrada ===
        if (!username || !password) {
            return res.status(400).json({ message: 'El nombre de usuario y la contraseña son obligatorios.' });
        }

        // === 2. Buscar al Usuario en la Base de Datos ===
        // * Busco al usuario por su username. Es importante seleccionar el password_hash para compararlo.
        const sql = `SELECT u.id, u.username, u.password_hash, u.id_rol, r.nombre_rol
                     FROM usuarios_sistema u
                     JOIN roles r ON u.id_rol = r.id
                     WHERE u.username = ? AND u.id_status = 1`;
        const [user] = await query(sql, [username]);

        // Si no se encuentra el usuario o no está activo, devuelvo un error 401.
        // Doy un mensaje genérico para no revelar si el usuario existe o no (buena práctica de seguridad).
        if (!user) {
            console.warn(`Herwing - Backend (login): Intento de login fallido para usuario inexistente o inactivo: "${username}"`);
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // === 3. Comparar la Contraseña ===
        // * Uso bcrypt.compare para comparar de forma segura la contraseña en texto plano
        // * enviada por el usuario con el hash almacenado en la base de datos.
        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

        // Si la comparación falla, las contraseñas no coinciden.
        if (!isPasswordCorrect) {
            console.warn(`Herwing - Backend (login): Contraseña incorrecta para usuario: "${username}"`);
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // === 4. Generar el Token JWT ===
        // * Si las credenciales son correctas, genero un token.
        // * El "payload" es la información que quiero guardar dentro del token.
        // * Es información pública (codificada, no cifrada), así que NO pongas datos sensibles aquí.
        const payload = {
            userId: user.id,
            username: user.username,
            roleId: user.id_rol
        };

        // * Firmo el token usando el payload, mi clave secreta de .env, y opciones (como la expiración).
        // * '1h' significa que el token expirará en 1 hora. Puedes usar '7d', '30m', etc.
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        console.log(`Herwing - Backend (login): Login exitoso para usuario: "${username}". Token generado.`);

        // === 5. Enviar la Respuesta ===
        // * Envío el token al frontend. También puedo enviar información útil del usuario.
        // ! NUNCA envíes el password_hash en la respuesta.
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                roleId: user.id_rol,
                roleName: user.nombre_rol
            }
        });

    } catch (error) {
        console.error('Herwing - Backend (login): Error durante el proceso de login:', error);
        next(error); // Paso el error al manejador global.
    }
};

module.exports = {
    login
}; 