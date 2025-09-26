export interface PagoMovil {
  id: string;
  orderId: string;
  referenceNumber: string;
  expectedAmount: number; // Monto esperado en USD (legacy)
  expectedAmountBS?: number; // Monto esperado en Bolívares
  expectedAmountUSD?: number; // Monto esperado en USD (explícito)
  actualAmount?: number; // Monto real encontrado en Bolívares
  actualAmountUSD?: number; // Monto real en USD (calculado)
  phoneNumber: string;
  status: 'pending' | 'verified' | 'amount_mismatch' | 'not_found' | 'error';
  verificationDate: Date;
  errorMessage?: string;
  bcvRate?: number; // Tasa BCV usada en el momento de la transacción
  createdAt: Date;
  updatedAt: Date;
}

export interface PagoMovilVerificationRequest {
  referenceNumber: string;
  expectedAmount: string;
  phoneNumber: string;
}

export interface PagoMovilVerificationResult {
  success: boolean;
  found: boolean;
  amountMatches: boolean;
  actualAmount?: string;
  errorMessage?: string;
}
