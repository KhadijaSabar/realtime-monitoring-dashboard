# Backend - Monitoring Dashboard API

RESTful API with WebSocket support for real-time system monitoring.

## Tech Stack

- Node.js 18+
- Express.js - Web framework
- PostgreSQL - Database
- Socket.io - Real-time communication
- pg (node-postgres) - PostgreSQL client

## Installation

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Database created and migrated (see main project README)

### Steps

1. Navigate to backend directory
```bash
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Create .env file
```bash
cp .env.example .env
```

4. Edit .env with your configuration
```env
DATABASE_URL=postgresql://monitoring_user:your_password@localhost:5432/monitoring_db
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

5. Make sure PostgreSQL is running and migrations are applied

6. Start the server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Servers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/servers | Get all servers |
| GET | /api/servers/:id | Get server by ID |
| GET | /api/servers/inactive | Check inactive servers |
| POST | /api/servers/register | Register new server |
| PATCH | /api/servers/:id/status | Update server status |
| DELETE | /api/servers/:id | Delete server |

### Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/metrics | Create new metric |
| GET | /api/metrics/current/:serverId | Get latest metric |
| GET | /api/metrics/history/:serverId | Get metric history |
| GET | /api/metrics/stats/:serverId | Get average stats |
| GET | /api/metrics/count/:serverId | Count metrics |
| DELETE | /api/metrics/cleanup | Clean old metrics |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Server health status |
| GET | / | API information |

## API Examples

### Register a Server
```bash
curl -X POST http://localhost:5000/api/servers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Server",
    "hostname": "server-01",
    "ip_address": "192.168.1.100",
    "os_type": "Linux"
  }'
```

### Submit Metrics
```bash
curl -X POST http://localhost:5000/api/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "server_id": 1,
    "cpu_percent": 45.2,
    "ram_percent": 67.8,
    "ram_used_mb": 6780,
    "ram_total_mb": 10000,
    "disk_percent": 55.3,
    "disk_used_gb": 110.6,
    "disk_total_gb": 200,
    "network_sent_mb": 1250.5,
    "network_recv_mb": 890.3
  }'
```

### Get Metric History
```bash
# Last 24 hours
curl http://localhost:5000/api/metrics/history/1?hours=24

# Custom time range
curl "http://localhost:5000/api/metrics/history/1?from=2025-02-04T00:00:00Z&to=2025-02-04T23:59:59Z"

# With limit
curl http://localhost:5000/api/metrics/history/1?limit=50
```

## WebSocket Events

### Client to Server

**join-server** - Subscribe to server updates
```javascript
socket.emit('join-server', { serverId: 1 });
```

**leave-server** - Unsubscribe from server updates
```javascript
socket.emit('leave-server', { serverId: 1 });
```

**get-subscriptions** - Get list of subscribed servers
```javascript
socket.emit('get-subscriptions');
```

### Server to Client

**metrics-update** - New metrics available
```javascript
socket.on('metrics-update', (data) => {
  console.log('New metrics:', data);
  // data: { server_id, cpu_percent, ram_percent, ... }
});
```

**server-status** - Server status changed
```javascript
socket.on('server-status', (data) => {
  console.log('Server status:', data);
  // data: { server_id, is_active, timestamp }
});
```

**alert** - Alert triggered
```javascript
socket.on('alert', (data) => {
  console.log('Alert:', data);
  // data: { server_id, type, value, threshold, timestamp }
});
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # PostgreSQL configuration
│   ├── models/
│   │   ├── Server.js             # Server model
│   │   └── Metric.js             # Metric model
│   ├── controllers/
│   │   ├── serverController.js   # Server logic
│   │   └── metricController.js   # Metric logic
│   ├── routes/
│   │   ├── servers.js            # Server routes
│   │   └── metrics.js            # Metric routes
│   ├── socket/
│   │   └── socketHandler.js      # WebSocket logic
│   └── app.js                    # Main application
├── migrations/
│   ├── 001_create_servers.sql
│   ├── 002_create_metrics.sql
│   └── 003_seed_data.sql
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Development

### Running in Development Mode
```bash
npm run dev
```

This uses nodemon for automatic restart on file changes.

### Testing the API

Use Postman, Insomnia, or curl to test endpoints.

Example collection available in `/docs/api-collection.json` (to be created).

### Logs

All requests are logged to console with:
- HTTP method
- Path
- Timestamp

Database queries are logged with:
- Query text
- Duration
- Row count

## Deployment

### Environment Variables

Set these in production:
```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
PORT=5000
FRONTEND_URL=https://your-frontend-url.com
```

### Deployment Platforms

**Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

**Render:**
1. Connect GitHub repo
2. Set environment variables
3. Deploy

**Heroku:**
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create monitoring-api

# Set env vars
heroku config:set DATABASE_URL=xxx

# Deploy
git push heroku main
```

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
Solution: Make sure PostgreSQL is running
```bash
# Check status
sudo systemctl status postgresql

# Start if needed
sudo systemctl start postgresql
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
Solution: Change PORT in .env or kill process using port 5000
```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>
```

### WebSocket Connection Refused
Solution: Make sure FRONTEND_URL in .env matches your frontend URL

## Performance Tips

1. Use connection pooling (already configured)
2. Add indexes on frequently queried columns (already done)
3. Implement caching for read-heavy endpoints (Redis)
4. Use pagination for large datasets
5. Regular cleanup of old metrics

## Security Best Practices

1. Never commit .env files
2. Use strong database passwords
3. Enable SSL in production
4. Implement rate limiting (express-rate-limit)
5. Validate all inputs (already done with express-validator)
6. Use helmet.js for security headers

## Next Steps

1. Add authentication (JWT)
2. Implement rate limiting
3. Add comprehensive tests
4. Set up CI/CD pipeline
5. Add API documentation (Swagger)
6. Implement caching layer

## License

MIT
