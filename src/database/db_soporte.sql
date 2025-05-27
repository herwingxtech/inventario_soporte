-- -----------------------------------------------------
-- Generado con tu experto guía para tu inventario :)
-- Adaptado para manejar tipos de sucursal y eliminar ubicaciones internas.
-- Asegúrate de usar una base de datos limpia o nueva.
-- -----------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */;

-- -----------------------------------------------------
-- Schema inventario_soporte
-- Puedes crear un esquema/base de datos específico antes de ejecutar este script
DROP SCHEMA IF EXISTS `inventario_soporte`; -- Descomentar si quieres eliminar la DB existente
CREATE SCHEMA IF NOT EXISTS `inventario_soporte` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
USE `inventario_soporte` ;
-- -----------------------------------------------------

-- Inicia una transacción
START TRANSACTION;

-- Drop tables in reverse order of dependencies
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
-- Eliminamos ubicaciones_internas como solicitado
-- DROP TABLE IF EXISTS `ubicaciones_internas`; -- Esta tabla ya no existe
DROP TABLE IF EXISTS `areas`; -- Áreas ahora dependen de Sucursales, así que se dropea antes que Sucursales
DROP TABLE IF EXISTS `sucursales`;
-- Nueva tabla para tipos de sucursal, dropear antes de sucursales
DROP TABLE IF EXISTS `tipos_sucursal`;
DROP TABLE IF EXISTS `empresas`;
DROP TABLE IF EXISTS `status`;


-- -----------------------------------------------------
-- Table `status`
-- Catálogo de estados posibles
-- Añadimos fecha_actualizacion
-- -----------------------------------------------------
CREATE TABLE `status` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_status` VARCHAR(50) NOT NULL UNIQUE,
  `descripcion` VARCHAR(255),
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Añadido
) ENGINE = InnoDB;

-- Insertar estados iniciales
INSERT INTO `status` (`id`, `nombre_status`) VALUES
(1, 'Activo'), (2, 'Inactivo'), (3, 'En Mantenimiento'), (4, 'Asignado'),
(5, 'Disponible'), (6, 'Finalizado'), (7, 'Cancelado'), (8, 'Reservada'),
(9, 'Baja'), (10, 'Pendiente'), (11, 'En Curso'), (12, 'Bloqueado');


-- -----------------------------------------------------
-- Table `empresas`
-- Las dos empresas principales
-- Añadimos fecha_actualizacion
-- -----------------------------------------------------
CREATE TABLE `empresas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL UNIQUE,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Añadido
  `id_status` INT NOT NULL DEFAULT 1,
  CONSTRAINT `fk_empresas_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `tipos_sucursal`
-- Nueva tabla para diferenciar tipos de sucursales (Corporativo, Tienda)
-- -----------------------------------------------------
CREATE TABLE `tipos_sucursal` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_tipo` VARCHAR(50) NOT NULL UNIQUE, -- ej: 'Corporativo', 'Tienda'
  `descripcion` VARCHAR(255)
) ENGINE = InnoDB;

-- Insertar tipos de sucursal iniciales (asegúrate que los IDs coincidan si son referenciados)
-- 1: Corporativo, 2: Tienda
INSERT INTO `tipos_sucursal` (`id`, `nombre_tipo`) VALUES
(1, 'Corporativo'), (2, 'Tienda');


-- -----------------------------------------------------
-- Table `sucursales`
-- Tiendas y ubicaciones físicas, asociadas a una empresa
-- Añadimos id_tipo_sucursal y fecha_actualizacion
-- -----------------------------------------------------
CREATE TABLE `sucursales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `direccion` VARCHAR(255),
  `numero_telefono` VARCHAR(20),
  `id_empresa` INT NOT NULL,
  `id_tipo_sucursal` INT NOT NULL, -- Añadido FK a tipos_sucursal
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Añadido
  `id_status` INT NOT NULL DEFAULT 1,
  CONSTRAINT `uq_sucursal_nombre_empresa` UNIQUE (`nombre`, `id_empresa`),
  CONSTRAINT `fk_sucursales_empresas`
    FOREIGN KEY (`id_empresa`)
    REFERENCES `empresas` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_sucursales_tipos_sucursal` -- Nueva FK
    FOREIGN KEY (`id_tipo_sucursal`)
    REFERENCES `tipos_sucursal` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_sucursales_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Eliminamos ubicaciones_internas por solicitud
-- DROP TABLE IF EXISTS `ubicaciones_internas`;


-- -----------------------------------------------------
-- Table `areas`
-- Departamentos o áreas, ahora dentro de las SUCURSALES (especialmente corporativas)
-- Cambiamos id_empresa por id_sucursal y añadimos fecha_actualizacion
-- -----------------------------------------------------
CREATE TABLE `areas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `id_sucursal` INT NOT NULL, -- CAMBIADO de id_empresa a id_sucursal
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Añadido
  `id_status` INT NOT NULL DEFAULT 1,
  CONSTRAINT `uq_area_nombre_sucursal` UNIQUE (`nombre`, `id_sucursal`), -- UNIQUE constraint actualizado
  CONSTRAINT `fk_areas_sucursales` -- Nueva FK a sucursales
    FOREIGN KEY (`id_sucursal`)
    REFERENCES `sucursales` (`id`)
    ON DELETE CASCADE -- Si se elimina la sucursal, eliminar sus áreas
    ON UPDATE CASCADE,
  CONSTRAINT `fk_areas_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `empleados`
-- Información de los empleados
-- fecha_actualizacion ya existía
-- -----------------------------------------------------
CREATE TABLE `empleados` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `numero_empleado` VARCHAR(50) UNIQUE,
  `nombres` VARCHAR(100) NOT NULL,
  `apellidos` VARCHAR(100) NOT NULL,
  `email_personal` VARCHAR(100),
  `telefono` VARCHAR(20),
  `puesto` VARCHAR(100),
  `fecha_nacimiento` DATE,
  `fecha_ingreso` DATE,
  `id_sucursal` INT, -- Sigue apuntando a Sucursal (base física o corporativa)
  `id_area` INT, -- Sigue apuntando a Area (dentro de sucursal corporativa)
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `id_status` INT NOT NULL DEFAULT 1,
  CONSTRAINT `fk_empleados_sucursales`
    FOREIGN KEY (`id_sucursal`)
    REFERENCES `sucursales` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_empleados_areas` -- Ahora apunta a la nueva tabla areas (ligada a sucursal)
    FOREIGN KEY (`id_area`)
    REFERENCES `areas` (`id`)
    ON DELETE SET NULL
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
-- Añadimos fecha_actualizacion
-- -----------------------------------------------------
CREATE TABLE `tipos_equipo` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_tipo` VARCHAR(100) NOT NULL UNIQUE,
  `descripcion` TEXT,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Añadido
) ENGINE = InnoDB;

-- Insertar tipos de equipo iniciales (ejemplos)
INSERT INTO `tipos_equipo` (`id`, `nombre_tipo`) VALUES
(1, 'Computadora'), (2, 'Laptop'), (3, 'Monitor'), (4, 'Teclado'), (5, 'Mouse'),
(6, 'Impresora'), (7, 'Scanner'), (8, 'Router'), (9, 'Switch'), (10, 'Access Point'),
(11, 'Cámara IP'), (12, 'Terminal de Cobro'), (13, 'Servidor'), (14, 'Disco Duro Externo'),
(15, 'Webcam'), (16, 'Proyector'), (17, 'Firewall'), (18, 'NAS');


-- -----------------------------------------------------
-- Table `equipos`
-- Tabla unificada para todos los ítems de inventario
-- Eliminamos id_ubicacion_interna_actual, fecha_actualizacion ya existía
-- -----------------------------------------------------
CREATE TABLE `equipos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `numero_serie` VARCHAR(100) UNIQUE NOT NULL,
  `nombre_equipo` VARCHAR(100),
  `marca` VARCHAR(100),
  `modelo` VARCHAR(100),
  `id_tipo_equipo` INT NOT NULL,
  `id_sucursal_actual` INT NOT NULL, -- La sucursal donde está físicamente
  -- Eliminamos id_ubicacion_interna_actual
  `procesador` VARCHAR(100),
  `ram` VARCHAR(50),
  `disco_duro` VARCHAR(50),
  `sistema_operativo` VARCHAR(100),
  `mac_address` VARCHAR(20) UNIQUE,
  `otras_caracteristicas` TEXT,
  `fecha_compra` DATE,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ya existía
  `id_status` INT NOT NULL DEFAULT 1,
  CONSTRAINT `fk_equipos_tipos_equipo`
    FOREIGN KEY (`id_tipo_equipo`)
    REFERENCES `tipos_equipo` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_equipos_sucursales`
    FOREIGN KEY (`id_sucursal_actual`)
    REFERENCES `sucursales` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  -- Eliminamos fk_equipos_ubicaciones_internas
  CONSTRAINT `fk_equipos_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `direcciones_ip`
-- Gestión de direcciones IP
-- Eliminamos id_ubicacion_interna, fecha_actualizacion ya existía
-- -----------------------------------------------------
CREATE TABLE `direcciones_ip` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `direccion_ip` VARCHAR(45) NOT NULL UNIQUE,
  `id_sucursal` INT, -- Sigue apuntando a Sucursal (donde reside la red/IP)
  -- Eliminamos id_ubicacion_interna
  `comentario` TEXT,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ya existía
  `id_status` INT NOT NULL DEFAULT 1,
   CONSTRAINT `fk_direcciones_ip_sucursales`
    FOREIGN KEY (`id_sucursal`)
    REFERENCES `sucursales` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  -- Eliminamos fk_direcciones_ip_ubicaciones_internas
  CONSTRAINT `fk_direcciones_ip_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `asignaciones`
-- Historial y estado actual de a quién/dónde/con qué IP/conectado a qué está un equipo
-- Modificamos para asignar a Sucursal o Area, eliminamos id_ubicacion_interna, añadimos fecha_actualizacion
-- -----------------------------------------------------
CREATE TABLE `asignaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_equipo` INT NOT NULL,
  `id_empleado` INT, -- Asignado a una persona
  -- Eliminamos id_ubicacion_interna
  `id_sucursal_asignado` INT, -- Añadido: Asignado directamente a una sucursal (e.g., stock en tienda)
  `id_area_asignado` INT, -- CAMBIADO de id_area a id_area_asignado y FK a la nueva tabla areas (ligada a sucursal)
  `id_equipo_padre` INT,
  `id_ip` INT UNIQUE,
  -- Eliminamos id_area (preferimos id_area_asignado para mayor claridad en la asignación)
  `fecha_asignacion` DATETIME NOT NULL,
  `fecha_fin_asignacion` DATETIME,
  `observacion` TEXT,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Añadido
  `id_status_asignacion` INT NOT NULL DEFAULT 1,
  -- NOTA: La validación de que SOLO se puede llenar id_sucursal_asignado o id_area_asignado
  -- (y las reglas sobre tipos de sucursal) DEBE hacerse en el código del backend,
  -- ya que MySQL no tiene constraints CHECK que soporten esta lógica fácilmente.
  CONSTRAINT `fk_asignaciones_equipos`
    FOREIGN KEY (`id_equipo`)
    REFERENCES `equipos` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_asignaciones_empleados`
    FOREIGN KEY (`id_empleado`)
    REFERENCES `empleados` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
   -- Eliminamos fk_asignaciones_ubicaciones_internas
   CONSTRAINT `fk_asignaciones_sucursal_asignado` -- Nueva FK
    FOREIGN KEY (`id_sucursal_asignado`)
    REFERENCES `sucursales` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
   CONSTRAINT `fk_asignaciones_area_asignado` -- Nueva FK
    FOREIGN KEY (`id_area_asignado`)
    REFERENCES `areas` (`id`)
    ON DELETE SET NULL -- Si se elimina el área, la asignación queda sin área
    ON UPDATE CASCADE,
  CONSTRAINT `fk_asignaciones_equipo_padre`
    FOREIGN KEY (`id_equipo_padre`)
    REFERENCES `equipos` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_asignaciones_direcciones_ip`
    FOREIGN KEY (`id_ip`)
    REFERENCES `direcciones_ip` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  -- Eliminamos fk_asignaciones_areas (redundante con id_area_asignado)
  CONSTRAINT `fk_asignaciones_status`
    FOREIGN KEY (`id_status_asignacion`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
    -- Índices (opcional, para optimización)
    -- CREATE INDEX idx_equipo_active_assignments ON asignaciones (id_equipo, fecha_fin_asignacion);
    -- CREATE INDEX idx_ip_active_assignments ON asignaciones (id_ip, fecha_fin_asignacion);
    -- CREATE INDEX idx_sucursal_area_assignments ON asignaciones (id_sucursal_asignado, id_area_asignado);
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mantenimientos`
-- Registro de mantenimientos para los equipos
-- Añadimos fecha_actualizacion
-- -----------------------------------------------------
CREATE TABLE `mantenimientos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_equipo` INT NOT NULL,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE,
  `diagnostico` TEXT,
  `solucion` TEXT,
  `costo` DECIMAL(10, 2),
  `proveedor` VARCHAR(100),
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Añadido
  `id_status` INT NOT NULL DEFAULT 1,
  CONSTRAINT `fk_mantenimientos_equipos`
    FOREIGN KEY (`id_equipo`)
    REFERENCES `equipos` (`id`)
    ON DELETE CASCADE
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
-- Añadimos fecha_actualizacion (opcional, rara vez se actualiza)
-- -----------------------------------------------------
CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_rol` VARCHAR(50) NOT NULL UNIQUE,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
) ENGINE = InnoDB;

-- Insertar roles iniciales
INSERT INTO `roles` (`id`, `nombre_rol`) VALUES (1, 'Admin'), (2, 'Viewer');


-- -----------------------------------------------------
-- Table `usuarios_sistema`
-- Usuarios que acceden a la aplicación web (incluyendo el admin)
-- fecha_actualizacion ya existía
-- -----------------------------------------------------
CREATE TABLE `usuarios_sistema` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `id_empleado` INT UNIQUE,
  `id_rol` INT NOT NULL,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_ultimo_login` TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ya existía
  `id_status` INT NOT NULL DEFAULT 1,
   CONSTRAINT `fk_usuarios_sistema_empleados`
    FOREIGN KEY (`id_empleado`)
    REFERENCES `empleados` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_usuarios_sistema_roles`
    FOREIGN KEY (`id_rol`)
    REFERENCES `roles` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_usuarios_sistema_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cuentas_email_corporativo`
-- Inventario de cuentas de correo.
-- fecha_actualizacion ya existía
-- -----------------------------------------------------
CREATE TABLE `cuentas_email_corporativo` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `usuario_email` VARCHAR(100),
  `password_data` VARCHAR(255),
  `id_empleado_asignado` INT,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ya existía
  `id_status` INT NOT NULL DEFAULT 1,
  `observaciones` TEXT,
   CONSTRAINT `fk_cuentas_email_empleados`
    FOREIGN KEY (`id_empleado_asignado`)
    REFERENCES `empleados` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_cuentas_email_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `notas`
-- Notas generales asociadas a equipos, mantenimientos, etc.
-- Añadimos fecha_actualizacion
-- -----------------------------------------------------
CREATE TABLE `notas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(100),
  `contenido` TEXT NOT NULL,
  `id_equipo` INT,
  `id_mantenimiento` INT,
  `id_cuenta_email` INT,
  `id_usuario_creacion` INT,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Añadido
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
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_notas_usuarios_sistema`
    FOREIGN KEY (`id_usuario_creacion`)
    REFERENCES `usuarios_sistema` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Optional: Tablas para Permisos si necesitas control de acceso más granular por rol
-- DROP TABLE IF EXISTS `permisos`;
-- CREATE TABLE `permisos` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `nombre_permiso` VARCHAR(100) NOT NULL UNIQUE -- ej: 'read_equipo', 'write_equipo', etc.
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

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;