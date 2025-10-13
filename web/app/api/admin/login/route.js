import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { totp } from 'otplib';

// In-memory limiter store (per process). For production, use Redis/Upstash.
const g = globalThis;
if (!g.__adminLimiter) {
  g.__adminLimiter = {
    attempts: new Map(), // key: ip:email -> { count, last, lockUntil }
    failures: [], // recent failure logs
  };
}

const store = g.__adminLimiter;
const WINDOW_MS = 15 * 60 * 1000; // 15 min rolling window
const MAX_FAILS = 3; // lock threshold
const BASE_LOCK_MS = 10 * 60 * 1000; // 10 min lock

function keyFor(ip, email) {
  return `${ip || 'unknown'}:${(email || '').toLowerCase()}`;
}

async function getIp() {
  const h = await headers();
  const xff = h.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return h.get('x-real-ip') || 'local';
}

function now() { return Date.now(); }

function checkAndMaybeLock(ip, email) {
  const k = keyFor(ip, email);
  const rec = store.attempts.get(k) || { count: 0, last: 0, lockUntil: 0 };
  const t = now();
  if (rec.lockUntil && rec.lockUntil > t) {
    return { locked: true, retryAfter: rec.lockUntil - t };
  }
  // window reset
  if (rec.last && t - rec.last > WINDOW_MS) {
    rec.count = 0;
  }
  rec.last = t;
  store.attempts.set(k, rec);
  return { locked: false };
}

function recordFailure(ip, email) {
  const k = keyFor(ip, email);
  const t = now();
  const rec = store.attempts.get(k) || { count: 0, last: 0, lockUntil: 0 };
  // slide window
  if (rec.last && t - rec.last > WINDOW_MS) rec.count = 0;
  rec.count += 1;
  rec.last = t;
  if (rec.count >= MAX_FAILS) {
    const backoff = BASE_LOCK_MS * Math.min(4, rec.count - MAX_FAILS + 1); // simple linear backoff up to 40 min
    rec.lockUntil = t + backoff;
    alertLockout(ip, email, rec.count, backoff);
  }
  store.attempts.set(k, rec);
  // monitoring log
  store.failures.push({ time: new Date().toISOString(), ip, email });
  if (store.failures.length > 1000) store.failures.shift();
}

function recordSuccess(ip, email) {
  const k = keyFor(ip, email);
  store.attempts.delete(k);
}

async function alertLockout(ip, email, count, backoffMs) {
  const msg = `[admin-login] Lockout: ip=${ip} email=${email} attempts=${count} lock=${Math.round(backoffMs/60000)}m`;
  console.warn(msg);
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: msg, ip, email, attempts: count, lockMs: backoffMs }) });
  } catch {}
}

export async function POST(req) {
  try {
    const { stage = 'precheck', email = '', totpCode = '' } = await req.json().catch(() => ({}));
    const ip = await getIp();
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();

    if (!adminEmail) {
      return NextResponse.json({ ok: false, error: 'Server not configured' }, { status: 500 });
    }

    // Always generic responses
    const generic = () => NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 400 });

    if (stage === 'report') {
      const { success = false } = await req.json().catch(() => ({ success: false }));
      if (success) {
        recordSuccess(ip, email);
        return NextResponse.json({ ok: true });
      }
      recordFailure(ip, email);
      return generic();
    }

    // stage === 'precheck'
    const { locked, retryAfter } = checkAndMaybeLock(ip, email);
    if (locked) {
      return generic();
    }

    // Email allowlist
    if (String(email || '').toLowerCase() !== adminEmail) {
      // pretend to work to equalize timing
      await new Promise(r => setTimeout(r, 200));
      return generic();
    }

    // Enforce TOTP if configured
    const secret = process.env.ADMIN_TOTP_SECRET || '';
    if (secret) {
      const token = (typeof totpCode === 'string' ? totpCode.replace(/\s+/g, '') : '').trim();
      const ok = token.length >= 6 && totp.verify({ token, secret, window: 1 }); // allow ±30s skew
      if (!ok) {
        recordFailure(ip, email);
        return generic();
      }
    }

    // Passed checks
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 400 });
  }
}
