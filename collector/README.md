# Python Metrics Collector

Python script that collects system metrics (CPU, RAM, Disk, Network) and sends them to the monitoring backend.

## Features

- Collects system metrics every 5 seconds (configurable)
- Automatic server registration with backend
- Retry mechanism for failed requests
- Comprehensive logging
- Configurable via JSON file

## Prerequisites

- Python 3.8+
- Backend API running
- Network access to backend

## Installation

### 1. Navigate to collector directory
```bash
cd collector
```

### 2. Create virtual environment (recommended)
```bash
# Create venv
python3 -m venv venv

# Activate venv
# On Linux/Mac:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure the collector
```bash
# Copy config example
cp config.json config.json.local

# Edit configuration
nano config.json
```

Configuration options:
```json
{
  "backend": {
    "url": "http://localhost:5000",
    "register_endpoint": "/api/servers/register",
    "metrics_endpoint": "/api/metrics"
  },
  "server": {
    "name": "My Server",
    "hostname": "auto",
    "ip_address": "auto",
    "os_type": "auto"
  },
  "collection": {
    "interval_seconds": 5,
    "retry_attempts": 3,
    "retry_delay_seconds": 2
  }
}
```

## Usage

### Run the collector
```bash
python collector.py
```

Expected output:
```
==================================================
System Metrics Collector
==================================================
2025-02-05 10:00:00 - INFO - MetricsCollector initialized
2025-02-05 10:00:00 - INFO - Configuration loaded from config.json
2025-02-05 10:00:01 - INFO - Registering server: My Server
2025-02-05 10:00:01 - INFO - Server registered successfully. Server ID: 1
2025-02-05 10:00:01 - INFO - Starting metrics collection (interval: 5s)
2025-02-05 10:00:01 - INFO - Press Ctrl+C to stop
2025-02-05 10:00:02 - INFO - Metrics sent successfully. CPU: 45.2%, RAM: 67.8%
2025-02-05 10:00:07 - INFO - Metrics sent successfully. CPU: 48.1%, RAM: 68.5%
```

### Stop the collector
Press `Ctrl+C`

## What Metrics Are Collected

| Metric | Description | Unit |
|--------|-------------|------|
| cpu_percent | CPU usage | Percentage (0-100) |
| ram_percent | RAM usage | Percentage (0-100) |
| ram_used_mb | RAM used | Megabytes |
| ram_total_mb | Total RAM | Megabytes |
| disk_percent | Disk usage | Percentage (0-100) |
| disk_used_gb | Disk used | Gigabytes |
| disk_total_gb | Total disk | Gigabytes |
| network_sent_mb | Data sent | Megabytes (cumulative) |
| network_recv_mb | Data received | Megabytes (cumulative) |

## How It Works

1. **Initialization**: Loads configuration from `config.json`
2. **Server Registration**: Registers itself with the backend API
3. **Collection Loop**: Every X seconds (default 5):
   - Collects system metrics using `psutil`
   - Sends metrics to backend via HTTP POST
   - Logs the results
4. **Error Handling**: Retries failed requests with exponential backoff

## Configuration Details

### Backend URL
Set this to your backend API URL:
```json
"url": "http://localhost:5000"
```

For production:
```json
"url": "https://your-backend-api.com"
```

### Server Info
Use "auto" for automatic detection:
```json
"hostname": "auto",
"ip_address": "auto",
"os_type": "auto"
```

Or specify manually:
```json
"hostname": "prod-server-01",
"ip_address": "192.168.1.100",
"os_type": "Linux"
```

### Collection Interval
Adjust how often metrics are collected:
```json
"interval_seconds": 5
```

Recommended values:
- Development: 5 seconds
- Production: 10-30 seconds (to reduce load)

## Running as a Service

### Linux (systemd)

Create service file `/etc/systemd/system/metrics-collector.service`:
```ini
[Unit]
Description=System Metrics Collector
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/collector
ExecStart=/path/to/collector/venv/bin/python collector.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable metrics-collector
sudo systemctl start metrics-collector
sudo systemctl status metrics-collector
```

### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (At startup)
4. Action: Start a program
5. Program: `C:\path\to\python.exe`
6. Arguments: `C:\path\to\collector.py`
7. Finish

## Troubleshooting

### Connection Refused
```
ERROR - Failed to register server: Connection refused
```
Solution: Make sure backend is running and URL is correct

### Module Not Found
```
ModuleNotFoundError: No module named 'psutil'
```
Solution: Install dependencies
```bash
pip install -r requirements.txt
```

### Permission Denied (Disk metrics)
```
PermissionError: [Errno 13] Permission denied: '/'
```
Solution: Run with appropriate permissions or change disk path in code

### High CPU Usage
If collector uses too much CPU, increase the collection interval:
```json
"interval_seconds": 30
```

## Logs

Logs are written to:
- Console (stdout)
- `collector.log` file

Log levels:
- INFO: Normal operations
- WARNING: Retries and recoverable errors
- ERROR: Fatal errors
- DEBUG: Detailed debugging info

To enable debug logging, edit collector.py:
```python
logging.basicConfig(level=logging.DEBUG, ...)
```

## Testing

Test the collector without running continuously:
```python
# Add to collector.py temporarily
if __name__ == "__main__":
    collector = MetricsCollector()
    metrics = collector.collect_metrics()
    print(json.dumps(metrics, indent=2))
```

## Dependencies

- **psutil**: Cross-platform library for system metrics
- **requests**: HTTP library for API calls
- **schedule**: Job scheduling (if using scheduled mode)
- **pyyaml**: YAML config support (optional)

## Security Notes

1. Don't commit `config.json` with sensitive data
2. Use HTTPS for production backend URLs
3. Consider authentication for backend API
4. Limit collector permissions (don't run as root)

## Performance

- CPU overhead: < 1%
- Memory usage: ~20-50 MB
- Network traffic: ~1 KB per collection cycle

## Next Steps

1. Configure multiple collectors for different servers
2. Add authentication to backend API
3. Implement metric aggregation
4. Add alerting thresholds
5. Create monitoring for the collector itself

## License

MIT
