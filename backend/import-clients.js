#!/usr/bin/env node
/**
 * BULK CLIENT IMPORTER
 * ====================
 * Usage: node import-clients.js clients.csv
 *
 * CSV format (one client per line):
 *   Name, Email
 *   John Smith, john@example.com
 *   Jane Doe, jane@example.com
 *
 * Or pipe directly:
 *   echo "John Smith, john@example.com" | node import-clients.js
 *
 * Running this MERGES new clients into the existing clients.json
 * (existing clients are preserved, duplicates by email are skipped)
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const CLIENTS_FILE = path.join(__dirname, 'src/data/clients.json');

function loadExisting() {
  try {
    return JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function parseCSV(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && !line.toLowerCase().startsWith('name'))
    .map(line => {
      const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      const name = parts[0];
      const email = parts[1];
      if (!name || !email || !email.includes('@')) return null;
      return { name, email };
    })
    .filter(Boolean);
}

async function main() {
  let csvText = '';

  const file = process.argv[2];
  if (file) {
    csvText = fs.readFileSync(file, 'utf-8');
  } else {
    // Read from stdin
    csvText = fs.readFileSync('/dev/stdin', 'utf-8');
  }

  const newClients = parseCSV(csvText);
  const existing = loadExisting();
  const existingEmails = new Set(existing.map(c => c.email.toLowerCase()));

  let added = 0;
  let skipped = 0;

  for (const client of newClients) {
    if (existingEmails.has(client.email.toLowerCase())) {
      console.log(`  SKIP (already exists): ${client.email}`);
      skipped++;
      continue;
    }
    existing.push({
      id: randomUUID(),
      name: client.name,
      email: client.email,
      active: true,
      addedAt: new Date().toISOString().split('T')[0],
    });
    existingEmails.add(client.email.toLowerCase());
    console.log(`  ADD: ${client.name} <${client.email}>`);
    added++;
  }

  fs.writeFileSync(CLIENTS_FILE, JSON.stringify(existing, null, 2));
  console.log(`\nDone. Added: ${added}, Skipped: ${skipped}, Total: ${existing.length}`);
}

main().catch(console.error);
