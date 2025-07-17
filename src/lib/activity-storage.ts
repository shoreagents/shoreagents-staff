export interface ActivitySession {
  userId: string;
  startTime: number;
  endTime?: number;
  type: 'active' | 'inactive' | 'break';
  duration?: number;
}

export interface UserActivityData {
  userId: string;
  currentSessionStart: number;
  isCurrentlyActive: boolean;
  totalActiveTime: number;
  totalInactiveTime: number;
  inactivityAlerts: number;
  activitySessions: ActivitySession[];
  lastActivityTime: number;
  isInBreak?: boolean; // Added for break mode
  pausedSessionStart?: number; // Added for break mode
}

export const getActivityStorageKey = (userId: string) => {
  return `shoreagents-activity-${userId}`;
};

export const initializeUserActivity = (userId: string) => {
  if (typeof window === 'undefined') return;
  
  const key = getActivityStorageKey(userId);
  const existingData = localStorage.getItem(key);
  
  if (!existingData) {
    const now = Date.now();
    const initialData: UserActivityData = {
      userId,
      currentSessionStart: now,
      isCurrentlyActive: true,
      totalActiveTime: 0,
      totalInactiveTime: 0,
      inactivityAlerts: 0,
      activitySessions: [{
        userId,
        startTime: now,
        type: 'active'
      }],
      lastActivityTime: now
    };
    
    localStorage.setItem(key, JSON.stringify(initialData));
  }
};

export const startActiveSession = (userId: string) => {
  if (typeof window === 'undefined') return;
  
  const key = getActivityStorageKey(userId);
  const existingData = localStorage.getItem(key);
  
  if (existingData) {
    const userData: UserActivityData = JSON.parse(existingData);
    const now = Date.now();
    
    // Only start a new active session if currently inactive
    if (!userData.isCurrentlyActive) {
      // End the inactive session and calculate duration
      if (userData.currentSessionStart) {
        const inactiveDuration = now - userData.currentSessionStart;
        userData.totalInactiveTime += inactiveDuration;
        
        // Update the last inactive session with end time and duration
        const activitySessions = userData.activitySessions || [];
        const lastSession = activitySessions[activitySessions.length - 1];
        if (lastSession && lastSession.type === 'inactive') {
          lastSession.endTime = now;
          lastSession.duration = inactiveDuration;
        }
      }
      
      // Start new active session
      userData.isCurrentlyActive = true;
      userData.currentSessionStart = now;
      userData.lastActivityTime = now;
      
      // Add new active session
      if (!userData.activitySessions) {
        userData.activitySessions = [];
      }
      userData.activitySessions.push({
        userId,
        startTime: now,
        type: 'active'
      });
      
      // Keep only last 100 sessions to prevent localStorage from getting too large
      if (userData.activitySessions.length > 100) {
        userData.activitySessions = userData.activitySessions.slice(-100);
      }
    } else {
      // User is already active, just update last activity time
      userData.lastActivityTime = now;
    }
    
    localStorage.setItem(key, JSON.stringify(userData));
  } else {
    initializeUserActivity(userId);
  }
};

export const startInactiveSession = (userId: string) => {
  if (typeof window === 'undefined') return;
  
  const key = getActivityStorageKey(userId);
  const existingData = localStorage.getItem(key);
  
  if (existingData) {
    const userData: UserActivityData = JSON.parse(existingData);
    const now = Date.now();
    
    // Only start inactive session if currently active (transition from active to inactive)
    if (userData.isCurrentlyActive) {
      // End the active session and calculate duration
      if (userData.currentSessionStart) {
        const activeDuration = now - userData.currentSessionStart;
        userData.totalActiveTime += activeDuration;
        
        // Update the last active session with end time and duration
        const activitySessions = userData.activitySessions || [];
        const lastSession = activitySessions[activitySessions.length - 1];
        if (lastSession && lastSession.type === 'active') {
          lastSession.endTime = now;
          lastSession.duration = activeDuration;
        }
      }
      
      // Start new inactive session (only when dialog shows up)
      userData.isCurrentlyActive = false;
      userData.currentSessionStart = now;
      userData.inactivityAlerts++;
      
      // Add new inactive session
      if (!userData.activitySessions) {
        userData.activitySessions = [];
      }
      userData.activitySessions.push({
        userId,
        startTime: now,
        type: 'inactive'
      });
      
      // Keep only last 100 sessions to prevent localStorage from getting too large
      if (userData.activitySessions.length > 100) {
        userData.activitySessions = userData.activitySessions.slice(-100);
      }
      
      localStorage.setItem(key, JSON.stringify(userData));
    }
    // If already inactive, do nothing (don't create duplicate inactive sessions)
  }
};

export const updateLastActivity = (userId: string) => {
  if (typeof window === 'undefined') return;
  
  const key = getActivityStorageKey(userId);
  const existingData = localStorage.getItem(key);
  
  if (existingData) {
    const userData: UserActivityData = JSON.parse(existingData);
    const now = Date.now();
    
    // If user is in break mode, do nothing (don't start new sessions during break)
    if (userData.isInBreak) {
      return;
    }
    
    // If user is currently inactive, transition to active (mouse moved after inactivity)
    if (!userData.isCurrentlyActive) {
      // End the inactive session and calculate duration
      if (userData.currentSessionStart) {
        const inactiveDuration = now - userData.currentSessionStart;
        userData.totalInactiveTime += inactiveDuration;
        
        // Update the last inactive session with end time and duration
        const activitySessions = userData.activitySessions || [];
        const lastSession = activitySessions[activitySessions.length - 1];
        if (lastSession && lastSession.type === 'inactive') {
          lastSession.endTime = now;
          lastSession.duration = inactiveDuration;
        }
      }
      
      // Start new active session
      userData.isCurrentlyActive = true;
      userData.currentSessionStart = now;
      userData.lastActivityTime = now;
      
      // Add new active session
      if (!userData.activitySessions) {
        userData.activitySessions = [];
      }
      userData.activitySessions.push({
        userId,
        startTime: now,
        type: 'active'
      });
      
      // Keep only last 100 sessions to prevent localStorage from getting too large
      if (userData.activitySessions.length > 100) {
        userData.activitySessions = userData.activitySessions.slice(-100);
      }
    } else {
      // User is already active, just update last activity time
      // Don't create a new session, just update the timestamp
      userData.lastActivityTime = now;
    }
    
    localStorage.setItem(key, JSON.stringify(userData));
  }
};

export const getUserActivityData = (userId: string): UserActivityData | null => {
  if (typeof window === 'undefined') return null;
  
  const key = getActivityStorageKey(userId);
  const data = localStorage.getItem(key);
  
  if (data) {
    return JSON.parse(data);
  }
  
  return null;
};

export const getCurrentUserActivityData = (): UserActivityData | null => {
  if (typeof window === 'undefined') return null;
  
  const authData = localStorage.getItem("shoreagents-auth");
  if (!authData) return null;
  
  try {
    const parsed = JSON.parse(authData);
    const userEmail = parsed.user?.email;
    if (userEmail) {
      return getUserActivityData(userEmail);
    }
  } catch {
    return null;
  }
  
  return null;
};

export const clearUserActivityData = (userId: string) => {
  if (typeof window === 'undefined') return;
  
  const key = getActivityStorageKey(userId);
  localStorage.removeItem(key);
};

export const cleanupDuplicateSessions = (userId: string) => {
  if (typeof window === 'undefined') return;
  
  const key = getActivityStorageKey(userId);
  const existingData = localStorage.getItem(key);
  
  if (existingData) {
    const userData: UserActivityData = JSON.parse(existingData);
    const now = Date.now();
    
    // Clean up activity sessions - remove any incomplete sessions except the current one
    if (userData.activitySessions && userData.activitySessions.length > 0) {
      const cleanedSessions = userData.activitySessions.filter((session, index) => {
        // Keep sessions that have both start and end times
        if (session.endTime && session.duration) {
          return true;
        }
        
        // Keep the last session if it's the current active session
        if (index === userData.activitySessions.length - 1 && userData.isCurrentlyActive) {
          return true;
        }
        
        // Remove incomplete sessions
        return false;
      });
      
      userData.activitySessions = cleanedSessions;
    }
    
    localStorage.setItem(key, JSON.stringify(userData));
  }
};

export const markUserAsLoggedOut = (userId: string) => {
  if (typeof window === 'undefined') return;
  
  const key = getActivityStorageKey(userId);
  const existingData = localStorage.getItem(key);
  
  if (existingData) {
    const userData: UserActivityData = JSON.parse(existingData);
    const now = Date.now();
    
    // If user is currently active, end their active session
    if (userData.isCurrentlyActive && userData.currentSessionStart) {
      const activeDuration = now - userData.currentSessionStart;
      userData.totalActiveTime += activeDuration;
      
      // Update the last active session with end time and duration
      const activitySessions = userData.activitySessions || [];
      const lastSession = activitySessions[activitySessions.length - 1];
      if (lastSession && lastSession.type === 'active') {
        lastSession.endTime = now;
        lastSession.duration = activeDuration;
      }
    }
    
    // Mark user as inactive (logged out)
    userData.isCurrentlyActive = false;
    userData.currentSessionStart = 0; // Clear current session
    userData.lastActivityTime = now;
    
    localStorage.setItem(key, JSON.stringify(userData));
  }
};

export const pauseActivityForBreak = (userId: string) => {
  if (typeof window === 'undefined') return;
  
  const key = getActivityStorageKey(userId);
  const existingData = localStorage.getItem(key);
  
  if (existingData) {
    const userData: UserActivityData = JSON.parse(existingData);
    const now = Date.now();
    
    // If user is currently active, pause the current session without ending it
    if (userData.isCurrentlyActive && userData.currentSessionStart) {
      // Calculate current session duration so far
      const currentSessionDuration = now - userData.currentSessionStart;
      userData.totalActiveTime += currentSessionDuration;
      
      // Update the last active session with end time and duration
      const activitySessions = userData.activitySessions || [];
      const lastSession = activitySessions[activitySessions.length - 1];
      if (lastSession && lastSession.type === 'active') {
        lastSession.endTime = now;
        lastSession.duration = currentSessionDuration;
      }
      
      // Store the paused session start time to resume later
      userData.pausedSessionStart = userData.currentSessionStart;
      userData.currentSessionStart = 0; // Clear current session
    }
    
    // Mark user as in break (paused)
    userData.isCurrentlyActive = false;
    userData.lastActivityTime = now;
    userData.isInBreak = true; // Add break flag
    
    // Add break session to activity sessions
    if (!userData.activitySessions) {
      userData.activitySessions = [];
    }
    userData.activitySessions.push({
      userId,
      startTime: now,
      type: 'break'
    });
    
    // Keep only last 100 sessions to prevent localStorage from getting too large
    if (userData.activitySessions.length > 100) {
      userData.activitySessions = userData.activitySessions.slice(-100);
    }
    
    localStorage.setItem(key, JSON.stringify(userData));
  }
};

export const resumeActivityFromBreak = (userId: string) => {
  if (typeof window === 'undefined') return;
  
  const key = getActivityStorageKey(userId);
  const existingData = localStorage.getItem(key);
  
  if (existingData) {
    const userData: UserActivityData = JSON.parse(existingData);
    const now = Date.now();
    
    // Remove break flag and resume tracking
    userData.isInBreak = false;
    userData.isCurrentlyActive = true;
    userData.currentSessionStart = now; // Start new session from now
    userData.lastActivityTime = now;
    userData.pausedSessionStart = undefined; // Clear paused session data
    
    // Add new active session
    if (!userData.activitySessions) {
      userData.activitySessions = [];
    }
    userData.activitySessions.push({
      userId,
      startTime: now,
      type: 'active'
    });
    
    // Keep only last 100 sessions to prevent localStorage from getting too large
    if (userData.activitySessions.length > 100) {
      userData.activitySessions = userData.activitySessions.slice(-100);
    }
    
    localStorage.setItem(key, JSON.stringify(userData));
  }
};

export const getActivitySummary = (userId: string) => {
  const data = getUserActivityData(userId);
  if (!data) return null;
  
  const now = Date.now();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  
  // Calculate current session duration
  let currentActiveTime = 0;
  let currentInactiveTime = 0;
  
  if (data.isCurrentlyActive && data.currentSessionStart) {
    currentActiveTime = now - data.currentSessionStart;
  } else if (!data.isCurrentlyActive && data.currentSessionStart) {
    // Only count inactive time if we're in an inactive session (dialog showed up)
    currentInactiveTime = now - data.currentSessionStart;
  }
  
  // If in break mode, don't add any current session time
  if (data.isInBreak) {
    currentActiveTime = 0;
    currentInactiveTime = 0;
  }
  
  // Get today's sessions - handle case where activitySessions might be undefined
  const activitySessions = data.activitySessions || [];
  const todaySessions = activitySessions.filter(session => session.startTime >= startOfDay);
  const todayActiveSessions = todaySessions.filter(session => session.type === 'active');
  const todayInactiveSessions = todaySessions.filter(session => session.type === 'inactive');
  
  // Calculate today's totals
  const todayActiveTime = todayActiveSessions.reduce((total, session) => {
    return total + (session.duration || 0);
  }, 0) + (data.isCurrentlyActive && !data.isInBreak ? currentActiveTime : 0);
  
  const todayInactiveTime = todayInactiveSessions.reduce((total, session) => {
    return total + (session.duration || 0);
  }, 0) + (!data.isCurrentlyActive && !data.isInBreak ? currentInactiveTime : 0);
  
  return {
    totalActiveTime: (data.totalActiveTime || 0) + (data.isInBreak ? 0 : currentActiveTime),
    totalInactiveTime: (data.totalInactiveTime || 0) + (data.isInBreak ? 0 : currentInactiveTime),
    totalInactivityAlerts: data.inactivityAlerts || 0,
    todayActiveTime,
    todayInactiveTime,
    todayActiveSessions: todayActiveSessions.length,
    todayInactiveSessions: todayInactiveSessions.length,
    lastActivity: new Date(data.lastActivityTime || now).toLocaleString(),
    isCurrentlyActive: data.isCurrentlyActive || false,
    isInBreak: data.isInBreak || false
  };
}; 

export const getCurrentSessionStatus = (userId: string) => {
  const data = getUserActivityData(userId);
  if (!data) return null;
  
  const now = Date.now();
  
  if (data.isInBreak) {
    return {
      type: 'break',
      status: 'On Break',
      startTime: data.pausedSessionStart || data.lastActivityTime,
      duration: 0, // No active duration during break
      isActive: false
    };
  }
  
  if (data.isCurrentlyActive && data.currentSessionStart) {
    const duration = now - data.currentSessionStart;
    return {
      type: 'active',
      status: 'Active Session Ongoing',
      startTime: data.currentSessionStart,
      duration,
      isActive: true
    };
  }
  
  if (!data.isCurrentlyActive && data.currentSessionStart) {
    const duration = now - data.currentSessionStart;
    return {
      type: 'inactive',
      status: 'Inactive Session',
      startTime: data.currentSessionStart,
      duration,
      isActive: false
    };
  }
  
  return {
    type: 'none',
    status: 'No Active Session',
    startTime: null,
    duration: 0,
    isActive: false
  };
}; 