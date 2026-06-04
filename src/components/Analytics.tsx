import React, { useMemo } from 'react';
import { getSessions } from '../lib/storage';
import { startOfDay, startOfWeek, startOfMonth, getIsoDate, cn } from '../lib/utils';
import { Session } from '../types';

export function Analytics() {
  const sessions = useMemo(() => getSessions(), []);

  const stats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now).getTime();
    const thisWeek = startOfWeek(now).getTime();
    const thisMonth = startOfMonth(now).getTime();

    let todayMinutes = 0;
    let weekMinutes = 0;
    let monthMinutes = 0;

    const dailyMap = new Map<string, number>();

    sessions.forEach(s => {
      if (s.mode !== 'pomodoro') return;

      const sTime = s.timestamp;
      
      if (sTime >= today) todayMinutes += s.durationMinutes;
      if (sTime >= thisWeek) weekMinutes += s.durationMinutes;
      if (sTime >= thisMonth) monthMinutes += s.durationMinutes;

      const dateStr = getIsoDate(new Date(sTime));
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + s.durationMinutes);
    });

    return { todayMinutes, weekMinutes, monthMinutes, dailyMap };
  }, [sessions]);

  // Generate heatmap grid (last 12 months = 364 days)
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = startOfDay(new Date());
    
    // We want to generate the last 364 days (52 weeks)
    for (let i = 363; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getIsoDate(d);
      const minutes = stats.dailyMap.get(dateStr) || 0;
      days.push({ dateStr, minutes });
    }
    return days;
  }, [stats.dailyMap]);

  return (
    <div className="flex flex-col p-8 h-full text-white">
      <h2 className="text-sm font-semibold uppercase tracking-widest opacity-50 mb-6">Productivity Insights</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard title="Today" value={stats.todayMinutes} unit="m" />
        <StatCard title="This Week" value={stats.weekMinutes} unit="m" />
        <StatCard title="This Month" value={stats.monthMinutes} unit="m" />
      </div>

      {/* Heatmap */}
      <div className="flex-1 w-full flex flex-col min-h-0">
        <div className="flex items-end justify-between mb-2 shrink-0">
          <h3 className="text-xs font-semibold uppercase tracking-widest opacity-50">Activity Map</h3>
          <span className="text-[10px] opacity-30">Last 12 Months</span>
        </div>
        
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col overflow-x-auto scrollbar-hide">
          <div className="grid grid-flow-col grid-rows-7 gap-[3px] w-max">
            {heatmapDays.map((day, i) => {
              // Calculate color intensity
              let intensityClass = 'bg-white/5'; // 0
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
        </div>
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
