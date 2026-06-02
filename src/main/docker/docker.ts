import { exec } from 'child_process';
import { platform } from 'os';
import { Docker } from 'docker-cli-js';

export interface DockerContainer {
  id: string;
  names: string[];
  image: string;
  state: string;
  status: string;
  ports: string;
  created: string;
  mounts: string[];
  labels: { [key: string]: string };
  size: string;
  networks: string[];
  command: string;
  environment: string[];
}

export class DockerService {
  private isWindows: boolean;

  constructor() {
    this.isWindows = platform() === 'win32';
  }

  async runContainer(image: string, options: string[] = [], runCommand: string = ""): Promise<string> {
    // For Windows, we need to ensure the Docker Desktop is running
    try {
      // Check if image exists locally
      const hasImage = await this.imageExists(image);
      if (!hasImage) {
        console.log(`Image ${image} not found locally, pulling...`);
        await this.pullImage(image);
      }

      return this.isWindows
        ? this.runContainerWindows(image, options, runCommand)
        : this.runContainerUnix(image, options, runCommand);
    } catch (error) {
      throw new Error(`Docker error: ${error.message}`);
    }
  }

  async resumeContainer(containerId: string): Promise<string> {
    const command = this.isWindows
      ? `powershell docker start ${containerId}`
      : `docker start ${containerId}`;

    return await this.execCommand(command);
  }

  private async runContainerWindows(image: string, options: string[], runCommand: string): Promise<string> {
    try {
      // First, check if Docker Desktop is running
      await this.checkDockerDesktop();

      // Use PowerShell to run Docker commands
      const command = `powershell  ${runCommand}`;
      return await this.execCommand(command);
    } catch (error) {
      throw new Error(`Docker error: ${error.message}`);
    }
  }

  private runContainerUnix(image: string, options: string[], runCommand: string): Promise<string> {
    const command = runCommand;
    return this.execCommand(command);
  }

  private async checkDockerDesktop(): Promise<void> {
    try {
      // Check if Docker Desktop process is running
      const command = 'powershell Get-Process com.docker.backend -ErrorAction SilentlyContinue';
      await this.execCommand(command);
    } catch (error) {
      throw new Error('Docker Desktop is not running. Please start Docker Desktop first.');
    }
  }

  async isDockerRunning(): Promise<boolean> {
    try {
      const command = this.isWindows
        ? 'powershell docker info'
        : 'docker info';

      await this.execCommand(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Helper to start Docker Desktop on Windows
  async startDockerDesktop(): Promise<void> {
    if (!this.isWindows) {
      throw new Error('This method is only supported on Windows');
    }

    try {
      // Path to Docker Desktop
      const dockerPath = 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe';
      await this.execCommand(`start "" "${dockerPath}"`);

      // Wait for Docker to start (you might want to implement a proper polling mechanism)
      await new Promise(resolve => setTimeout(resolve, 20000));
    } catch (error) {
      throw new Error(`Failed to start Docker Desktop: ${error.message}`);
    }
  }

  async execCommand(command: string): Promise<string> {
    try {
      let env = { ...process.env };

      // Handle different OS environments
      switch (platform()) {
        case 'darwin': // macOS
          env.PATH = `/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Applications/Docker.app/Contents/Resources/bin:${process.env.PATH}`;
          break;
        case 'linux':
          env.PATH = `/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${process.env.PATH}`;
          break;
        case 'win32':
          // Windows typically uses different path format and has Docker Desktop in Program Files
          env.PATH = `${process.env.ProgramFiles}\\Docker\\Docker\\resources\\bin;${process.env.PATH}`;
          break;
      }

      return new Promise((resolve, reject) => {
        exec(command, { env }, (error, stdout, stderr) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });
    } catch (error) {
      console.error('Error executing command:', error);
      throw error;
    }
  }

  async pullImage(image: string): Promise<string> {
    const command = this.isWindows
      ? `powershell docker pull ${image}`
      : `docker pull ${image}`;

    try {
      return await this.execCommand(command);
    } catch (error) {
      throw new Error(`Failed to pull Docker image: ${error.message}`);
    }
  }

  async imageExists(image: string): Promise<boolean> {
    const command = this.isWindows
      ? `powershell docker image inspect ${image}`
      : `docker image inspect ${image}`;

    try {
      await this.execCommand(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getRunningContainers(): Promise<DockerContainer[]> {
    try {
      const command = this.isWindows
        ? 'powershell docker ps --format "{{json .}}"'
        : 'docker ps --format "{{json .}}"';

      const output = await this.execCommand(command);
      const containers = await this.parseContainers(output, false);
      return containers;
    } catch (error) {
      throw new Error(`Failed to get running containers: ${error.message}`);
    }
  }

  async getAllContainers(): Promise<DockerContainer[]> {
    try {
      const command = this.isWindows
        ? 'powershell docker ps -a --format "{{json .}}"'
        : 'docker ps -a --format "{{json .}}"';

      const output = await this.execCommand(command);
      const containers = await this.parseContainers(output, true);
      return containers;
    } catch (error) {
      throw new Error(`Failed to get all containers: ${error.message}`);
    }
  }

  async stopContainer(containerId: string): Promise<void> {
    const command = this.isWindows
      ? `powershell docker stop ${containerId}`
      : `docker stop ${containerId}`;

    try {
      await this.execCommand(command);
    } catch (error) {
      throw new Error(`Failed to stop container: ${error.message}`);
    }
  }

  async removeContainer(containerId: string): Promise<void> {
    const command = this.isWindows
      ? `powershell docker rm -f -v ${containerId}`
      : `docker rm -f -v ${containerId}`;

    try {
      await this.execCommand(command);
    } catch (error) {
      throw new Error(`Failed to remove container: ${error.message}`);
    }
  }

  async getContainerEnv(containerId: string): Promise<string[]> {
    const command = this.isWindows
      ? `powershell docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${containerId}`
      : `docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${containerId}`;

    try {
      const output = await this.execCommand(command);
      return output.trim().split('\n').filter(line => line.length > 0);
    } catch (error) {
      console.error(`Failed to get environment variables for container ${containerId}:`, error);
      return [];
    }
  }

  private async parseContainers(output: string, includeAll: boolean): Promise<DockerContainer[]> {
    const containers = await Promise.all(
      output
        .trim()
        .split('\n')
        .filter(line => line.length > 0)
        .map(async line => {
          try {
            const container = JSON.parse(line);
            const env = await this.getContainerEnv(container.ID);

            return {
              id: container.ID,
              names: [container.Names],
              image: container.Image,
              state: container.State,
              status: container.Status,
              ports: container.Ports?.replace(/0\.0\.0\.0:/g, ''),
              created: container.CreatedAt,
              mounts: container.Mounts?.split(',').map(m => m.trim()) || [],
              labels: container.Labels,
              size: container.Size,
              networks: container.Networks,
              command: container.Command,
              environment: env
            } as DockerContainer;
          } catch (error) {
            console.error('Error parsing container data:', error);
            return null;
          }
        })
    );

    return containers.filter((container): container is DockerContainer => container !== null);
  }
}

export const dockerService = new DockerService();
