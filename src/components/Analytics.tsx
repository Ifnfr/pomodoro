import React from 'react';
import { StudySession, TodoItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Award, Clock, Flame, CheckCircle } from 'lucide-react';
import { getLocalDateString } from '../lib/utils';

interface AnalyticsProps {
  sessions: StudySession[];
  todos: TodoItem[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ sessions, todos }) => {
  // 1. Calculate General Stats
  const focusSessions = sessions.filter(s => s.type === 'focus');
  const totalFocusSeconds = focusSessions.reduce((acc, s) => acc + s.duration, 0);
  const totalFocusMinutes = Math.round(totalFocusSeconds / 60);
  
  const totalHours = Math.floor(totalFocusMinutes / 60);
  const remainingMins = totalFocusMinutes % 60;
  
  const totalPomodoros = focusSessions.length;
  const completedTasks = todos.filter(t => t.completed).length;

  // 2. Daily Streak calculation
  const uniqueDates = Array.from(new Set(
    focusSessions.map(s => getLocalDateString(s.timestamp))
  )).sort();

  let streak = 0;
  if (uniqueDates.length > 0) {
    const todayStr = getLocalDateString(Date.now());
    const yesterdayStr = getLocalDateString(Date.now() - 86400000);
    
    // Check if they studied today or yesterday to continue streak
    const hasStudiedRecently = uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr);
    
    if (hasStudiedRecently) {
      streak = 1;
      let checkDate = new Date();
      // Go backwards and count consecutive days
      for (let i = 1; i < 100; i++) {
        checkDate.setDate(checkDate.getDate() - 1);
        const checkStr = getLocalDateString(checkDate.getTime());
        if (uniqueDates.includes(checkStr)) {
          streak++;
        } else {
          break;
        }
      }
    }
  }

  // 3. Prepare Chart Data for Last 7 Days
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateString(d.getTime());
    
    const daySessions = focusSessions.filter(s => getLocalDateString(s.timestamp) === dateStr);
    const dayMinutes = Math.round(daySessions.reduce((acc, s) => acc + s.duration, 0) / 60);
    
    // Formatted name (e.g., "Mon", "Tue")
    const label = d.toLocaleDateString('id-ID', { weekday: 'short' });
    chartData.push({
      name: label,
      menit: dayMinutes,
      tanggal: dateStr
    });
  }

  return (
    <div className="flex flex-col gap-4 p-4 text-slate-200 h-full overflow-y-auto">
      {/* Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-md">
            <Clock size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Fokus</span>
            <span className="text-sm font-bold text-slate-100">
              {totalHours > 0 ? `${totalHours}j ${remainingMins}m` : `${remainingMins}m`}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-md">
            <Flame size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Streak Hari</span>
            <span className="text-sm font-bold text-slate-100">{streak} Hari 🔥</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-md">
            <CheckCircle size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tugas Selesai</span>
            <span className="text-sm font-bold text-slate-100">{completedTasks} Selesai</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 text-sky-400 rounded-md">
            <Award size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Sesi Selesai</span>
            <span className="text-sm font-bold text-slate-100">{totalPomodoros} Sesi 🍅</span>
          </div>
        </div>
      </div>

      {/* Recharts Bar Graph */}
      <div className="bg-slate-900/20 border border-slate-800/80 rounded-xl p-3.5 flex-1 min-h-[220px]">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 px-1">Aktivitas Belajar (7 Hari Terakhir)</h4>
        <div className="w-full h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="m" />
              <Tooltip 
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px' }}
                labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 11 }}
                itemStyle={{ color: '#f43f5e', fontSize: 12 }}
                formatter={(value) => [`${value} menit`, 'Sesi Belajar']}
              />
              <Bar dataKey="menit" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quote / Recommendation Card */}
      <div className="bg-slate-800/10 border border-slate-700/30 p-3 rounded-lg flex flex-col gap-1 text-xs text-slate-400 leading-normal italic">
        <span className="font-bold text-rose-400/90 not-italic block mb-0.5">💡 Tips Belajar Efektif:</span>
        {totalFocusMinutes === 0 
          ? "Mulailah sesi fokus pertama Anda! 25 menit pertama adalah langkah terbesar untuk mengalahkan penundaan."
          : totalFocusMinutes < 120 
          ? "Kerja bagus! Ingat untuk beristirahat di setiap sesi agar otak Anda dapat memproses materi dengan rileks."
          : "Luar biasa! Konsistensi Anda sangat solid. Jaga ritme ini agar Anda terhindar dari rasa jenuh (burnout)."}
      </div>
    </div>
  );
};
