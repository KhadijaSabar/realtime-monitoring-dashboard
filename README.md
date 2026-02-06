# Real-time Monitoring Dashboard

A comprehensive full-stack application for real-time system monitoring with WebSocket support, featuring CPU, RAM, and disk usage visualization.

## Overview

This project provides a complete monitoring solution with:
- **Backend API** (Node.js + Express + Socket.io) for data management and real-time communication
- **Python Collector** for system metrics collection
- **Frontend Dashboard** (React) for visualization
- **PostgreSQL Database** for metrics storage

## Features

- Real-time metrics visualization with live updates
- WebSocket-based communication for instant data refresh
- Historical data tracking and analysis
- Interactive charts and graphs
- Multi-server support
- Responsive design for all devices
- Alert system for critical thresholds

## Tech Stack

### Backend
- Node.js 18+
- Express.js
- Socket.io (WebSocket)
- PostgreSQL
- pg (node-postgres)

### Collector
- Python 3.9+
- psutil (system metrics)
- requests (HTTP)

### Frontend
- React 18
- Recharts (charts)
- Axios (HTTP)
- Socket.io-client

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture, database schema, and API documentation.

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- PostgreSQL 14+
- npm or yarn

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/KhadijaSabar/realtime-monitoring-dashboard.git
cd realtime-monitoring-dashboard
```

**2. Set up the database**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE monitoring_db;
CREATE USER monitoring_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE monitoring_db TO monitoring_user;
\c monitoring_db
GRANT ALL ON SCHEMA public TO monitoring_user;
\q

# Run migrations (copy SQL from ARCHITECTURE.md or create migration files)
# Execute the 3 SQL scripts to create tables
```

**3. Set up the backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

Backend will run on `http://localhost:5000`

**4. Set up the collector**
```bash
cd collector
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp config.json config.json.local
# Edit config.json with backend URL
python collector.py
```

**5. Set up the frontend**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with backend URL
npm start
```

Frontend will open at `http://localhost:3000`

## Project Structure

```
realtime-monitoring-dashboard/
├── backend/                 # Node.js API + WebSocket server
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── models/         # Data models
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API routes
│   │   ├── socket/         # WebSocket handlers
│   │   └── app.js          # Entry point
│   ├── package.json
│   └── README.md
│
├── collector/              # Python metrics collector
│   ├── collector.py        # Main script
│   ├── config.json         # Configuration
│   ├── requirements.txt    # Dependencies
│   └── README.md
│
├── frontend/               # React dashboard
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API & WebSocket services
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── README.md
│
├── ARCHITECTURE.md         # Detailed architecture
└── README.md              # This file
```

## Usage

### Starting the Full Stack

**Terminal 1 - Database**
```bash
# Make sure PostgreSQL is running
sudo systemctl start postgresql  # Linux
# Or start via Services on Windows
```

**Terminal 2 - Backend**
```bash
cd backend
npm run dev
```

**Terminal 3 - Collector**
```bash
cd collector
source venv/bin/activate
python collector.py
```

**Terminal 4 - Frontend**
```bash
cd frontend
npm start
```

### Accessing the Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

You should see:
- Real-time CPU, RAM, and disk usage cards
- Live updating chart with metrics history
- Server information panel

## Configuration

### Backend (.env)
```env
DATABASE_URL=postgresql://monitoring_user:your_password@localhost:5432/monitoring_db
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Collector (config.json)
```json
{
  "backend": {
    "url": "http://localhost:5000"
  },
  "collection": {
    "interval_seconds": 5
  }
}
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=http://localhost:5000
```

## API Endpoints

### Servers
- `GET /api/servers` - List all servers
- `GET /api/servers/:id` - Get server details
- `POST /api/servers/register` - Register new server

### Metrics
- `POST /api/metrics` - Submit new metrics
- `GET /api/metrics/current/:serverId` - Get latest metrics
- `GET /api/metrics/history/:serverId` - Get historical data
- `GET /api/metrics/stats/:serverId` - Get statistics

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete API documentation.

## WebSocket Events

### Client → Server
- `join-server` - Subscribe to server updates
- `leave-server` - Unsubscribe from server

### Server → Client
- `metrics-update` - New metrics available
- `server-status` - Server status changed
- `alert` - Alert triggered

## Deployment

### Backend (Railway/Render)

**Railway:**
```bash
# Install CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Render:**
1. Connect GitHub repository
2. Select "Web Service"
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)

**Vercel:**
```bash
npm install -g vercel
vercel login
vercel
```

**Netlify:**
```bash
npm run build
# Deploy build folder on netlify.com
```

### Database (Supabase)
1. Create project on supabase.com
2. Get connection string
3. Update backend .env
4. Run migrations via SQL editor

## Development

### Running Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Code Style
- ESLint for JavaScript
- Prettier for formatting
- Follow existing code patterns

### Adding Features
1. Create feature branch
2. Implement changes
3. Test thoroughly
4. Submit pull request

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Check port 5000 is available

### Collector can't connect
- Verify backend is running
- Check backend URL in config.json
- Ensure no firewall blocking

### Frontend shows no data
- Check backend is running
- Verify API_URL in .env
- Check browser console for errors

### WebSocket not connecting
- Verify WS_URL matches backend
- Check CORS settings
- Ensure Socket.io versions match

## Performance Tips

1. Adjust collector interval (default 5s)
2. Limit historical data retention
3. Use database indexes (already configured)
4. Enable gzip compression
5. Use CDN for frontend

## Security Considerations

- Never commit .env files
- Use strong database passwords
- Enable SSL in production
- Implement authentication
- Sanitize all inputs
- Use environment variables

## Roadmap

- [ ] User authentication
- [ ] Email/Slack alerts
- [ ] Mobile app
- [ ] Docker compose setup
- [ ] Kubernetes deployment
- [ ] More metric types (Network, Processes)
- [ ] Machine learning predictions
- [ ] Export data (CSV, PDF)

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Author

**Khadija Sabar**
- GitHub: [@KhadijaSabar](https://github.com/KhadijaSabar)
- Email: ksabar179@gmail.com
- Portfolio: [Live Demo](https://portfolio-ten-eta-tau2euy5sd.vercel.app)

## Acknowledgments

- Built with React, Node.js, and PostgreSQL
- Charts powered by Recharts
- Real-time communication via Socket.io
- System metrics via psutil

---

**Status:** Active Development | Last Updated: February 2025
