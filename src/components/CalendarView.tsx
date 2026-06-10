import React, { useState, useEffect } from 'react';
import { fetchStudyEvents } from '../lib/calendar';
import { startOfMonth, endOfMonth, getIsoDate, cn } from '../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function CalendarView({ dailyMap }: { dailyMap?: Map<string, number> }) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [eventsData, setEventsData] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      setLoading(true);
      setError('');
      try {
        const timeMin = currentMonth;
        const timeMax = endOfMonth(currentMonth);
        // Extend timeMin and Max a bit if needed, but start/end of month is fine
        
        const events = await fetchStudyEvents(timeMin, timeMax);
        if (!active) return;

        const dailySeconds = new Map<string, number>();
        events.forEach((ev: any) => {
          if (ev.start?.dateTime && ev.end?.dateTime) {
            const start = new Date(ev.start.dateTime);
            const end = new Date(ev.end.dateTime);
            const dateStr = getIsoDate(start);
            const durationSecs = Math.floor((end.getTime() - start.getTime()) / 1000);
            
            dailySeconds.set(dateStr, (dailySeconds.get(dateStr) || 0) + durationSecs);
          }
        });
        
        setEventsData(dailySeconds);
      } catch (err) {
        console.error(err);
        if (active) setError('Failed to load events');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEvents();
    return () => { active = false; };
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentMonth(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonth(next);
  };

  const getDaysInMonth = (date: Date) => {
    const days = [];
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Padding for first week
    for (let i = 0; i < firstDay.getDay(); i++) {
        days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const d = new Date(year, month, i);
        days.push(d);
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">{monthName}</h3>
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={16} /></button>
          <button onClick={handleNextMonth} className="p-1 hover:bg-white/10 rounded-full transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>
      
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      {loading && <p className="text-blue-400 text-xs mb-2 animate-pulse">Syncing with Google Calendar...</p>}

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-[10px] uppercase font-semibold opacity-50">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="h-14 bg-white/[0.02] rounded-lg" />;
          
          const dateStr = getIsoDate(day);
          const gcSecs = eventsData.get(dateStr) || 0;
          const localMins = dailyMap?.get(dateStr) || 0;
          const totalSecs = gcSecs + localMins * 60;
          const totalMins = totalSecs / 60;
          
          let durationStr = '';
          if (totalSecs > 0) {
            const h = Math.floor(totalSecs / 3600);
            const m = Math.floor((totalSecs % 3600) / 60);
            if (h > 0) {
               durationStr = `${h}h ${m}m`;
            } else {
               durationStr = `${m}m`;
            }
          }

          let intensityClass = "bg-white/5 border-transparent text-white/50";
          if (totalMins > 0 && totalMins < 30) intensityClass = "bg-blue-900/60 border-blue-800/50 text-blue-100";
          else if (totalMins >= 30 && totalMins < 60) intensityClass = "bg-blue-700/80 border-blue-600/50 text-blue-100";
          else if (totalMins >= 60 && totalMins < 120) intensityClass = "bg-blue-500 border-blue-400/50 text-white";
          else if (totalMins >= 120) intensityClass = "bg-blue-400 border-blue-300/50 text-white";

          return (
            <div key={dateStr} className={cn(
                "h-14 flex flex-col justify-between p-1.5 rounded-lg border",
                intensityClass
            )}>
              <span className="text-xs font-medium self-start">{day.getDate()}</span>
              {totalSecs > 0 && (
                <span className="text-[10px] font-bold self-end opacity-90">
                  {durationStr}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
