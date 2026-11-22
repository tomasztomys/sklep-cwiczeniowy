// Porównuje nieudane testy z raportu JSON Playwrighta z listą oczekiwanych.
// Użycie: node porownaj-wyniki.mjs raport.json "nazwa przebiegu" [oczekiwany test]...
import { readFileSync } from 'node:fs';

const [plik, nazwa, ...oczekiwane] = process.argv.slice(2);
const raport = JSON.parse(readFileSync(plik, 'utf8'));
const nieudane = [];
const chodz = (s) => {
  for (const sp of s.specs ?? []) for (const t of sp.tests) if (t.status === 'unexpected') nieudane.push(`${sp.file} › ${sp.title}`);
  for (const x of s.suites ?? []) chodz(x);
};
raport.suites.forEach(chodz);
const brakujace = oczekiwane.filter((o) => !nieudane.includes(o));
const nadmiarowe = nieudane.filter((n) => !oczekiwane.includes(n));
console.log(`${brakujace.length + nadmiarowe.length ? '✗' : '✓'} ${nazwa}: ${nieudane.length} nieudanych, oczekiwano ${oczekiwane.length}`);
for (const b of brakujace) console.log(`    powinien wykryć, a przeszedł: ${b}`);
for (const n of nadmiarowe) console.log(`    nieoczekiwanie nie przeszedł: ${n}`);
process.exitCode = brakujace.length + nadmiarowe.length ? 1 : 0;
