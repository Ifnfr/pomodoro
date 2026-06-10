export function getIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

export function startOfWeek(date: Date): Date {
  const newDate = startOfDay(date);
  const day = newDate.getDay();
  const diff = newDate.getDate() - day + (day === 0 ? -6 : 1); // target Monday
  newDate.setDate(diff);
  return newDate;
}

export function startOfMonth(date: Date): Date {
  const newDate = startOfDay(date);
  newDate.setDate(1);
  return newDate;
}

export function endOfMonth(date: Date): Date {
  const newDate = startOfDay(date);
  newDate.setMonth(newDate.getMonth() + 1);
  newDate.setDate(0);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function sendNotification(title: string, body?: string) {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, { body });
      }
    });
  }
}

export function calculateStreak(sessions: any[]): number {
  if (!sessions || sessions.length === 0) return 0;
  
  const pomodoroDates = new Set<string>();
  for (const s of sessions) {
    if (s.mode === 'pomodoro' && s.durationMinutes > 0) {
      pomodoroDates.add(getIsoDate(new Date(s.timestamp)));
    }
  }

  if (pomodoroDates.size === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  let dateStr = getIsoDate(currentDate);

  if (pomodoroDates.has(dateStr)) {
    streak++;
  } else {
    currentDate.setDate(currentDate.getDate() - 1);
    dateStr = getIsoDate(currentDate);
    if (!pomodoroDates.has(dateStr)) {
      return 0;
    } else {
      streak++;
    }
  }

  while (true) {
    currentDate.setDate(currentDate.getDate() - 1);
    dateStr = getIsoDate(currentDate);
    if (pomodoroDates.has(dateStr)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
