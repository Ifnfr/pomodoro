import React from 'react';
import { StudySession } from '../types';
import { getLocalDateString } from '../lib/utils';
import { Calendar, History } from 'lucide-react';

interface CalendarViewProps {
  sessions: StudySession[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ sessions }) => {
  const focusSessions = sessions.filter(s => s.type === 'focus');

  // Aggregate sessions by date
  const dateMap: Record<string, number> = {};
  focusSessions.forEach(s => {
    const dStr = getLocalDateString(s.timestamp);
    dateMap[dStr] = (dateMap[dStr] || 0) + s.duration;
  });

  // Generate grid for the last 15 weeks (15 * 7 = 105 days)
  const totalDays = 105;
  const daysArray = [];
  const today = new Date();

  // Create array from oldest to newest (today is at index totalDays - 1)
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dStr = getLocalDateString(d.getTime());
    const durationSeconds = dateMap[dStr] || 0;
    const durationMinutes = Math.round(durationSeconds / 60);
    
    daysArray.push({
      date: d,
      dateStr: dStr,
      minutes: durationMinutes,
    });
  }

  // Helper to determine intensity color
  const getColorClass = (mins: number) => {
    if (mins === 0) return 'bg-slate-900 border-slate-950/40 hover:bg-slate-800';
    if (mins <= 15) return 'bg-rose-950 text-rose-300 border-rose-900/40 hover:bg-rose-900';
    if (mins <= 30) return 'bg-rose-800 text-rose-100 border-rose-700/40 hover:bg-rose-700';
    if (mins <= 60) return 'bg-rose-600 text-white border-rose-500/40 hover:bg-rose-50';
    return 'bg-rose-400 text-slate-950 border-rose-300 hover:bg-rose-300';
  };

  // Group days by week for column-based layout
  const weeks: typeof daysArray[] = [];
  let currentWeek: typeof daysArray = [];

  // Pad the start so weeks align nicely (Sunday is first day of row in standard calendar)
  const firstDay = daysArray[0].date;
  const paddingSize = firstDay.getDay(); // 0 is Sunday, 1 Monday...
  
  // Empty slots padding
  const paddedDaysArray = [
    ...Array(paddingSize).fill(null),
    ...daysArray
  ];

  paddedDaysArray.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === paddedDaysArray.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div className="flex flex-col gap-4 p-4 text-slate-200 h-full overflow-y-auto">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-rose-400" />
          <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-300">Papan Kontribusi Belajar</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Sedikit</span>
          <span className="w-2.5 h-2.5 bg-slate-900 border border-slate-950/40 rounded-sm"></span>
          <span className="w-2.5 h-2.5 bg-rose-950 rounded-sm"></span>
          <span className="w-2.5 h-2.5 bg-rose-800 rounded-sm"></span>
          <span className="w-2.5 h-2.5 bg-rose-600 rounded-sm"></span>
          <span className="w-2.5 h-2.5 bg-rose-400 rounded-sm"></span>
          <span>Banyak</span>
        </div>
      </div>

      {/* Grid Heatmap Container */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 overflow-x-auto">
        <div className="flex min-w-[500px] justify-between gap-1 select-none">
          {/* Day Labels */}
          <div className="flex flex-col justify-between text-[10px] text-slate-500 pr-2 pt-4 pb-1">
            <span>Min</span>
            <span>Sel</span>
            <span>Kam</span>
            <span>Sab</span>
          </div>

          {/* Grid Blocks */}
          <div className="flex flex-1 gap-1">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1 flex-1">
                {week.map((day, dIdx) => {
                  if (!day) {
                    return <div key={`empty-${dIdx}`} className="w-full aspect-square bg-transparent"></div>;
                  }
                  return (
                    <div
                      key={day.dateStr}
                      className={`w-full aspect-square rounded-[3px] border transition-all relative group cursor-pointer ${getColorClass(day.minutes)}`}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-slate-950 border border-slate-700 text-[10px] text-slate-200 rounded px-2 py-1 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10 shadow-lg">
                        <span className="font-bold">{day.minutes} menit</span> • {day.date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session History Log List */}
      <div className="flex flex-col gap-2 flex-1 min-h-[150px]">
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5 px-0.5">
          <History size={15} className="text-slate-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Riwayat Sesi Terakhir</h4>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1 max-h-[180px]">
          {sessions.length === 0 ? (
            <div className="text-center text-slate-500 py-6 text-xs italic">
              Belum ada aktivitas belajar yang tercatat. Selesaikan sesi fokus Anda!
            </div>
          ) : (
            sessions.slice(0, 30).map((session) => {
              const date = new Date(session.timestamp);
              const isFocus = session.type === 'focus';
              
              return (
                <div 
                  key={session.id} 
                  className="bg-slate-900/30 border border-slate-800/80 rounded px-3 py-2 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${
                      session.type === 'focus' 
                        ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' 
                        : session.type === 'shortBreak' 
                        ? 'bg-emerald-500' 
                        : 'bg-sky-500'
                    }`}></span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200">
                        {isFocus ? 'Fokus Selesai 🎯' : session.type === 'shortBreak' ? 'Istirahat Singkat ☕' : 'Istirahat Panjang 🌴'}
                      </span>
                      {session.taskTitle && (
                        <span className="text-[10px] text-slate-400 max-w-[200px] truncate">
                          Tugas: "{session.taskTitle}"
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span className="font-medium bg-slate-950/40 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                      {Math.round(session.duration / 60)} m
                    </span>
                    <span>
                      {date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })} - {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
