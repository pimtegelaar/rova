export const messages = {
  nl: {
    pageTitle: 'ROVA-afvalkalender', title: 'Jouw ROVA-afvalkalender',
    intro: 'Download herinneringen om je afval de avond vóór de inzameling buiten te zetten.',
    postcode: 'Postcode', houseNumber: 'Huisnummer', addition: 'Toevoeging (optioneel)', year: 'Inzameljaar',
    eventTime: 'Tijdstip herinnering — Europe/Amsterdam', fromDate: 'Herinneringen vanaf',
    examples: '🥬 GFT · ♻️ PMD · 📦 Papier · 🗑️ Restafval',
    tip: 'Tip: Maak een aparte agenda, zodat je deze met je partner kunt delen. Je kunt de agenda ook eenvoudig aan- of uitzetten.',
    download: 'Kalender downloaden',
    instructions: 'In Google Agenda op een computer: Instellingen → Importeren en exporteren → kies het gedownloade .ics-bestand en een agenda → Importeren. Dit is een momentopname en wordt niet automatisch bijgewerkt. Meldingen zijn afhankelijk van je agenda-instellingen.',
    disclaimer: 'Onafhankelijke toepassing; niet verbonden aan ROVA.',
    loading: 'Je inzamelschema wordt opgehaald…',
    configured: 'De beheerder moet de Worker-URL instellen in app.js.',
    invalidPostcode: 'Vul een postcode in met vier cijfers en twee letters.',
    failed: 'Het inzamelschema kon niet worden opgehaald.',
    empty: 'Geen herinneringen voor het gekozen jaar en de begindatum. Kies een eerdere begindatum of een ander jaar.',
    timeout: 'De aanvraag duurde te lang. Probeer het opnieuw.',
    connection: 'Verbinding mislukt. Controleer je internetverbinding. De beheerder kan de Worker-URL en toegestane origins controleren.',
    done: count => `${count} afspraken gedownload. Importeer het bestand in je agenda.`
  },
  en: {
    pageTitle: 'ROVA calendar', title: 'Your ROVA calendar',
    intro: 'Download reminders to put out your bins the evening before collection.',
    postcode: 'Postcode', houseNumber: 'House number', addition: 'Suffix (optional)', year: 'Collection year',
    eventTime: 'Reminder time — Europe/Amsterdam', fromDate: 'Include reminder events starting from',
    examples: '🥬 GFT · ♻️ PMD · 📦 Papier · 🗑️ Restafval',
    tip: 'Tip: Create a separate calendar so you can share it with your partner. You can also easily toggle the calendar on or off.',
    download: 'Download calendar',
    instructions: 'In Google Calendar on a computer: Settings → Import & export → select the downloaded .ics file and a destination calendar → Import. This is a snapshot, not an automatically updated subscription. Notification delivery depends on your calendar settings.',
    disclaimer: 'Independent tool; not affiliated with ROVA.',
    loading: 'Retrieving your collection schedule…', configured: 'The website owner must configure the Worker URL in app.js.',
    invalidPostcode: 'Enter a postcode with four digits and two letters.', failed: 'Could not retrieve the collection schedule.',
    empty: 'No reminder events match the selected year and start date. Try an earlier start date or another year.',
    timeout: 'The request timed out. Please try again.',
    connection: 'Connection failed. Check your connection; the owner should check the Worker URL and allowed origins.',
    done: count => `Downloaded ${count} calendar events. Import the file into your calendar.`
  }
};

const workerErrors = {
  'Origin not allowed.': 'Deze website is niet toegestaan. De beheerder moet ALLOWED_ORIGINS controleren.',
  'The owner must configure ALLOWED_ORIGINS.': 'De beheerder moet ALLOWED_ORIGINS instellen.',
  'The owner must configure ALLOWED_ORIGIN.': 'De beheerder moet ALLOWED_ORIGIN instellen.',
  'Check postcode, house number, suffix and year (last, current or next year).': 'Controleer postcode, huisnummer, toevoeging en jaar (vorig, huidig of volgend jaar).',
  'The connection to ROVA timed out.': 'De verbinding met ROVA duurde te lang.',
  'The Worker could not connect to ROVA (network failure).': 'De Worker kon geen verbinding maken met ROVA (netwerkfout).',
  'ROVA returned a response that could not be read as JSON.': 'Het antwoord van ROVA kon niet als JSON worden gelezen.',
  'ROVA returned an unexpected response structure (expected a collection list).': 'ROVA gaf een onverwacht antwoord (een lijst met inzamelingen werd verwacht).',
  'ROVA returned an unexpected response structure.': 'ROVA gaf een onverwacht antwoord.',
  'ROVA returned a collection with an invalid date or waste-type field.': 'ROVA gaf een inzameling met een ongeldige datum of afvalsoort.',
  'ROVA is unavailable or returned an unexpected response. Please try again later.': 'ROVA is niet bereikbaar of gaf een onverwacht antwoord. Probeer het later opnieuw.',
  'ROVA could not retrieve this address. Check the address or try again later.': 'ROVA kon dit adres niet ophalen. Controleer het adres of probeer het later opnieuw.'
};
export function translateWorkerError(message, language) {
  if (language === 'en') return message;
  if (workerErrors[message]) return workerErrors[message];
  const http = /^ROVA returned HTTP (\d+)\./.exec(message);
  if (http) return `ROVA gaf HTTP ${http[1]}. Controleer je adres of probeer het later opnieuw.`;
  const redirect = /^ROVA returned a redirect \(HTTP (\d+)\)/.exec(message);
  if (redirect) return `ROVA gaf een doorverwijzing (HTTP ${redirect[1]}). De Worker heeft deze niet gevolgd.`;
  return `De aanvraag is mislukt. Technische melding: ${message}`;
}
