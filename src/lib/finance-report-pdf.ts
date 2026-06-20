import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { BalanceSheetReport, FinanceAnalysis, FinanceMetrics, FinanceSession } from './finance-types';

const MARGIN = 48;
const PAGE_W = 612;
const PAGE_H = 792;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COLORS = {
  ink: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  accent: [30, 64, 175] as [number, number, number],
  line: [226, 232, 240] as [number, number, number],
  positive: [22, 101, 52] as [number, number, number],
  risk: [185, 28, 28] as [number, number, number],
};

function currencySymbol(code: string) {
  switch (code.toUpperCase()) {
    case 'INR':
      return '₹';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    default:
      return '$';
  }
}

function fmtMoney(value: number, currency: string) {
  return `${currencySymbol(currency)}${value.toLocaleString('en-US')}M`;
}

function fmtRatio(value: number | null) {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toFixed(2);
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function drawPageHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 0, PAGE_W, 72, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SWEEP FINANCE', MARGIN, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Institutional Balance Sheet Analysis', MARGIN, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, MARGIN, 58);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(subtitle, PAGE_W - MARGIN, 58, { align: 'right' });
}

function drawFooter(doc: jsPDF, page: number, total: number) {
  doc.setDrawColor(...COLORS.line);
  doc.line(MARGIN, PAGE_H - 40, PAGE_W - MARGIN, PAGE_H - 40);
  doc.setTextColor(...COLORS.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Educational analysis only — not investment advice. Verify figures against official filings.', MARGIN, PAGE_H - 24);
  doc.text(`Page ${page} of ${total}`, PAGE_W - MARGIN, PAGE_H - 24, { align: 'right' });
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  fontSize = 10,
) {
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function addSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setTextColor(...COLORS.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title, MARGIN, y);
  doc.setDrawColor(...COLORS.line);
  doc.line(MARGIN, y + 4, PAGE_W - MARGIN, y + 4);
  return y + 18;
}

function addBulletList(doc: jsPDF, items: string[], y: number, bulletColor: [number, number, number] = COLORS.ink) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  let cursor = y;
  for (const item of items) {
    doc.setTextColor(...bulletColor);
    doc.text('•', MARGIN, cursor);
    doc.setTextColor(...COLORS.ink);
    cursor = addWrappedText(doc, item, MARGIN + 12, cursor, CONTENT_W - 12, 13, 9.5) + 2;
  }
  return cursor + 4;
}

function addMetricsGrid(doc: jsPDF, metrics: FinanceMetrics, currency: string, y: number) {
  const rows = [
    ['Total assets', fmtMoney(metrics.totalAssets, currency), 'Current ratio', fmtRatio(metrics.currentRatio)],
    ['Total liabilities', fmtMoney(metrics.totalLiabilities, currency), 'Quick ratio', fmtRatio(metrics.quickRatio)],
    ['Total equity', fmtMoney(metrics.totalEquity, currency), 'Debt / equity', fmtRatio(metrics.debtToEquity)],
    ['Working capital', fmtMoney(metrics.workingCapital, currency), 'Debt / assets', fmtRatio(metrics.debtToAssets)],
    ['Cash & equivalents', fmtMoney(metrics.cashAndEquivalents, currency), 'Equity ratio', fmtRatio(metrics.equityRatio)],
    ['Total debt', fmtMoney(metrics.totalDebt, currency), 'Balance check', metrics.balanceCheckOk ? 'Balanced' : `${fmtMoney(metrics.balanceCheck, currency)} gap`],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 5, textColor: COLORS.ink },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 120, textColor: COLORS.muted },
      1: { cellWidth: 95 },
      2: { fontStyle: 'bold', cellWidth: 95, textColor: COLORS.muted },
      3: { cellWidth: 'auto' },
    },
    body: rows,
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;
}

function buildAnalysisPage(doc: jsPDF, session: FinanceSession) {
  const { report, metrics, analysis } = session;
  drawPageHeader(
    doc,
    `${report.companyName} (${report.ticker})`,
    `${report.period} · ${report.currency} millions`,
  );

  let y = 88;
  y = addSectionTitle(doc, 'Key metrics', y);
  y = addMetricsGrid(doc, metrics, report.currency, y);

  y = addSectionTitle(doc, 'Executive summary', y);
  y = addWrappedText(doc, analysis.executiveSummary, MARGIN, y, CONTENT_W, 11, 9) + 6;

  y = addSectionTitle(doc, 'Key highlights', y);
  y = addBulletList(doc, analysis.keyHighlights, y, COLORS.ink) + 2;

  const colW = (CONTENT_W - 14) / 2;
  y = addSectionTitle(doc, 'Liquidity & leverage', y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.ink);
  const liquidityLines = doc.splitTextToSize(analysis.liquidityAssessment, colW) as string[];
  const leverageLines = doc.splitTextToSize(analysis.leverageAssessment, colW) as string[];
  doc.text(liquidityLines, MARGIN, y);
  doc.text(leverageLines, MARGIN + colW + 14, y);
  y += Math.max(liquidityLines.length, leverageLines.length) * 11 + 8;

  y = addSectionTitle(doc, 'Asset quality', y);
  y = addWrappedText(doc, analysis.assetQualityNotes, MARGIN, y, CONTENT_W, 11, 8.5) + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.positive);
  doc.text('Strengths', MARGIN, y);
  doc.setTextColor(...COLORS.risk);
  doc.text('Risk factors', MARGIN + colW + 14, y);
  y += 12;

  const maxItems = Math.max(analysis.strengths.length, analysis.riskFactors.length);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  for (let i = 0; i < maxItems; i++) {
    let rowHeight = 0;
    if (analysis.strengths[i]) {
      doc.setTextColor(...COLORS.ink);
      const lines = doc.splitTextToSize(`• ${analysis.strengths[i]}`, colW) as string[];
      doc.text(lines, MARGIN, y);
      rowHeight = Math.max(rowHeight, lines.length * 10);
    }
    if (analysis.riskFactors[i]) {
      doc.setTextColor(...COLORS.ink);
      const lines = doc.splitTextToSize(`• ${analysis.riskFactors[i]}`, colW) as string[];
      doc.text(lines, MARGIN + colW + 14, y);
      rowHeight = Math.max(rowHeight, lines.length * 10);
    }
    y += rowHeight + 2;
  }

  y += 4;
  y = addSectionTitle(doc, 'Watch items', y);
  y = addBulletList(doc, analysis.watchItems, y, COLORS.ink) + 2;
  y = addSectionTitle(doc, 'Analyst verdict', y);
  addWrappedText(doc, analysis.analystVerdict, MARGIN, y, CONTENT_W, 11, 8.5);

  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(7.5);
  doc.text(`Source: ${report.source}`, MARGIN, PAGE_H - 52);
  doc.text(`Generated ${new Date(session.generatedAt).toLocaleString()}`, MARGIN, PAGE_H - 62);
  drawFooter(doc, 1, 2);
}

function formatLineItems(items: Array<{ label: string; value: number }>, currency: string) {
  return items.map((item) => [item.label, fmtMoney(item.value, currency)]);
}

function buildBalanceSheetPage(doc: jsPDF, report: BalanceSheetReport) {
  doc.addPage();
  drawPageHeader(doc, 'Balance Sheet', `${report.title} · ${report.period}`);

  const currency = report.currency;
  const sum = (items: Array<{ value: number }>) => items.reduce((t, i) => t + i.value, 0);

  const currentAssets = report.assets.current;
  const nonCurrentAssets = report.assets.nonCurrent;
  const currentLiabilities = report.liabilities.current;
  const nonCurrentLiabilities = report.liabilities.nonCurrent;
  const equity = report.equity;

  const totalCurrentAssets = sum(currentAssets);
  const totalNonCurrentAssets = sum(nonCurrentAssets);
  const totalCurrentLiabilities = sum(currentLiabilities);
  const totalNonCurrentLiabilities = sum(nonCurrentLiabilities);
  const auth = report.authoritativeTotals;
  const totalAssets = auth?.totalAssets ?? totalCurrentAssets + totalNonCurrentAssets;
  const totalLiabilities = auth?.totalLiabilities ?? totalCurrentLiabilities + totalNonCurrentLiabilities;
  const totalEquity = auth?.totalEquity ?? sum(equity);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const body: Array<Array<string | { content: string; styles?: Record<string, unknown> }>> = [
    [{ content: 'ASSETS', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, ''],
    [{ content: 'Current assets', styles: { fontStyle: 'bold', textColor: COLORS.muted } }, ''],
    ...formatLineItems(currentAssets, currency),
    [{ content: 'Total current assets', styles: { fontStyle: 'bold' } }, fmtMoney(totalCurrentAssets, currency)],
    [{ content: 'Non-current assets', styles: { fontStyle: 'bold', textColor: COLORS.muted } }, ''],
    ...formatLineItems(nonCurrentAssets, currency),
    [{ content: 'Total non-current assets', styles: { fontStyle: 'bold' } }, fmtMoney(totalNonCurrentAssets, currency)],
    [{ content: 'TOTAL ASSETS', styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } }, fmtMoney(totalAssets, currency)],
    [{ content: 'LIABILITIES', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, ''],
    [{ content: 'Current liabilities', styles: { fontStyle: 'bold', textColor: COLORS.muted } }, ''],
    ...formatLineItems(currentLiabilities, currency),
    [{ content: 'Total current liabilities', styles: { fontStyle: 'bold' } }, fmtMoney(totalCurrentLiabilities, currency)],
    [{ content: 'Non-current liabilities', styles: { fontStyle: 'bold', textColor: COLORS.muted } }, ''],
    ...formatLineItems(nonCurrentLiabilities, currency),
    [{ content: 'Total non-current liabilities', styles: { fontStyle: 'bold' } }, fmtMoney(totalNonCurrentLiabilities, currency)],
    [{ content: 'TOTAL LIABILITIES', styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } }, fmtMoney(totalLiabilities, currency)],
    [{ content: "SHAREHOLDERS' EQUITY", styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, ''],
    ...formatLineItems(equity, currency),
    [{ content: 'TOTAL EQUITY', styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } }, fmtMoney(totalEquity, currency)],
    [
      { content: 'TOTAL LIABILITIES + EQUITY', styles: { fontStyle: 'bold', fillColor: [191, 219, 254] } },
      fmtMoney(totalLiabilitiesAndEquity, currency),
    ],
  ];

  autoTable(doc, {
    startY: 92,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    head: [['Line item', `Amount (${currency} millions)`]],
    headStyles: {
      fillColor: COLORS.accent,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: COLORS.ink,
      lineColor: COLORS.line,
    },
    columnStyles: {
      0: { cellWidth: 360 },
      1: { halign: 'right', cellWidth: 'auto' },
    },
    body,
  });

  doc.setTextColor(...COLORS.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Currency: ${currency} (millions) · Source: ${report.source}`, MARGIN, PAGE_H - 52);
  drawFooter(doc, 2, 2);
}

export function downloadFinanceReportPdf(session: FinanceSession) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  buildAnalysisPage(doc, session);
  buildBalanceSheetPage(doc, session.report);

  const fileName = `${slugify(session.report.ticker)}-${slugify(session.report.period)}-sweep-report.pdf`;
  doc.save(fileName);
}