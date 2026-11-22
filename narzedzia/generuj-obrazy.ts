// Generuje obrazy produktów (publiczne/img/*.jpg) i ikonę strony z rysunków SVG.
// Uruchomienie: node narzedzia/generuj-obrazy.ts
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const tlo = '#f4f1ec';
const logo = (x: number, y: number, s: number, kolor: string) =>
  `<g transform="translate(${String(x)} ${String(y)}) scale(${String(s)})"><circle r="40" fill="${kolor}"/><path d="M-18 -6 h36 l-5 26 h-26 z M-12 -6 a12 12 0 0 1 24 0" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/></g>`;

const rysunki: Record<string, string> = {
  kubek: `<rect width="600" height="600" fill="${tlo}"/>
    <ellipse cx="290" cy="470" rx="150" ry="22" fill="#000" opacity=".08"/>
    <path d="M400 230 c70 0 70 130 0 130" fill="none" stroke="#e9e6e1" stroke-width="34"/>
    <path d="M400 230 c70 0 70 130 0 130" fill="none" stroke="#d6d2cb" stroke-width="34" opacity=".35"/>
    <path d="M160 170 h260 l-18 280 a20 20 0 0 1 -20 18 h-184 a20 20 0 0 1 -20 -18 z" fill="#fff"/>
    <path d="M160 170 h260 l-2 30 h-256 z" fill="#ece8e2"/>
    <ellipse cx="290" cy="170" rx="130" ry="18" fill="#e4e0d9"/>
    ${logo(290, 320, 1.4, '#2e5bba')}`,
  notes: `<rect width="600" height="600" fill="${tlo}"/>
    <ellipse cx="300" cy="490" rx="170" ry="20" fill="#000" opacity=".08"/>
    <rect x="160" y="110" width="280" height="370" rx="14" fill="#2f4858"/>
    <rect x="185" y="110" width="255" height="370" rx="10" fill="#33658a"/>
    <g stroke="#fff" stroke-opacity=".18" stroke-width="2">${Array.from({ length: 11 }, (_, i) => `<line x1="205" x2="420" y1="${String(150 + i * 30)}" y2="${String(150 + i * 30)}"/>`).join('')}${Array.from({ length: 7 }, (_, i) => `<line y1="130" y2="460" x1="${String(215 + i * 32)}" x2="${String(215 + i * 32)}"/>`).join('')}</g>
    <rect x="395" y="110" width="16" height="370" fill="#f6ae2d"/>
    ${logo(300, 290, 1, '#f6ae2d')}`,
  bluza: `<rect width="600" height="600" fill="${tlo}"/>
    <ellipse cx="300" cy="505" rx="190" ry="20" fill="#000" opacity=".08"/>
    <path d="M230 110 q70 -40 140 0 l90 40 q30 14 34 46 l26 220 h-70 l-14 -150 v230 h-272 v-230 l-14 150 h-70 l26 -220 q4 -32 34 -46 z" fill="#8a8f98"/>
    <path d="M240 112 q60 70 120 0 q-10 60 -60 70 q-50 -10 -60 -70 z" fill="#6f747c"/>
    <path d="M290 182 v60 M310 182 v60" stroke="#e6e7ea" stroke-width="5" stroke-linecap="round"/>
    <rect x="230" y="395" width="140" height="60" rx="10" fill="#7b8089"/>
    ${logo(300, 320, 0.9, '#2e5bba')}`,
};

const przegladarka = await chromium.launch();
const strona = await przegladarka.newPage({ viewport: { width: 600, height: 600 } });
for (const [nazwa, svg] of Object.entries(rysunki)) {
  await strona.setContent(`<style>*{margin:0}</style><svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">${svg}</svg>`);
  await strona.screenshot({ path: `publiczne/img/${nazwa}.jpg`, type: 'jpeg', quality: 85 });
}
await przegladarka.close();

writeFileSync(
  'publiczne/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100">${logo(0, 0, 1.2, '#2e5bba')}</svg>\n`,
);
console.log('Gotowe: publiczne/img/*.jpg, publiczne/favicon.svg');
