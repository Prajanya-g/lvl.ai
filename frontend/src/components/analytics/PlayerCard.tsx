'use client';

import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { User } from '@/lib/types/User';

interface PlayerCardProps {
  readonly user: User;
  readonly stats: {
    level: number;
    xp: number;
    totalTasksCompleted: number;
    tasks: {
      total: number;
      completed: number;
      pending: number;
      inProgress: number;
    };
  };
  readonly taskStats: {
    earnedPoints: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  } | null;
}

export function PlayerCard({ user, stats, taskStats }: PlayerCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Demo data with fake user info
  const demoUser = {
    name: user?.name || 'Alex Johnson',
    avatar: user?.avatar || null, // Use initial-based avatar instead
    level: stats?.level || 15,
    xp: stats?.xp || 3420,
    totalTasksCompleted: stats?.totalTasksCompleted || 127,
  };

  // Generate gradient color based on user name
  const getAvatarGradient = (name: string) => {
    const colors = [
      'from-primary to-primary/60',
      'from-success to-success/60',
      'from-warning to-warning/60',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
    ];
    const codePoint = name.codePointAt(0) || 0;
    const index = codePoint % colors.length;
    return colors[index];
  };

  // Calculate skill ratings (0-100 scale) with fallback to demo data
  const calculateSkillRatings = () => {
    // Use demo data if real stats aren't available
    const demoStats = {
      tasks: {
        total: stats?.tasks.total || 45,
        completed: stats?.tasks.completed || 39,
        inProgress: stats?.tasks.inProgress || 4,
      },
      totalTasksCompleted: stats?.totalTasksCompleted || 127,
    };

    const completionRate = demoStats.tasks.total > 0 
      ? (demoStats.tasks.completed / demoStats.tasks.total) * 100 
      : 87;
    
    const productivity = Math.min(100, Math.max(60, (demoStats.totalTasksCompleted / 10) * 7)); // Cap at 100, min 60
    const consistency = Math.min(100, Math.max(70, completionRate));
    const efficiency = taskStats 
      ? Math.min(100, Math.max(65, (taskStats.earnedPoints / Math.max(1, demoStats.tasks.total)) * 8))
      : 78;
    const speed = demoStats.tasks.inProgress > 0 
      ? Math.min(100, Math.max(70, (demoStats.tasks.completed / Math.max(1, demoStats.tasks.inProgress + demoStats.tasks.completed)) * 100))
      : 85;
    const focus = taskStats?.byPriority?.high 
      ? Math.min(100, Math.max(60, (taskStats.byPriority.high / Math.max(1, demoStats.tasks.total)) * 100))
      : 72;

    return {
      Productivity: Math.round(productivity),
      Consistency: Math.round(consistency),
      Efficiency: Math.round(efficiency),
      Speed: Math.round(speed),
      Focus: Math.round(focus),
    };
  };

  const skillRatings = calculateSkillRatings();
  
  // Convert to radar chart format
  const radarData = Object.entries(skillRatings).map(([key, value]) => ({
    skill: key,
    value,
    fullMark: 100,
  }));

  // Calculate overall rating (average of all skills)
  const overallRating = Math.round(
    Object.values(skillRatings).reduce((sum, val) => sum + val, 0) / Object.keys(skillRatings).length
  );

  // Calculate offensive (productivity/efficiency) and defensive (consistency/focus) ratings
  const offensiveRating = Math.round((skillRatings.Productivity + skillRatings.Efficiency) / 2);
  const defensiveRating = Math.round((skillRatings.Consistency + skillRatings.Focus) / 2);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto" style={{ perspective: '1000px' }}>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl blur-3xl"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.15),transparent_50%)] rounded-2xl"></div>
      
      {/* Card Container */}
      <button
        type="button"
        className="relative w-full h-[600px] transition-transform duration-700 cursor-pointer border-0 bg-transparent p-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-2xl"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
        onClick={handleFlip}
        aria-label="Flip player card to view skill breakdown"
      >
        {/* Front Side - Player Stats */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)',
          }}
        >
          <div className="relative w-full h-full bg-gradient-to-br from-background via-muted to-background rounded-2xl border-2 border-primary/50 shadow-2xl overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.3),transparent_50%)]"></div>
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.2),transparent_50%)]"></div>
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>

            {/* Content */}
            <div className="relative z-10 p-8 h-full flex flex-col">
              {/* Header */}
              <div className="mb-6">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">GENERAL</div>
                <div className="text-3xl font-bold text-foreground">{demoUser.name.toUpperCase()}</div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex items-center justify-between">
                {/* Left Side - Ratings */}
                <div className="flex flex-col gap-6">
                  {/* Productivity Rating */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg border-4 border-primary/50">
                      <div className="text-center">
                        <div className="text-xs text-primary-foreground uppercase tracking-wider">PROD</div>
                        <div className="text-3xl font-bold text-primary-foreground">{offensiveRating}</div>
                      </div>
                    </div>
                  </div>

                  {/* Consistency Rating */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-success to-success/80 flex items-center justify-center shadow-lg border-4 border-success/50">
                      <div className="text-center">
                        <div className="text-xs text-success-foreground uppercase tracking-wider">CONS</div>
                        <div className="text-3xl font-bold text-success-foreground">{defensiveRating}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center - Avatar/Image Area */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative">
                    {/* Avatar Circle with Gradient */}
                    <div className={`w-48 h-48 rounded-full bg-gradient-to-br ${getAvatarGradient(demoUser.name)} flex items-center justify-center shadow-2xl border-4 border-primary/30 relative overflow-hidden`}>
                      {/* Pattern overlay */}
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_70%)]"></div>
                      {/* User initial */}
                      <div className="relative z-10 text-6xl font-bold text-white drop-shadow-lg">
                        {demoUser.name.charAt(0).toUpperCase()}
                      </div>
                      {/* Decorative rings */}
                      <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
                      <div className="absolute inset-4 rounded-full border border-white/10"></div>
                    </div>
                    {/* Level Badge */}
                    <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full bg-primary flex items-center justify-center border-4 border-background shadow-lg">
                      <div className="text-center">
                        <div className="text-xs text-primary-foreground">LVL</div>
                        <div className="text-xl font-bold text-primary-foreground">{demoUser.level}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Stats */}
                <div className="flex flex-col gap-4 text-foreground">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">XP</div>
                    <div className="text-2xl font-bold">{demoUser.xp.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">Tasks</div>
                    <div className="text-2xl font-bold">{demoUser.totalTasksCompleted}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">Completion</div>
                    <div className="text-2xl font-bold">
                      {stats?.tasks.total > 0 
                        ? Math.round((stats.tasks.completed / stats.tasks.total) * 100)
                        : 87}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom - Details */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-2 gap-4 text-foreground">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">From</div>
                    <div className="text-sm font-semibold">LVL.AI</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">Position</div>
                    <div className="text-sm font-semibold">PRODUCTIVITY PLAYER</div>
                  </div>
                </div>
              </div>

              {/* Click Hint */}
              <div className="absolute bottom-4 right-4 text-xs text-muted-foreground animate-pulse">
                Click to flip →
              </div>
            </div>
          </div>
        </div>

        {/* Back Side - Radar Chart */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="relative w-full h-full bg-gradient-to-br from-background via-muted to-background rounded-2xl border-2 border-primary/50 shadow-2xl overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.3),transparent_70%)]"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 p-8 h-full flex flex-col">
              {/* Header */}
              <div className="mb-6">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">SKILL BREAKDOWN</div>
                <div className="text-3xl font-bold text-foreground">{demoUser.name.toUpperCase()}</div>
                <div className="text-sm text-muted-foreground mt-1">Overall Rating: {overallRating}</div>
              </div>

              {/* Radar Chart */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full h-full max-w-md">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis 
                        dataKey="skill" 
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                      />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 100]} 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      />
                      <Radar
                        name="Skills"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.6}
                        strokeWidth={2}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--primary))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))',
                        }}
                        formatter={(value: number) => [`${value}`, 'Rating']}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Skill Details */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-3 gap-4 text-foreground">
                  {Object.entries(skillRatings).map(([skill, rating]) => (
                    <div key={skill} className="text-center">
                      <div className="text-xs text-muted-foreground uppercase mb-1">{skill}</div>
                      <div className="text-xl font-bold">{rating}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Click Hint */}
              <div className="absolute bottom-4 right-4 text-xs text-muted-foreground animate-pulse">
                Click to flip ←
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

