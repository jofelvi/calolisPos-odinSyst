import { NextRequest, NextResponse } from 'next/server';
import { pagoMovilVerifier } from '@/shared/utils/pagoMovilVerifier';
import { PagoMovilVerificationRequest } from '@/modelTypes/pagoMovil';

export async function POST(request: NextRequest) {
  try {
    const body: PagoMovilVerificationRequest = await request.json();

    // Validaciones básicas
    if (!body.referenceNumber || body.referenceNumber.length !== 6) {
      return NextResponse.json(
        {
          success: false,
          found: false,
          amountMatches: false,
          errorMessage: 'Número de referencia debe tener 6 dígitos',
        },
        { status: 400 },
      );
    }

    if (!body.expectedAmount || parseFloat(body.expectedAmount) <= 0) {
      return NextResponse.json(
        {
          success: false,
          found: false,
          amountMatches: false,
          errorMessage: 'Monto esperado debe ser mayor a 0',
        },
        { status: 400 },
      );
    }

    if (!body.phoneNumber || body.phoneNumber.length < 10) {
      return NextResponse.json(
        {
          success: false,
          found: false,
          amountMatches: false,
          errorMessage: 'Número de teléfono inválido',
        },
        { status: 400 },
      );
    }

    // Realizar verificación
    const result = await pagoMovilVerifier.verifyPayment(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        found: false,
        amountMatches: false,
        errorMessage:
          error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 },
    );
  }
}
