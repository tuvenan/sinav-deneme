export interface GoogleCalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: { method: 'popup' | 'email'; minutes: number }[];
  };
}

// Map Turkish weekdays to Javascript Date days
const WEEK_DAT_MAP: Record<string, number> = {
  'pazartesi': 1,
  'salı': 2,
  'çarşamba': 3,
  'perşembe': 4,
  'cuma': 5,
  'cumartesi': 6,
  'pazar': 0
};

// Find the date for the upcoming occurrence of a specific weekday (e.g. "Pazartesi" -> next Monday)
export function getNextDateForWeekday(weekday: string): Date {
  const targetDayNum = WEEK_DAT_MAP[weekday.toLowerCase()] ?? 1;
  const resultDate = new Date();
  const currentDayNum = resultDate.getDay();
  
  // Calculate days until target weekday
  // If targetDayNum is today, schedule it for today or next week if later in the day, default to today
  let daysDiff = targetDayNum - currentDayNum;
  if (daysDiff < 0) {
    daysDiff += 7;
  }
  
  resultDate.setDate(resultDate.getDate() + daysDiff);
  return resultDate;
}

// Format Date as ISO String with no timezone offset (for Google Calendar API)
export function formatToCalISO(date: Date, hours: number, minutes: number = 0): string {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  
  // Use Turkish timezone format (ISO string but with local offset, or standard ISO format + timezone parameter)
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
}

// 1. Fetch upcoming events from Google Calendar
export async function listUpcomingEvents(accessToken: string, maxResults = 15): Promise<any[]> {
  try {
    const timeMin = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Calendar API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Failed to fetch events from Google Calendar:', error);
    return [];
  }
}

// 2. Create a single event in Google Calendar
export async function createCalendarEvent(accessToken: string, event: GoogleCalendarEvent): Promise<any> {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create calendar event: ${errText}`);
  }

  return response.json();
}

// 3. Add entire LGS study camp program to Google Calendar (User approval must be requested before invoking this)
export async function addLgsWeeklyCampToCalendar(
  accessToken: string, 
  weeklySchedule: { weakTopic: string; studyStyle: string; tasks: Record<string, any> }
): Promise<number> {
  let createdCount = 0;
  const tasks = Object.entries(weeklySchedule.tasks);
  
  for (const [dayName, task] of tasks) {
    const targetDate = getNextDateForWeekday(dayName);
    
    // Schedule all study plans at 14:00 (ideal study hour) or custom default
    const startIso = formatToCalISO(targetDate, 14, 0);
    const endIso = formatToCalISO(targetDate, 16, 0); // 2 hours study session
    
    const event: GoogleCalendarEvent = {
      summary: `📚 LGS Çalışması: ${task.title}`,
      description: `Konu: ${weeklySchedule.weakTopic}\nKategori: ${weeklySchedule.studyStyle}\nHedef Soru: +${task.target}\n\nTaktik / İpucu: ${task.tip}\n\nEduAi tarafından otomatik oluşturulmuştur. Başarılar dileriz!`,
      start: {
        dateTime: startIso,
        timeZone: 'Europe/Istanbul'
      },
      end: {
        dateTime: endIso,
        timeZone: 'Europe/Istanbul'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 120 }
        ]
      }
    };
    
    await createCalendarEvent(accessToken, event);
    createdCount++;
  }
  
  return createdCount;
}

// 4. Set Daily study reminder
export async function setDailyStudyReminder(
  accessToken: string,
  timeString: string, // e.g. "19:30"
  targetSoruGoal: number
): Promise<any> {
  const today = new Date();
  const [hoursStr, minutesStr] = timeString.split(':');
  const hours = parseInt(hoursStr) || 19;
  const minutes = parseInt(minutesStr) || 0;
  
  const startIso = formatToCalISO(today, hours, minutes);
  
  // End event after 1 hour
  const endIso = formatToCalISO(today, hours + 1, minutes);
  
  const event: GoogleCalendarEvent = {
    summary: '🔔 LGS Günlük Soru Çözme Saati!',
    description: `Günlük soru çözme hedefine ulaşma zamanı! Hedefin: ${targetSoruGoal} soru çözmek.\n\n"Bugün atmadığın adım, yarın seni hedeften bir adım daha uzaklaştırır."\n\nEduAi Danışmanlık`,
    start: {
      dateTime: startIso,
      timeZone: 'Europe/Istanbul'
    },
    end: {
      dateTime: endIso,
      timeZone: 'Europe/Istanbul'
    },
    // Recurrence rule to repeat daily
    // RRULE for standard recurrence rule
    ...{
      recurrence: [
        'RRULE:FREQ=DAILY'
      ]
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 10 }
      ]
    }
  };
  
  return createCalendarEvent(accessToken, event);
}
