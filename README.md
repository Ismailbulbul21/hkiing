# Connection Management System

A web application for managing remote connections.

## Features

- Attractive landing page that establishes connections
- Admin panel to view and manage active connections
- Remote monitoring capabilities
- MySQL database for persistent storage
- React frontend with modern UI

## Prerequisites

- Node.js (v14+)
- MySQL Server
- npm or yarn

## Setup

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

### 3. Configure Database

Edit the database configuration in `server.js` to match your MySQL settings:

```javascript
const db = mysql.createConnection({
  host: "localhost",
  user: "YOUR_MYSQL_USER",
  password: "YOUR_MYSQL_PASSWORD",
  database: "access_manager",
});
```

### 4. Running the Application

For development with hot reloading:

```bash
npm run dev:all
```

This will start both the React development server and the backend Express server.

For production build:

```bash
npm run build
npm start
```

## Usage

1. Visit the root URL (`http://localhost:5000`) to see the landing page
2. Click the "Access Resources" button to establish a connection
3. Access the admin panel at `/admin` to view active connections
4. Select a connection to view details and send commands

## Deployment

To deploy to a production server, build the React app and serve it with Express:

```bash
npm run build
npm start
```

The server will serve the React app from the `dist` directory and handle API requests.

## Security Note

This application is for educational purposes only. The connection features should only be used in environments where you have explicit permission to establish such connections.

---

For questions or issues, please open a GitHub issue.
