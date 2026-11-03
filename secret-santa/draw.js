#!/usr/bin/env node
/*
 * Runway Secret Santa draw
 * ------------------------
 * Run from the project folder:   node secret-santa/draw.js
 *
 * Reads   secret-santa/participants.txt   (one name per line)
 * Writes  secret-santa/assignments-PRIVATE.csv   (for the organiser only — never publish)
 *         docs/secret-santa-data.js              (encrypted matches for the website)
 *
 * Refuses to overwrite an existing draw unless you add --force, so codes you've
 * already sent out don't get scrambled by accident.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { webcrypto, randomInt } = require('node:crypto');

const subtle = webcrypto.subtle;

const PARTICIPANTS_FILE = path.join(__dirname, 'participants.txt');
const PRIVATE_CSV = path.join(__dirname, 'assignments-PRIVATE.csv');
const SITE_DATA = path.join(__dirname, '..', 'docs', 'secret-santa-data.js');

// Slows down anyone trying to guess codes from the page source.
// The website reads this value from the data file, so it can be changed here freely.
const PBKDF2_ITERATIONS = 250000;

// Codes look like JANDAL-4821: a summery word + 4 digits.
const CODE_WORDS = [
  'JANDAL', 'PAVLOVA', 'KIWI', 'TUI', 'KUMARA', 'SURF', 'BACH', 'TOGS',
  'SUNNIES', 'PIPI', 'KAKA', 'WEKA', 'KOWHAI', 'MANUKA', 'BEACH', 'WAVE',
  'SANTA', 'TINSEL', 'HOLLY', 'CRACKER', 'BAUBLE', 'PRESSIE', 'PUTT', 'BIRDIE',
  'EAGLE', 'GECKO', 'DOLPHIN', 'ORCA', 'LOLLY', 'PAUA', 'SANDCASTLE', 'BBQ',
];

function readParticipants(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Can't find ${path.relative(process.cwd(), file)}. Create it with one name per line.`);
  }
  const names = fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  const seen = new Map();
  const duplicates = [];
  for (const name of names) {
    const key = name.toLowerCase();
    if (seen.has(key)) duplicates.push(name);
    seen.set(key, name);
  }
  if (duplicates.length) {
    throw new Error(`These names appear more than once: ${duplicates.join(', ')}.\n` +
      'Remove the repeats, or add a surname initial so everyone is unique (e.g. "Sam K" and "Sam T").');
  }
  if (names.length < 2) {
    throw new Error('You need at least 2 people for a Secret Santa.');
  }
  return names;
}

function shuffle(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Shuffle everyone into one big circle and have each person buy for the next.
// Nobody can draw themselves, and there are no little closed loops.
function drawAssignments(names) {
  const circle = shuffle(names);
  return circle.map((from, i) => ({ from, to: circle[(i + 1) % circle.length] }));
}

function makeCodes(count) {
  const codes = new Set();
  while (codes.size < count) {
    const word = CODE_WORDS[randomInt(CODE_WORDS.length)];
    const digits = String(randomInt(1000, 10000));
    codes.add(`${word}-${digits}`);
  }
  return [...codes];
}

// Must match docs/script.js
function normaliseCode(code) {
  return String(code).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

const toBase64 = (bytes) => Buffer.from(bytes).toString('base64');

async function encryptFor(code, payload, salt) {
  const baseKey = await subtle.importKey('raw', new TextEncoder().encode(normaliseCode(code)), 'PBKDF2', false, ['deriveKey']);
  const key = await subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  // Pad with spaces so every entry is the same size and name lengths don't show.
  const json = JSON.stringify(payload);
  const bytes = Buffer.byteLength(json);
  const padded = json + ' '.repeat(Math.ceil((bytes + 1) / 128) * 128 - bytes);
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const data = await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(padded));
  return { iv: toBase64(iv), data: toBase64(new Uint8Array(data)) };
}

function csvCell(value) {
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const force = process.argv.includes('--force');
  const alreadyDrawn = fs.existsSync(PRIVATE_CSV) ||
    (fs.existsSync(SITE_DATA) && !/SECRET_SANTA\s*=\s*null/.test(fs.readFileSync(SITE_DATA, 'utf8')));
  if (alreadyDrawn && !force) {
    console.error('⚠️  A draw already exists. Running it again gives everyone new matches AND new codes.');
    console.error('   If you really want to redraw, run:  node secret-santa/draw.js --force');
    process.exit(1);
  }

  const names = readParticipants(PARTICIPANTS_FILE);
  const assignments = drawAssignments(names);
  const codes = makeCodes(assignments.length);
  const rows = assignments.map((a, i) => ({ ...a, code: codes[i] }));

  // Sanity check before writing anything.
  const receivers = new Set(rows.map((r) => r.to));
  if (receivers.size !== names.length || rows.some((r) => r.from === r.to)) {
    throw new Error('Draw failed its own sanity check — please run it again.');
  }

  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const entries = await Promise.all(rows.map((r) => encryptFor(r.code, { from: r.from, to: r.to }, salt)));

  const siteData = {
    version: 1,
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    // Shuffled so the order doesn't hint at who's who.
    entries: shuffle(entries),
  };
  fs.mkdirSync(path.dirname(SITE_DATA), { recursive: true });
  fs.writeFileSync(SITE_DATA,
    `// Generated by secret-santa/draw.js on ${new Date().toISOString()}. Do not edit by hand.\n` +
    `window.SECRET_SANTA = ${JSON.stringify(siteData)};\n`);

  const sorted = rows.slice().sort((a, b) => a.from.localeCompare(b.from));
  const csv = [['Name', 'Code', 'Buying for'], ...sorted.map((r) => [r.from, r.code, r.to])]
    .map((cols) => cols.map(csvCell).join(','))
    .join('\r\n');
  // The BOM helps Excel open names with macrons (ā, ō…) correctly.
  fs.writeFileSync(PRIVATE_CSV, '﻿' + csv + '\r\n');

  console.log(`🎁 Drew ${rows.length} Secret Santas.`);
  console.log(`   Private list (don't share!): ${path.relative(process.cwd(), PRIVATE_CSV)}`);
  console.log(`   Website data:                ${path.relative(process.cwd(), SITE_DATA)}`);
  console.log('\nNext: redeploy the docs folder, then send each person ONLY their own code.');
}

main().catch((err) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
