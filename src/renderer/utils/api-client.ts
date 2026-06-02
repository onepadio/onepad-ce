import { API_CONFIG } from '../config/api-config';

export interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    status: number;
}

export interface RequestConfig {
    headers?: Record<string, string>;
    timeout?: number;
}

class ApiClient {
    private baseUrl: string;
    private defaultHeaders: Record<string, string>;
    private timeout: number;

    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        this.defaultHeaders = API_CONFIG.HEADERS;
        this.timeout = API_CONFIG.TIMEOUT;
    }

    private async makeRequest<T>(
        method: string,
        apiName: string,
        endpoint: string,
        options: { body?: any; headers?: Record<string, string> } = {}
    ): Promise<T> {
        const apiEndpoint = API_CONFIG.ENDPOINTS[apiName as keyof typeof API_CONFIG.ENDPOINTS];
        if (!apiEndpoint) {
            throw new Error(`Unknown API: ${apiName}`);
        }

        const url = `${this.baseUrl}${apiEndpoint}${endpoint}`;
        const headers = {
            ...this.defaultHeaders,
            ...options.headers
        };

        const config: RequestInit = {
            method,
            headers,
            signal: AbortSignal.timeout(this.timeout)
        };

        if (options.body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Handle empty responses
            const text = await response.text();
            if (!text) {
                return {} as T;
            }

            try {
                return JSON.parse(text) as T;
            } catch {
                return text as unknown as T;
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`API request failed: ${error.message}`);
            }
            throw new Error('API request failed with unknown error');
        }
    }

    async get<T>(apiName: string, endpoint: string, config?: RequestConfig): Promise<T> {
        return this.makeRequest<T>('GET', apiName, endpoint, { headers: config?.headers });
    }

    async post<T>(apiName: string, endpoint: string, options: { body?: any; headers?: Record<string, string> } = {}): Promise<T> {
        return this.makeRequest<T>('POST', apiName, endpoint, options);
    }

    async put<T>(apiName: string, endpoint: string, options: { body?: any; headers?: Record<string, string> } = {}): Promise<T> {
        return this.makeRequest<T>('PUT', apiName, endpoint, options);
    }

    async del<T>(apiName: string, endpoint: string, config?: RequestConfig): Promise<T> {
        return this.makeRequest<T>('DELETE', apiName, endpoint, { headers: config?.headers });
    }

    async patch<T>(apiName: string, endpoint: string, options: { body?: any; headers?: Record<string, string> } = {}): Promise<T> {
        return this.makeRequest<T>('PATCH', apiName, endpoint, options);
    }
}

// Create a singleton instance
export const API = new ApiClient();

// Storage replacement (basic file operations - you may need to implement file upload/download based on your needs)
export class Storage {
    static async put(key: string, file: File | Blob, options?: any): Promise<any> {
        // Implement file upload to your own storage service
        throw new Error('Storage.put not implemented - replace with your own file upload logic');
    }

    static async get(key: string, options?: any): Promise<any> {
        // Implement file download from your own storage service
        throw new Error('Storage.get not implemented - replace with your own file download logic');
    }

    static async remove(key: string): Promise<any> {
        // Implement file deletion from your own storage service
        throw new Error('Storage.remove not implemented - replace with your own file deletion logic');
    }
}

export default API;
