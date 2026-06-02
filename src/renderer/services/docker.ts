// Check if we're in Electron environment
// @ts-expect-error
const isElectron = window?.electronAPI !== undefined;
// @ts-expect-error
const ipcRenderer = isElectron ? window.electronAPI : null;

class DockerService {
  async getContainers(includeAll = false) {
    if (!isElectron) {
      console.warn('Docker service is only available in Electron environment');
      return [];
    }

    try {
      return await ipcRenderer.invoke('get-docker-containers', includeAll);
    } catch (error) {
      console.error('Failed to get Docker containers:', error);
      throw error;
    }
  }

  async runContainer(image: any, options = [], runCommand="") {
    if (!isElectron) {
      console.warn('Docker service is only available in Electron environment');
      return null;
    }

    try {
      return await ipcRenderer.invoke('run-docker-container', { image, options, runCommand });
    } catch (error) {
      console.error('Failed to run Docker container:', error);
      throw error;
    }
  }

  async resumeContainer(containerId: any) {
    if (!isElectron) {
      console.warn('Docker service is only available in Electron environment');
      return null;
    }

    try {
      return await ipcRenderer.invoke('resume-docker-container', containerId);
    } catch (error) {
      console.error('Failed to resume Docker container:', error);
      throw error;
    }
  }

  async stopContainer(containerId: any) {
    if (!isElectron) {
      console.warn('Docker service is only available in Electron environment');
      return null;
    }

    try {
      return await ipcRenderer.invoke('stop-docker-container', containerId);
    } catch (error) {
      console.error('Failed to stop Docker container:', error);
      throw error;
    }
  }

  async removeContainer(containerId: any) {
    if (!isElectron) {
      console.warn('Docker service is only available in Electron environment');
      return null;
    }

    try {
      return await ipcRenderer.invoke('remove-docker-container', containerId);
    } catch (error) {
      console.error('Failed to remove Docker container:', error);
      throw error;
    }
  }

  async isDockerRunning() {
    if (!isElectron) {
      console.warn('Docker service is only available in Electron environment');
      return false;
    }

    try {
      return await ipcRenderer.invoke('check-docker-status');
    } catch (error) {
      console.error('Failed to check Docker status:', error);
      throw error;
    }
  }
}

export const dockerService = new DockerService(); 