import crypto from 'crypto';

const PEPPER = 'penca-salados-v2';

export function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

export function nameKey(name: string) {
  return normalizeName(name).toLocaleLowerCase('es-UY');
}

export function validatePin(pin: string) {
  return /^[0-9]{4,8}$/.test(pin);
}

export function hashPin(name: string, pin: string) {
  return crypto
    .createHash('sha256')
    .update(`${PEPPER}:${nameKey(name)}:${pin}`)
    .digest('hex');
}

export function isAdminRequest(request: Request) {
  const configured = process.env.ADMIN_PASSWORD;
  const header = request.headers.get('x-admin-password');
  return Boolean(configured && header && configured === header);
}

export function isCronRequest(request: Request) {
  const configured = process.env.CRON_SECRET;
  const header = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace('Bearer ', '');
  return Boolean(configured && header && configured === header);
}
