import { getAccessToken } from './firebase';

export async function addEventToCalendar(title: string, durationMinutes: number, startTimeMs: number) {
  const token = await getAccessToken();
  if (!token) return;

  const start = new Date(startTimeMs);
  const end = new Date(startTimeMs + durationMinutes * 60 * 1000);

  const event = {
    summary: title,
    description: 'Synced from Focus Popup app',
    start: {
      dateTime: start.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  try {
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!res.ok) {
      console.error('Failed to create calendar event', await res.text());
    }
  } catch (error) {
    console.error('Error creating calendar event', error);
  }
}

export async function fetchStudyEvents(timeMin: Date, timeMax: Date) {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.append('timeMin', timeMin.toISOString());
    url.searchParams.append('timeMax', timeMax.toISOString());
    url.searchParams.append('singleEvents', 'true');
    // Searching for focus app syncs or anything we define as "study"
    url.searchParams.append('q', 'Focus Popup app'); 

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error('Failed to fetch calendar events', await res.text());
      return [];
    }

    const data = await res.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching calendar events', error);
    return [];
  }
}
