// Analytics replacement for AWS Amplify Analytics
export interface AnalyticsEvent {
  name: string;
  attributes?: Record<string, any>;
  metrics?: Record<string, number>;
}

class CustomAnalytics {
  private isEnabled: boolean = true;

  constructor() {
    // Initialize your analytics service here
    this.isEnabled = import.meta.env.MODE === 'production';
  }

  async record(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled) {
      console.log('Analytics (dev):', event);
      return;
    }

    try {
      // Implement your analytics tracking here
      // Examples:
      // - Send to Google Analytics
      // - Send to your own analytics API
      // - Send to PostHog, Mixpanel, etc.

      console.log('Analytics event:', event);

      // Example implementation:
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }
}

// Create singleton instance
export const Analytics = new CustomAnalytics();

// Compatibility functions for AWS Amplify Analytics
export const record = (event: AnalyticsEvent) => Analytics.record(event);
export const enable = () => Analytics.enable();
export const disable = () => Analytics.disable();

export default Analytics;
