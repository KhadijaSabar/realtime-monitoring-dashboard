#!/usr/bin/env python3
"""
System Metrics Collector
Collecte les métriques système (CPU, RAM, Disk) et les envoie au backend.
"""

import psutil
import requests
import time
import json
import logging
import socket
import platform
import sys
from datetime import datetime
from typing import Dict, Optional

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('collector.log')
    ]
)
logger = logging.getLogger(__name__)


class MetricsCollector:
    """Classe principale pour collecter et envoyer les métriques système."""
    
    def __init__(self, config_file: str = 'config.json'):
        """
        Initialise le collector avec la configuration.
        
        Args:
            config_file: Chemin vers le fichier de configuration JSON
        """
        self.config = self.load_config(config_file)
        self.server_id: Optional[int] = None
        self.backend_url = self.config['backend']['url']
        self.is_running = False
        
        logger.info("MetricsCollector initialized")
    
    def load_config(self, config_file: str) -> Dict:
        """
        Charge la configuration depuis le fichier JSON.
        
        Args:
            config_file: Chemin vers le fichier de configuration
            
        Returns:
            Dictionnaire de configuration
        """
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
            logger.info(f"Configuration loaded from {config_file}")
            return config
        except FileNotFoundError:
            logger.error(f"Config file {config_file} not found")
            sys.exit(1)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in config file: {e}")
            sys.exit(1)
    
    def get_system_info(self) -> Dict:
        """
        Récupère les informations système pour l'enregistrement du serveur.
        
        Returns:
            Dictionnaire avec name, hostname, ip_address, os_type
        """
        server_config = self.config['server']
        
        # Hostname
        hostname = server_config.get('hostname')
        if hostname == 'auto':
            hostname = socket.gethostname()
        
        # IP Address
        ip_address = server_config.get('ip_address')
        if ip_address == 'auto':
            try:
                # Obtenir l'IP locale (pas 127.0.0.1)
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.connect(("8.8.8.8", 80))
                ip_address = s.getsockname()[0]
                s.close()
            except Exception:
                ip_address = "127.0.0.1"
        
        # OS Type
        os_type = server_config.get('os_type')
        if os_type == 'auto':
            os_type = platform.system()
        
        # Name
        name = server_config.get('name', f"Server-{hostname}")
        
        return {
            'name': name,
            'hostname': hostname,
            'ip_address': ip_address,
            'os_type': os_type
        }
    
    def register_server(self) -> bool:
        """
        Enregistre le serveur auprès du backend.
        
        Returns:
            True si l'enregistrement réussit, False sinon
        """
        url = f"{self.backend_url}{self.config['backend']['register_endpoint']}"
        system_info = self.get_system_info()
        
        logger.info(f"Registering server: {system_info['name']}")
        
        try:
            response = requests.post(url, json=system_info, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                self.server_id = data['data']['id']
                logger.info(f"Server registered successfully. Server ID: {self.server_id}")
                return True
            else:
                logger.error(f"Server registration failed: {data.get('error')}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to register server: {e}")
            return False
    
    def collect_metrics(self) -> Dict:
        """
        Collecte toutes les métriques système.
        
        Returns:
            Dictionnaire contenant toutes les métriques
        """
        # CPU
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # RAM
        memory = psutil.virtual_memory()
        ram_percent = memory.percent
        ram_used_mb = memory.used / (1024 * 1024)  # Convertir en MB
        ram_total_mb = memory.total / (1024 * 1024)
        
        # Disk (partition racine)
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent
        disk_used_gb = disk.used / (1024 * 1024 * 1024)  # Convertir en GB
        disk_total_gb = disk.total / (1024 * 1024 * 1024)
        
        # Network (optionnel)
        net_io = psutil.net_io_counters()
        network_sent_mb = net_io.bytes_sent / (1024 * 1024)  # Convertir en MB
        network_recv_mb = net_io.bytes_recv / (1024 * 1024)
        
        metrics = {
            'server_id': self.server_id,
            'cpu_percent': round(cpu_percent, 2),
            'ram_percent': round(ram_percent, 2),
            'ram_used_mb': round(ram_used_mb, 2),
            'ram_total_mb': round(ram_total_mb, 2),
            'disk_percent': round(disk_percent, 2),
            'disk_used_gb': round(disk_used_gb, 2),
            'disk_total_gb': round(disk_total_gb, 2),
            'network_sent_mb': round(network_sent_mb, 2),
            'network_recv_mb': round(network_recv_mb, 2),
        }
        
        logger.debug(f"Metrics collected: CPU={cpu_percent}%, RAM={ram_percent}%, Disk={disk_percent}%")
        
        return metrics
    
    def send_metrics(self, metrics: Dict) -> bool:
        """
        Envoie les métriques au backend.
        
        Args:
            metrics: Dictionnaire des métriques à envoyer
            
        Returns:
            True si l'envoi réussit, False sinon
        """
        url = f"{self.backend_url}{self.config['backend']['metrics_endpoint']}"
        
        retry_attempts = self.config['collection'].get('retry_attempts', 3)
        retry_delay = self.config['collection'].get('retry_delay_seconds', 2)
        
        for attempt in range(retry_attempts):
            try:
                response = requests.post(url, json=metrics, timeout=10)
                response.raise_for_status()
                
                data = response.json()
                if data.get('success'):
                    logger.info(f"Metrics sent successfully. CPU: {metrics['cpu_percent']}%, RAM: {metrics['ram_percent']}%")
                    return True
                else:
                    logger.warning(f"Backend returned error: {data.get('error')}")
                    
            except requests.exceptions.RequestException as e:
                logger.warning(f"Attempt {attempt + 1}/{retry_attempts} failed: {e}")
                if attempt < retry_attempts - 1:
                    time.sleep(retry_delay)
        
        logger.error("Failed to send metrics after all retry attempts")
        return False
    
    def run(self):
        """
        Boucle principale du collector.
        Collecte et envoie les métriques à intervalle régulier.
        """
        # Enregistrer le serveur au démarrage
        if not self.register_server():
            logger.error("Failed to register server. Exiting.")
            return
        
        self.is_running = True
        interval = self.config['collection'].get('interval_seconds', 5)
        
        logger.info(f"Starting metrics collection (interval: {interval}s)")
        logger.info("Press Ctrl+C to stop")
        
        try:
            while self.is_running:
                # Collecter les métriques
                metrics = self.collect_metrics()
                
                # Envoyer au backend
                self.send_metrics(metrics)
                
                # Attendre avant la prochaine collecte
                time.sleep(interval)
                
        except KeyboardInterrupt:
            logger.info("Collector stopped by user")
            self.is_running = False
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            self.is_running = False
    
    def stop(self):
        """Arrête le collector proprement."""
        logger.info("Stopping collector...")
        self.is_running = False


def main():
    """Point d'entrée principal du script."""
    print("=" * 50)
    print("System Metrics Collector")
    print("=" * 50)
    
    # Vérifier que le fichier de config existe
    import os
    if not os.path.exists('config.json'):
        logger.error("config.json not found in current directory")
        logger.info("Please create config.json based on config.json.example")
        sys.exit(1)
    
    # Créer et démarrer le collector
    collector = MetricsCollector('config.json')
    
    try:
        collector.run()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
