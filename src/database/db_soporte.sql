-- -----------------------------------------------------
-- Generado con tu experto guía para tu inventario :)
-- Asegúrate de usar una base de datos limpia o nueva.
-- -----------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */; -- Asegura que los nombres de las tablas se manejen correctamente

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */;

-- -----------------------------------------------------
-- Schema inventario_db
-- Puedes crear un esquema/base de datos específico antes de ejecutar este script
CREATE SCHEMA IF NOT EXISTS `inventario_soporte` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
USE `inventario_soporte` ;
-- -----------------------------------------------------

-- Inicia una transacción para asegurar la atomicidad de la creación
START TRANSACTION;

-- Drop tables if they exist, in reverse order of foreign key dependencies
DROP TABLE IF EXISTS `notas`;
DROP TABLE IF EXISTS `cuentas_email_corporativo`;
DROP TABLE IF EXISTS `usuarios_sistema`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `mantenimientos`;
DROP TABLE IF EXISTS `asignaciones`;
DROP TABLE IF EXISTS `direcciones_ip`;
DROP TABLE IF EXISTS `equipos`;
DROP TABLE IF EXISTS `tipos_equipo`;
DROP TABLE IF EXISTS `empleados`;
DROP TABLE IF EXISTS `ubicaciones_internas`;
DROP TABLE IF EXISTS `sucursales`;
DROP TABLE IF EXISTS `areas`;
DROP TABLE IF EXISTS `empresas`;
DROP TABLE IF EXISTS `status`;

-- -----------------------------------------------------
-- Table `status`
-- Catálogo de estados posibles (ej: 'Activo', 'Inactivo', 'En Mantenimiento', 'Asignado', 'Disponible', 'Finalizado', 'Cancelado', 'Reservada', 'Baja', 'Pendiente', 'En Curso', 'Bloqueado')
-- -----------------------------------------------------
CREATE TABLE `status` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_status` VARCHAR(50) NOT NULL UNIQUE,
  `descripcion` VARCHAR(255), -- Opcional: para detallar el status
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- Insertar estados iniciales (ejemplos) - Asegúrate de que estos IDs correspondan a los DEFAULTs (1=Activo, etc.)
-- Puedes ajustar los IDs si es necesario después de insertar.
INSERT INTO `status` (`id`, `nombre_status`) VALUES
(1, 'Activo'), (2, 'Inactivo'), (3, 'En Mantenimiento'), (4, 'Asignado'),
(5, 'Disponible'), (6, 'Finalizado'), (7, 'Cancelado'), (8, 'Reservada'),
(9, 'Baja'), (10, 'Pendiente'), (11, 'En Curso'), (12, 'Bloqueado');


-- -----------------------------------------------------
-- Table `empresas`
-- Las dos empresas principales
-- -----------------------------------------------------
CREATE TABLE `empresas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL UNIQUE,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `id_status` INT NOT NULL DEFAULT 1, -- Asumiendo que status 1 es 'Activo'
  CONSTRAINT `fk_empresas_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT -- No permitir eliminar un status si hay empresas usándolo
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `areas`
-- Departamentos o áreas dentro de las empresas
-- -----------------------------------------------------
CREATE TABLE `areas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL, -- ej: 'Contabilidad', 'Informática', 'Recursos Humanos'
  `id_empresa` INT NOT NULL, -- A qué empresa pertenece esta área
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `id_status` INT NOT NULL DEFAULT 1, -- Asumiendo que status 1 es 'Activo'
  CONSTRAINT `uq_area_nombre_empresa` UNIQUE (`nombre`, `id_empresa`), -- Nombre de área único por empresa
  CONSTRAINT `fk_areas_empresas`
    FOREIGN KEY (`id_empresa`)
    REFERENCES `empresas` (`id`)
    ON DELETE CASCADE -- Si se elimina la empresa, eliminar sus áreas
    ON UPDATE CASCADE,
  CONSTRAINT `fk_areas_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `sucursales`
-- Tiendas y ubicaciones físicas, asociadas a una empresa
-- -----------------------------------------------------
CREATE TABLE `sucursales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `direccion` VARCHAR(255),
  `numero_telefono` VARCHAR(20),
  `id_empresa` INT NOT NULL,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `id_status` INT NOT NULL DEFAULT 1, -- Asumiendo que status 1 es 'Activo'
  CONSTRAINT `uq_sucursal_nombre_empresa` UNIQUE (`nombre`, `id_empresa`), -- Nombre de sucursal único por empresa
  CONSTRAINT `fk_sucursales_empresas`
    FOREIGN KEY (`id_empresa`)
    REFERENCES `empresas` (`id`)
    ON DELETE RESTRICT -- No permitir eliminar una empresa si tiene sucursales
    ON UPDATE CASCADE,
  CONSTRAINT `fk_sucursales_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `ubicaciones_internas`
-- Opcional: Lugares específicos dentro de una sucursal (ej: piso 1, sala 305)
-- -----------------------------------------------------
CREATE TABLE `ubicaciones_internas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL, -- ej: 'Oficina 1', 'Almacén', 'Sala de Juntas'
  `descripcion` TEXT,
  `id_sucursal` INT NOT NULL,
  `id_status` INT NOT NULL DEFAULT 1,
  CONSTRAINT `uq_ubicacion_nombre_sucursal` UNIQUE (`nombre`, `id_sucursal`),
  CONSTRAINT `fk_ubicaciones_sucursales`
    FOREIGN KEY (`id_sucursal`)
    REFERENCES `sucursales` (`id`)
    ON DELETE CASCADE -- Si se elimina la sucursal, eliminar las ubicaciones internas
    ON UPDATE CASCADE,
  CONSTRAINT `fk_ubicaciones_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `empleados`
-- Información de los empleados
-- -----------------------------------------------------
CREATE TABLE `empleados` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `numero_empleado` VARCHAR(50) UNIQUE, -- Podría ser un número interno de la empresa
  `nombres` VARCHAR(100) NOT NULL,
  `apellidos` VARCHAR(100) NOT NULL,
  `email_personal` VARCHAR(100), -- Email personal, no corporativo
  `telefono` VARCHAR(20),
  `puesto` VARCHAR(100),
  `fecha_nacimiento` DATE,
  `fecha_ingreso` DATE,
  `id_sucursal` INT, -- A qué sucursal está adscrito el empleado (NULLable si es staff corporativo sin sucursal base)
  `id_area` INT, -- A qué área corporativa pertenece el empleado (NULLable si no aplica)
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `id_status` INT NOT NULL DEFAULT 1, -- Estado del empleado (Activo, Baja, Permiso)
  CONSTRAINT `fk_empleados_sucursales`
    FOREIGN KEY (`id_sucursal`)
    REFERENCES `sucursales` (`id`)
    ON DELETE SET NULL -- Si se elimina la sucursal, el empleado puede quedar sin sucursal
    ON UPDATE CASCADE,
  CONSTRAINT `fk_empleados_areas`
    FOREIGN KEY (`id_area`)
    REFERENCES `areas` (`id`)
    ON DELETE SET NULL -- Si se elimina el área, el empleado puede quedar sin área asignada
    ON UPDATE CASCADE,
  CONSTRAINT `fk_empleados_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `tipos_equipo`
-- Catálogo para diferenciar Computadoras, Monitores, Teclados, etc.
-- -----------------------------------------------------
CREATE TABLE `tipos_equipo` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_tipo` VARCHAR(100) NOT NULL UNIQUE, -- ej: 'Computadora', 'Monitor', 'Teclado', 'Impresora', 'Router', 'Switch', 'Cámara IP', 'Terminal de Cobro'
  `descripcion` TEXT,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- Insertar tipos de equipo iniciales (ejemplos)
INSERT INTO `tipos_equipo` (`id`, `nombre_tipo`) VALUES
(1, 'Computadora'), (2, 'Laptop'), (3, 'Monitor'), (4, 'Teclado'), (5, 'Mouse'),
(6, 'Impresora'), (7, 'Scanner'), (8, 'Router'), (9, 'Switch'), (10, 'Access Point'),
(11, 'Cámara IP'), (12, 'Terminal de Cobro'), (13, 'Servidor'), (14, 'Disco Duro Externo'),
(15, 'Webcam'), (16, 'Proyector'), (17, 'Firewall'), (18, 'NAS'); -- Añadidos algunos más


-- -----------------------------------------------------
-- Table `equipos`
-- Tabla unificada para todos los ítems de inventario
-- -----------------------------------------------------
CREATE TABLE `equipos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `numero_serie` VARCHAR(100) UNIQUE NOT NULL, -- Identificador único del fabricante
  `nombre_equipo` VARCHAR(100), -- Nombre interno o alias (ej: "PC Contabilidad 1")
  `marca` VARCHAR(100),
  `modelo` VARCHAR(100),
  `id_tipo_equipo` INT NOT NULL, -- FK a tipos_equipo
  `id_sucursal_actual` INT NOT NULL, -- Sucursal donde se encuentra físicamente (obligatorio)
  `id_ubicacion_interna_actual` INT, -- FK a ubicaciones_internas (NULLable)
  `procesador` VARCHAR(100), -- Especifico de computadoras/servidores/terminales (NULLable)
  `ram` VARCHAR(50),          -- (NULLable)
  `disco_duro` VARCHAR(50),    -- (NULLable)
  `sistema_operativo` VARCHAR(100), -- (NULLable)
  `mac_address` VARCHAR(20) UNIQUE, -- MAC address (NULLable, pero única si existe)
  `otras_caracteristicas` TEXT,
  `fecha_compra` DATE,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `id_status` INT NOT NULL DEFAULT 1, -- Estado del equipo (Disponible, Asignado, En Mantenimiento, Baja)
  CONSTRAINT `fk_equipos_tipos_equipo`
    FOREIGN KEY (`id_tipo_equipo`)
    REFERENCES `tipos_equipo` (`id`)
    ON DELETE RESTRICT -- Un equipo debe tener un tipo
    ON UPDATE CASCADE,
  CONSTRAINT `fk_equipos_sucursales`
    FOREIGN KEY (`id_sucursal_actual`)
    REFERENCES `sucursales` (`id`)
    ON DELETE RESTRICT -- Un equipo debe estar en una sucursal física
    ON UPDATE CASCADE,
  CONSTRAINT `fk_equipos_ubicaciones_internas`
    FOREIGN KEY (`id_ubicacion_interna_actual`)
    REFERENCES `ubicaciones_internas` (`id`)
    ON DELETE SET NULL -- Si se elimina la ubicación interna, el equipo puede quedar sin ubicacion interna específica
    ON UPDATE CASCADE,
  CONSTRAINT `fk_equipos_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `direcciones_ip`
-- Gestión de direcciones IP
-- -----------------------------------------------------
CREATE TABLE `direcciones_ip` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `direccion_ip` VARCHAR(45) NOT NULL UNIQUE, -- IPv4 o IPv6
  `id_sucursal` INT, -- NULLable: A qué sucursal está asociada esta IP (puede haber IPs corporativas no ligadas a una sucursal específica)
  `id_ubicacion_interna` INT, -- Opcional: Ubicación interna específica
  `comentario` TEXT,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `id_status` INT NOT NULL DEFAULT 1, -- Estado de la IP (Disponible, Asignada, Reservada, Baja). Usar IDs de `status`.
   CONSTRAINT `fk_direcciones_ip_sucursales`
    FOREIGN KEY (`id_sucursal`)
    REFERENCES `sucursales` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_direcciones_ip_ubicaciones_internas`
    FOREIGN KEY (`id_ubicacion_interna`)
    REFERENCES `ubicaciones_internas` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_direcciones_ip_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `asignaciones`
-- Historial y estado actual de a quién/dónde/con qué IP/conectado a qué está un equipo
-- -----------------------------------------------------
CREATE TABLE `asignaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_equipo` INT NOT NULL, -- El equipo que está siendo asignado
  `id_empleado` INT, -- NULLable: Si el equipo está asignado a una persona
  `id_ubicacion_interna` INT, -- NULLable: Si el equipo está en un lugar específico (ej. "Stock almacén") sin estar asignado a una persona
  `id_equipo_padre` INT, -- NULLable: Si este equipo es un periférico/componente de otro equipo (ej. Monitor asignado a una Computadora)
  `id_ip` INT UNIQUE, -- NULLable. Un equipo puede tener 0 o 1 IP principal asignada en un momento dado *en una asignación activa*. UNIQUE asegura que una IP solo se asigna a un equipo ACTIVO a la vez. (La unicidad debe validarse en la aplicación o con un índice parcial si MySQL lo soportara fácilmente, aquí se pone como ayuda)
  `id_area` INT, -- NULLable: A qué área está asociado este equipo/asignación (si no está ligado a un empleado o ubicación específica de área)
  `fecha_asignacion` DATETIME NOT NULL, -- Cuándo comenzó esta asignación
  `fecha_fin_asignacion` DATETIME, -- NULLable. Cuándo terminó esta asignación (NULL = Asignación Activa)
  `observacion` TEXT,
  `id_status_asignacion` INT NOT NULL DEFAULT 1, -- Estado de la asignación (Activa, Finalizada, Cancelada). Usar IDs de `status`.
  -- Se podría añadir id_usuario_registro para saber quién hizo la asignación
  CONSTRAINT `fk_asignaciones_equipos`
    FOREIGN KEY (`id_equipo`)
    REFERENCES `equipos` (`id`)
    ON DELETE RESTRICT -- No eliminar equipo si tiene asignaciones (históricas o activas)
    ON UPDATE CASCADE,
  CONSTRAINT `fk_asignaciones_empleados`
    FOREIGN KEY (`id_empleado`)
    REFERENCES `empleados` (`id`)
    ON DELETE SET NULL -- Si se elimina un empleado, sus asignaciones quedan pero sin empleado
    ON UPDATE CASCADE,
   CONSTRAINT `fk_asignaciones_ubicaciones_internas`
    FOREIGN KEY (`id_ubicacion_interna`)
    REFERENCES `ubicaciones_internas` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_asignaciones_equipo_padre`
    FOREIGN KEY (`id_equipo_padre`)
    REFERENCES `equipos` (`id`)
    ON DELETE CASCADE -- Si el equipo padre se elimina, esta asignación hijo ya no tiene sentido
    ON UPDATE CASCADE,
  CONSTRAINT `fk_asignaciones_direcciones_ip`
    FOREIGN KEY (`id_ip`)
    REFERENCES `direcciones_ip` (`id`)
    ON DELETE SET NULL -- Si se elimina una IP, la asignación queda pero sin IP
    ON UPDATE CASCADE,
  CONSTRAINT `fk_asignaciones_areas`
    FOREIGN KEY (`id_area`)
    REFERENCES `areas` (`id`)
    ON DELETE SET NULL -- Si se elimina el área, la asignación puede quedar sin área
    ON UPDATE CASCADE,
  CONSTRAINT `fk_asignaciones_status`
    FOREIGN KEY (`id_status_asignacion`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
    -- Añadir un índice para buscar asignaciones activas por equipo
    -- CREATE INDEX idx_equipo_active_assignments ON asignaciones (id_equipo, fecha_fin_asignacion);
    -- Añadir un índice para buscar asignaciones activas por IP (considerar que UNIQUE es para la tabla completa, la validación de unicidad de IP solo para asignaciones activas se haría mejor en la aplicación)
    -- CREATE INDEX idx_ip_active_assignments ON asignaciones (id_ip, fecha_fin_asignacion);
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mantenimientos`
-- Registro de mantenimientos para los equipos
-- -----------------------------------------------------
CREATE TABLE `mantenimientos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_equipo` INT NOT NULL,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE, -- NULLable si el mantenimiento está en curso
  `diagnostico` TEXT,
  `solucion` TEXT,
  `costo` DECIMAL(10, 2), -- Opcional
  `proveedor` VARCHAR(100), -- Opcional
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `id_status` INT NOT NULL DEFAULT 1, -- Estado del mantenimiento (Pendiente, En Curso, Finalizado, Cancelado). Usar IDs de `status`.
  CONSTRAINT `fk_mantenimientos_equipos`
    FOREIGN KEY (`id_equipo`)
    REFERENCES `equipos` (`id`)
    ON DELETE CASCADE -- Si se elimina el equipo, se eliminan sus mantenimientos
    ON UPDATE CASCADE,
  CONSTRAINT `fk_mantenimientos_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `roles`
-- Roles de usuario para el sistema (ej: Admin, Viewer)
-- -----------------------------------------------------
CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_rol` VARCHAR(50) NOT NULL UNIQUE
) ENGINE = InnoDB;

-- Insertar roles iniciales
INSERT INTO `roles` (`id`, `nombre_rol`) VALUES (1, 'Admin'), (2, 'Viewer');


-- -----------------------------------------------------
-- Table `usuarios_sistema`
-- Usuarios que acceden a la aplicación web (incluyendo el admin)
-- Las contraseñas de acceso al sistema NUNCA se guardan en texto plano. Se usa HASHING.
-- -----------------------------------------------------
CREATE TABLE `usuarios_sistema` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) UNIQUE, -- Email para recuperación, notificaciones, etc.
  `password_hash` VARCHAR(255) NOT NULL, -- <-- Aquí se guarda el hash SEGURO de la contraseña de ACCESO AL SISTEMA.
  `id_empleado` INT UNIQUE, -- Opcional: Si el usuario del sistema es también un empleado. UNIQUE asegura 1 usuario de sistema por empleado.
  `id_rol` INT NOT NULL,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_ultimo_login` TIMESTAMP,
  `id_status` INT NOT NULL DEFAULT 1, -- Estado del usuario (Activo, Inactivo, Bloqueado). Usar IDs de `status`.
   CONSTRAINT `fk_usuarios_sistema_empleados`
    FOREIGN KEY (`id_empleado`)
    REFERENCES `empleados` (`id`)
    ON DELETE SET NULL -- Si se elimina un empleado, su cuenta de sistema puede quedar pero sin FK
    ON UPDATE CASCADE,
  CONSTRAINT `fk_usuarios_sistema_roles`
    FOREIGN KEY (`id_rol`)
    REFERENCES `roles` (`id`)
    ON DELETE RESTRICT -- Un usuario debe tener un rol
    ON UPDATE CASCADE,
  CONSTRAINT `fk_usuarios_sistema_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- NOTA IMPORTANTE DE SEGURIDAD:
-- LA CONTRASEÑA DE ACCESO AL SISTEMA SE DEBE HASHEAR USANDO FUNCIONES SEGURAS (ej. bcrypt) ANTES DE GUARDAR.
-- NUNCA GUARDAR EN TEXTO PLANO O CIFRADO REVERSIBLE.


-- -----------------------------------------------------
-- Table `cuentas_email_corporativo`
-- Inventario de cuentas de correo. ¡¡¡RIESGO DE SEGURIDAD CRÍTICO CON LAS CONTRASEÑAS!!!
-- -----------------------------------------------------
CREATE TABLE `cuentas_email_corporativo` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `usuario_email` VARCHAR(100), -- A veces diferente del email (ej: usuario de dominio)
  `password_data` VARCHAR(255), -- <-- AQUÍ VA LA CONTRASEÑA. DEBE SER CIFRADA SI NECESITAS VERLA (ALTO RIESGO).
                                --     CONSIDERA MUY SERIAMENTE NO GUARDARLA O USAR PROCESO DE RESETEO.
                                --     SI LA GUARDAS CIFRADA, NECESITAS GESTIÓN SEGURA DE LA CLAVE DE CIFRADO.
  `servidor_imap_pop3` VARCHAR(100), -- Opcional: Configuración del servidor
  `servidor_smtp` VARCHAR(100),    -- Opcional
  `puerto_imap_pop3` INT,          -- Opcional
  `puerto_smtp` INT,               -- Opcional
  `ssl_tls` BOOLEAN DEFAULT FALSE, -- Opcional
  `id_empleado_asignado` INT, -- A qué empleado está asignada esta cuenta (NULLable si es una cuenta genérica)
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `id_status` INT NOT NULL DEFAULT 1, -- Estado de la cuenta (Activa, Inactiva, Bloqueada). Usar IDs de `status`.
  `observaciones` TEXT,
   CONSTRAINT `fk_cuentas_email_empleados`
    FOREIGN KEY (`id_empleado_asignado`)
    REFERENCES `empleados` (`id`)
    ON DELETE SET NULL -- Si se elimina un empleado, la cuenta de correo queda pero sin asignación
    ON UPDATE CASCADE,
  CONSTRAINT `fk_cuentas_email_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- NOTA IMPORTANTE DE SEGURIDAD:
-- GUARDAR CONTRASEÑAS DE EMAIL ES UN RIESGO MUY ALTO.
-- SI ES INDISPENSABLE PODER RECUPERARLA, DEBE SER CIFRADA USANDO LLAVES FUERTES Y GESTIÓN SEGURA DE LLAVES.
-- EL HASHING (como para las contraseñas de usuarios_sistema) NO FUNCIONA AQUÍ PORQUE ES UNIDIRECCIONAL.
-- CONSIDERA SERIAMENTE IMPLEMENTAR UN PROCESO DE RESETEO DE CONTRASEÑA DE EMAIL EN LUGAR DE RECUPERACIÓN.


-- -----------------------------------------------------
-- Table `notas`
-- Notas generales asociadas a equipos, mantenimientos, etc.
-- -----------------------------------------------------
CREATE TABLE `notas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(100),
  `contenido` TEXT NOT NULL,
  `id_equipo` INT, -- NULLable, puede ser para otra entidad en el futuro
  `id_mantenimiento` INT, -- NULLable
  `id_cuenta_email` INT, -- NULLable, para notas sobre cuentas de correo
  `id_usuario_creacion` INT, -- Quién creó la nota (FK a usuarios_sistema)
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notas_equipos`
    FOREIGN KEY (`id_equipo`)
    REFERENCES `equipos` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
   CONSTRAINT `fk_notas_mantenimientos`
    FOREIGN KEY (`id_mantenimiento`)
    REFERENCES `mantenimientos` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_notas_cuentas_email`
    FOREIGN KEY (`id_cuenta_email`)
    REFERENCES `cuentas_email_corporativo` (`id`)
    ON DELETE CASCADE -- Si se elimina la cuenta, se eliminan sus notas
    ON UPDATE CASCADE,
  CONSTRAINT `fk_notas_usuarios_sistema`
    FOREIGN KEY (`id_usuario_creacion`)
    REFERENCES `usuarios_sistema` (`id`)
    ON DELETE SET NULL -- Si se elimina el usuario de sistema, sus notas quedan pero sin FK
    ON UPDATE CASCADE
) ENGINE = InnoDB;


-- Opcional: Tablas para Permisos si necesitas control de acceso más granular por rol
-- DROP TABLE IF EXISTS `permisos`;
-- CREATE TABLE `permisos` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `nombre_permiso` VARCHAR(100) NOT NULL UNIQUE -- ej: 'read_equipo', 'write_equipo', 'delete_equipo', 'assign_equipo', 'view_email_password' (¡!)
-- );
--
-- DROP TABLE IF EXISTS `rol_permisos`;
-- CREATE TABLE `rol_permisos` (
--   `id_rol` INT NOT NULL,
--   `id_permiso` INT NOT NULL,
--   PRIMARY KEY (`id_rol`, `id_permiso`),
--   CONSTRAINT `fk_rol_permisos_roles` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
--   CONSTRAINT `fk_rol_permisos_permisos` FOREIGN KEY (`id_permiso`) REFERENCES `permisos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
-- );


COMMIT; -- Confirma la transacción si todo fue bien

-- Restaura los modos SQL y checks originales si los había
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;