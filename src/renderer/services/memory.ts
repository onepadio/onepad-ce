declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

const ipcRenderer = window.electronAPI;

export interface MemoryInfo {
  workingSetSize: number;
  peakWorkingSetSize?: number;
  privateBytes?: number;
}

export interface TabMemoryInfo {
  id: number;
  url: string;
  title: string;
  memory: MemoryInfo | null;
}

export interface MemoryDataPoint {
  timestamp: number;
  totalMemory: number;
  systemMemory: number;
  tabsMemory: number;
}

class MemoryService {
  private memoryHistory: MemoryDataPoint[] = [];
  private trackingInterval: NodeJS.Timeout | null = null;
  private isTracking: boolean = false;
  private readonly HISTORY_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly TRACKING_INTERVAL = 5000; // 5 seconds

  async getTabMemoryInfo(webContentsId: number): Promise<MemoryInfo | null> {
    try {
      return await ipcRenderer.invoke('get-tab-memory-info', webContentsId);
    } catch (error) {
      console.error('Failed to get tab memory info:', error);
      return null;
    }
  }

  async getAllTabsMemory(): Promise<TabMemoryInfo[]> {
    try {
      const result = await ipcRenderer.invoke('get-all-tabs-memory');
      console.log('getAllTabsMemory result:', result);
      return result;
    } catch (error) {
      console.error('Failed to get all tabs memory:', error);
      return [];
    }
  }

  formatMemory(kb: number): string {
    if (!kb) return '0 MB';
    const mb = kb / 1024;
    if (mb < 1) return `${kb.toFixed(0)} KB`;
    return `${mb.toFixed(1)} MB`;
  }

  private async collectMemorySnapshot(): Promise<void> {
    try {
      const allMemory = await this.getAllTabsMemory();
      
      let totalMemory = 0;
      let tabsMemory = 0;
      
      allMemory.forEach((tabMem: TabMemoryInfo) => {
        if (tabMem.memory) {
          const memory = tabMem.memory.workingSetSize || 0;
          totalMemory += memory;
          tabsMemory += memory;
        }
      });
      
      const systemMemory = totalMemory - tabsMemory;
      const now = Date.now();
      
      const newDataPoint: MemoryDataPoint = {
        timestamp: now,
        totalMemory,
        systemMemory,
        tabsMemory,
      };
      
      // Add new data point and clean old data
      this.memoryHistory.push(newDataPoint);
      
      const cutoffTime = now - this.HISTORY_DURATION;
      this.memoryHistory = this.memoryHistory.filter(
        (point) => point.timestamp >= cutoffTime
      );
    } catch (error) {
      console.error('Failed to collect memory snapshot:', error);
    }
  }

  startTracking(): void {
    if (this.isTracking) {
      return;
    }

    this.isTracking = true;
    
    // Collect initial snapshot
    this.collectMemorySnapshot();
    
    // Start periodic collection
    this.trackingInterval = setInterval(() => {
      this.collectMemorySnapshot();
    }, this.TRACKING_INTERVAL);

    console.log('Memory tracking started');
  }

  stopTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    this.isTracking = false;
    console.log('Memory tracking stopped');
  }

  getMemoryHistory(): MemoryDataPoint[] {
    return [...this.memoryHistory];
  }

  clearHistory(): void {
    this.memoryHistory = [];
  }

  isTrackingActive(): boolean {
    return this.isTracking;
  }
}

export const memoryService = new MemoryService();
