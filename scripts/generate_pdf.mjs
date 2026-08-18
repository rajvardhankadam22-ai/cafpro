import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePdf() {
  console.log('=== GENERATING CAFEPULSE SRS PDF DOCUMENT ===');

  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];

  let executablePath = null;
  for (const p of chromePaths) {
    if (fs.existsSync(p)) {
      executablePath = p;
      break;
    }
  }

  if (!executablePath) {
    throw new Error('No Chrome or Edge browser found on system.');
  }

  console.log(`Using Browser Engine: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  const htmlPath = path.resolve(__dirname, '../srs_document.html');
  const pdfPath = path.resolve(__dirname, '../CafePulse_SRS_Document.pdf');

  console.log(`Loading HTML: ${htmlPath}`);
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  console.log(`Rendering PDF: ${pdfPath}`);
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '15mm',
      right: '15mm',
    },
    displayHeaderFooter: false,
  });

  await browser.close();

  const stats = fs.statSync(pdfPath);
  console.log(`✅ SUCCESS: PDF Generated! File Size: ${(stats.size / 1024).toFixed(2)} KB at: ${pdfPath}`);
}

generatePdf().catch((err) => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
