/**
 * Pool de conexões MySQL (mysql2/promise).
 * - dateStrings: DATE/TIMESTAMP retornam como string (evita problemas de fuso)
 * - decimalNumbers: DECIMAL retorna como number em vez de string
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fitness_manager',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  decimalNumbers: true,
});

module.exports = pool;
