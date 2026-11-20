-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generacion: 20-11-2026 a las 04:46:03
-- Version del servidor: 10.4.32-MariaDB
-- Version de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sigse`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categories`
--

CREATE TABLE `categories` (
  `id` int(10) UNSIGNED NOT NULL COMMENT 'Identificador',
  `name` varchar(100) NOT NULL COMMENT 'Nombre de la categoria',
  `description` varchar(255) DEFAULT NULL COMMENT 'Descripcion',
  `color` char(7) DEFAULT NULL COMMENT 'Color hex para UI (#RRGGBB)',
  `icon` varchar(50) DEFAULT NULL COMMENT 'Nombre de icono Material',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Disponible para nuevas inspecciones',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Auditoria',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Auditoria'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `evidences`
--

CREATE TABLE `evidences` (
  `id` bigint(20) UNSIGNED NOT NULL COMMENT 'Identificador',
  `inspection_id` bigint(20) UNSIGNED NOT NULL COMMENT 'Inspeccion',
  `uploaded_by` bigint(20) UNSIGNED NOT NULL COMMENT 'Autor de la carga',
  `type` enum('foto','documento') NOT NULL COMMENT 'Tipo',
  `file_path` varchar(500) NOT NULL COMMENT 'Ruta relativa /uploads/...',
  `original_name` varchar(255) NOT NULL COMMENT '	Nombre original',
  `mime_type` varchar(100) NOT NULL COMMENT 'MIME validado',
  `size_bytes` int(10) UNSIGNED NOT NULL COMMENT 'Tamano',
  `description` varchar(255) DEFAULT NULL COMMENT 'Nota',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Alta'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inspections`
--

CREATE TABLE `inspections` (
  `id` bigint(20) UNSIGNED NOT NULL COMMENT 'Identificador',
  `folio` varchar(24) DEFAULT NULL COMMENT 'SIG-2026-00001',
  `title` varchar(150) NOT NULL COMMENT 'Resumen del hallazgo',
  `description` text NOT NULL COMMENT 'Observaciones del usuario',
  `category_id` int(10) UNSIGNED NOT NULL COMMENT 'Clasificacion',
  `created_by` bigint(20) UNSIGNED NOT NULL COMMENT 'Usuario que reporta',
  `assigned_to` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Operador asignado',
  `status` enum('pendiente','asignada','en_proceso','finalizada','cancelada') NOT NULL DEFAULT 'pendiente' COMMENT 'Estado actual',
  `priority` enum('baja','media','alta') NOT NULL DEFAULT 'media' COMMENT 'baja, media, alta',
  `building` varchar(120) DEFAULT NULL COMMENT 'Edificio',
  `area` varchar(120) DEFAULT NULL COMMENT 'Area/zona',
  `reference` varchar(255) DEFAULT NULL COMMENT 'Referencia textual',
  `latitude` decimal(10,7) DEFAULT NULL COMMENT '-90 a 90',
  `longitude` decimal(10,7) DEFAULT NULL COMMENT '-180 a 180',
  `tilt_degrees` decimal(5,2) DEFAULT NULL COMMENT 'Inclinacion medida con acelerometro',
  `review_result` text DEFAULT NULL COMMENT 'Resultado de la revision (obligatorio al finalizar)',
  `final_condition` enum('buena','regular','mala','reemplazada') DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT NULL COMMENT 'Hito de asignacion',
  `started_at` timestamp NULL DEFAULT NULL,
  `finished_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  CONSTRAINT `chk_inspections_latitude`
    CHECK (`latitude` BETWEEN -90 AND 90),
  CONSTRAINT `chk_inspections_longitude`
    CHECK (`longitude` BETWEEN -180 AND 180),
  CONSTRAINT `chk_finalizacion`
    CHECK (
      `status` <> 'finalizada'
      OR (`review_result` IS NOT NULL AND `final_condition` IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inspection_history`
--

CREATE TABLE `inspection_history` (
  `id` bigint(20) UNSIGNED NOT NULL COMMENT 'Identificador',
  `inspection_id` bigint(20) UNSIGNED NOT NULL COMMENT 'Inspeccion',
  `changed_by` bigint(20) UNSIGNED NOT NULL COMMENT 'Actor',
  `action` varchar(40) NOT NULL COMMENT 'creacion, actualizacion, asignacion, cambio_estado, evidencia, cancelacion, finalizacion',
  `previous_status` enum('pendiente','asignada','en_proceso','finalizada','cancelada') DEFAULT NULL COMMENT 'Estado anterior',
  `new_status` enum('pendiente','asignada','en_proceso','finalizada','cancelada') DEFAULT NULL COMMENT 'Estado nuevo',
  `comment` text DEFAULT NULL COMMENT 'Motivo/nota',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL COMMENT 'Identificador',
  `name` varchar(120) NOT NULL COMMENT 'Nombre completo',
  `email` varchar(150) NOT NULL COMMENT 'Correo institucional',
  `password_hash` varchar(255) NOT NULL COMMENT 'bcrypt (nunca texto plano)',
  `role` enum('usuario','operador') NOT NULL DEFAULT 'usuario' COMMENT 'usuario o operador',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Baja logica',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Alta',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Ultima modificacion'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='this is the Users table is used for aggregate users';

--
-- Indices para tablas volcadas
--

--
-- Indices de la tabla `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_categories_name` (`name`);

--
-- Indices de la tabla `evidences`
--
ALTER TABLE `evidences`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_evidences_inspection` (`inspection_id`),
  ADD KEY `fk_evidences_users` (`uploaded_by`);

--
-- Indices de la tabla `inspections`
--
ALTER TABLE `inspections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_inspections_folio` (`folio`),
  ADD KEY `fk_inspections_category` (`category_id`),
  ADD KEY `fk_inspections_created_by` (`created_by`),
  ADD KEY `fk_inspections_assigned_to` (`assigned_to`),
  ADD KEY `idx_inspections_status` (`status`) USING BTREE,
  ADD KEY `idx_inspections_created_at` (`created_at`);

--
-- Indices de la tabla `inspection_history`
--
ALTER TABLE `inspection_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_history_users` (`changed_by`),
  ADD KEY `idx_history_inspection` (`inspection_id`,`created_at`) USING BTREE;

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador';

--
-- AUTO_INCREMENT de la tabla `evidences`
--
ALTER TABLE `evidences`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador';

--
-- AUTO_INCREMENT de la tabla `inspections`
--
ALTER TABLE `inspections`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador';

--
-- AUTO_INCREMENT de la tabla `inspection_history`
--
ALTER TABLE `inspection_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador';

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador';

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `evidences`
--
ALTER TABLE `evidences`
  ADD CONSTRAINT `fk_evidences_inspection` FOREIGN KEY (`inspection_id`) REFERENCES `inspections` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_evidences_users` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `inspections`
--
ALTER TABLE `inspections`
  ADD CONSTRAINT `fk_inspections_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_inspections_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `fk_inspections_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `inspection_history`
--
ALTER TABLE `inspection_history`
  ADD CONSTRAINT `fk_history_inspections` FOREIGN KEY (`inspection_id`) REFERENCES `inspections` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_history_users` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
