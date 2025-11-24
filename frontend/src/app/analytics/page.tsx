'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import ClientGuard from '@/components/ClientGuard';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api/client';
import { UserAPI } from '@/lib/api/users';
import { PlayerCard } from '@/components/analytics';
import { User, Task } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { FoodOrdersPieChart, RevenueBarChart, GuestsLineChart, RoomsStackedBarChart } from '@/components/charts';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  TrophyIcon,
  ChartBarIcon,
  FireIcon
} from '@heroicons/react/24/outline';

interface TaskStats {
  totalTasks: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  totalPoints: number;
  earnedPoints: number;
  overdue: number;
}

interface UserStats {
  level: number;
  xp: number;
  totalTasksCompleted: number;
  tasks: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
  };
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    const fetchAnalyticsData = async () => {
      // Check if user exists and has an _id
      if (!user) {
        console.log('No user available - user is null');
        setLoading(false);
        return;
      }

      const userId = user._id || (user as User & { id?: string }).id;
      if (!userId) {
        console.log('No user ID available - user object:', user);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching analytics data for user:', userId);

        // Fetch task stats (last 30 days)
        const stats = await apiClient.getTaskStats(30);
        console.log('Task stats:', stats);
        setTaskStats(stats);

        // Fetch user stats
        const userStatsData = await UserAPI.getUserStats(userId);
        console.log('User stats data:', userStatsData);
        if (userStatsData.data) {
          setUserStats(userStatsData.data);
        } else {
          console.warn('No user stats data returned');
        }

        // Fetch recent tasks for trends (last 30 days, up to 100 tasks)
        const tasksResponse = await apiClient.getTasks(
          {}, 
          { field: 'createdAt', direction: 'desc' }, 
          1, 
          100
        );
        const fetchedTasks: Task[] = (tasksResponse.data || []).map(task => ({
          ...task,
          taskTime: task.taskTime ? new Date(task.taskTime) : undefined,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
        }));
        setTasks(fetchedTasks);

      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(`Failed to load analytics data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user, authLoading]);

  // Calculate derived metrics (must be before early returns)
  const metrics = useMemo(() => {
    if (!taskStats || !userStats) return null;

    const completionRate = taskStats.totalTasks > 0 
      ? ((taskStats.byStatus.completed || 0) / taskStats.totalTasks * 100).toFixed(1)
      : '0';
    
    const avgPointsPerTask = taskStats.totalTasks > 0
      ? (taskStats.totalPoints / taskStats.totalTasks).toFixed(1)
      : '0';

    const pointsEfficiency = taskStats.totalPoints > 0
      ? ((taskStats.earnedPoints / taskStats.totalPoints) * 100).toFixed(1)
      : '0';

    return {
      completionRate: Number.parseFloat(completionRate),
      avgPointsPerTask: Number.parseFloat(avgPointsPerTask),
      pointsEfficiency: Number.parseFloat(pointsEfficiency),
    };
  }, [taskStats, userStats]);

  // Prepare chart data (must be before early returns)
  const statusChartData = useMemo(() => {
    if (!taskStats) return [];
    return Object.entries(taskStats.byStatus).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
      value,
    }));
  }, [taskStats]);

  const priorityChartData = useMemo(() => {
    if (!taskStats) return [];
    return Object.entries(taskStats.byPriority).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [taskStats]);

  // Calculate weekly completion trend (last 7 days)
  const weeklyTrendData = useMemo(() => {
    if (!tasks.length) return [];
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekData = days.map(day => ({ name: day, completed: 0, total: 0 }));

    for (const task of tasks) {
      const taskDate = task.completedAt || task.createdAt;
      if (!taskDate) continue;
      
      const date = new Date(taskDate);
      const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff >= 0 && daysDiff < 7) {
        const dayIndex = date.getDay();
        weekData[dayIndex].total++;
        if (task.status === 'completed') {
          weekData[dayIndex].completed++;
        }
      }
    }

    return weekData.map(day => ({
      name: day.name,
      value: day.completed,
    }));
  }, [tasks]);

  // Tag/Category breakdown
  const tagChartData = useMemo(() => {
    if (!tasks.length) return [];
    
    const tagCounts: Record<string, number> = {};
    for (const task of tasks) {
      if (task.tags && task.tags.length > 0) {
        for (const tag of task.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      } else {
        tagCounts['Untagged'] = (tagCounts['Untagged'] || 0) + 1;
      }
    }

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8) // Top 8 tags
      .map(([name, value]) => ({
        name: name.length > 15 ? `${name.substring(0, 15)}...` : name,
        value,
      }));
  }, [tasks]);

  // XP/Points earned over time (last 30 days)
  const xpTrendData = useMemo(() => {
    if (!tasks.length) return [];
    
    const today = new Date();
    const days: Array<{ name: string; value: number }> = [];
    
    // Create data for last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      let xpEarned = 0;
      for (const task of tasks) {
        if (task.status === 'completed' && task.completedAt) {
          const completedDate = new Date(task.completedAt);
          if (
            completedDate.getDate() === date.getDate() &&
            completedDate.getMonth() === date.getMonth() &&
            completedDate.getFullYear() === date.getFullYear()
          ) {
            xpEarned += task.points || 0;
          }
        }
      }
      
      days.push({ name: dateStr, value: xpEarned });
    }
    
    return days;
  }, [tasks]);

  // Task creation vs completion (last 4 weeks)
  const taskVelocityData = useMemo(() => {
    if (!tasks.length) return [];
    
    const today = new Date();
    const weeks: Array<{ name: string; created: number; completed: number }> = [];
    
    // Create data for last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (i * 7) - 6);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekLabel = `Week ${4 - i}`;
      let created = 0;
      let completed = 0;
      
      for (const task of tasks) {
        const createdDate = new Date(task.createdAt);
        createdDate.setHours(0, 0, 0, 0);
        if (createdDate >= weekStart && createdDate <= weekEnd) {
          created++;
        }
        
        if (task.status === 'completed' && task.completedAt) {
          const completedDate = new Date(task.completedAt);
          completedDate.setHours(0, 0, 0, 0);
          if (completedDate >= weekStart && completedDate <= weekEnd) {
            completed++;
          }
        }
      }
      
      weeks.push({ name: weekLabel, created, completed });
    }
    
    return weeks;
  }, [tasks]);

  // Calculate velocity metrics
  const velocityMetrics = useMemo(() => {
    if (!taskVelocityData.length) return null;

    const totalCreated = taskVelocityData.reduce((sum, week) => sum + week.created, 0);
    const totalCompleted = taskVelocityData.reduce((sum, week) => sum + week.completed, 0);
    const avgCreatedPerWeek = totalCreated / taskVelocityData.length;
    const avgCompletedPerWeek = totalCompleted / taskVelocityData.length;
    const completionRate = totalCreated > 0 ? (totalCompleted / totalCreated) * 100 : 0;
    
    // Calculate trend (comparing last 2 weeks vs first 2 weeks)
    const recentWeeks = taskVelocityData.slice(-2);
    const olderWeeks = taskVelocityData.slice(0, 2);
    const recentAvg = recentWeeks.reduce((sum, w) => sum + w.completed, 0) / recentWeeks.length;
    const olderAvg = olderWeeks.length > 0 
      ? olderWeeks.reduce((sum, w) => sum + w.completed, 0) / olderWeeks.length 
      : recentAvg;
    const trend = recentAvg - olderAvg;

    return {
      totalCreated,
      totalCompleted,
      avgCreatedPerWeek: Number.parseFloat(avgCreatedPerWeek.toFixed(1)),
      avgCompletedPerWeek: Number.parseFloat(avgCompletedPerWeek.toFixed(1)),
      completionRate: Number.parseFloat(completionRate.toFixed(1)),
      trend: Number.parseFloat(trend.toFixed(1)),
      trendDirection: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
    };
  }, [taskVelocityData]);

  // Show loading state while auth is initializing or data is fetching
  if (authLoading || loading) {
    return (
      <ClientGuard>
        <Sidebar>
          <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-4 w-full max-w-2xl">
              <div className="h-8 bg-muted rounded w-1/4 mx-auto"></div>
              <div className="h-96 bg-muted rounded w-full"></div>
            </div>
          </div>
        </Sidebar>
      </ClientGuard>
    );
  }

  if (!user) {
    return (
      <ClientGuard>
        <Sidebar>
          <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-muted-foreground">Please log in to view analytics</p>
            </div>
          </div>
        </Sidebar>
      </ClientGuard>
    );
  }

  if (!userStats) {
    return (
      <ClientGuard>
        <Sidebar>
          <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-muted-foreground">Loading user statistics...</p>
              {error && (
                <p className="text-destructive mt-2 text-sm">{error}</p>
              )}
            </div>
          </div>
        </Sidebar>
      </ClientGuard>
    );
  }

  return (
    <ClientGuard>
      <Sidebar>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">User Analytics</h1>
            <p className="text-muted-foreground">Comprehensive insights into your productivity</p>
          </div>

          {error && (
            <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Player Card */}
          <div className="flex items-center justify-center mb-8">
            <PlayerCard 
              user={user}
              stats={userStats}
              taskStats={taskStats}
            />
          </div>

          {/* Metrics Cards */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4" />
                    Completion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{metrics.completionRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {taskStats?.byStatus.completed || 0} of {taskStats?.totalTasks || 0} tasks completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrophyIcon className="h-4 w-4" />
                    Points Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{metrics.pointsEfficiency}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {taskStats?.earnedPoints || 0} / {taskStats?.totalPoints || 0} points earned
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ChartBarIcon className="h-4 w-4" />
                    Avg Points/Task
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{metrics.avgPointsPerTask}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average points per task
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto mb-8">
            {/* Task Status Distribution */}
            {statusChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Task Status Distribution</CardTitle>
                  <CardDescription>Breakdown of tasks by status</CardDescription>
                </CardHeader>
                <CardContent>
                  <FoodOrdersPieChart
                    data={statusChartData}
                    colors={['#10b981', '#f59e0b', '#3b82f6', '#ef4444']}
                    height={250}
                  />
                </CardContent>
              </Card>
            )}

            {/* Priority Distribution */}
            {priorityChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Priority Distribution</CardTitle>
                  <CardDescription>Tasks grouped by priority level</CardDescription>
                </CardHeader>
                <CardContent>
                  <RevenueBarChart
                    data={priorityChartData}
                    color="#0ea5e9"
                    height={250}
                  />
                </CardContent>
              </Card>
            )}

            {/* Tag/Category Breakdown */}
            {tagChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Categories</CardTitle>
                  <CardDescription>Most used tags/categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <FoodOrdersPieChart
                    data={tagChartData}
                    colors={['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4', '#84cc16']}
                    height={250}
                  />
                </CardContent>
              </Card>
            )}

            {/* XP Earned Over Time */}
            {xpTrendData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>XP Earned (30 Days)</CardTitle>
                  <CardDescription>Points earned per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <GuestsLineChart
                    data={xpTrendData}
                    color="#f59e0b"
                    height={250}
                  />
                </CardContent>
              </Card>
            )}

            {/* Weekly Completion Trend */}
            {weeklyTrendData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Completion Trend</CardTitle>
                  <CardDescription>Tasks completed over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <GuestsLineChart
                    data={weeklyTrendData}
                    color="#10b981"
                    height={250}
                  />
                </CardContent>
              </Card>
            )}

            {/* Task Velocity (Creation vs Completion) */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <div>Task Velocity (4 Weeks)</div>
                    <CardDescription className="mt-1">
                      Tasks created vs completed per week
                    </CardDescription>
                  </div>
                  {velocityMetrics && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <div className="text-muted-foreground">Avg/Week</div>
                        <div className="font-semibold text-foreground">
                          {velocityMetrics.avgCompletedPerWeek} completed
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">Trend</div>
                        <div className={`font-semibold flex items-center gap-1 ${
                          velocityMetrics.trendDirection === 'up' ? 'text-success' :
                          velocityMetrics.trendDirection === 'down' ? 'text-destructive' :
                          'text-muted-foreground'
                        }`}>
                          {velocityMetrics.trendDirection === 'up' && '↑'}
                          {velocityMetrics.trendDirection === 'down' && '↓'}
                          {velocityMetrics.trendDirection === 'stable' && '→'}
                          {Math.abs(velocityMetrics.trend).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {taskVelocityData.length > 0 ? (
                  <div className="space-y-4">
                    <RoomsStackedBarChart
                      data={taskVelocityData.map(week => ({
                        name: week.name,
                        occupied: week.completed,
                        booked: week.created - week.completed,
                        available: 0,
                      }))}
                      colors={{
                        occupied: '#10b981',
                        booked: '#3b82f6',
                        available: '#f59e0b',
                      }}
                      height={250}
                    />
                    {velocityMetrics && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                        <div>
                          <div className="text-sm text-muted-foreground">Total Created</div>
                          <div className="text-2xl font-bold text-foreground">{velocityMetrics.totalCreated}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Total Completed</div>
                          <div className="text-2xl font-bold text-success">{velocityMetrics.totalCompleted}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Avg Created/Week</div>
                          <div className="text-2xl font-bold text-primary">{velocityMetrics.avgCreatedPerWeek}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Completion Rate</div>
                          <div className="text-2xl font-bold text-foreground">{velocityMetrics.completionRate}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ChartBarIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-2">No task data available</p>
                    <p className="text-sm text-muted-foreground">
                      Create some tasks to see your velocity metrics
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          {taskStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-warning" />
                    Overdue Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-warning">{taskStats.overdue}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tasks that are past their due date
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FireIcon className="h-5 w-5 text-primary" />
                    Total Points Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">{taskStats.totalPoints}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {taskStats.earnedPoints} points earned ({metrics?.pointsEfficiency || 0}%)
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </Sidebar>
    </ClientGuard>
  );
}
