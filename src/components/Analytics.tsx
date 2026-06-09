import React, { useMemo, useState, useEffect } from 'react';
import { getSessions, subscribeToSessions } from '../lib/storage';
import { startOfDay, startOfWeek, startOfMonth, getIsoDate, cn } from '../lib/utils';
import { Session } from '../types';
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, YAxis, CartesianGrid } from 'recharts';
import { CalendarView } from './CalendarView';

function formatDuration(minutes: number): string {
  const totalSeconds = Math.round(minutes * 60);
  if (totalSeconds === 0) return '0s';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

export function Analytics() {
  const [sessions, setSessions] = useState<Session[]>(getSessions());
  
  useEffect(() => {
    const unsubscribe = subscribeToSessions((newSessions) => {
        setSessions(newSessions);
    });
    return () => unsubscribe();
  }, []);
  const [viewMode, setViewMode] = useState<'heatmap' | 'chart' | 'calendar'>('heatmap');
  const [hoveredCell, setHoveredCell] = useState<{ x: number, y: number, text: string } | null>(null);

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

  // Generate heatmap grid (padded for exactly full columns ending this week)
  const heatmapData = useMemo(() => {
    const today = startOfDay(new Date());
    
    // Go back 52 weeks (364 days), then find the preceding Sunday.
    const startOfPast = new Date(today);
    startOfPast.setDate(startOfPast.getDate() - 364);
    while (startOfPast.getDay() !== 0) {
      startOfPast.setDate(startOfPast.getDate() - 1);
    }
    
    const days = [];
    const months: { label: string, col: number }[] = [];
    let colIndex = 0;
    
    const curr = new Date(startOfPast);
    while (curr <= today) {
      if (curr.getDate() === 1) {
         months.push({ label: curr.toLocaleDateString('en-US', { month: 'short' }), col: colIndex });
      }
      
      const dateStr = getIsoDate(curr);
      const minutes = stats.dailyMap.get(dateStr) || 0;
      days.push({ 
        dateStr, 
        minutes, 
        date: new Date(curr),
        isFuture: false
      });
      
      if (curr.getDay() === 6) {
         colIndex++;
      }
      curr.setDate(curr.getDate() + 1);
    }
    
    // pad the rest of the week if needed
    const remainingToPad = 7 - (days.length % 7);
    if (remainingToPad < 7) {
        for(let i=0; i<remainingToPad; i++) {
           days.push({
             dateStr: '',
             minutes: 0,
             date: new Date(curr),
             isFuture: true
           });
           curr.setDate(curr.getDate() + 1);
        }
    }
    
    const totalCols = days.length / 7;
    
    return { days, months, totalCols };
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
    <div className="flex flex-col p-8 h-full text-white overflow-hidden relative">
      {hoveredCell && (
        <div 
          className="fixed z-[100] px-3 py-1.5 bg-[#2d2d2d] border border-white/10 text-white/90 font-medium text-[11px] rounded shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-[130%]"
          style={{ left: hoveredCell.x, top: hoveredCell.y }}
        >
          <div className="absolute w-2 h-2 bg-[#2d2d2d] border-b border-r border-white/10 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
          {hoveredCell.text}
        </div>
      )}
      <h2 className="text-sm font-semibold uppercase tracking-widest opacity-50 mb-6 shrink-0">Productivity Insights</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6 shrink-0">
        <StatCard title="Today" value={stats.todayMinutes} />
        <StatCard title="This Week" value={stats.weekMinutes} />
        <StatCard title="This Month" value={stats.monthMinutes} />
      </div>

      <div className="flex-1 w-full flex flex-col min-h-0 overflow-y-auto scrollbar-hide pb-8">
        {/* Topic Breakdown */}
        <div className="mb-8 shrink-0">
          <h3 className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-4">Focus Topics</h3>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5 relative z-10">
            {topicData.length > 0 ? (
              <div className="space-y-3">
                {topicData.map((item) => {
                  const percentage = (item.minutes / totalTopicMins) * 100;
                  const displayTime = formatDuration(item.minutes);

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
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col mb-4">
            <div 
              className="grid grid-rows-7 w-full gap-[3px]"
              style={{ gridAutoFlow: 'column', gridAutoColumns: 'minmax(0, 1fr)' }}
            >
              {heatmapData.days.map((day, i) => {
                let intensityClass = 'bg-[#2d2d2d]'; // empty state similar to github
                if (!day.isFuture) {
                  if (day.minutes > 0 && day.minutes < 30) intensityClass = 'bg-blue-900/60';
                  else if (day.minutes >= 30 && day.minutes < 60) intensityClass = 'bg-blue-700/80';
                  else if (day.minutes >= 60 && day.minutes < 120) intensityClass = 'bg-blue-500';
                  else if (day.minutes >= 120) intensityClass = 'bg-blue-400';
                } else {
                  intensityClass = 'bg-transparent';
                }

                return (
                  <div
                    key={i}
                    onMouseEnter={(e) => {
                      if (day.isFuture) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      
                      let displayTime = '';
                      if (day.minutes === 0) {
                          displayTime = 'No activity';
                      } else {
                          displayTime = `${formatDuration(day.minutes)} focus`;
                      }
                      
                      const dateFormatted = day.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                      
                      setHoveredCell({
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                          text: `${displayTime} on ${dateFormatted}`
                      });
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={cn("w-full aspect-square rounded-sm cursor-pointer transition-colors hover:ring-1 hover:ring-white/50", intensityClass)}
                  />
                );
              })}
            </div>
            {/* Months Row */}
            <div 
              className="grid w-full mt-2" 
              style={{ gridTemplateColumns: `repeat(${heatmapData.totalCols}, minmax(0, 1fr))` }}
            >
               {heatmapData.months.map((m, i) => (
                   <div 
                     key={i} 
                     className="text-[10px] text-white/40 font-medium tracking-wide" 
                     style={{ gridColumn: m.col + 1, gridRow: 1 }}
                   >
                     {m.label}
                   </div>
               ))}
            </div>
            
            <div className="flex items-center justify-between text-xs opacity-40 mt-4">
              <span>Last 12 Months</span>
              <div className="flex items-center gap-1.5">
                <span>Less</span>
                <div className="flex gap-[3px]">
                  <div className="w-3 h-3 rounded-sm bg-[#2d2d2d]" />
                  <div className="w-3 h-3 rounded-sm bg-blue-900/60" />
                  <div className="w-3 h-3 rounded-sm bg-blue-700/80" />
                  <div className="w-3 h-3 rounded-sm bg-blue-500" />
                  <div className="w-3 h-3 rounded-sm bg-blue-400" />
                </div>
                <span>More</span>
              </div>
            </div>
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
                <RechartsTooltip 
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

function StatCard({ title, value }: { title: string; value: number }) {
  const totalSeconds = Math.round(value * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col">
      <p className="text-[10px] uppercase tracking-wider opacity-40 mb-1">{title}</p>
      <p className="text-xl font-light tabular-nums flex items-baseline gap-1">
        {h > 0 && <><span className="text-2xl">{h}</span><span className="text-xs opacity-40">h</span></>}
        {(h > 0 || m > 0) && <><span className="text-2xl">{m}</span><span className="text-xs opacity-40">m</span></>}
        <span className="text-2xl">{s}</span><span className="text-xs opacity-40">s</span>
      </p>
    </div>
  );
}
