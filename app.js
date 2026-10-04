import { makeCalendar } from './calendar.mjs';
import { messages, translateWorkerError } from './i18n.mjs';

// Replace this with the deployed Cloudflare Worker URL, including /calendar.
const WORKER_URL = 'https://rova.pimtegelaar.workers.dev/calendar';

const form = document.querySelector('#calendar-form');
const status = document.querySelector('#status');
const button = document.querySelector('#download');
const languageButton = document.querySelector('#language-toggle');
let language = 'nl';
let currentStatus = null;
function showStatus(key, value) {
  currentStatus = { key, value };
  status.textContent = key === 'worker' ? translateWorkerError(value, language)
    : key === 'done' ? messages[language].done(value) : messages[language][key];
}
function renderLanguage() {
  document.documentElement.lang = language;
  document.title = messages[language].pageTitle;
  document.querySelectorAll('[data-i18n]').forEach(element => {
    element.textContent = messages[language][element.dataset.i18n];
  });
  languageButton.textContent = language === 'nl' ? '🇬🇧 English' : '🇳🇱 Nederlands';
  languageButton.lang = language === 'nl' ? 'en' : 'nl';
  languageButton.setAttribute('aria-label', language === 'nl' ? 'Switch to English' : 'Schakel naar Nederlands');
  if (currentStatus) showStatus(currentStatus.key, currentStatus.value);
}
languageButton.addEventListener('click', () => { language = language === 'nl' ? 'en' : 'nl'; renderLanguage(); });
renderLanguage();
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit'
}).formatToParts(new Date());
const part = type => today.find(p => p.type === type).value;
const currentYear = Number(part('year'));
form.elements.year.value = currentYear;
form.elements.year.min = currentYear - 1;
form.elements.year.max = currentYear + 1;
form.elements.fromDate.value = `${part('year')}-${part('month')}-${part('day')}`;

form.addEventListener('submit', async event => {
  event.preventDefault();
  button.disabled = true;
  languageButton.disabled = true;
  showStatus('loading');
  try {
    if (WORKER_URL.includes('YOUR_SUBDOMAIN')) { showStatus('configured'); return; }
    const postcode = form.elements.postcode.value.replace(/\s/g, '').toUpperCase();
    const houseNumber = Number(form.elements.houseNumber.value);
    const addition = form.elements.addition.value.trim();
    const year = Number(form.elements.year.value);
    if (!/^[1-9]\d{3}[A-Z]{2}$/.test(postcode)) { showStatus('invalidPostcode'); return; }
    const response = await fetch(WORKER_URL, {
      method: 'POST', credentials: 'omit', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postcode, houseNumber, addition, year }),
      signal: AbortSignal.timeout(35000)
    });
    const data = await response.json();
    if (!response.ok) { data.error ? showStatus('worker', data.error) : showStatus('failed'); return; }
    const { text, count } = await makeCalendar(data.collections,
      `${postcode}|${houseNumber}|${addition}`, form.elements.eventTime.value, form.elements.fromDate.value, language);
    if (!count) { showStatus('empty'); return; }
    const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `rova-${year}.ics`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    showStatus('done', count);
  } catch (error) {
    if (error.name === 'TimeoutError') showStatus('timeout');
    else if (error instanceof TypeError) showStatus('connection');
    else showStatus('worker', error.message);
  } finally { button.disabled = false; languageButton.disabled = false; }
});
