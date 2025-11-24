'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import ClientGuard from '@/components/ClientGuard';
import { TaskCompletionGraph } from '@/components/home';
import { Calendar } from '@/components/charts/calender';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { UserAPI } from '@/lib/api/users';
import { Task } from '@/lib/types';
import { 
  ChartBarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  FireIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalTasks: number;
  completedToday: number;
  overdueTasks: number;
  currentStreak: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedToday: 0,
    overdueTasks: 0,
    currentStreak: 0,
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [userStats, setUserStats] = useState<{ level: number; xp: number; totalTasksCompleted: number } | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userId = user._id || (user as any).id;

        // Fetch task stats
        const taskStats = await apiClient.getTaskStats(30);
        
        // Fetch user stats
        const userStatsData = await UserAPI.getUserStats(userId);
        
        // Fetch recent tasks (last 5)
        const tasksResponse = await apiClient.getTasks({}, { field: 'createdAt', direction: 'desc' }, 1, 5);
        const tasks: Task[] = (tasksResponse.data || []).map(task => ({
          ...task,
          taskTime: task.taskTime ? new Date(task.taskTime) : undefined,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
        }));

        // Calculate completed today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const completedToday = tasks.filter(task => {
          if (task.status !== 'completed' || !task.completedAt) return false;
          const completedDate = new Date(task.completedAt);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === today.getTime();
        }).length;

        // Update stats
        setStats({
          totalTasks: taskStats.totalTasks,
          completedToday,
          overdueTasks: taskStats.overdue,
          currentStreak: 0, // TODO: Calculate streak from task completion history
        });

        setRecentTasks(tasks);
        if (userStatsData.data) {
          setUserStats({
            level: userStatsData.data.level,
            xp: userStatsData.data.xp,
            totalTasksCompleted: userStatsData.data.totalTasksCompleted,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Keep default/empty stats on error
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, authLoading]);

  const handleViewTasks = () => {
    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.location.href = '/tasks';
    }
  };

  // Calculate achievements based on real data
  const achievements = userStats ? [
    { 
      name: 'Task Master', 
      description: 'Complete 50 tasks', 
      progress: userStats.totalTasksCompleted, 
      target: 50 
    },
    { 
      name: 'Level Up', 
      description: 'Reach level 10', 
      progress: userStats.level, 
      target: 10 
    },
    { 
      name: 'XP Collector', 
      description: 'Earn 1000 XP', 
      progress: Math.min(userStats.xp, 1000), 
      target: 1000 
    },
  ] : [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-5 w-5 text-success" />;
      case 'in_progress': return <ClockIcon className="h-5 w-5 text-warning" />;
      case 'pending': return <ExclamationTriangleIcon className="h-5 w-5 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <ClientGuard>
      <Sidebar>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back{user?.name ? `, ${user.name}` : ''}! Here&apos;s what&apos;s happening with your tasks.
            </p>
          </div>

          {/* Task Completion Graph */}
          <TaskCompletionGraph />
          
          {/* Calender */}
          <Calendar />

          {/* Stats Grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                      <div className="h-8 bg-muted rounded w-16"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalTasks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                      <p className="text-2xl font-bold text-foreground">{stats.completedToday}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Overdue Tasks</p>
                      <p className="text-2xl font-bold text-foreground">{stats.overdueTasks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Level</p>
                      <p className="text-2xl font-bold text-foreground">
                        {userStats ? `Lv. ${userStats.level}` : 'Lv. 1'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  Recent Tasks
                </CardTitle>
                <CardDescription>Your latest task activity</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse p-3 rounded-lg border">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : recentTasks.length > 0 ? (
                  <div className="space-y-4">
                    {recentTasks.map((task) => (
                      <div key={task._id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(task.status)}
                          <div>
                            <p className="font-medium text-foreground">{task.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getPriorityColor(task.priority)} size="sm">
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tasks yet. Create your first task to get started!</p>
                  </div>
                )}
                <Button variant="outline" className="w-full mt-4" onClick={handleViewTasks}>
                  View All Tasks
                </Button>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrophyIcon className="h-5 w-5" />
                  Achievements
                </CardTitle>
                <CardDescription>Track your progress and unlock rewards</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="animate-pulse h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="animate-pulse h-2 bg-muted rounded w-full"></div>
                      </div>
                    ))}
                  </div>
                ) : achievements.length > 0 ? (
                  <div className="space-y-4">
                    {achievements.map((achievement) => (
                      <div key={achievement.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-foreground">{achievement.name}</h4>
                          <span className="text-sm text-muted-foreground">
                            {achievement.progress}/{achievement.target}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Complete tasks to unlock achievements!</p>
                  </div>
                )}
                <Button variant="outline" className="w-full mt-4">
                  View All Achievements
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FireIcon className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks to get you started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Button className="h-20 flex-col gap-2">
                  <ChartBarIcon className="h-6 w-6" />
                  <span>Add Task</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <ClockIcon className="h-6 w-6" />
                  <span>Start Timer</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <TrophyIcon className="h-6 w-6" />
                  <span>View Stats</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <CheckCircleIcon className="h-6 w-6" />
                  <span>Complete Task</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Sidebar>
    </ClientGuard>
  );
}