/**
 * Utility functions for timezone resolution and date calculation
 * specifically for the store's operational day.
 */

export function getTimezoneFromCepOrState(
  cep?: string | null,
  state?: string | null
): string {
  // 1. Sigla do Estado (UF)
  const uf = state?.trim().toUpperCase();
  if (uf) {
    if (uf === 'AC') return 'America/Rio_Branco'; // Acre: UTC-5
    if (uf === 'MT') return 'America/Cuiaba'; // Mato Grosso: UTC-4
    if (uf === 'MS') return 'America/Campo_Grande'; // Mato Grosso do Sul: UTC-4
    if (uf === 'RO') return 'America/Porto_Velho'; // Rondônia: UTC-4
    if (uf === 'RR') return 'America/Boa_Vista'; // Roraima: UTC-4
    if (uf === 'AM') return 'America/Manaus'; // Amazonas: UTC-4
    return 'America/Sao_Paulo'; // Demais estados: Horário de Brasília (UTC-3)
  }

  // 2. Faixa de CEP
  if (cep) {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length >= 2) {
      const prefix2 = parseInt(cleanCep.slice(0, 2), 10);
      const prefix5 =
        cleanCep.length >= 5 ? parseInt(cleanCep.slice(0, 5), 10) : 0;

      // Fernando de Noronha (PE)
      if (prefix5 >= 53990 && prefix5 <= 53999) return 'America/Noronha';

      // Acre (69900 a 69999)
      if (prefix2 === 69 && cleanCep.length >= 3 && cleanCep.charAt(2) === '9') {
        return 'America/Rio_Branco';
      }

      // Rondônia (76800 a 76999)
      if (prefix5 >= 76800 && prefix5 <= 76999) return 'America/Porto_Velho';

      // Roraima (69300 a 69399)
      if (prefix5 >= 69300 && prefix5 <= 69399) return 'America/Boa_Vista';

      // Amazonas (69000 a 69899)
      if (prefix2 === 69) return 'America/Manaus';

      // Mato Grosso (78000 a 78899)
      if (prefix2 === 78) return 'America/Cuiaba';

      // Mato Grosso do Sul (79000 a 79999)
      if (prefix2 === 79) return 'America/Campo_Grande';

      return 'America/Sao_Paulo';
    }
  }

  return 'America/Campo_Grande'; // Default da loja
}

export function getStoreTimezone(settings?: {
  deliveryOriginCep?: string | null;
  cep?: string | null;
  state?: string | null;
} | null): string {
  if (!settings) return 'America/Campo_Grande';
  return getTimezoneFromCepOrState(
    settings.deliveryOriginCep || settings.cep,
    settings.state
  );
}

/**
 * Returns a Date in UTC that represents dateStr + timeStr in the given timezone.
 */
export function getUtcDateForLocalTime(
  dateStr: string,
  timeStr: string,
  timeZone = 'America/Campo_Grande'
): Date {
  const baseUtc = new Date(`${dateStr}T${timeStr}Z`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(baseUtc);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const localAsUtc = new Date(
    `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}:${partMap.second}.${partMap.fractionalSecond || '000'}Z`
  );

  const offsetMs = baseUtc.getTime() - localAsUtc.getTime();
  return new Date(baseUtc.getTime() + offsetMs);
}

/**
 * Returns start of day (00:00:00.000) and end of day (23:59:59.999) in UTC ISO format,
 * along with the local YYYY-MM-DD date string, for today in the given timezone.
 */
export function getTodayRangeUtc(timeZone = 'America/Campo_Grande'): {
  startDateIso: string;
  endDateIso: string;
  todayYmd: string;
} {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayYmd = formatter.format(new Date()); // 'YYYY-MM-DD'

  const startOfDay = getUtcDateForLocalTime(todayYmd, '00:00:00.000', timeZone);
  const endOfDay = getUtcDateForLocalTime(todayYmd, '23:59:59.999', timeZone);

  return {
    startDateIso: startOfDay.toISOString(),
    endDateIso: endOfDay.toISOString(),
    todayYmd,
  };
}

/**
 * Check if a date falls within today in the given timezone.
 */
export function isOrderFromToday(
  createdAt: string | Date,
  timeZone = 'America/Campo_Grande',
  targetTodayYmd?: string
): boolean {
  try {
    const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    if (isNaN(d.getTime())) return false;

    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const orderYmd = formatter.format(d);
    const expectedYmd = targetTodayYmd || formatter.format(new Date());

    return orderYmd === expectedYmd;
  } catch {
    return false;
  }
}

/**
 * Formats order creation time as HH:mm in the store's timezone.
 */
export function formatOrderTime(
  createdAt: string | Date,
  timeZone = 'America/Campo_Grande'
): string {
  try {
    const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    if (isNaN(d.getTime())) return '--:--';

    return new Intl.DateTimeFormat('pt-BR', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(d);
  } catch {
    return '--:--';
  }
}
