// Configuration de la connexion PostgreSQL
// Ce fichier gère la connexion à la base de données

const { Pool } = require('pg');
require('dotenv').config();

// Créer un pool de connexions PostgreSQL
// Un pool permet de réutiliser les connexions au lieu d'en créer une nouvelle à chaque requête
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Configuration additionnelle pour la production
  max: 20, // Nombre maximum de clients dans le pool
  idleTimeoutMillis: 30000, // Fermer les connexions inactives après 30 secondes
  connectionTimeoutMillis: 2000, // Timeout de connexion de 2 secondes
});

// Tester la connexion au démarrage
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

// Gérer les erreurs de connexion
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Fonction helper pour exécuter des requêtes
// Cette fonction simplifie l'exécution de requêtes SQL
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Fonction pour obtenir un client du pool (pour les transactions)
const getClient = () => {
  return pool.connect();
};

module.exports = {
  query,
  getClient,
  pool,
};
