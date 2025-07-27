// eslint-disable @typescript-eslint/no-explicit-any
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Asegúrate de que los tipos de jspdf-autotable estén instalados: npm i -D @types/jspdf-autotable
import { Invoice } from '@/modelTypes/invoice';
import { Customer } from '@/modelTypes/customer';
import { formatDate, formatDateTime } from './dateHelpers';

interface PDFData {
  invoice: Invoice;
  customer?: Customer | null;
}

// Interface para extender jsPDF con la propiedad de autoTable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

// --- Constantes de Estilo y Diseño ---

const STYLES = {
  primaryColor: [0, 150, 136] as const,
  secondaryColor: [0, 188, 212] as const,
  textColor: [37, 47, 63] as const,
  lightGrayColor: [245, 245, 245] as const,
  grayTextColor: [100, 100, 100] as const,
  whiteColor: [255, 255, 255] as const,
  margin: 20,
  pageWidth: 210,
};

const FONT = {
  size: {
    xs: 8,
    sm: 9,
    md: 10,
    lg: 12,
    xl: 16,
    xxl: 24,
  },
  family: 'helvetica',
};

// --- Funciones de Dibujo Auxiliares ---

const drawHeader = (doc: jsPDF, invoice: Invoice): void => {
  doc.setFillColor(...STYLES.primaryColor);
  doc.rect(0, 0, STYLES.pageWidth, 40, 'F');

  doc.setTextColor(...STYLES.whiteColor);
  doc.setFont(FONT.family, 'bold');
  doc.setFontSize(FONT.size.xxl);
  doc.text('OdinSystem', STYLES.margin, 25);

  doc.setFont(FONT.family, 'normal');
  doc.setFontSize(FONT.size.lg);
  doc.text('Sistema de Punto de Venta', STYLES.margin, 35);

  doc.setTextColor(...STYLES.textColor);
  doc.setFont(FONT.family, 'bold');
  doc.setFontSize(FONT.size.xl);
  doc.text(`FACTURA #${invoice.invoiceNumber}`, 150, 25);

  doc.setFont(FONT.family, 'normal');
  doc.setFontSize(FONT.size.md);
  doc.text(`Fecha: ${formatDate(invoice.createdAt)}`, 150, 35);
};

const drawSectionTitle = (doc: jsPDF, y: number, title: string): number => {
  doc.setFillColor(...STYLES.secondaryColor);
  doc.rect(STYLES.margin, y, STYLES.pageWidth - STYLES.margin * 2, 8, 'F');
  doc.setTextColor(...STYLES.whiteColor);
  doc.setFont(FONT.family, 'bold');
  doc.setFontSize(FONT.size.lg);
  doc.text(title, STYLES.margin + 5, y + 6);
  return y + 15;
};

const drawCustomerInfo = (
  doc: jsPDF,
  y: number,
  invoice: Invoice,
  customer?: Customer | null,
): number => {
  let yPosition = drawSectionTitle(doc, y, 'INFORMACIÓN DEL CLIENTE');
  const xPosition = STYLES.margin + 5;

  doc.setTextColor(...STYLES.textColor);
  doc.setFont(FONT.family, 'normal');
  doc.setFontSize(FONT.size.md);

  const customerName =
    customer?.name || invoice.customerName || 'Cliente no especificado';
  doc.text(`Nombre: ${customerName}`, xPosition, yPosition);

  if (customer?.email) {
    yPosition += 6;
    doc.text(`Email: ${customer.email}`, xPosition, yPosition);
  }
  if (customer?.phone) {
    yPosition += 6;
    doc.text(`Teléfono: ${customer.phone}`, xPosition, yPosition);
  }
  if (customer?.address) {
    yPosition += 6;
    doc.text(`Dirección: ${customer.address}`, xPosition, yPosition);
  }
  return yPosition + 15;
};

const drawDateAndStatusInfo = (
  doc: jsPDF,
  y: number,
  invoice: Invoice,
): number => {
  let yPosition = drawSectionTitle(doc, y, 'INFORMACIÓN DE LA FACTURA');
  const xPosition = STYLES.margin + 5;

  doc.setTextColor(...STYLES.textColor);
  doc.setFont(FONT.family, 'normal');
  doc.setFontSize(FONT.size.md);

  doc.text(
    `Fecha de creación: ${formatDateTime(invoice.createdAt)}`,
    xPosition,
    yPosition,
  );

  if (invoice.dueDate) {
    yPosition += 6;
    doc.text(
      `Fecha de vencimiento: ${formatDate(invoice.dueDate)}`,
      xPosition,
      yPosition,
    );
  }

  if (invoice.paidAt) {
    yPosition += 6;
    doc.text(
      `Fecha de pago: ${formatDateTime(invoice.paidAt)}`,
      xPosition,
      yPosition,
    );
  }

  const statusLabels: Record<string, string> = {
    PAID: 'Pagada',
    PENDING: 'Pendiente',
    OVERDUE: 'Vencida',
    CANCELLED: 'Cancelada',
  };
  const statusLabel = statusLabels[invoice.status] || invoice.status;

  yPosition += 10;
  doc.setFont(FONT.family, 'bold');
  doc.setFontSize(FONT.size.lg);
  doc.text(`Estado: ${statusLabel}`, xPosition, yPosition);

  return yPosition + 15;
};

const drawItemsTable = (doc: jsPDF, y: number, invoice: Invoice): number => {
  const tableColumns = ['Descripción', 'Cantidad', 'Precio Unitario', 'Total'];
  const tableRows = (invoice.items || []).map((item) => [
    item.description || 'Sin descripción',
    (item.quantity || 0).toString(),
    `$${(item.unitPrice || 0).toFixed(2)}`,
    `$${(item.total || 0).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [tableColumns],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      fillColor: STYLES.primaryColor || [0, 150, 136],
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      textColor: STYLES.whiteColor,
      fontStyle: 'bold',
      fontSize: FONT.size.md,
    },
    bodyStyles: {
      fontSize: FONT.size.sm,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      textColor: STYLES.textColor,
    },
    alternateRowStyles: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      fillColor: STYLES.lightGrayColor,
    },
    margin: { left: STYLES.margin, right: STYLES.margin },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
  });

  return (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 15;
};

const drawTotals = (doc: jsPDF, y: number, invoice: Invoice): number => {
  let yPosition = y;
  const totalsX = 120;
  const totalsWidth = 70;

  doc.setFillColor(...STYLES.lightGrayColor);
  doc.rect(totalsX, yPosition, totalsWidth, 40, 'F');
  doc.setDrawColor(...STYLES.primaryColor);
  doc.setLineWidth(0.5);
  doc.rect(totalsX, yPosition, totalsWidth, 40);

  doc.setTextColor(...STYLES.textColor);
  doc.setFont(FONT.family, 'normal');
  doc.setFontSize(FONT.size.md);

  const rightAlignX = totalsX + totalsWidth - 5;

  yPosition += 10;
  doc.text('Subtotal:', totalsX + 5, yPosition);
  doc.text(`$${(invoice.subtotal || 0).toFixed(2)}`, rightAlignX, yPosition, {
    align: 'right',
  });

  const subtotal = invoice.subtotal || 0;
  const tax = invoice.tax || 0;
  const taxPercentage =
    subtotal > 0 ? ((tax / subtotal) * 100).toFixed(0) : '0';
  yPosition += 8;
  doc.text(`Impuestos (${taxPercentage}%):`, totalsX + 5, yPosition);
  doc.text(`$${tax.toFixed(2)}`, rightAlignX, yPosition, { align: 'right' });

  yPosition += 7;
  doc.setDrawColor(...STYLES.primaryColor);
  doc.line(totalsX + 5, yPosition, rightAlignX, yPosition);

  yPosition += 8;
  doc.setFont(FONT.family, 'bold');
  doc.setFontSize(FONT.size.lg);
  doc.text('TOTAL:', totalsX + 5, yPosition);
  doc.text(`$${(invoice.total || 0).toFixed(2)}`, rightAlignX, yPosition, {
    align: 'right',
  });

  return y + 40 + 10;
};

const drawNotes = (doc: jsPDF, y: number, notes: string): void => {
  doc.setFont(FONT.family, 'bold');
  doc.setFontSize(FONT.size.md);
  doc.setTextColor(...STYLES.textColor);
  doc.text('NOTAS:', STYLES.margin, y);

  doc.setFont(FONT.family, 'normal');
  doc.setFontSize(FONT.size.sm);
  const splitNotes = doc.splitTextToSize(
    notes,
    STYLES.pageWidth - STYLES.margin * 2,
  );
  doc.text(splitNotes, STYLES.margin, y + 8);
};

const drawFooter = (doc: jsPDF): void => {
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 20;
  doc.setFont(FONT.family, 'normal');
  doc.setFontSize(FONT.size.xs);
  doc.setTextColor(...STYLES.grayTextColor);
  doc.text(
    'Generado por OdinSystem - Sistema de Punto de Venta',
    STYLES.pageWidth / 2,
    footerY,
    { align: 'center' },
  );
  doc.text(
    `Generado el: ${formatDateTime(new Date())}`,
    STYLES.pageWidth / 2,
    footerY + 5,
    { align: 'center' },
  );
};

// --- Función Principal ---

export const generateInvoicePDF = ({ invoice, customer }: PDFData): jsPDF => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const footerZone = 40;

  drawHeader(doc, invoice);

  let yPosition = 55;
  yPosition = drawCustomerInfo(doc, yPosition, invoice, customer);
  yPosition = drawDateAndStatusInfo(doc, yPosition, invoice);
  yPosition = drawItemsTable(doc, yPosition, invoice);

  const TOTALS_HEIGHT = 60;
  if (yPosition + TOTALS_HEIGHT > pageHeight - footerZone) {
    doc.addPage();
    yPosition = STYLES.margin;
  }
  yPosition = drawTotals(doc, yPosition, invoice);

  if (invoice.notes) {
    const notesHeight =
      doc.splitTextToSize(invoice.notes, STYLES.pageWidth - STYLES.margin * 2)
        .length *
        5 +
      10;
    if (yPosition + notesHeight > pageHeight - footerZone) {
      doc.addPage();
      yPosition = STYLES.margin;
    }
    drawNotes(doc, yPosition, invoice.notes);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(doc);
  }
  return doc;
};

// --- Funciones de Exportación ---

export const downloadInvoicePDF = (
  invoice: Invoice,
  customer?: Customer | null,
): void => {
  const doc = generateInvoicePDF({ invoice, customer });
  const fileName = `factura-${invoice.invoiceNumber}-${formatDate(invoice.createdAt).replace(/\s/g, '-')}.pdf`;
  doc.save(fileName);
};

export const previewInvoicePDF = (
  invoice: Invoice,
  customer?: Customer | null,
): void => {
  const doc = generateInvoicePDF({ invoice, customer });
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};
