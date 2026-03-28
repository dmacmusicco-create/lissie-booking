#!/usr/bin/env node
/**
 * PRE-FLIGHT CHECK
 * ================
 * Run this before deploying to confirm everything is configured:
 *   node check-setup.js
 */

require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passed = 0;
let failed = 0;
let warnings = 0;

function check(label, value, required = true) {
  if (value) {
    console.log(`  ${GREEN}✓${RESET} ${label}`);
    passed++;
  } else if (required) {
    console.log(`  ${RED}✗ MISSING: ${label}${RESET}`);
    failed++;
  } else {
    console.log(`  ${YELLOW}⚠ Optional missing: ${label}${RESET}`);
    warnings++;
  }
}

function section(name) {
  console.log(`\n${BOLD}${name}${RESET}`);
  console.log('─'.repeat(40));
}

console.log(`\n${BOLD}🚀 Lissie Marion Booking System — Pre-Flight Check${RESET}\n`);

section('Google Calendar');
check('GOOGLE_CLIENT_ID', process.env.GOOGLE_CLIENT_ID);
check('GOOGLE_CLIENT_SECRET', process.env.GOOGLE_CLIENT_SECRET);
check('GOOGLE_REDIRECT_URI', process.env.GOOGLE_REDIRECT_URI);
check('GOOGLE_REFRESH_TOKEN', process.env.GOOGLE_REFRESH_TOKEN);
check('GOOGLE_CALENDAR_EMAIL', process.env.GOOGLE_CALENDAR_EMAIL);

section('Email (Gmail SMTP)');
check('GMAIL_USER', process.env.GMAIL_USER);
check('GMAIL_APP_PASSWORD', process.env.GMAIL_APP_PASSWORD);
if (process.env.GMAIL_APP_PASSWORD) {
  const clean = process.env.GMAIL_APP_PASSWORD.replace(/\s/g, '');
  if (clean.length !== 16) {
    console.log(`  ${YELLOW}⚠ App password should be 16 chars (got ${clean.length}) — remove spaces${RESET}`);
    warnings++;
  } else {
    console.log(`  ${GREEN}✓${RESET} App password length looks correct (16 chars)`);
    passed++;
  }
}
check('BOOKING_NOTIFICATION_EMAIL', process.env.BOOKING_NOTIFICATION_EMAIL);

section('Security');
check('ADMIN_SECRET', process.env.ADMIN_SECRET);
if (process.env.ADMIN_SECRET && process.env.ADMIN_SECRET.length < 16) {
  console.log(`  ${YELLOW}⚠ ADMIN_SECRET is short — use 20+ random characters${RESET}`);
  warnings++;
}
check('CRON_SECRET (for Vercel cron auth)', process.env.CRON_SECRET, false);

section('Server');
check('FRONTEND_URL', process.env.FRONTEND_URL);
check('PORT (optional)', process.env.PORT, false);

section('Client List');
const clientsFile = path.join(__dirname, 'src/data/clients.json');
try {
  const clients = JSON.parse(fs.readFileSync(clientsFile, 'utf-8'));
  const active = clients.filter(c => c.active);
  if (clients.length === 0) {
    console.log(`  ${YELLOW}⚠ clients.json is empty — add your clients${RESET}`);
    warnings++;
  } else if (active.length < 2) {
    console.log(`  ${YELLOW}⚠ Only ${active.length} active client(s) — add more${RESET}`);
    warnings++;
  } else {
    console.log(`  ${GREEN}✓${RESET} ${active.length} active clients, ${clients.length} total`);
    passed++;
  }
} catch {
  console.log(`  ${RED}✗ clients.json not found or invalid${RESET}`);
  failed++;
}

section('Newsletter Schedule');
const cron = process.env.NEWSLETTER_CRON || '0 14 1,15 * *';
console.log(`  ${GREEN}✓${RESET} Schedule: "${cron}" (1st and 15th of each month at 2pm)`);
console.log(`  ${YELLOW}→${RESET} Edit NEWSLETTER_CRON in .env to change`);
passed++;

// Summary
console.log(`\n${'═'.repeat(40)}`);
if (failed === 0) {
  console.log(`${GREEN}${BOLD}✅ All checks passed! (${passed} passed, ${warnings} warnings)${RESET}`);
  console.log(`\nReady to deploy. Run: vercel --cwd backend && vercel --cwd frontend\n`);
} else {
  console.log(`${RED}${BOLD}❌ ${failed} check(s) failed. Fix the above before deploying.${RESET}`);
  console.log(`   ${warnings} warnings, ${passed} passed\n`);
  process.exit(1);
}
