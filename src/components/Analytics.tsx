import React, { useMemo, useState, useEffect } from 'react';
import { getSessions, subscribeToSessions } from '../lib/storage';
import { startOfDay, startOfWeek, startOfMonth, getIsoDate, cn } from '../lib/utils';
import { Session } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, YAxis, CartesianGrid } from 'recharts';
import { CalendarView } from './CalendarView';

export function Analytics() {
  const [sessions, setSessions] = useState<Session[]>(getSessions());
  
  useEffect(() => {
    const unsubscribe = subscribeToSessions((newSessions) => {
        setSessions(newSessions);
    });
    return () => unsubscribe();
  }, []);
  const [viewMode, setViewMode] = useState<'heatmap' | 'chart' | 'calendar'>('calendar');

  const stats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now).getTime();
    const thisWeek = startOfWeek(now).getTime();
    const thisMonth = startOfMonth(now).getTime();

    let todayMinutes = 0;
    let weekMinutes = 0;
    let monthMinutes = 0;

    const dailyMap = new Map<string, number>();
    const topicStats = new Map<string, number>();

    sessions.forEach(s => {
      if (s.mode !== 'pomodoro') return;

      const sTime = s.timestamp;
      
      if (sTime >= today) todayMinutes += s.durationMinutes;
      if (sTime >= thisWeek) weekMinutes += s.durationMinutes;
      if (sTime >= thisMonth) monthMinutes += s.durationMinutes;

      const dateStr = getIsoDate(new Date(sTime));
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + s.durationMinutes);

      const topicName = s.topic || 'Uncategorized';
      topicStats.set(topicName, (topicStats.get(topicName) || 0) + s.durationMinutes);
    });

    return { todayMinutes, weekMinutes, monthMinutes, dailyMap, topicStats };
  }, [sessions]);

  // Generate heatmap grid (last 12 months = 364 days)
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = startOfDay(new Date());
    
    for (let i = 363; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getIsoDate(d);
      const minutes = stats.dailyMap.get(dateStr) || 0;
      days.push({ dateStr, minutes });
    }
    return days;
  }, [stats.dailyMap]);

  // Generate chart data (last 14 days)
  const chartData = useMemo(() => {
    const days = [];
    const today = startOfDay(new Date());
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getIsoDate(d);
      const minutes = stats.dailyMap.get(dateStr) || 0;
      // Format day and month for label
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      days.push({ label, minutes, dateStr });
    }
    return days;
  }, [stats.dailyMap]);

  // Generate topic data
  const topicData = useMemo(() => {
    return Array.from(stats.topicStats.entries())
      .map(([topic, minutes]) => ({ topic, minutes }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [stats.topicStats]);

  const totalTopicMins = useMemo(() => {
    return topicData.reduce((acc, curr) => acc + curr.minutes, 0) || 1;
  }, [topicData]);

  return (
    <div className="flex flex-col p-8 h-full text-white overflow-hidden">
      <h2 className="text-sm font-semibold uppercase tracking-widest opacity-50 mb-6 shrink-0">Productivity Insights</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6 shrink-0">
        <StatCard title="Today" value={stats.todayMinutes} unit="m" />
        <StatCard title="This Week" value={stats.weekMinutes} unit="m" />
        <StatCard title="This Month" value={stats.monthMinutes} unit="m" />
      </div>

      <div className="flex-1 w-full flex flex-col min-h-0 overflow-y-auto scrollbar-hide pb-8">
        {/* Topic Breakdown */}
        <div className="mb-8 shrink-0">
          <h3 className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-4">Focus Topics</h3>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            {topicData.length > 0 ? (
              <div className="space-y-3">
                {topicData.map((item) => {
                  const percentage = (item.minutes / totalTopicMins) * 100;
                  
                  const hours = Math.floor(item.minutes / 60);
                  const mins = item.minutes % 60;
                  let displayTime = '';
                  if (hours > 0 && mins > 0) displayTime = `${hours}h ${mins}m`;
                  else if (hours > 0) displayTime = `${hours}h`;
                  else displayTime = `${mins}m`;

                  return (
                    <div key={item.topic} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">{item.topic}</span>
                        <span className="opacity-60 text-xs">{displayTime}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-sm text-white/40 py-2">
                No focus sessions recorded yet. Add a focus topic on the timer!
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-xs font-semibold uppercase tracking-widest opacity-50">Activity Map</h3>
          
          <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/5">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                "text-[10px] uppercase tracking-wider px-3 py-1 rounded-full transition-colors",
                viewMode === 'calendar' ? "bg-white/10 text-white font-medium" : "text-white/50 hover:text-white"
              )}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={cn(
                "text-[10px] uppercase tracking-wider px-3 py-1 rounded-full transition-colors",
                viewMode === 'heatmap' ? "bg-white/10 text-white font-medium" : "text-white/50 hover:text-white"
              )}
            >
              Heatmap
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={cn(
                "text-[10px] uppercase tracking-wider px-3 py-1 rounded-full transition-colors",
                viewMode === 'chart' ? "bg-white/10 text-white font-medium" : "text-white/50 hover:text-white"
              )}
            >
              Chart
            </button>
          </div>
        </div>
        
        {viewMode === 'calendar' ? (
          <CalendarView />
        ) : viewMode === 'heatmap' ? (
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col overflow-x-auto scrollbar-hide py-6 mb-4">
            <div className="grid grid-flow-col grid-rows-7 gap-[3px] w-max">
              {heatmapDays.map((day) => {
                let intensityClass = 'bg-white/5';
                if (day.minutes > 0) intensityClass = 'bg-blue-900/40';
                if (day.minutes >= 30) intensityClass = 'bg-blue-700/60';
                if (day.minutes >= 60) intensityClass = 'bg-blue-500';

                return (
                  <div
                    key={day.dateStr}
                    title={`${day.dateStr}: ${day.minutes} mins`}
                    className={cn("w-[10px] h-[10px] rounded-[2px] transition-colors", intensityClass)}
                  />
                );
              })}
            </div>
            <div className="text-[10px] opacity-30 mt-4 text-right">Last 12 Months</div>
          </div>
        ) : (
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col flex-1 min-h-[200px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  dy={10}
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
                  formatter={(value: number) => [`${value} min`, 'Duration']}
                />
                <Bar 
                  dataKey="minutes" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-[10px] opacity-30 mt-2 text-right">Last 14 Days</div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, unit }: { title: string; value: number; unit: string }) {
  const hours = Math.floor(value / 60);
  const mins = value % 60;

    let displayValue = '';
    let displayUnit = '';
    if (hours > 0) {
      displayValue = `${hours}.${Math.floor((mins / 60) * 10)}`;
      displayUnit = 'hrs';
    } else {
      displayValue = `${mins}`;
      displayUnit = unit;
    }

  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col">
      <p className="text-[10px] uppercase tracking-wider opacity-40 mb-1">{title}</p>
      <p className="text-2xl font-light">
        {displayValue}
        <span className="text-xs ml-1 opacity-40">{displayUnit}</span>
      </p>
    </div>
  );
}
