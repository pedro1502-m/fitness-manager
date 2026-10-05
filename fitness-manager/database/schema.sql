-- =====================================================
-- Fitness Manager - DDL (MySQL 8+)
-- Execute: mysql -u root -p < database/schema.sql
-- =====================================================
CREATE DATABASE IF NOT EXISTS fitness_manager
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fitness_manager;

-- Usuários / alunos
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  weight        DECIMAL(5,2)  NULL COMMENT 'Peso em kg',
  height        DECIMAL(5,2)  NULL COMMENT 'Altura em cm',
  goal          VARCHAR(150)  NULL COMMENT 'Objetivo (ex: Hipertrofia)',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Rotinas de treino (1 usuário : N treinos)
CREATE TABLE IF NOT EXISTS workouts (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  title       VARCHAR(120) NOT NULL,
  description TEXT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_workouts_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_workouts_user (user_id)
) ENGINE=InnoDB;

-- Exercícios (1 treino : N exercícios)
CREATE TABLE IF NOT EXISTS exercises (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workout_id INT UNSIGNED NOT NULL,
  name       VARCHAR(120) NOT NULL,
  sets       SMALLINT UNSIGNED NOT NULL DEFAULT 3,
  reps       SMALLINT UNSIGNED NOT NULL DEFAULT 10,
  weight     DECIMAL(6,2) NOT NULL DEFAULT 0 COMMENT 'Carga em kg',
  CONSTRAINT fk_exercises_workout FOREIGN KEY (workout_id)
    REFERENCES workouts(id) ON DELETE CASCADE,
  INDEX idx_exercises_workout (workout_id)
) ENGINE=InnoDB;

-- Refeições (1 usuário : N refeições)
CREATE TABLE IF NOT EXISTS meals (
  id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id  INT UNSIGNED NOT NULL,
  name     VARCHAR(120) NOT NULL,
  calories INT UNSIGNED NOT NULL DEFAULT 0,
  prot     DECIMAL(6,2) NOT NULL DEFAULT 0 COMMENT 'Proteínas (g)',
  carb     DECIMAL(6,2) NOT NULL DEFAULT 0 COMMENT 'Carboidratos (g)',
  fat      DECIMAL(6,2) NOT NULL DEFAULT 0 COMMENT 'Gorduras (g)',
  date     DATE NOT NULL,
  CONSTRAINT fk_meals_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_meals_user_date (user_id, date)
) ENGINE=InnoDB;
