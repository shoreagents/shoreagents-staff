import { useState, useEffect, useCallback } from 'react';
import { startActiveSession, startInactiveSession, updateLastActivity, initializeUserActivity } from '@/lib/activity-storage';
import { getCurrentUser } from '@/lib/ticket-utils';

interface ActivityData {
  timestamp: number;
  position: { x: number; y: number };
}

interface InactivityAlert {
  inactiveTime: number;
  threshold: number;
}

interface ActivityStatus {
  lastActivityTime: number;
  isTracking: boolean;
  mousePosition: { x: number; y: number };
  timeSinceLastActivity: number;
}

export const useActivityTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [lastActivity, setLastActivity] = useState<ActivityData | null>(null);
  const [showInactivityDialog, setShowInactivityDialog] = useState(false);
  const [inactivityData, setInactivityData] = useState<InactivityAlert | null>(null);
  const [activityStatus, setActivityStatus] = useState<ActivityStatus | null>(null);

  // Start activity tracking
  const startTracking = useCallback(async () => {
    if (!window.electronAPI) {
      console.warn('electronAPI not available - running in browser mode');
      return;
    }
    
    try {
      const result = await window.electronAPI.activityTracking.start();
      if (result.success) {
        setIsTracking(true);
        console.log('Activity tracking started');
      } else {
        console.error('Failed to start activity tracking:', result.error);
      }
    } catch (error) {
      console.error('Error starting activity tracking:', error);
    }
  }, []);

  // Stop activity tracking
  const stopTracking = useCallback(async () => {
    if (!window.electronAPI) {
      console.warn('electronAPI not available - running in browser mode');
      return;
    }
    
    try {
      const result = await window.electronAPI.activityTracking.stop();
      if (result.success) {
        setIsTracking(false);
        console.log('Activity tracking stopped');
      } else {
        console.error('Failed to stop activity tracking:', result.error);
      }
    } catch (error) {
      console.error('Error stopping activity tracking:', error);
    }
  }, []);

  // Pause activity tracking
  const pauseTracking = useCallback(async () => {
    if (!window.electronAPI) {
      console.warn('electronAPI not available - running in browser mode');
      return;
    }
    
    try {
      const result = await window.electronAPI.activityTracking.pause();
      if (result.success) {
        setIsTracking(false);
        console.log('Activity tracking paused');
      } else {
        console.error('Failed to pause activity tracking:', result.error);
      }
    } catch (error) {
      console.error('Error pausing activity tracking:', error);
    }
  }, []);

  // Resume activity tracking
  const resumeTracking = useCallback(async () => {
    if (!window.electronAPI) {
      console.warn('electronAPI not available - running in browser mode');
      return;
    }
    
    try {
      const result = await window.electronAPI.activityTracking.resume();
      if (result.success) {
        setIsTracking(true);
        console.log('Activity tracking resumed');
      } else {
        console.error('Failed to resume activity tracking:', result.error);
      }
    } catch (error) {
      console.error('Error resuming activity tracking:', error);
    }
  }, []);

  // Reset activity
  const resetActivity = useCallback(async () => {
    if (!window.electronAPI) {
      console.warn('electronAPI not available - running in browser mode');
      return;
    }
    
    try {
      const result = await window.electronAPI.activityTracking.reset();
      if (result.success) {
        setShowInactivityDialog(false);
        setInactivityData(null);
        console.log('Activity reset');
      } else {
        console.error('Failed to reset activity:', result.error);
      }
    } catch (error) {
      console.error('Error resetting activity:', error);
    }
  }, []);

  // Set inactivity threshold
  const setInactivityThreshold = useCallback(async (threshold: number) => {
    if (!window.electronAPI) {
      console.warn('electronAPI not available - running in browser mode');
      return;
    }
    
    try {
      const result = await window.electronAPI.activityTracking.setThreshold(threshold);
      if (result.success) {
        console.log('Inactivity threshold set to:', threshold);
      } else {
        console.error('Failed to set inactivity threshold:', result.error);
      }
    } catch (error) {
      console.error('Error setting inactivity threshold:', error);
    }
  }, []);

  // Get activity status
  const getActivityStatus = useCallback(async () => {
    if (!window.electronAPI) {
      console.warn('electronAPI not available - running in browser mode');
      return;
    }
    
    try {
      const status = await window.electronAPI.activityTracking.getStatus();
      if (status && !status.error) {
        setActivityStatus(status);
        return status;
      } else {
        console.error('Failed to get activity status:', status.error);
      }
    } catch (error) {
      console.error('Error getting activity status:', error);
    }
  }, []);

  // Handle activity updates
  const handleActivityUpdate = useCallback((data: unknown) => {
    const activityData = data as ActivityData;
    setLastActivity(activityData);
    setShowInactivityDialog(false);
    setInactivityData(null);
    
    // Only update last activity time, don't start new sessions on every movement
    const currentUser = getCurrentUser();
    if (currentUser) {
      updateLastActivity(currentUser.email);
    }
  }, []);

  // Handle inactivity alerts
  const handleInactivityAlert = useCallback((data: unknown) => {
    const alertData = data as InactivityAlert;
    setInactivityData(alertData);
    setShowInactivityDialog(true);
    
    // Start inactive session when inactivity is detected
    const currentUser = getCurrentUser();
    if (currentUser) {
      startInactiveSession(currentUser.email);
    }
  }, []);

  // Handle activity reset
  const handleActivityReset = useCallback((data: unknown) => {
    const resetData = data as { timestamp: number };
    setLastActivity({ timestamp: resetData.timestamp, position: { x: 0, y: 0 } });
    setShowInactivityDialog(false);
    setInactivityData(null);
    
    // Just update last activity time when activity is reset
    const currentUser = getCurrentUser();
    if (currentUser) {
      updateLastActivity(currentUser.email);
    }
  }, []);

  // Update inactive time dynamically when dialog is shown
  useEffect(() => {
    if (showInactivityDialog && inactivityData) {
      const interval = setInterval(() => {
        setInactivityData(prev => {
          if (prev) {
            return {
              ...prev,
              inactiveTime: prev.inactiveTime + 1000 // Add 1 second
            };
          }
          return prev;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showInactivityDialog, inactivityData]);

  // Set up event listeners
  useEffect(() => {
    // Check if electronAPI is available
    if (!window.electronAPI) {
      console.warn('electronAPI not available - running in browser mode');
      return;
    }

    // Listen for activity updates
    window.electronAPI.receive('activity-update', handleActivityUpdate);
    
    // Listen for inactivity alerts
    window.electronAPI.receive('inactivity-alert', handleInactivityAlert);
    
    // Listen for activity resets
    window.electronAPI.receive('activity-reset', handleActivityReset);

    // Cleanup listeners on unmount
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('activity-update');
        window.electronAPI.removeAllListeners('inactivity-alert');
        window.electronAPI.removeAllListeners('activity-reset');
      }
    };
  }, [handleActivityUpdate, handleInactivityAlert, handleActivityReset]);

  // Get current activity status periodically
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        getActivityStatus();
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isTracking, getActivityStatus]);

  return {
    isTracking,
    lastActivity,
    showInactivityDialog,
    inactivityData,
    activityStatus,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    resetActivity,
    setInactivityThreshold,
    getActivityStatus,
    setShowInactivityDialog
  };
}; 