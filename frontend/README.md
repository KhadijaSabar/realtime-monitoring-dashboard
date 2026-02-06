# Frontend - Monitoring Dashboard

React frontend for the real-time monitoring dashboard.

## Features

- Real-time metrics visualization
- WebSocket connection for live updates
- Interactive charts with Recharts
- Responsive design
- Modern UI with custom styling

## Prerequisites

- Node.js 16+ installed
- Backend API running
- npm or yarn package manager

## Installation

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=http://localhost:5000
```

For production, update with your deployed backend URL.

### 4. Start development server
```bash
npm start
```

The app will open at `http://localhost:3000`

## Available Scripts

### Development
```bash
npm start
```
Runs the app in development mode with hot reload.

### Build for Production
```bash
npm build
```
Builds the app for production to the `build` folder.
Optimizes the build for best performance.

### Run Tests
```bash
npm test
```
Launches the test runner.

## Project Structure

```
frontend/
├── public/
│   └── index.html           # HTML template
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx    # Main dashboard page
│   │   ├── Dashboard.css
│   │   ├── MetricCard.jsx   # Individual metric card
│   │   ├── MetricCard.css
│   │   ├── RealtimeChart.jsx # Real-time chart
│   │   └── RealtimeChart.css
│   ├── services/
│   │   ├── api.js           # API calls with axios
│   │   └── socket.js        # WebSocket service
│   ├── App.js               # Root component
│   ├── App.css
│   ├── index.js             # Entry point
│   └── index.css            # Global styles
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Components

### Dashboard
Main page that:
- Loads list of servers
- Displays current metrics
- Shows real-time charts
- Manages WebSocket connections

### MetricCard
Displays individual metric (CPU, RAM, Disk) with:
- Current value
- Progress bar
- Status indicator (normal/warning/danger)
- Color-coded alerts

### RealtimeChart
Line chart showing:
- Last 50 data points
- Multiple metrics on same chart
- Live indicator
- Responsive design

## Services

### API Service (api.js)
Handles all HTTP requests:
- `getServers()` - Fetch all servers
- `getCurrentMetric(serverId)` - Get latest metric
- `getMetricHistory(serverId, params)` - Get historical data
- `getMetricStats(serverId, hours)` - Get averages

### Socket Service (socket.js)
Manages WebSocket connection:
- `connect()` - Connect to backend
- `subscribeToServer(serverId)` - Subscribe to updates
- `onMetricsUpdate(callback)` - Listen for new metrics
- `disconnect()` - Close connection

## Customization

### Colors
Edit `src/index.css` CSS variables:
```css
:root {
  --primary: #06b6d4;        /* Main color */
  --bg-dark: #0f172a;        /* Background */
  --text-primary: #e2e8f0;   /* Text color */
}
```

### Chart Configuration
Edit `Dashboard.jsx`:
```javascript
<RealtimeChart
  dataKeys={['cpu_percent', 'ram_percent', 'disk_percent']}
  colors={['#06b6d4', '#10b981', '#f59e0b']}
/>
```

### Metric Thresholds
Edit `MetricCard` usage in `Dashboard.jsx`:
```javascript
<MetricCard
  title="CPU Usage"
  threshold={80}  // Alert at 80%
/>
```

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Or connect GitHub repo for automatic deploys
```

### Netlify
```bash
# Build
npm run build

# Deploy build folder on netlify.com
# Or use Netlify CLI
```

### Environment Variables
Set in deployment platform:
```
REACT_APP_API_URL=https://your-backend-api.com
REACT_APP_WS_URL=https://your-backend-api.com
```

## Troubleshooting

### Can't connect to backend
```
Error: Network Error
```
Solution: 
- Check backend is running on correct port
- Verify REACT_APP_API_URL in .env
- Check CORS settings in backend

### WebSocket not connecting
```
WebSocket connection error
```
Solution:
- Check REACT_APP_WS_URL matches backend
- Ensure backend Socket.io CORS is configured
- Check firewall/network settings

### Build fails
```
Module not found
```
Solution:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Charts not displaying
Solution:
- Check data format matches expected structure
- Verify Recharts is installed
- Check browser console for errors

## Performance Tips

1. Use React.memo for expensive components
2. Limit chart data points (keep last 50)
3. Debounce WebSocket updates if needed
4. Use production build for deployment
5. Enable gzip compression on server

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Requires JavaScript enabled.

## License

MIT
