import PdfPrinter from 'pdfmake/src/Printer';
import { PrismaClient } from '@prisma/client';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

const prisma = new PrismaClient();

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

const printer = new PdfPrinter(fonts);

const COL_WIDTHS = [8, 44, 10, 14, 14];

function formatCurrency(n: number): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`;
}

function headerFooter(currentPage: number, pageCount: number) {
  return {
    header: [
      { text: 'SIMMON / PARA', alignment: 'center', fontSize: 8, color: '#888', margin: [0, 10, 0, 0] },
    ],
    footer: [
      { text: `Page ${currentPage.toString()} / ${pageCount.toString()}`, alignment: 'center', fontSize: 8, color: '#aaa', margin: [0, 10, 0, 0] },
    ],
  };
}

export async function generateFacturePdf(factureId: string) {
  const facture = await prisma.facture.findUnique({
    where: { id: factureId },
    include: {
      client: true,
      bonLivraison: { include: { client: true } },
      lignes: {
        include: { product: true },
      },
    },
  });
  if (!facture) throw new Error('Facture introuvable');

  const client = facture.client || facture.bonLivraison?.client;
  const lignes = facture.lignes || [];

  const body = [
    [
      { text: 'Code', style: 'tableHeader', alignment: 'center' },
      { text: 'Désignation', style: 'tableHeader' },
      { text: 'Qté', style: 'tableHeader', alignment: 'center' },
      { text: 'P.U HT', style: 'tableHeader', alignment: 'right' },
      { text: 'Total TTC', style: 'tableHeader', alignment: 'right' },
    ],
    ...lignes.map((l: any) => [
      { text: l.product?.code || '', alignment: 'center', fontSize: 8 },
      { text: l.product?.designation || l.product?.name || '', fontSize: 8 },
      { text: l.quantity?.toString() || '', alignment: 'center', fontSize: 8 },
      { text: formatCurrency(l.priceHT || 0), alignment: 'right', fontSize: 8 },
      { text: formatCurrency(l.totalTTC || 0), alignment: 'right', fontSize: 8 },
    ]),
  ];

  const totalHT = facture.totalHT || 0;
  const totalTVA = facture.totalTVA || 0;
  const totalTTC = facture.totalTTC || 0;

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    info: {
      title: `Facture ${facture.reference}`,
      author: 'SIMMON / PARA',
    },
    ...headerFooter(0, 0),
    content: [
      { text: 'FACTURE', style: 'title', alignment: 'center', margin: [0, 0, 0, 20] },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'SIMMON / PARA', style: 'companyName' },
              { text: 'Adresse : ...', fontSize: 9, color: '#555', margin: [0, 2, 0, 0] },
              { text: 'Tél : ...', fontSize: 9, color: '#555' },
              { text: 'ICE : ...', fontSize: 9, color: '#555' },
            ],
          },
          {
            width: '50%',
            stack: [
              { text: `N° ${facture.reference}`, style: 'ref', alignment: 'right' },
              { text: `Date : ${facture.date ? new Date(facture.date).toLocaleDateString('fr-FR') : ''}`, alignment: 'right', fontSize: 9, color: '#555' },
              { text: `Échéance : ${facture.dueDate ? new Date(facture.dueDate).toLocaleDateString('fr-FR') : '-'}`, alignment: 'right', fontSize: 9, color: '#555' },
            ],
          },
        ],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#ddd' }], margin: [0, 10, 0, 10] },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'CLIENT', style: 'sectionTitle' },
              { text: client?.name || '', fontSize: 10, bold: true },
              { text: `Code : ${client?.code || ''}`, fontSize: 9, color: '#555' },
              { text: client?.address || '', fontSize: 9, color: '#555' },
              { text: client?.city || '', fontSize: 9, color: '#555' },
            ],
          },
          {
            width: '50%',
            stack: [
              { text: 'RÈGLEMENT', style: 'sectionTitle', alignment: 'right' },
              { text: `Mode : ${facture.paymentMode || '-'}`, alignment: 'right', fontSize: 9, color: '#555' },
              { text: `Statut : ${facture.statut || '-'}`, alignment: 'right', fontSize: 9, color: '#555' },
            ],
          },
        ],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#ddd' }], margin: [0, 10, 0, 10] },
      { text: 'DÉTAIL DES PRODUITS', style: 'sectionTitle', margin: [0, 0, 0, 8] },
      {
        table: {
          headerRows: 1,
          widths: COL_WIDTHS.map(w => `${w}%`),
          body,
        },
        layout: 'headerLineOnly',
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#ddd' }], margin: [0, 10, 0, 5] },
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            stack: [
              { text: `Total HT : ${formatCurrency(totalHT)}`, alignment: 'right', fontSize: 10, margin: [0, 2, 0, 0] },
              { text: `Total TVA : ${formatCurrency(totalTVA)}`, alignment: 'right', fontSize: 10, margin: [0, 2, 0, 0] },
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1, lineColor: '#333' }], margin: [0, 4, 0, 4] },
              { text: `Total TTC : ${formatCurrency(totalTTC)}`, alignment: 'right', fontSize: 12, bold: true, margin: [0, 2, 0, 0], color: '#1a5632' },
            ],
          },
        ],
      },
    ],
    styles: {
      title: { fontSize: 18, bold: true, color: '#1a5632' },
      companyName: { fontSize: 12, bold: true, color: '#1a5632' },
      ref: { fontSize: 12, bold: true, color: '#1a5632' },
      sectionTitle: { fontSize: 10, bold: true, color: '#333', margin: [0, 4, 0, 4] },
      tableHeader: { fontSize: 9, bold: true, fillColor: '#1a5632', color: '#fff', margin: [4, 4, 4, 4] },
    },
    defaultStyle: { font: 'Helvetica', fontSize: 9, color: '#333' },
  };

  return printer.createPdfKitDocument(docDefinition);
}

export async function generateBonLivraisonPdf(bonId: string) {
  const bon = await prisma.bonLivraison.findUnique({
    where: { id: bonId },
    include: {
      client: true,
      lignes: { include: { product: true } },
    },
  });
  if (!bon) throw new Error('Bon de livraison introuvable');

  const lignes = bon.lignes || [];
  const body = [
    [
      { text: 'Code', style: 'tableHeader', alignment: 'center' },
      { text: 'Désignation', style: 'tableHeader' },
      { text: 'Qté', style: 'tableHeader', alignment: 'center' },
      { text: 'P.U HT', style: 'tableHeader', alignment: 'right' },
      { text: 'Total TTC', style: 'tableHeader', alignment: 'right' },
    ],
    ...lignes.map((l: any) => [
      { text: l.product?.code || '', alignment: 'center', fontSize: 8 },
      { text: l.product?.designation || l.product?.name || '', fontSize: 8 },
      { text: l.quantity?.toString() || '', alignment: 'center', fontSize: 8 },
      { text: formatCurrency(l.priceHT || 0), alignment: 'right', fontSize: 8 },
      { text: formatCurrency(l.totalTTC || 0), alignment: 'right', fontSize: 8 },
    ]),
  ];

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    info: { title: `Bon Livraison ${bon.reference}`, author: 'SIMMON / PARA' },
    ...headerFooter(0, 0),
    content: [
      { text: 'BON DE LIVRAISON', style: 'title', alignment: 'center', margin: [0, 0, 0, 20] },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'SIMMON / PARA', style: 'companyName' },
              { text: 'Adresse : ...', fontSize: 9, color: '#555', margin: [0, 2, 0, 0] },
            ],
          },
          {
            width: '50%',
            stack: [
              { text: `N° ${bon.reference}`, style: 'ref', alignment: 'right' },
              { text: `Date : ${bon.date ? new Date(bon.date).toLocaleDateString('fr-FR') : ''}`, alignment: 'right', fontSize: 9, color: '#555' },
            ],
          },
        ],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#ddd' }], margin: [0, 10, 0, 10] },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'CLIENT', style: 'sectionTitle' },
              { text: bon.client?.name || '', fontSize: 10, bold: true },
              { text: `Code : ${bon.client?.code || ''}`, fontSize: 9, color: '#555' },
            ],
          },
          {
            width: '50%',
            stack: [
              { text: 'DÉTAILS', style: 'sectionTitle', alignment: 'right' },
              { text: `Validé : ${bon.validated ? 'Oui' : 'Non'}`, alignment: 'right', fontSize: 9, color: '#555' },
            ],
          },
        ],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#ddd' }], margin: [0, 10, 0, 10] },
      { text: 'DÉTAIL DES PRODUITS', style: 'sectionTitle', margin: [0, 0, 0, 8] },
      {
        table: {
          headerRows: 1,
          widths: COL_WIDTHS.map(w => `${w}%`),
          body,
        },
        layout: 'headerLineOnly',
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#ddd' }], margin: [0, 10, 0, 5] },
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            stack: [
              { text: `Total HT : ${formatCurrency(bon.totalHT || 0)}`, alignment: 'right', fontSize: 10, margin: [0, 2, 0, 0] },
              { text: `Total TVA : ${formatCurrency(bon.totalTVA || 0)}`, alignment: 'right', fontSize: 10, margin: [0, 2, 0, 0] },
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1, lineColor: '#333' }], margin: [0, 4, 0, 4] },
              { text: `Total TTC : ${formatCurrency(bon.totalTTC || 0)}`, alignment: 'right', fontSize: 12, bold: true, margin: [0, 2, 0, 0], color: '#1a5632' },
            ],
          },
        ],
      },
    ],
    styles: {
      title: { fontSize: 18, bold: true, color: '#1a5632' },
      companyName: { fontSize: 12, bold: true, color: '#1a5632' },
      ref: { fontSize: 12, bold: true, color: '#1a5632' },
      sectionTitle: { fontSize: 10, bold: true, color: '#333', margin: [0, 4, 0, 4] },
      tableHeader: { fontSize: 9, bold: true, fillColor: '#1a5632', color: '#fff', margin: [4, 4, 4, 4] },
    },
    defaultStyle: { font: 'Helvetica', fontSize: 9, color: '#333' },
  };

  return printer.createPdfKitDocument(docDefinition);
}
