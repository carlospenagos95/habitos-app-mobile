/** Fecha local del dispositivo en formato "YYYY-MM-DD". */
export function todayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Suma (o resta, con días negativos) días a una fecha "YYYY-MM-DD". */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Día de la semana en español: "Lunes". */
export function weekdayNameEs(date: Date): string {
  return DIAS[date.getDay()];
}

/** Fecha larga en español: "Lunes 28 de septiembre". Arreglos propios; no depende de Intl. */
export function formatLongDateEs(date: Date): string {
  return `${weekdayNameEs(date)} ${date.getDate()} de ${MESES[date.getMonth()]}`;
}
