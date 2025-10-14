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

    // Normalizar monto con 2 decimales para comparación exacta (ej: 100 → 100.00)
    const normalizedAmount = parseFloat(body.expectedAmount).toFixed(2);

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

    // Configurar timeout de 90 segundos para toda la operación
    const verificationPromise = pagoMovilVerifier.verifyPayment({
      ...body,
      expectedAmount: normalizedAmount, // Usar monto normalizado
    });
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () =>
          reject(new Error('Timeout: Verificación tardó más de 90 segundos')),
        90000,
      );
    });

    // Realizar verificación con timeout
    const result = await Promise.race([verificationPromise, timeoutPromise]);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error en verify-pago-movil API:', error);
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
