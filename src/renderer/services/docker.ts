// @ts-nocheck — electronAPI is injected at runtime via preload
const isElectron = window?.electronAPI !== undefined;
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

  async runContainer(image, options = [], runCommand = '') {
    if (!isElectron) {
      console.warn('Docker service is only available in Electron environment');
      return null;
    }

    try {
      return await ipcRenderer.invoke('run-docker-container', {
        image,
        options,
        runCommand,
      });
    } catch (error) {
      console.error('Failed to run Docker container:', error);
      throw error;
    }
  }

  async resumeContainer(containerId) {
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

  async stopContainer(containerId) {
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

  async removeContainer(containerId) {
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

  async getImages() {
    if (!isElectron) {
      console.warn('Docker service is only available in Electron environment');
      return [];
    }
    try {
      return await ipcRenderer.invoke('get-docker-images');
    } catch (error) {
      console.error('Failed to get Docker images:', error);
      throw error;
    }
  }

  async removeImage(imageId) {
    if (!isElectron) {
      console.warn('Docker service is only available in Electron environment');
      return null;
    }
    try {
      return await ipcRenderer.invoke('remove-docker-image', imageId);
    } catch (error) {
      console.error('Failed to remove Docker image:', error);
      throw error;
    }
  }

  async getVolumes() {
    if (!isElectron) {
      console.warn('Docker service is only available in Electron environment');
      return [];
    }
    try {
      return await ipcRenderer.invoke('get-docker-volumes');
    } catch (error) {
      console.error('Failed to get Docker volumes:', error);
      throw error;
    }
  }

  async removeVolume(name) {
    if (!isElectron) {
      console.warn('Docker service is only available in Electron environment');
      return null;
    }
    try {
      return await ipcRenderer.invoke('remove-docker-volume', name);
    } catch (error) {
      console.error('Failed to remove Docker volume:', error);
      throw error;
    }
  }

  async restartContainer(containerId) {
    if (!isElectron) return null;
    return await ipcRenderer.invoke('restart-docker-container', containerId);
  }

  async getContainerLogs(containerId, tail = 300) {
    if (!isElectron) return '';
    return await ipcRenderer.invoke('get-docker-container-logs', {
      containerId,
      tail,
    });
  }

  async inspectContainer(containerId) {
    if (!isElectron) return null;
    return await ipcRenderer.invoke('inspect-docker-container', containerId);
  }

  async getContainerStats(containerId) {
    if (!isElectron) return null;
    return await ipcRenderer.invoke('get-docker-container-stats', containerId);
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
