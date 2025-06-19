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

-- Insertar múltiples empresas en una sola sentencia, todas con id_status 1 (Activo)
INSERT INTO `empresas` (`nombre`,`id_status`) VALUES
    ('Tarjetas Moviles Telefonicas', 1),
    ('Lidifon', 1),
    ('Comercializadora Movil', 1),
    ('TA3', 1);


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


-- Insertar múltiples sucursales en una sola sentencia
INSERT INTO `sucursales` (`nombre`,`direccion`,`numero_telefono`,`id_empresa`,`id_tipo_sucursal`,`id_status`) VALUES
    ('Corporativo Tuxtla', '1a Avenida Norte Poniente #834, Centro, CP 29000, Tuxtla Gutiérrez, Chis.', '9616189200', 1, 1, 1),
    ('Corporativo Tuxtla', '1a Avenida Norte Poniente #834, Centro, CP 29000, Tuxtla Gutiérrez, Chis.', '9616189200', 2, 1, 1),
    ('Corporativo Villahermosa', 'Paseo Tabasco 200, Villahermosa, Tab.', '9626255810', 1, 1, 1),
    ('Corporativo Tapachula', '4a. Av. Nte. 70, Los Naranjos, Centro, 30700 Tapachula, Chis.', '9626255810', 1, 1, 1);


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


-- Insertar múltiples áreas, asignando todas las áreas únicas a cada sucursal
INSERT INTO `areas` (`nombre`,`id_sucursal`,`id_status`) VALUES
    -- Áreas para Sucursal ID 1
    ('ATENCION Y DESARROLLO', 1, 1),
    ('GERENCIA COMERCIAL', 1, 1),
    ('OPERACIONES', 1, 1),
    ('CONTABILIDAD', 1, 1),
    ('RECURSOS HUMANOS', 1, 1),
    ('DIRECCION GENERAL', 1, 1),
    ('TIENDAS PROPIAS', 1, 1),
    ('CADENAS COMERCIALES', 1, 1),
    ('TAE', 1, 1),
    ('INFORMATICA', 1, 1),
    ('COMERCIAL AMIGO PAY', 1, 1),

    -- Áreas para Sucursal ID 2
    ('ATENCION Y DESARROLLO', 2, 1),
    ('GERENCIA COMERCIAL', 2, 1),
    ('OPERACIONES', 2, 1),
    ('CONTABILIDAD', 2, 1),
    ('RECURSOS HUMANOS', 2, 1),
    ('DIRECCION GENERAL', 2, 1),
    ('TIENDAS PROPIAS', 2, 1),
    ('CADENAS COMERCIALES', 2, 1),
    ('TAE', 2, 1),
    ('INFORMATICA', 2, 1),
    ('COMERCIAL AMIGO PAY', 2, 1),

    -- Áreas para Sucursal ID 3
    ('ATENCION Y DESARROLLO', 3, 1),
    ('GERENCIA COMERCIAL', 3, 1),
    ('OPERACIONES', 3, 1),
    ('CONTABILIDAD', 3, 1),
    ('RECURSOS HUMANOS', 3, 1),
    ('DIRECCION GENERAL', 3, 1),
    ('TIENDAS PROPIAS', 3, 1),
    ('CADENAS COMERCIALES', 3, 1),
    ('TAE', 3, 1),
    ('INFORMATICA', 3, 1),
    ('COMERCIAL AMIGO PAY', 3, 1),

    -- Áreas para Sucursal ID 4
    ('ATENCION Y DESARROLLO', 4, 1),
    ('GERENCIA COMERCIAL', 4, 1),
    ('OPERACIONES', 4, 1),
    ('CONTABILIDAD', 4, 1),
    ('RECURSOS HUMANOS', 4, 1),
    ('DIRECCION GENERAL', 4, 1),
    ('TIENDAS PROPIAS', 4, 1),
    ('CADENAS COMERCIALES', 4, 1),
    ('TAE', 4, 1),
    ('INFORMATICA', 4, 1),
    ('COMERCIAL AMIGO PAY', 4, 1);

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
  `id_empresa` INT,
  `id_sucursal` INT, -- Sigue apuntando a Sucursal (base física o corporativa)
  `id_area` INT, -- Sigue apuntando a Area (dentro de sucursal corporativa)
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `id_status` INT NOT NULL DEFAULT 1,
  CONSTRAINT `fk_empleados_empresas`
    FOREIGN KEY (`id_empresa`)
    REFERENCES `empresas` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
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

INSERT INTO `empleados` (
    `numero_empleado`,
    `nombres`,
    `apellidos`,
    `email_personal`,
    `telefono`,
    `puesto`,
    `fecha_nacimiento`,
    `fecha_ingreso`,
    `id_empresa`,
    `id_sucursal`,
    `id_area`,
    `id_status`
) VALUES
    -- EMPLEADOS DE TARJETAS MOVILES TELEFONICAS (ID_EMPRESA = 1)
    ('21', 'JOSE ALFREDO', 'ALCALA CARDONA', 'jose_alcala@linea-digital.com', NULL, 'GERENTE DE ATENCION Y DESARROLLO', NULL, '2008-08-01', 1, 1, 1, 1),
    ('60', 'GLORIA DE JESUS', 'ALVAREZ VAZQUEZ', NULL, NULL, 'ANALISTA DE MESA DE CONTROL', NULL, '2013-09-03', 1, 1, 2, 1),
    ('24', 'BEATRIZ', 'ARRIAGA RAMIREZ', 'beatriz_arriaga@linea-digital.com', NULL, 'JEFE DE MESA DE CONTROL', NULL, '2004-03-01', 1, 1, 3, 1),
    ('2', 'SERGIO OMAR', 'AVENDAÑO AQUINO', 'omar_avendano@linea-digital.com', NULL, 'GERENTE DE TI', NULL, '2004-01-06', 1, 1, 10, 1),
    ('912', 'JORGE VIDAL', 'AVENDAñO PEREZ', NULL, NULL, 'AUXILIAR DE AUDITORIA', NULL, '2023-10-30', 1, 4, 37, 1),
    ('711', 'ISRAEL', 'BELTRAN NATURI', 'egresos@linea-digital.com', NULL, 'AUXILIAR CONTABLE', NULL, '2021-06-16', 1, 1, 4, 1),
    ('598', 'HAROLD ABRAHAM', 'BONILLA ACOSTA', 'publicidad@linea-digital.com', NULL, 'DISEÑADOR GRAFICO', NULL, '2018-07-16', 1, 1, 8, 1),
    ('153', 'ALEXIS', 'CAMAS ROBLES', 'alexis_camas@linea-digital.com', NULL, 'SUPERVISOR DE VENTAS', NULL, '2012-08-24', 1, 1, 2, 1),
    ('402', 'MAURICIO ALEJANDRO', 'CHANDOMI QUINTERO', NULL, NULL, 'AUXILIAR DE ALMACEN', NULL, '2016-02-05', 1, 1, 4, 1),
    ('54', 'EDUARDO MARTIN', 'CHANONA MAZA', NULL, NULL, 'SEGURIDAD', NULL, '2007-11-20', 1, 1, 3, 1), -- Mapeado a Operaciones
    ('871', 'JUAN DE JESUS', 'COLMENARES LOPEZ', NULL, NULL, 'AUXILIAR DE ALMACEN', NULL, '2023-05-04', 1, 1, 3, 1), -- Mapeado a Operaciones
    ('677', 'JOSE MANUEL', 'CRUZ OROZCO', NULL, NULL, 'SUPERVISOR DE VENTAS', NULL, '2020-02-18', 1, 4, 40, 1),
    ('39', 'ROBERTO', 'CUEVAS PEREZ', NULL, NULL, 'DIRECTOR COMERCIAL', NULL, '2004-08-01', 1, 1, 2, 1),
    ('43', 'MARIA DEL CARMEN', 'DE LA CRUZ VELAZQUEZ', NULL, NULL, 'JEFE ADMINISTRATIVO', NULL, '2005-06-01', 1, 1, 6, 1), -- Mapeado a Dirección General
    ('5', 'SERGIO', 'DEL ANGEL ZAMORA', 'sergiodelangel@linea-digital.com', NULL, 'DISEÑADOR GRAFICO', NULL, '2021-03-16', 1, 1, 2, 1),
    ('960', 'GABRIEL LEONARDO', 'DOMINGUEZ ESPINOSA', 'garantias@linea-digital.com', NULL, 'ANALISTA', NULL, '2024-04-13', 1, 1, 1, 1),
    ('832', 'FRANCISCO JAVIER', 'DOMINGUEZ MATEOS', NULL, NULL, 'AUXILIAR DE ALMACEN', NULL, '2022-08-08', 1, 4, 36, 1), -- Mapeado a Operaciones
    ('984', 'DULCE FATIMA', 'ESPINOSA GOMEZ', 'bolsa_trabajo1@linea-digital.com', NULL, 'AUXILIAR ADMINISTRATIVO', NULL, '2024-08-03', 1, 1, 5, 1),
    ('939', 'JOSE EDUARDO', 'FLORES GOMEZ', NULL, NULL, 'AUXILIAR CONTABLE', NULL, '2024-02-13', 1, 4, 37, 1),
    ('1042', 'SINDY JARET', 'FONSECA AMBROCIO', 'cajaprincipaltuxtla@linea-digital.com', NULL, 'RESPONSABLE DE CAJA', NULL, '2025-04-24', 1, 1, 4, 1),
    ('998', 'DANIELA', 'GOMEZ ALFARO', NULL, NULL, 'AUXILIAR DE MESA DE CONTROL', NULL, '2024-11-12', 1, 1, 8, 1),
    ('703', 'ADALBERTO', 'GONZALEZ LOPEZ', 'adalberto_gonzalez@linea-digital.com', NULL, 'GERENTE DE CONTABILIDAD', NULL, '2021-03-16', 1, 1, 4, 1),
    ('903', 'ISAAC ABINADI', 'HERNANDEZ ESPINOSA', NULL, NULL, 'AUXILIAR DE ALMACEN', NULL, '2023-09-29', 1, 1, 3, 1), -- Mapeado a Operaciones
    ('87', 'IRIS MARLIT', 'HERNANDEZ LIEVANO', NULL, NULL, 'SUPERVISOR DE VENTAS', NULL, '2025-03-18', 1, 1, 2, 1),
    ('1034', 'MARCIAL PAUL', 'HERNANDEZ RASGADO', NULL, NULL, 'AUXILIAR DE ALMACEN', NULL, '2025-03-25', 1, 4, 36, 1), -- Mapeado a Operaciones
    ('67', 'ROCIO', 'JIMENEZ ALEGRIA', 'facturas_proveedores@linea-digital.com', NULL, 'ASISTENTE', NULL, '2013-09-19', 1, 1, 4, 1),
    ('902', 'CRISTIAN ROMEO', 'MACAL INFANZON', NULL, NULL, 'EJECUTIVO DE ATENCION Y DESARROLLO DE ASOCIADOS', NULL, '2023-09-29', 1, 1, 1, 1),
    ('42', 'GUADALUPE', 'MACIAS VELAZQUEZ', 'gmacias@linea-digital.com', NULL, 'JEFE ADMINISTRATIVO', NULL, '2002-07-01', 1, 1, 6, 1),
    ('317', 'ERICK ROMEO', 'MARTINEZ CORDOVA', NULL, NULL, 'GERENTE DE ATENCION Y DESARROLLO', NULL, '2015-02-17', 1, 4, 34, 1),
    ('119', 'AMIR', 'MARTINEZ JIMENEZ', NULL, NULL, 'AUXILIAR DE AUDITORIA', NULL, '2024-12-18', 1, 1, 4, 1),
    ('1050', 'LUIS FERNANDO', 'MEGCHUN ANTONIO', NULL, NULL, 'EJECUTIVO DE ATENCION Y DESARROLLO DE ASOCIADOS', NULL, '2025-05-19', 1, 1, 1, 1),
    ('94', 'JOSE ALBERTO', 'MEJIA AQUINO', NULL, NULL, 'VENDEDOR DE PLANES TARIFARIOS', NULL, '2013-05-25', 1, 1, 2, 1),
    ('571', 'LUIS ENRIQUE', 'MENCHU SANTIAGO', NULL, NULL, 'ANALISTA DE ATENCION Y DESARROLLO', NULL, '2018-02-16', 1, 4, 34, 1),
    ('75', 'EUDELIA', 'MIGUEL VAZQUEZ', NULL, NULL, 'LIMPIEZA', NULL, '2012-05-02', 1, 4, 36, 1), -- Mapeado a Operaciones
    ('943', 'JOSE MANUEL', 'MORALES HERNANDEZ', NULL, NULL, 'RESPONSABLE DE NOMINA', NULL, '2024-02-20', 1, 1, 4, 1),
    ('611', 'LUIS MANUEL', 'MORALES MANDUJANO', NULL, NULL, 'EJECUTIVO DE RENOVACIONES DE PLANES TARIFARIOS', NULL, '2020-03-02', 1, 1, 2, 1),
    ('985', 'YADIRA', 'MUÑOZ LEPE', NULL, NULL, 'AUXILIAR CONTABLE', NULL, '2024-08-09', 1, 1, 4, 1),
    ('0', 'BRENDA NORELY', 'NUÑEZ GOMEZ', NULL, NULL, 'AUXILIAR ADMINISTRATIVO', NULL, '2025-05-14', 1, 1, 5, 1), -- Mapeado a Recursos Humanos
    ('274', 'MANUEL DE JESUS', 'OCAñA PEREZ', NULL, NULL, 'EJECUTIVO DE ATENCION Y DESARROLLO DE ASOCIADOS', NULL, '2014-08-01', 1, 1, 1, 1),
    ('144', 'CECIL', 'OCHOA MARROQUIN', NULL, NULL, 'ANALISTA', NULL, '2007-06-06', 1, 1, 10, 1),
    ('716', 'ANGELITA', 'PALOMEQUE HERNANDEZ', NULL, NULL, 'JEFE ADMINISTRATIVO', NULL, '2004-03-16', 1, 4, 39, 1), -- Mapeado a Dirección General
    ('107', 'SANDRA', 'PEREZ BARTOLON', NULL, NULL, 'AUXILIAR CONTABLE', NULL, '2018-08-01', 1, 4, 37, 1),
    ('982', 'JORGE IVAN', 'REYES ALVARADO', NULL, NULL, 'AUXILIAR DE ALMACEN', NULL, '2024-07-22', 1, 1, 3, 1), -- Mapeado a Operaciones
    ('177', 'MARIANO GUSTAVO', 'RINCON SANCHEZ', NULL, NULL, 'ANALISTA', NULL, '2014-03-18', 1, 1, 2, 1), -- Mapeado a Gerencia Comercial
    ('841', 'WILLIAM IVAN', 'ROBLERO GONZALEZ', NULL, NULL, 'EJECUTIVO DE ATENCION Y DESARROLLO DE ASOCIADOS', NULL, '2022-09-22', 1, 4, 34, 1),
    ('765', 'CARLOS ALBERTO', 'RODRIGUEZ JIMENEZ', NULL, NULL, 'AUXILIAR CONTABLE', NULL, '2021-12-20', 1, 1, 4, 1),
    ('110', 'JOSE ANGEL', 'RODRIGUEZ MARTINEZ', NULL, NULL, 'CHOFER', NULL, '2016-04-16', 1, 1, 3, 1), -- Mapeado a Operaciones
    ('68', 'MARIA DEL ROSARIO', 'ROSALES MENDEZ', NULL, NULL, 'EJECUTIVO DE RENOVACIONES DE PLANES TARIFARIOS', NULL, '2013-09-19', 1, 1, 2, 1),
    ('1', 'RAFAEL OCTAVIO', 'RUIZ LOPEZ', NULL, NULL, 'DIRECTOR GENERAL', NULL, '2007-06-11', 1, 1, 6, 1),
    ('699', 'SERGIO DE JESUS', 'RUIZ LOPEZ', NULL, NULL, 'JEFE ADMINISTRATIVO', NULL, '2021-01-16', 1, 1, 6, 1),
    ('18', 'OSMAR YONATAN', 'RUIZ MOLINA', NULL, NULL, 'EJECUTIVO DE OPERACIONES', NULL, '2004-08-01', 1, 1, 3, 1),
    ('1A', 'RAFAEL ABRAHAM', 'RUIZ REYES', 'abrahamruizld@gmail.com', NULL, 'DIRECTOR GENERAL', NULL, '2018-10-25', 1, 1, 6, 1),
    ('1045', 'EBERTO DARINEL', 'SANCHEZ GAMBOA', NULL, NULL, 'AUXILIAR DE AUDITORIA', NULL, '2025-05-06', 1, 4, 37, 1),
    ('983', 'VICTOR HUGO', 'SANTIAGO ALVAREZ', NULL, NULL, 'EJECUTIVO DE ATENCION Y DESARROLLO DE ASOCIADOS', NULL, '2024-07-22', 1, 1, 1, 1),
    ('669', 'DANIEL ALEJANDRO', 'TELLO SANTIAGO', NULL, NULL, 'CONTROL DE BANCOS', NULL, '2019-12-17', 1, 1, 4, 1),
    ('742', 'CITLALLI GUADALUPE', 'TOLEDO DE LEON', NULL, NULL, 'AUXILIAR CONTABLE', NULL, '2021-10-01', 1, 1, 4, 1),
    ('917', 'ANDREA MERARI', 'URBINA PEREZ', 'recursos_humanos@linea-digital.com', NULL, 'GERENTE DE RECURSOS HUMANOS', NULL, '2023-11-10', 1, 1, 5, 1),
    ('163', 'JULIO CESAR', 'VAZQUEZ JUAREZ', NULL, NULL, 'ANALISTA', NULL, '2012-11-20', 1, 1, 3, 1), -- Mapeado a Operaciones
    ('972', 'HERWING EDUARDO', 'VAZQUEZ MACIAS', NULL, NULL, 'SOPORTE TECNICO', NULL, '2024-06-03', 1, 1, 10, 1),
    ('83', 'LUIS FELIPE', 'VIDRIOS LOPEZ', NULL, NULL, 'SUPERVISOR DE EJECUTIVOS', NULL, '2013-03-11', 1, 1, 1, 1),
    ('1047', 'BLANCA DEL ROCIO', 'VILLAFUERTE GOMEZ', NULL, NULL, 'RECEPCIONISTA', NULL, '2025-05-09', 1, 1, 5, 1), -- Mapeado a Recursos Humanos
    ('770', 'FRANCISCO', 'VILLALOBOS RUIZ', NULL, NULL, 'EJECUTIVO DE ATENCION Y DESARROLLO DE ASOCIADOS', NULL, '2022-01-10', 1, 4, 34, 1),
    ('55', 'CARLOS ALBERTO', 'ZAVALETA ORNELAS', NULL, NULL, 'COORDINADOR AMIGO PAY', NULL, '2015-03-06', 1, 1, 11, 1),

    -- EMPLEADOS DE LIDIFON (ID_EMPRESA = 2)
    ('973', 'BRIAN MOISES', 'GUTIERREZ OCAMPO', NULL, NULL, 'AUXILIAR DE ALMACEN', NULL, '2024-06-01', 2, 2, 14, 1), -- Mapeado a Operaciones
    ('796', 'GABRIELA GUADALUPE', 'HERNANDEZ PEREZ', NULL, NULL, 'AUXILIAR CONTABLE', NULL, '2022-05-10', 2, 2, 15, 1),
    ('951', 'GABRIELA GUADALUPE', 'HERNANDEZ ZOMA', 'recursos_humanos@lidifon.com', NULL, 'GERENTE DE RECURSOS HUMANOS', NULL, '2024-03-07', 2, 2, 16, 1),
    ('158', 'ROBERTO', 'MARROQUIN OCHOA', NULL, NULL, 'JEFE DE VENTAS', NULL, '2012-09-24', 2, 2, 18, 1),
    ('803', 'MARLONN ALEXANDRO', 'MOLINA HERNANDEZ', NULL, NULL, 'GERENTE DE CONTABILIDAD', NULL, '2022-05-16', 2, 2, 15, 1),
    ('1525', 'ROBERTO ANTONIO', 'PEREZ FLORES', NULL, NULL, 'SUPERVISOR DE VENTAS', NULL, '2024-10-19', 2, 2, 18, 1),
    ('1040', 'JOEL', 'RINCON LOPEZ', NULL, NULL, 'ENCARGADO DE CONTROL INTERNO', NULL, '2025-01-03', 2, 2, 14, 1), -- Mapeado a Operaciones
    ('61', 'WINFIELD OCTAVIO', 'ROQUE RUIZ', NULL, NULL, 'COORDINADOR AMIGO PAY', NULL, '2018-11-20', 2, 2, 22, 1),
    ('20', 'DANIEL', 'ROVELO ROJAS', NULL, NULL, 'GERENTE', NULL, '2007-02-23', 2, 2, 17, 1), -- Mapeado a Dirección General
    ('443', 'JONATHAN DAMIAN', 'RUIZ MARTINEZ', NULL, NULL, 'SUPERVISOR DE VENTAS', NULL, '2016-06-24', 2, 2, 18, 1),
    ('787', 'OCTAVIO ANDRES', 'RUIZ REYES', 'octavioruiz197@gmail.com', NULL, 'DIRECTOR GENERAL', NULL, '2019-10-16', 2, 2, 17, 1),
    ('159', 'EZEQUIEL ALEJANDRO', 'RUSTRIAN LOPEZ', NULL, NULL, 'JEFE DE ALMACEN', NULL, '2012-10-03', 2, 2, 14, 1);

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
  `id_equipo` INT NOT NULL, -- El equipo que está siendo asignado
  `id_empleado` INT, -- NULLable: Si el equipo está asignado a una persona
  `id_sucursal_asignado` INT, -- NULLable: Asignado a una sucursal (ej. stock en tienda)
  `id_area_asignado` INT, -- NULLable: Asignado a un área (en corporativo)
  `id_equipo_padre` INT, -- NULLable: Componente de otro equipo
  `id_ip` INT UNIQUE, -- NULLable: IP principal asociada (UNIQUE en TODA la tabla por defecto, pero la regla es UNIQUE ACTIVA)
  `fecha_asignacion` DATETIME NOT NULL,
  `fecha_fin_asignacion` DATETIME, -- NULL = Asignación Activa
  `observacion` TEXT,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
