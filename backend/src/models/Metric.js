// Modèle Metric - Gère toutes les opérations liées à la table metrics
// Ce fichier contient la logique métier pour les métriques

const db = require('../config/database');

class Metric {
  // Créer une nouvelle métrique
  // Appelé par le script Python quand il envoie des données
  static async create(metricData) {
    const query = `
      INSERT INTO metrics (
        server_id,
        cpu_percent,
        ram_percent,
        ram_used_mb,
        ram_total_mb,
        disk_percent,
        disk_used_gb,
        disk_total_gb,
        network_sent_mb,
        network_recv_mb,
        recorded_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [
      metricData.server_id,
      metricData.cpu_percent,
      metricData.ram_percent,
      metricData.ram_used_mb,
      metricData.ram_total_mb,
      metricData.disk_percent,
      metricData.disk_used_gb,
      metricData.disk_total_gb,
      metricData.network_sent_mb || 0,
      metricData.network_recv_mb || 0,
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Récupérer la dernière métrique d'un serveur
  // Utilisé pour afficher les valeurs actuelles sur le dashboard
  static async findLatestByServerId(serverId) {
    const query = `
      SELECT * FROM metrics
      WHERE server_id = $1
      ORDER BY recorded_at DESC
      LIMIT 1
    `;
    const result = await db.query(query, [serverId]);
    return result.rows[0];
  }

  // Récupérer l'historique des métriques d'un serveur
  // Permet d'afficher les graphiques avec données historiques
  static async findHistoryByServerId(serverId, from, to, limit = 100) {
    let query = `
      SELECT 
        cpu_percent,
        ram_percent,
        ram_used_mb,
        ram_total_mb,
        disk_percent,
        disk_used_gb,
        disk_total_gb,
        network_sent_mb,
        network_recv_mb,
        recorded_at
      FROM metrics
      WHERE server_id = $1
    `;
    
    const values = [serverId];
    let paramCount = 1;
    
    // Ajouter filtre de date si fourni
    if (from) {
      paramCount++;
      query += ` AND recorded_at >= $${paramCount}`;
      values.push(from);
    }
    
    if (to) {
      paramCount++;
      query += ` AND recorded_at <= $${paramCount}`;
      values.push(to);
    }
    
    query += ` ORDER BY recorded_at DESC LIMIT $${paramCount + 1}`;
    values.push(limit);
    
    const result = await db.query(query, values);
    // Retourner dans l'ordre chronologique (du plus ancien au plus récent)
    return result.rows.reverse();
  }

  // Récupérer les métriques des dernières X heures
  // Utilisé pour afficher les données récentes sur le dashboard
  static async findRecentByServerId(serverId, hours = 24) {
    const query = `
      SELECT 
        cpu_percent,
        ram_percent,
        disk_percent,
        recorded_at
      FROM metrics
      WHERE server_id = $1
        AND recorded_at >= NOW() - INTERVAL '${hours} hours'
      ORDER BY recorded_at ASC
    `;
    const result = await db.query(query, [serverId]);
    return result.rows;
  }

  // Calculer les moyennes des métriques sur une période
  // Utile pour les statistiques et les résumés
  static async calculateAverages(serverId, hours = 24) {
    const query = `
      SELECT 
        AVG(cpu_percent) as avg_cpu,
        AVG(ram_percent) as avg_ram,
        AVG(disk_percent) as avg_disk,
        MAX(cpu_percent) as max_cpu,
        MAX(ram_percent) as max_ram,
        MIN(cpu_percent) as min_cpu,
        MIN(ram_percent) as min_ram
      FROM metrics
      WHERE server_id = $1
        AND recorded_at >= NOW() - INTERVAL '${hours} hours'
    `;
    const result = await db.query(query, [serverId]);
    return result.rows[0];
  }

  // Supprimer les anciennes métriques (nettoyage)
  // Important pour ne pas remplir la DB indéfiniment
  // Exécuter périodiquement (ex: via cron job)
  static async deleteOlderThan(days = 30) {
    const query = `
      DELETE FROM metrics
      WHERE recorded_at < NOW() - INTERVAL '${days} days'
    `;
    const result = await db.query(query);
    return result.rowCount; // Nombre de lignes supprimées
  }

  // Compter le nombre total de métriques pour un serveur
  static async countByServerId(serverId) {
    const query = `
      SELECT COUNT(*) as count
      FROM metrics
      WHERE server_id = $1
    `;
    const result = await db.query(query, [serverId]);
    return parseInt(result.rows[0].count);
  }

  // Récupérer les métriques avec agrégation par intervalle
  // Utilisé pour afficher des graphiques avec moins de points (performance)
  static async findAggregatedByInterval(serverId, interval = '5 minutes', hours = 24) {
    const query = `
      SELECT 
        time_bucket('${interval}', recorded_at) AS time,
        AVG(cpu_percent) as cpu_percent,
        AVG(ram_percent) as ram_percent,
        AVG(disk_percent) as disk_percent
      FROM metrics
      WHERE server_id = $1
        AND recorded_at >= NOW() - INTERVAL '${hours} hours'
      GROUP BY time
      ORDER BY time ASC
    `;
    
    // Note: time_bucket nécessite l'extension TimescaleDB
    // Pour une version simple sans extension, on peut grouper par tranche horaire
    const simpleQuery = `
      SELECT 
        DATE_TRUNC('minute', recorded_at) AS time,
        AVG(cpu_percent) as cpu_percent,
        AVG(ram_percent) as ram_percent,
        AVG(disk_percent) as disk_percent
      FROM metrics
      WHERE server_id = $1
        AND recorded_at >= NOW() - INTERVAL '${hours} hours'
      GROUP BY DATE_TRUNC('minute', recorded_at)
      ORDER BY time ASC
    `;
    
    try {
      const result = await db.query(query, [serverId]);
      return result.rows;
    } catch (error) {
      // Si TimescaleDB n'est pas installé, utiliser la version simple
      const result = await db.query(simpleQuery, [serverId]);
      return result.rows;
    }
  }
}

module.exports = Metric;
