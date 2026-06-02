// API Configuration
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.your-domain.com',
    ENDPOINTS: {
        appCatalogApi: '/api/app-catalog',
        clipboardApi: '/api/clipboard',
        iconApi: '/api/icons',
        p2pFileApi: '/api/p2p-file',
        processApi: '/api/process',
        profileApi: '/api/profiles',
        sessionApi: '/api/sessions',
        stripeApi: '/api/stripe',
        userApi: '/api/users',
        workspaceApi: '/api/workspaces'
    },
    TIMEOUT: 10000, // 10 seconds
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

export default API_CONFIG;
