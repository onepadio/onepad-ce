import { useEffect } from 'react';
import { useStore } from 'react-redux';
import log from 'loglevel';
import screenshotManager from '../services/screenshotManager';

/**
 * Screenshot Manager Hub
 * Initializes and manages the background screenshot capture service
 * This component starts the service on mount and stops it on unmount
 */
function ScreenshotManagerHub() {
  const store = useStore();

  useEffect(() => {
    log.debug('ScreenshotManagerHub: Initializing');
    
    // Start the background screenshot manager
    screenshotManager.start(store);

    // Cleanup: stop the manager when component unmounts
    return () => {
      log.debug('ScreenshotManagerHub: Cleaning up');
      screenshotManager.stop();
    };
  }, [store]);

  // This is a service component, it doesn't render anything
  return null;
}

export default ScreenshotManagerHub;
