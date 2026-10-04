const icons = { GFT: '🥬', GFTE: '🥬', PMD: '♻️', PAP: '📦', RST: '🗑️' };
const titles = { GFT: 'GFT', GFTE: 'GFT', PMD: 'PMD', PAP: 'Papier', RST: 'Restafval' };
const encoder = new TextEncoder();
const escapeText = value => String(value).replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
function fold(line) {
  const result = []; let current = '';
  for (const char of line) {
    if (encoder.encode(current + char).length > 75) { result.push(current); current = ' '; }
    current += char;
  }
  return [...result, current].join('\r\n');
}
function previousDay(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Invalid collection date.');
  const date = new Date(`${day}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== day) throw new Error('Invalid collection date.');
  // UTC is used only for calendar-day arithmetic, not for the event's local time.
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0,10);
}
export async function makeCalendar(rows, addressKey, eventTime = '20:00', fromDate = '', language = 'nl') {
  if (!Array.isArray(rows)) throw new Error('Invalid collection response.');
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(eventTime)) throw new Error('Invalid reminder time.');
  if (fromDate) previousDay(fromDate); // Validate the filter date too.
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ROVA Downloader//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:ROVA', 'X-WR-TIMEZONE:Europe/Amsterdam',
    'BEGIN:VTIMEZONE', 'TZID:Europe/Amsterdam', 'BEGIN:DAYLIGHT', 'DTSTART:19960331T020000',
    'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT', 'BEGIN:STANDARD', 'DTSTART:19961027T030000', 'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100', 'TZNAME:CET', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD', 'END:VTIMEZONE'];
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const seen = new Set(); let count = 0;
  for (const row of [...rows].sort((a,b) => a.date.localeCompare(b.date) || a.waste_type.localeCompare(b.waste_type))) {
    const day = previousDay(row.date);
    if (fromDate && day < fromDate) continue;
    const identity = `${addressKey}|${row.date}|${row.waste_code}|${row.waste_type}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(identity));
    const uid = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('');
    const code = row.waste_code.toUpperCase();
    const summary = `${icons[code] || '🚛'} ${titles[code] || row.waste_type}`;
    const description = language === 'en'
      ? `ROVA collects ${row.waste_type} on ${row.date}.` + (row.is_irregular ? ' Irregular collection.' : '')
      : `ROVA zamelt ${row.waste_type} in op ${row.date}.` + (row.is_irregular ? ' Afwijkende inzameling.' : '');
    lines.push('BEGIN:VEVENT', `UID:${uid}@rova-calendar.local`, `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Amsterdam:${day.replace(/-/g,'')}T${eventTime.replace(':','')}00`,
      'DURATION:PT25M', `SUMMARY:${escapeText(summary)}`, `DESCRIPTION:${escapeText(description)}`,
      'TRANSP:TRANSPARENT', 'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT0S',
      `DESCRIPTION:${escapeText(summary)}`, 'END:VALARM', 'END:VEVENT');
    count++;
  }
  lines.push('END:VCALENDAR');
  return { text: lines.map(fold).join('\r\n') + '\r\n', count };
}
