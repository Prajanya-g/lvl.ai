import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  PaginatedResponse, 
  User, 
  BaseTask, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  TaskFormData,
  TaskFilters,
  SortOption
} from '@/lib/types';

class ApiClient {
  public client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, clear it
          this.clearToken();
          // Don't redirect here - let AuthContext and ClientGuard handle it
          // This prevents the cascade of redirects
        }
        return Promise.reject(error);
      }
    );

    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<{ success: boolean; token: string; user: User }> = await this.client.post('/auth/login', credentials);
    if (response.data.success) {
      this.setToken(response.data.token);
      return {
        success: true,
        data: {
          token: response.data.token,
          user: response.data.user
        }
      };
    }
    throw new Error('Login failed');
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<{ success: boolean; token: string; user: User }> = await this.client.post('/auth/register', userData);
    if (response.data.success) {
      this.setToken(response.data.token);
      return {
        success: true,
        data: {
          token: response.data.token,
          user: response.data.user
        }
      };
    }
    throw new Error('Registration failed');
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<{ success: boolean; user: User }> = await this.client.get('/auth/me');
    if (response.data.success) {
      return response.data.user;
    }
    throw new Error('Failed to get user data');
  }

  async updateProfile(profileData: { name?: string; email?: string }): Promise<User> {
    const response: AxiosResponse<{ success: boolean; user: User }> = await this.client.put('/auth/profile', profileData);
    if (response.data.success) {
      return response.data.user;
    }
    throw new Error('Failed to update profile');
  }

  async updatePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<{ token: string; message: string }> {
    const response: AxiosResponse<{ success: boolean; token: string; message: string }> = await this.client.put('/auth/password', passwordData);
    if (response.data.success) {
      this.setToken(response.data.token);
      return {
        token: response.data.token,
        message: response.data.message
      };
    }
    throw new Error('Failed to update password');
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await this.client.post('/auth/forgot-password', { email });
    if (response.data.success) {
      return { message: response.data.message };
    }
    throw new Error('Failed to send password reset email');
  }

  async resetPassword(token: string, password: string): Promise<{ token: string; message: string }> {
    const response: AxiosResponse<{ success: boolean; token: string; message: string }> = await this.client.put(`/auth/reset-password/${token}`, { password });
    if (response.data.success) {
      this.setToken(response.data.token);
      return {
        token: response.data.token,
        message: response.data.message
      };
    }
    throw new Error('Failed to reset password');
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await this.client.get(`/auth/verify-email/${token}`);
    if (response.data.success) {
      return { message: response.data.message };
    }
    throw new Error('Failed to verify email');
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await this.client.post('/auth/resend-verification', { email });
    if (response.data.success) {
      return { message: response.data.message };
    }
    throw new Error('Failed to resend verification email');
  }

  getToken(): string | null {
    return this.token;
  }

  // User endpoints
  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.put(`/users/${userId}`, userData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update user');
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response: AxiosResponse<ApiResponse<{ url: string }>> = await this.client.post(
      `/users/${userId}/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.url;
    }
    throw new Error(response.data.message || 'Failed to upload avatar');
  }

  // Task endpoints
  async getTasks(
    filters?: TaskFilters,
    sort?: SortOption,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<BaseTask>> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.status) params.append('status', filters.status.join(','));
      if (filters.priority) params.append('priority', filters.priority.join(','));
      if (filters.taskType) params.append('type', filters.taskType.join(','));
      if (filters.tags) params.append('tag', filters.tags.join(','));
    }
    
    if (sort) {
      params.append('sortBy', sort.field);
      params.append('sortOrder', sort.direction);
    }
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response: AxiosResponse<{ success: boolean; count: number; total: number; page: number; pages: number; data: BaseTask[] }> = await this.client.get(
      `/tasks?${params.toString()}`
    );
    
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
        pagination: {
          page: response.data.page,
          limit: limit,
          total: response.data.total,
          totalPages: response.data.pages
        }
      };
    }
    throw new Error('Failed to fetch tasks');
  }

  async getTaskStats(period?: number): Promise<{
    totalTasks: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    totalPoints: number;
    earnedPoints: number;
    overdue: number;
  }> {
    const params = new URLSearchParams();
    if (period) params.append('period', period.toString());

    const response: AxiosResponse<{ success: boolean; data: any }> = await this.client.get(`/tasks/stats?${params.toString()}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch task stats');
  }

  async getTask(taskId: string): Promise<BaseTask> {
    const response: AxiosResponse<{ success: boolean; data: BaseTask }> = await this.client.get(`/tasks/${taskId}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch task');
  }

  async createTask(taskData: TaskFormData): Promise<BaseTask> {
    const response: AxiosResponse<{ success: boolean; data: BaseTask }> = await this.client.post('/tasks', taskData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to create task');
  }

  async updateTask(taskId: string, taskData: Partial<TaskFormData>): Promise<BaseTask> {
    const response: AxiosResponse<{ success: boolean; data: BaseTask }> = await this.client.put(`/tasks/${taskId}`, taskData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to update task');
  }

  async deleteTask(taskId: string): Promise<void> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await this.client.delete(`/tasks/${taskId}`);
    if (!response.data.success) {
      throw new Error('Failed to delete task');
    }
  }

  async addTaskNote(taskId: string, content: string): Promise<any[]> {
    const response: AxiosResponse<{ success: boolean; data: any[] }> = await this.client.post(`/tasks/${taskId}/notes`, { content });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to add note');
  }

  async addTaskReminder(taskId: string, date: string, message: string): Promise<any[]> {
    const response: AxiosResponse<{ success: boolean; data: any[] }> = await this.client.post(`/tasks/${taskId}/reminders`, { date, message });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to add reminder');
  }

  async addTaskCollaborator(taskId: string, collaboratorId: string): Promise<any[]> {
    const response: AxiosResponse<{ success: boolean; data: any[] }> = await this.client.post(`/tasks/${taskId}/collaborators`, { collaboratorId });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to add collaborator');
  }

  async removeTaskCollaborator(taskId: string, collaboratorId: string): Promise<any[]> {
    const response: AxiosResponse<{ success: boolean; data: any[] }> = await this.client.delete(`/tasks/${taskId}/collaborators/${collaboratorId}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to remove collaborator');
  }

  async getTasksByType(type: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<BaseTask>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response: AxiosResponse<{ success: boolean; count: number; total: number; page: number; pages: number; data: BaseTask[] }> = await this.client.get(
      `/tasks/type/${type}?${params.toString()}`
    );
    
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
        pagination: {
          page: response.data.page,
          limit: limit,
          total: response.data.total,
          totalPages: response.data.pages
        }
      };
    }
    throw new Error('Failed to fetch tasks by type');
  }

  async getOverdueTasks(): Promise<BaseTask[]> {
    const response: AxiosResponse<{ success: boolean; count: number; data: BaseTask[] }> = await this.client.get('/tasks/overdue');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch overdue tasks');
  }

  // Task type specific endpoints
  async getFoodTasks(): Promise<BaseTask[]> {
    const response: AxiosResponse<{ success: boolean; data: BaseTask[] }> = await this.client.get('/food-tasks');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch food tasks');
  }

  async getHomeworkTasks(): Promise<BaseTask[]> {
    const response: AxiosResponse<{ success: boolean; data: BaseTask[] }> = await this.client.get('/homework-tasks');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch homework tasks');
  }

  async getWorkTasks(): Promise<BaseTask[]> {
    const response: AxiosResponse<{ success: boolean; data: BaseTask[] }> = await this.client.get('/work-tasks');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch work tasks');
  }

  async getHealthTasks(): Promise<BaseTask[]> {
    const response: AxiosResponse<{ success: boolean; data: BaseTask[] }> = await this.client.get('/health-tasks');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch health tasks');
  }

  async getEmailTasks(): Promise<BaseTask[]> {
    const response: AxiosResponse<{ success: boolean; data: BaseTask[] }> = await this.client.get('/email-tasks');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch email tasks');
  }

  async getMeetingTasks(): Promise<BaseTask[]> {
    const response: AxiosResponse<{ success: boolean; data: BaseTask[] }> = await this.client.get('/meeting-tasks');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch meeting tasks');
  }

  async getProjectTasks(): Promise<BaseTask[]> {
    const response: AxiosResponse<{ success: boolean; data: BaseTask[] }> = await this.client.get('/project-tasks');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch project tasks');
  }

  // Friend endpoints
  async getFriends(): Promise<User[]> {
    const response: AxiosResponse<{ success: boolean; count: number; data: User[] }> = await this.client.get('/friends');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch friends');
  }

  async sendFriendRequest(recipientId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await this.client.post('/friends/request', { recipientId });
    if (response.data.success) {
      return { message: response.data.message };
    }
    throw new Error('Failed to send friend request');
  }

  async acceptFriendRequest(userId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await this.client.put(`/friends/accept/${userId}`);
    if (response.data.success) {
      return { message: response.data.message };
    }
    throw new Error('Failed to accept friend request');
  }

  async declineFriendRequest(userId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await this.client.put(`/friends/decline/${userId}`);
    if (response.data.success) {
      return { message: response.data.message };
    }
    throw new Error('Failed to decline friend request');
  }

  async getPendingFriendRequests(): Promise<User[]> {
    const response: AxiosResponse<{ success: boolean; count: number; data: User[] }> = await this.client.get('/friends/pending');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch pending friend requests');
  }

  async getSentFriendRequests(): Promise<User[]> {
    const response: AxiosResponse<{ success: boolean; count: number; data: User[] }> = await this.client.get('/friends/sent');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch sent friend requests');
  }

  async removeFriend(userId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await this.client.delete(`/friends/${userId}`);
    if (response.data.success) {
      return { message: response.data.message };
    }
    throw new Error('Failed to remove friend');
  }

  async blockUser(userId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await this.client.put(`/friends/block/${userId}`);
    if (response.data.success) {
      return { message: response.data.message };
    }
    throw new Error('Failed to block user');
  }

  async unblockUser(userId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await this.client.put(`/friends/unblock/${userId}`);
    if (response.data.success) {
      return { message: response.data.message };
    }
    throw new Error('Failed to unblock user');
  }

  // Analytics endpoints
  async getAnalytics(): Promise<Record<string, unknown>> {
    const response: AxiosResponse<ApiResponse<Record<string, unknown>>> = await this.client.get('/analytics');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch analytics');
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;
