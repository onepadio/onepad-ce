import { exec } from 'child_process';
import { platform } from 'os';

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
  /** compose | swarm | standalone */
  stackKind: 'compose' | 'swarm' | 'standalone';
  /** Compose project or Swarm stack name; empty for standalone */
  stackName: string;
  /** Compose/Swarm service name when present */
  serviceName: string;
}

export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
}

export interface DockerVolume {
  name: string;
  driver: string;
  mountpoint: string;
  scope: string;
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
    } catch (error: any) {
      throw new Error(`Failed to remove container: ${error.message}`);
    }
  }

  async restartContainer(containerId: string): Promise<void> {
    const command = this.isWindows
      ? `powershell docker restart ${containerId}`
      : `docker restart ${containerId}`;
    try {
      await this.execCommand(command);
    } catch (error: any) {
      throw new Error(`Failed to restart container: ${error.message}`);
    }
  }

  async getContainerLogs(
    containerId: string,
    tail: number = 300
  ): Promise<string> {
    const command = this.isWindows
      ? `powershell docker logs --timestamps --tail ${tail} ${containerId}`
      : `docker logs --timestamps --tail ${tail} ${containerId} 2>&1`;
    try {
      return await this.execCommand(command);
    } catch (error: any) {
      // docker logs writes to stderr; exec may reject — still return message
      if (error?.stdout) return String(error.stdout);
      if (error?.message) return String(error.message);
      throw new Error(`Failed to get logs: ${error?.message || error}`);
    }
  }

  async inspectContainer(containerId: string): Promise<any> {
    const command = this.isWindows
      ? `powershell docker inspect ${containerId}`
      : `docker inspect ${containerId}`;
    try {
      const output = await this.execCommand(command);
      const parsed = JSON.parse(output);
      return Array.isArray(parsed) ? parsed[0] : parsed;
    } catch (error: any) {
      throw new Error(`Failed to inspect container: ${error.message}`);
    }
  }

  async getContainerStats(containerId: string): Promise<any | null> {
    const command = this.isWindows
      ? `powershell docker stats --no-stream --format "{{json .}}" ${containerId}`
      : `docker stats --no-stream --format "{{json .}}" ${containerId}`;
    try {
      const output = await this.execCommand(command);
      const line = output.trim().split('\n').filter(Boolean)[0];
      return line ? JSON.parse(line) : null;
    } catch (error: any) {
      throw new Error(`Failed to get container stats: ${error.message}`);
    }
  }

  async getImages(): Promise<DockerImage[]> {
    try {
      const command = this.isWindows
        ? 'powershell docker images --format "{{json .}}"'
        : 'docker images --format "{{json .}}"';
      const output = await this.execCommand(command);
      return this.parseJsonLines(output, (row) => ({
        id: row.ID || row.Id || '',
        repository: row.Repository || '<none>',
        tag: row.Tag || '<none>',
        size: row.Size || '',
        created: row.CreatedAt || row.CreatedSince || '',
      }));
    } catch (error) {
      throw new Error(`Failed to get images: ${error.message}`);
    }
  }

  async removeImage(imageId: string): Promise<void> {
    const command = this.isWindows
      ? `powershell docker rmi -f ${imageId}`
      : `docker rmi -f ${imageId}`;
    try {
      await this.execCommand(command);
    } catch (error) {
      throw new Error(`Failed to remove image: ${error.message}`);
    }
  }

  async getVolumes(): Promise<DockerVolume[]> {
    try {
      const command = this.isWindows
        ? 'powershell docker volume ls --format "{{json .}}"'
        : 'docker volume ls --format "{{json .}}"';
      const output = await this.execCommand(command);
      return this.parseJsonLines(output, (row) => ({
        name: row.Name || '',
        driver: row.Driver || '',
        mountpoint: row.Mountpoint || '',
        scope: row.Scope || '',
      }));
    } catch (error) {
      throw new Error(`Failed to get volumes: ${error.message}`);
    }
  }

  async removeVolume(name: string): Promise<void> {
    const command = this.isWindows
      ? `powershell docker volume rm ${name}`
      : `docker volume rm ${name}`;
    try {
      await this.execCommand(command);
    } catch (error) {
      throw new Error(`Failed to remove volume: ${error.message}`);
    }
  }

  private parseJsonLines<T>(
    output: string,
    mapRow: (row: any) => T
  ): T[] {
    return output
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => {
        try {
          return mapRow(JSON.parse(line));
        } catch (error) {
          console.error('Error parsing docker json line:', error);
          return null;
        }
      })
      .filter((row): row is T => row !== null);
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

  private parseLabelMap(raw: unknown): Record<string, string> {
    if (!raw) return {};
    if (typeof raw === 'object' && !Array.isArray(raw)) {
      const out: Record<string, string> = {};
      Object.entries(raw as Record<string, unknown>).forEach(([k, v]) => {
        if (v != null) out[k] = String(v);
      });
      return out;
    }
    if (typeof raw !== 'string' || !raw.trim()) return {};
    const out: Record<string, string> = {};
    // docker ps Labels: "k=v,k2=v2" (values may contain '=')
    raw.split(',').forEach((part) => {
      const idx = part.indexOf('=');
      if (idx <= 0) return;
      out[part.slice(0, idx)] = part.slice(idx + 1);
    });
    return out;
  }

  private stackFromLabels(labels: Record<string, string>): {
    stackKind: 'compose' | 'swarm' | 'standalone';
    stackName: string;
    serviceName: string;
  } {
    const composeProject = labels['com.docker.compose.project'];
    if (composeProject) {
      return {
        stackKind: 'compose',
        stackName: composeProject,
        serviceName: labels['com.docker.compose.service'] || '',
      };
    }
    const swarmStack =
      labels['com.docker.stack.namespace'] ||
      labels['com.docker.swarm.stack.namespace'];
    if (swarmStack) {
      return {
        stackKind: 'swarm',
        stackName: swarmStack,
        serviceName:
          labels['com.docker.swarm.service.name'] ||
          labels['com.docker.compose.service'] ||
          '',
      };
    }
    return { stackKind: 'standalone', stackName: '', serviceName: '' };
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
            const labels = this.parseLabelMap(container.Labels);
            const stack = this.stackFromLabels(labels);

            return {
              id: container.ID,
              names: [container.Names],
              image: container.Image,
              state: container.State,
              status: container.Status,
              ports: container.Ports?.replace(/0\.0\.0\.0:/g, ''),
              created: container.CreatedAt,
              mounts: container.Mounts?.split(',').map((m: string) => m.trim()) || [],
              labels,
              size: container.Size,
              networks: container.Networks,
              command: container.Command,
              environment: env,
              stackKind: stack.stackKind,
              stackName: stack.stackName,
              serviceName: stack.serviceName,
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
