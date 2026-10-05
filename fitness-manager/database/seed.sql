-- =====================================================
-- Fitness Manager - DML de teste
-- Login de teste: aluno@teste.com / 123456
-- =====================================================
USE fitness_manager;

INSERT INTO users (name, email, password_hash, weight, height, goal) VALUES
('Aluno Teste', 'aluno@teste.com', '$2a$10$Yq/DXZQsSIyHPaEkhcl2iOSrRNwx5rxOikXYEYNkMi6td6Lnyfxou', 78.50, 178.00, 'Hipertrofia');

SET @uid = LAST_INSERT_ID();

INSERT INTO workouts (user_id, title, description) VALUES
(@uid, 'Treino A - Peito e Tríceps', 'Foco em força e volume para peitoral.');
SET @wa = LAST_INSERT_ID();
INSERT INTO workouts (user_id, title, description) VALUES
(@uid, 'Treino B - Costas e Bíceps', 'Puxadas e remadas com boa execução.');
SET @wb = LAST_INSERT_ID();

INSERT INTO exercises (workout_id, name, sets, reps, weight) VALUES
(@wa, 'Supino reto', 4, 10, 60),
(@wa, 'Supino inclinado com halteres', 3, 12, 24),
(@wa, 'Tríceps corda', 3, 12, 25),
(@wb, 'Puxada frontal', 4, 10, 55),
(@wb, 'Remada curvada', 3, 10, 50),
(@wb, 'Rosca direta', 3, 12, 20);

INSERT INTO meals (user_id, name, calories, prot, carb, fat, date) VALUES
(@uid, 'Café da manhã', 520, 32, 60, 14, CURDATE()),
(@uid, 'Almoço',        780, 50, 85, 22, CURDATE()),
(@uid, 'Lanche',        300, 25, 30, 8,  CURDATE()),
(@uid, 'Jantar',        650, 45, 55, 20, CURDATE() - INTERVAL 1 DAY),
(@uid, 'Almoço',        800, 52, 90, 24, CURDATE() - INTERVAL 1 DAY),
(@uid, 'Almoço',        750, 48, 80, 21, CURDATE() - INTERVAL 2 DAY);
