import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Calendar } from 'lucide-react';
import { Todo, CountdownEvent } from '../types';
import { cn, getIsoDate } from '../lib/utils';

export function Todos() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const data = localStorage.getItem('pomodoro_todos');
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  });
  
  const [events, setEvents] = useState<CountdownEvent[]>(() => {
    try {
      const data = localStorage.getItem('pomodoro_events');
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  });

  const [newTask, setNewTask] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');

  useEffect(() => {
    localStorage.setItem('pomodoro_todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('pomodoro_events', JSON.stringify(events));
  }, [events]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const t: Todo = {
      id: crypto.randomUUID(),
      text: newTask.trim(),
      completed: false,
      priority: 'medium',
      createdAt: Date.now()
    };
    setTodos([t, ...todos]);
    setNewTask('');
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) return;
    const ev: CountdownEvent = {
        id: crypto.randomUUID(),
        title: newEventTitle.trim(),
        date: newEventDate
    };
    setEvents([...events, ev].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setNewEventTitle('');
    setNewEventDate('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };
  
  const deleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const calculateDaysLeft = (targetDateStr: string) => {
      // Calculate D-Day
      const today = new Date();
      today.setHours(0,0,0,0);
      const target = new Date(targetDateStr);
      target.setHours(0,0,0,0);
      const diffMs = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diffDays; // negative if passed, positive if future
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8 h-full text-white w-full max-w-6xl mx-auto overflow-y-auto scrollbar-hide">
      
      {/* Todo List Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-white/5 rounded-2xl border border-white/5 p-6 relative">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            Task List
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                {todos.filter(t => !t.completed).length} pending
            </span>
          </h2>
          
          <form onSubmit={handleAddTodo} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 bg-black/40 border-none rounded-xl px-4 py-3 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <button type="submit" className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-lg">
                <Plus size={20} />
            </button>
          </form>

          <div className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-hide">
            {todos.length === 0 ? (
                <div className="text-center text-white/30 text-sm py-12">No tasks remaining. Keep it up!</div>
            ) : (
              todos.sort((a,b) => Number(a.completed) - Number(b.completed) || b.createdAt - a.createdAt).map(t => (
                <div 
                    key={t.id} 
                    className={cn(
                        "group flex items-center gap-3 p-3 rounded-xl border transition-all",
                        t.completed ? "bg-white/5 border-transparent opacity-50" : "bg-black/20 border-white/10 hover:border-white/20"
                    )}
                >
                    <button onClick={() => toggleTodo(t.id)} className="text-white/60 hover:text-white shrink-0">
                        {t.completed ? <CheckCircle size={20} className="text-green-400" /> : <Circle size={20} />}
                    </button>
                    <span className={cn("flex-1 text-sm font-medium", t.completed && "line-through text-white/50")}>
                        {t.text}
                    </span>
                    <button onClick={() => deleteTodo(t.id)} className="text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                        <Trash2 size={16} />
                    </button>
                </div>
              ))
            )}
          </div>
      </div>

      {/* Countdown Timers Area */}
      <div className="w-full md:w-80 flex flex-col bg-white/5 rounded-2xl border border-white/5 p-6 h-fit shrink-0">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-blue-400" /> Countdowns
          </h2>

          <form onSubmit={handleAddEvent} className="flex flex-col gap-3 mb-6">
            <input
              type="text"
              value={newEventTitle}
              onChange={e => setNewEventTitle(e.target.value)}
              placeholder="Event name (e.g., Final Exam)"
              className="bg-black/40 border-none rounded-lg px-3 py-2 text-sm text-white/90 placeholder-white/30 focus:outline-none"
            />
            <div className="flex gap-2">
                <input
                    type="date"
                    value={newEventDate}
                    onChange={e => setNewEventDate(e.target.value)}
                    className="flex-1 bg-black/40 border-none rounded-lg px-3 py-2 text-sm text-white/90 focus:outline-none"
                    min={getIsoDate(new Date())}
                />
                <button type="submit" className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
                    <Plus size={16} />
                </button>
            </div>
          </form>

          <div className="flex flex-col gap-3">
            {events.length === 0 ? (
                 <div className="text-center text-white/30 text-xs py-4">No upcoming events.</div>
            ) : (
                events.map(ev => {
                    const daysLeft = calculateDaysLeft(ev.date);
                    let badgeText = '';
                    let badgeColor = '';
                    if (daysLeft === 0) {
                        badgeText = 'Today / D-DAY';
                        badgeColor = 'bg-yellow-500 text-yellow-950 font-bold';
                    } else if (daysLeft < 0) {
                        badgeText = `H+${Math.abs(daysLeft)}`;
                        badgeColor = 'bg-white/10 text-white/50';
                    } else {
                        badgeText = `H-${daysLeft}`;
                        badgeColor = daysLeft <= 3 ? 'bg-red-500 text-white font-bold' : 'bg-blue-500/20 text-blue-300';
                    }

                    return (
                        <div key={ev.id} className="p-3 bg-black/20 rounded-xl border border-white/10 group relative pt-4 flex flex-col items-center">
                             <button onClick={() => deleteEvent(ev.id)} className="absolute top-2 right-2 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={12} />
                            </button>
                            <span className={cn("text-xs tracking-wider px-2 py-0.5 rounded-full mb-2", badgeColor)}>
                                {badgeText}
                            </span>
                            <span className="font-semibold text-sm text-center mb-1">{ev.title}</span>
                            <span className="text-[10px] text-white/50">{new Date(ev.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'})}</span>
                        </div>
                    );
                })
            )}
          </div>
      </div>
      
    </div>
  );
}
