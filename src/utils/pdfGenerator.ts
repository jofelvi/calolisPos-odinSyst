// utils/pdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '@/types/invoice';
import { Customer } from '@/types/customer';
import { formatDate, formatDateTime } from './dateHelpers';

interface PDFData {
  invoice: Invoice;
  customer?: Customer | null;
}

export const generateInvoicePDF = ({ invoice, customer }: PDFData) => {
  // Crear nueva instancia de PDF
  const doc = new jsPDF();

  // Configuración de colores
  const primaryColor = [0, 150, 136]; // Teal
  const secondaryColor = [0, 188, 212]; // Cyan
  const textColor = [37, 47, 63]; // Dark blue-gray

  // Header de la empresa
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');

  // Logo y nombre de la empresa (simulado)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('OdinSystem', 20, 25);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Punto de Venta', 20, 35);

  // Información de la factura en el header
  doc.setTextColor(...textColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`FACTURA #${invoice.invoiceNumber}`, 150, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${formatDate(invoice.createdAt)}`, 150, 35);

  // Información del cliente
  let yPosition = 60;

  doc.setFillColor(...secondaryColor);
  doc.rect(20, yPosition, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL CLIENTE', 25, yPosition + 6);

  yPosition += 15;
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const customerName =
    customer?.name || invoice.customerName || 'Cliente no especificado';
  doc.text(`Nombre: ${customerName}`, 25, yPosition);

  if (customer?.email) {
    yPosition += 6;
    doc.text(`Email: ${customer.email}`, 25, yPosition);
  }

  if (customer?.phone) {
    yPosition += 6;
    doc.text(`Teléfono: ${customer.phone}`, 25, yPosition);
  }

  if (customer?.address) {
    yPosition += 6;
    doc.text(`Dirección: ${customer.address}`, 25, yPosition);
  }

  // Información de fechas
  yPosition += 15;

  doc.setFillColor(...secondaryColor);
  doc.rect(20, yPosition, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DE FECHAS', 25, yPosition + 6);

  yPosition += 15;
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(
    `Fecha de creación: ${formatDateTime(invoice.createdAt)}`,
    25,
    yPosition,
  );

  if (invoice.dueDate) {
    yPosition += 6;
    doc.text(
      `Fecha de vencimiento: ${formatDate(invoice.dueDate)}`,
      25,
      yPosition,
    );
  }

  if (invoice.paidAt) {
    yPosition += 6;
    doc.text(`Fecha de pago: ${formatDateTime(invoice.paidAt)}`, 25, yPosition);
  }

  // Estado de la factura
  yPosition += 10;
  const statusLabels = {
    PAID: 'Pagada',
    PENDING: 'Pendiente',
    OVERDUE: 'Vencida',
    CANCELLED: 'Cancelada',
  };

  const statusLabel =
    statusLabels[invoice.status as unknown as keyof typeof statusLabels] ||
    invoice.status;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Estado: ${statusLabel}`, 25, yPosition);

  // Tabla de items
  yPosition += 20;

  const tableColumns = ['Descripción', 'Cantidad', 'Precio Unitario', 'Total'];
  const tableRows = (invoice.items || []).map((item) => [
    item.description || 'Sin descripción',
    (item.quantity || 0).toString(),
    `$${(item.unitPrice || 0).toFixed(2)}`,
    `$${(item.total || 0).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [tableColumns],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
  });

  // Obtener la posición Y después de la tabla
  // @ts-expect-error - autoTable añade esta propiedad
  yPosition = doc.lastAutoTable.finalY + 20;

  // Totales
  const pageHeight = doc.internal.pageSize.height;

  // Si no hay espacio suficiente, crear nueva página
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 30;
  }

  // Box para totales
  doc.setFillColor(245, 245, 245);
  doc.rect(120, yPosition, 70, 40, 'F');
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.rect(120, yPosition, 70, 40);

  // Subtotal
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 125, yPosition + 10);
  doc.text(`$${(invoice.subtotal || 0).toFixed(2)}`, 185, yPosition + 10, {
    align: 'right',
  });

  // Impuestos
  const taxPercentage = invoice.subtotal
    ? ((invoice.tax / invoice.subtotal) * 100).toFixed(0)
    : '0';
  doc.text(`Impuestos (${taxPercentage}%):`, 125, yPosition + 18);
  doc.text(`$${(invoice.tax || 0).toFixed(2)}`, 185, yPosition + 18, {
    align: 'right',
  });

  // Línea divisoria
  doc.setDrawColor(...primaryColor);
  doc.line(125, yPosition + 25, 185, yPosition + 25);

  // Total
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 125, yPosition + 35);
  doc.text(`$${(invoice.total || 0).toFixed(2)}`, 185, yPosition + 35, {
    align: 'right',
  });

  // Footer
  const footerY = pageHeight - 30;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(
    'Generado por OdinSystem - Sistema de Punto de Venta',
    105,
    footerY,
    { align: 'center' },
  );
  doc.text(`Generado el: ${formatDateTime(new Date())}`, 105, footerY + 5, {
    align: 'center',
  });

  // Notas adicionales si existen
  if (invoice.notes) {
    yPosition += 50;
    if (yPosition > footerY - 30) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.text('NOTAS:', 20, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(invoice.notes, 170);
    doc.text(splitNotes, 20, yPosition + 8);
  }

  return doc;
};

export const downloadInvoicePDF = (
  invoice: Invoice,
  customer?: Customer | null,
) => {
  const doc = generateInvoicePDF({ invoice, customer });
  const fileName = `factura-${invoice.invoiceNumber}-${formatDate(invoice.createdAt).replace(/\s/g, '-')}.pdf`;
  doc.save(fileName);
};

export const previewInvoicePDF = (
  invoice: Invoice,
  customer?: Customer | null,
) => {
  const doc = generateInvoicePDF({ invoice, customer });
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};
