const { screen } = require('electron');

class ActivityTracker {
  constructor(mainWindow) {
    if (!mainWindow) {
      throw new Error('MainWindow is required for ActivityTracker');
    }
    this.mainWindow = mainWindow;
    this.lastActivityTime = Date.now();
    this.inactivityThreshold = 30000; // 30 seconds in milliseconds
    this.isTracking = false;
    this.activityCheckInterval = null;
    this.mousePosition = { x: 0, y: 0 };
  }

  startTracking() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.lastActivityTime = Date.now();
    
    // Start checking for inactivity
    this.activityCheckInterval = setInterval(() => {
      this.checkInactivity();
    }, 1000); // Check every second
    
    // Track mouse movement
    this.trackMouseMovement();
    
    console.log('Activity tracking started');
  }

  stopTracking() {
    if (!this.isTracking) return;
    
    this.isTracking = false;
    
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
      this.activityCheckInterval = null;
    }
    
    console.log('Activity tracking stopped');
  }

  trackMouseMovement() {
    // Get mouse position every 100ms
    setInterval(() => {
      if (!this.isTracking) return;
      
      const point = screen.getCursorScreenPoint();
      const newPosition = { x: point.x, y: point.y };
      
      // Check if mouse has moved
      if (newPosition.x !== this.mousePosition.x || newPosition.y !== this.mousePosition.y) {
        this.updateActivity();
        this.mousePosition = newPosition;
      }
    }, 100);
  }

  updateActivity() {
    this.lastActivityTime = Date.now();
    
    // Send activity update to renderer
    try {
      if (this.mainWindow && !this.mainWindow.isDestroyed() && this.mainWindow.webContents) {
        this.mainWindow.webContents.send('activity-update', {
          timestamp: this.lastActivityTime,
          position: this.mousePosition
        });
      }
    } catch (error) {
      console.error('Error sending activity update:', error);
    }
  }

  checkInactivity() {
    if (!this.isTracking) return;
    
    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - this.lastActivityTime;
    
    if (timeSinceLastActivity >= this.inactivityThreshold) {
      // Send inactivity alert to renderer
      try {
        if (this.mainWindow && !this.mainWindow.isDestroyed() && this.mainWindow.webContents) {
          this.mainWindow.webContents.send('inactivity-alert', {
            inactiveTime: timeSinceLastActivity,
            threshold: this.inactivityThreshold
          });
        }
      } catch (error) {
        console.error('Error sending inactivity alert:', error);
      }
    }
  }

  resetActivity() {
    this.lastActivityTime = Date.now();
    
    // Send reset confirmation to renderer
    try {
      if (this.mainWindow && !this.mainWindow.isDestroyed() && this.mainWindow.webContents) {
        this.mainWindow.webContents.send('activity-reset', {
          timestamp: this.lastActivityTime
        });
      }
    } catch (error) {
      console.error('Error sending activity reset:', error);
    }
  }

  setInactivityThreshold(threshold) {
    this.inactivityThreshold = threshold;
  }

  pauseTracking() {
    if (!this.isTracking) return;
    
    this.isTracking = false;
    
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
      this.activityCheckInterval = null;
    }
    
    console.log('Activity tracking paused');
  }

  resumeTracking() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.lastActivityTime = Date.now();
    
    // Start checking for inactivity
    this.activityCheckInterval = setInterval(() => {
      this.checkInactivity();
    }, 1000); // Check every second
    
    console.log('Activity tracking resumed');
  }

  getCurrentActivity() {
    return {
      lastActivityTime: this.lastActivityTime,
      isTracking: this.isTracking,
      mousePosition: this.mousePosition,
      timeSinceLastActivity: Date.now() - this.lastActivityTime
    };
  }
}

module.exports = ActivityTracker; 