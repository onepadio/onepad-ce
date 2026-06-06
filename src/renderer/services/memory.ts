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

class MemoryService {
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
}

export const memoryService = new MemoryService();
