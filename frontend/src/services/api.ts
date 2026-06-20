const API_BASE = '/api';

export class ApiService {
  private static getHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  public static async request(endpoint: string, method: string = 'GET', body?: any, token?: string): Promise<any> {
    const config: RequestInit = {
      method,
      headers: this.getHeaders(token)
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    if ((response.status === 401 || response.status === 403) && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
      // Clear local auth token if unauthorized and redirect to login via reload
      localStorage.removeItem('eco_token');
      window.location.reload();
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'API Request Failed');
    }
    return data;
  }

  public static get(endpoint: string, token?: string): Promise<any> {
    return this.request(endpoint, 'GET', undefined, token);
  }

  public static post(endpoint: string, body: any, token?: string): Promise<any> {
    return this.request(endpoint, 'POST', body, token);
  }

  public static patch(endpoint: string, body: any, token?: string): Promise<any> {
    return this.request(endpoint, 'PATCH', body, token);
  }

  public static delete(endpoint: string, token?: string): Promise<any> {
    return this.request(endpoint, 'DELETE', undefined, token);
  }
}
