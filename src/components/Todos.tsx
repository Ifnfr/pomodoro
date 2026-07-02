import React, { useState } from 'react';
import { TodoItem } from '../types';
import { Plus, Trash2, CheckCircle, Circle, Sparkles } from 'lucide-react';
import { playBtnSound } from '../lib/audio';

interface TodosProps {
  todos: TodoItem[];
  onAddTodo: (text: string, estimated: number) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  activeTodoId: string | null;
  onSetActiveTodo: (id: string | null) => void;
}

export const Todos: React.FC<TodosProps> = ({
  todos,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  activeTodoId,
  onSetActiveTodo,
}) => {
  const [newText, setNewText] = useState('');
  const [estimated, setEstimated] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAddTodo(newText.trim(), estimated);
    setNewText('');
    setEstimated(1);
    playBtnSound();
  };

  const renderTomatoes = (count: number, filledCount: number) => {
    const tomatoes = [];
    for (let i = 0; i < count; i++) {
      tomatoes.push(
        <span 
          key={i} 
          className={`text-xs select-none ${i < filledCount ? 'text-rose-500' : 'text-slate-600'}`}
          title={`${filledCount}/${count} Pomodoro`}
        >
          🍅
        </span>
      );
    }
    return <div className="flex gap-0.5">{tomatoes}</div>;
  };

  return (
    <div className="flex flex-col h-full text-slate-200">
      {/* Task input form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-3 border-b border-slate-700/40 bg-slate-800/10 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Apa yang ingin Anda pelajari hari ini?..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="flex-1 min-w-0 bg-slate-900/60 border border-slate-700/60 rounded px-2.5 py-1.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
          <button
            type="submit"
            className="bg-rose-600 hover:bg-rose-500 text-white font-medium px-3.5 py-1.5 rounded text-sm transition-colors flex items-center justify-center gap-1 shrink-0"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Tambah</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 px-0.5 mt-1">
          <span className="font-medium">Estimasi Durasi (Sesi 🍅):</span>
          <div className="flex items-center gap-1 bg-slate-950/40 px-2 py-1 rounded border border-slate-800">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  playBtnSound();
                  setEstimated(num);
                }}
                className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                  estimated === num 
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 font-bold' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* List items */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
        {todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 gap-2 select-none">
            <Sparkles size={28} className="text-slate-600" />
            <p className="text-xs max-w-[200px]">Belum ada tugas. Tulis sesuatu di atas untuk mulai fokus.</p>
          </div>
        ) : (
          todos.map((todo) => {
            const isActive = todo.id === activeTodoId;
            return (
              <div
                key={todo.id}
                onClick={() => !todo.completed && onSetActiveTodo(isActive ? null : todo.id)}
                className={`flex items-start justify-between p-2.5 rounded border transition-all cursor-pointer ${
                  todo.completed
                    ? 'bg-slate-950/10 border-slate-800/50 opacity-55'
                    : isActive
                    ? 'bg-rose-500/10 border-rose-500/50 shadow-md ring-1 ring-rose-500/20'
                    : 'bg-slate-800/20 border-slate-700/40 hover:border-slate-600 hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTodo(todo.id);
                      playBtnSound();
                    }}
                    className="p-0.5 rounded text-slate-500 hover:text-slate-300 transition-colors shrink-0 mt-0.5"
                  >
                    {todo.completed ? (
                      <CheckCircle size={18} className="text-emerald-500" />
                    ) : (
                      <Circle size={18} className="text-slate-500 hover:text-rose-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <span 
                      className={`text-sm block truncate ${
                        todo.completed ? 'line-through text-slate-500' : 'text-slate-100 font-medium'
                      }`}
                    >
                      {todo.text}
                    </span>
                    <div className="mt-1">
                      {renderTomatoes(todo.pomodorosEstimated, todo.pomodorosCompleted)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {!todo.completed && (
                    <span 
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isActive 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700/50 hover:bg-slate-700'
                      }`}
                      title={isActive ? "Tugas ini aktif di timer" : "Aktifkan tugas ini"}
                    >
                      {isActive ? "Fokus 🎯" : "Pilih"}
                    </span>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTodo(todo.id);
                      playBtnSound();
                    }}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-colors"
                    title="Hapus Tugas"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer stats */}
      {todos.length > 0 && (
        <div className="p-2 border-t border-slate-700/40 bg-slate-900/40 text-[11px] text-slate-400 flex justify-between shrink-0 font-medium px-3">
          <span>Tugas: {todos.filter(t => t.completed).length} / {todos.length} selesai</span>
          <span>Estimasi: {todos.reduce((acc, t) => acc + t.pomodorosEstimated, 0)} 🍅 total</span>
        </div>
      )}
    </div>
  );
};
