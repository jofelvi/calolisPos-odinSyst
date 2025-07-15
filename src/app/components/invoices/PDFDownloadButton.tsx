'use client';

import { useState } from 'react';
import { Button } from '@/components/shared/button/Button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Invoice } from '@/types/invoice';
import { Customer } from '@/types/customer';
import { downloadInvoicePDF, previewInvoicePDF } from '@/utils/pdfGenerator';

interface PDFDownloadButtonProps {
  invoice: Invoice;
  customer?: Customer | null;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showPreview?: boolean;
}

export default function PDFDownloadButton({
  invoice,
  customer,
  variant = 'outline',
  size = 'default',
  showPreview = true,
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      // Pequeño delay para mostrar el loading
      await new Promise((resolve) => setTimeout(resolve, 500));
      downloadInvoicePDF(invoice, customer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewPDF = async () => {
    try {
      setIsGenerating(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      previewInvoicePDF(invoice, customer);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      alert(
        'Error al generar la vista previa del PDF. Por favor, intenta de nuevo.',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (showPreview) {
    return (
      <div className="flex gap-2">
        <Button
          variant={variant}
          size={size}
          onClick={handlePreviewPDF}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          Vista Previa
        </Button>
        <Button
          variant={variant}
          size={size}
          onClick={handleDownloadPDF}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Descargar PDF
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownloadPDF}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      Descargar PDF
    </Button>
  );
}
