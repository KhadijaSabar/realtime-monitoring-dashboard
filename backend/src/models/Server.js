// Modèle Server - Gère toutes les opérations liées à la table servers
// Ce fichier contient la logique métier pour les serveurs

const db = require('../config/database');

class Server {
  // Créer un nouveau serveur
  // Utilisé quand un serveur se connecte pour la première fois
  static async create({ name, hostname, ip_address, os_type }) {
    const query = `
      INSERT INTO servers (name, hostname, ip_address, os_type, is_active)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING *
    `;
    const values = [name, hostname, ip_address, os_type];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      // Si le hostname existe déjà, on retourne le serveur existant
      if (error.code === '23505') { // Code PostgreSQL pour violation de contrainte unique
        return await this.findByHostname(hostname);
      }
      throw error;
    }
  }

  // Récupérer tous les serveurs
  static async findAll() {
    const query = `
      SELECT * FROM servers
      ORDER BY created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  // Récupérer un serveur par son ID
  static async findById(id) {
    const query = `
      SELECT * FROM servers
      WHERE id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Récupérer un serveur par son hostname
  static async findByHostname(hostname) {
    const query = `
      SELECT * FROM servers
      WHERE hostname = $1
    `;
    const result = await db.query(query, [hostname]);
    return result.rows[0];
  }

  // Mettre à jour le statut d'activité d'un serveur
  // Appelé quand un serveur envoie des métriques (last_seen)
  static async updateLastSeen(id) {
    const query = `
      UPDATE servers
      SET last_seen = CURRENT_TIMESTAMP,
          is_active = TRUE
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Marquer un serveur comme inactif
  // Peut être utilisé si un serveur n'envoie plus de métriques
  static async markInactive(id) {
    const query = `
      UPDATE servers
      SET is_active = FALSE
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Supprimer un serveur (et toutes ses métriques grâce à ON DELETE CASCADE)
  static async delete(id) {
    const query = `
      DELETE FROM servers
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Vérifier les serveurs inactifs (n'ont pas envoyé de métriques depuis X minutes)
  static async findInactive(minutes = 10) {
    const query = `
      SELECT * FROM servers
      WHERE last_seen < NOW() - INTERVAL '${minutes} minutes'
        AND is_active = TRUE
    `;
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = Server;
