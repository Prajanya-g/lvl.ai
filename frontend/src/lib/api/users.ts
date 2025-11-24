import { AxiosResponse } from 'axios';
import apiClient from './client';
import { 
  ApiResponse, 
  PaginatedResponse, 
  User, 
  BaseTask, 
  Metric, 
  LevelProgress,
  UserProfileFormData 
} from '@/lib/types';

// User API endpoints based on backend routes
export class UserAPI {
  // @route   GET /api/users
  // @desc    Get all users (Admin only)
  static async getUsers(params?: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'email';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response: AxiosResponse<PaginatedResponse<User>> = await apiClient.client.get(
      `/users?${queryParams.toString()}`
    );
    
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Failed to fetch users');
  }

  // @route   GET /api/users/profile/me
  // @desc    Get current user profile
  static async getMyProfile(): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await apiClient.client.get('/users/profile/me');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch profile');
  }

  // @route   GET /api/users/:id
  // @desc    Get single user (Admin only)
  static async getUser(userId: string): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await apiClient.client.get(`/users/${userId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch user');
  }

  // @route   POST /api/users
  // @desc    Create new user (Admin only)
  static async createUser(userData: {
    name: string;
    email: string;
    password: string;
    avatar?: string;
    preferences?: {
      timezone?: string;
      dailyGoalXP?: number;
      preferredWorkouts?: string[];
      dietaryPreferences?: string[];
      notificationSettings?: {
        email?: boolean;
        push?: boolean;
      };
    };
  }): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await apiClient.client.post('/users', userData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create user');
  }

  // @route   PUT /api/users/profile/me
  // @desc    Update my profile
  static async updateMyProfile(profileData: UserProfileFormData): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await apiClient.client.put('/users/profile/me', profileData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update profile');
  }

  // @route   PUT /api/users/:id
  // @desc    Update user (Admin only)
  static async updateUser(userId: string, userData: {
    name?: string;
    email?: string;
    avatar?: string;
  }): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await apiClient.client.put(`/users/${userId}`, userData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update user');
  }

  // @route   DELETE /api/users/:id
  // @desc    Delete user (Admin only)
  static async deleteUser(userId: string): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await apiClient.client.delete(`/users/${userId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete user');
    }
  }

  // @route   GET /api/users/:id/tasks
  // @desc    Get user tasks
  static async getUserTasks(userId: string, params?: {
    category?: 'Fitness' | 'Productivity' | 'Nutrition' | 'Finance' | 'Social' | 'Knowledge';
    completed?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<BaseTask>> {
    const queryParams = new URLSearchParams();
    
    if (params?.category) queryParams.append('category', params.category);
    if (params?.completed !== undefined) queryParams.append('completed', params.completed.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response: AxiosResponse<PaginatedResponse<BaseTask>> = await apiClient.client.get(
      `/users/${userId}/tasks?${queryParams.toString()}`
    );
    
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Failed to fetch user tasks');
  }

  // @route   POST /api/users/:id/tasks
  // @desc    Add task to user
  static async addUserTask(userId: string, taskData: {
    title: string;
    category: 'Fitness' | 'Productivity' | 'Nutrition' | 'Finance' | 'Social' | 'Knowledge';
    dueDate?: string;
    completed?: boolean;
    xpValue?: number;
    autoGenerated?: boolean;
  }): Promise<BaseTask> {
    const response: AxiosResponse<ApiResponse<BaseTask>> = await apiClient.client.post(
      `/users/${userId}/tasks`,
      taskData
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to add task');
  }

  // @route   PUT /api/users/:id/tasks/:taskId
  // @desc    Update user task
  static async updateUserTask(userId: string, taskId: string, taskData: {
    title?: string;
    category?: 'Fitness' | 'Productivity' | 'Nutrition' | 'Finance' | 'Social' | 'Knowledge';
    dueDate?: string;
    completed?: boolean;
    xpValue?: number;
    autoGenerated?: boolean;
  }): Promise<BaseTask> {
    const response: AxiosResponse<ApiResponse<BaseTask>> = await apiClient.client.put(
      `/users/${userId}/tasks/${taskId}`,
      taskData
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update task');
  }

  // @route   DELETE /api/users/:id/tasks/:taskId
  // @desc    Delete user task
  static async deleteUserTask(userId: string, taskId: string): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await apiClient.client.delete(
      `/users/${userId}/tasks/${taskId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete task');
    }
  }

  // @route   GET /api/users/:id/metrics
  // @desc    Get user metrics
  static async getUserMetrics(userId: string, params?: {
    metricType?: 'workout' | 'meal' | 'finance' | 'study' | 'sleep';
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Metric>> {
    const queryParams = new URLSearchParams();
    
    if (params?.metricType) queryParams.append('metricType', params.metricType);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response: AxiosResponse<PaginatedResponse<Metric>> = await apiClient.client.get(
      `/users/${userId}/metrics?${queryParams.toString()}`
    );
    
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Failed to fetch user metrics');
  }

  // @route   POST /api/users/:id/metrics
  // @desc    Add metric to user
  static async addUserMetric(userId: string, metricData: {
    metricType: 'workout' | 'meal' | 'finance' | 'study' | 'sleep';
    value: number;
    unit?: string;
    date?: string;
    notes?: string;
  }): Promise<Metric> {
    const response: AxiosResponse<ApiResponse<Metric>> = await apiClient.client.post(
      `/users/${userId}/metrics`,
      metricData
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to add metric');
  }

  // @route   GET /api/users/:id/stats
  // @desc    Get user stats (level, XP, task counts)
  // @access  Private
  static async getUserStats(userId: string): Promise<ApiResponse<{
    level: number;
    xp: number;
    totalTasksCompleted: number;
    tasks: {
      total: number;
      completed: number;
      pending: number;
      inProgress: number;
    };
  }>> {
    const response: AxiosResponse<ApiResponse<{
      level: number;
      xp: number;
      totalTasksCompleted: number;
      tasks: {
        total: number;
        completed: number;
        pending: number;
        inProgress: number;
      };
    }>> = await apiClient.client.get(`/users/${userId}/stats`);
    if (response.data.success && response.data.data) {
      return response.data;
    }
    throw new Error(response.data.message || 'Failed to fetch user stats');
  }

  // @route   GET /api/users/:id/levels
  // @desc    Get user levels
  static async getUserLevels(userId: string): Promise<Record<string, LevelProgress>> {
    const response: AxiosResponse<ApiResponse<Record<string, LevelProgress>>> = await apiClient.client.get(
      `/users/${userId}/levels`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch user levels');
  }
}

export default UserAPI;