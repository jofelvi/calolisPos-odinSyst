export interface PagoMovil {
  id: string;
  orderId: string;
  referenceNumber: string;
  expectedAmount: number;
  actualAmount?: number;
  phoneNumber: string;
  status: 'pending' | 'verified' | 'amount_mismatch' | 'not_found' | 'error';
  verificationDate: Date;
  errorMessage?: string;
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
