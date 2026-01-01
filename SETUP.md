# Monipx - Setup Guide

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.4
- npm >= 10.0.0
- Docker and Docker Compose (for containerized deployment)

### Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run database migrations:**
   ```bash
   node server/database/migrate.js
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   This will start both the backend server (port 3001) and frontend dev server (port 5173).

4. **Access the application:**
   - Frontend: http://localhost:5173
   - API: http://localhost:3001/api
   - Health check: http://localhost:3001/health

### Production Build

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Access the application:**
   - Application: http://localhost:3001

### Docker Setup

1. **Build and run with Docker Compose:**
   ```bash
   docker compose up -d
   ```

2. **Access the application:**
   - Application: http://localhost:3001

3. **View logs:**
   ```bash
   docker compose logs -f
   ```

4. **Stop the container:**
   ```bash
   docker compose down
   ```

### Docker Build

1. **Build the Docker image:**
   ```bash
   docker build -t monipx:latest .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name monipx \
     -p 3001:3001 \
     -v $(pwd)/data:/app/data \
     -v $(pwd)/logs:/app/logs \
     monipx:latest
   ```

## 📁 Project Structure

```
monipx/
├── server/                 # Backend server
│   ├── server.js          # Main server entry point
│   ├── routes/            # API routes
│   ├── database/          # Database setup and migrations
│   ├── models/            # Data models (to be created)
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── src/                   # Frontend Vue.js application
│   ├── main.js           # Vue app entry point
│   ├── App.vue           # Root component
│   ├── views/            # Page components
│   ├── components/       # Reusable components
│   ├── stores/           # Pinia state management
│   ├── services/         # API and Socket services
│   └── assets/           # Static assets
├── public/               # Public static files
├── data/                 # Database files (created at runtime)
├── logs/                 # Log files (created at runtime)
├── Dockerfile            # Docker build configuration
├── docker-compose.yml    # Docker Compose configuration
└── package.json          # Node.js dependencies
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3001
DB_PATH=./data/monipx.db
LOG_LEVEL=info
```

### Database

The application uses SQLite by default. The database file will be created at:
- Development: `./data/monipx.db`
- Docker: `/app/data/monipx.db`

## 📝 Development Scripts

- `npm run dev` - Start both backend and frontend in development mode
- `npm run dev:server` - Start only the backend server
- `npm run dev:client` - Start only the frontend dev server
- `npm run build` - Build the frontend for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🐛 Troubleshooting

### Port Already in Use

If port 3001 is already in use, change it in `.env`:
```env
PORT=3002
```

### Database Migration Errors

If you encounter database errors, delete the database file and run migrations again:
```bash
rm -rf data/monipx.db
node server/database/migrate.js
```

### Docker Issues

If Docker build fails, try:
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

## 📚 Next Steps

1. Review the [PROJECT_SPECIFICATION.md](./PROJECT_SPECIFICATION.md) for detailed feature documentation
2. Check [TASKS_V1.md](./TASKS_V1.md) for development tasks
3. Start implementing features according to the roadmap

## 🆘 Support

For issues or questions, please refer to the project documentation or create an issue in the repository.

