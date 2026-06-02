// Event Hub replacement for AWS Amplify Hub
type EventListener = (data: any) => void;

interface HubEvent {
  payload: {
    event: string;
    data?: any;
  };
}

class EventHub {
  private listeners: Map<string, EventListener[]> = new Map();

  listen(channel: string, callback: EventListener): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
    
    const channelListeners = this.listeners.get(channel)!;
    channelListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = channelListeners.indexOf(callback);
      if (index > -1) {
        channelListeners.splice(index, 1);
      }
    };
  }

  dispatch(channel: string, event: HubEvent): void {
    const channelListeners = this.listeners.get(channel);
    if (channelListeners) {
      channelListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in hub listener for channel ${channel}:`, error);
        }
      });
    }
  }

  // Auth-specific methods for compatibility
  dispatchAuthEvent(eventType: 'signIn' | 'signOut' | 'signUp', data?: any): void {
    this.dispatch('auth', {
      payload: {
        event: eventType,
        data
      }
    });
  }
}

// Create singleton instance
export const Hub = new EventHub();

export default Hub;
