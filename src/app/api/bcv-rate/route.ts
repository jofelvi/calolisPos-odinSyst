import { NextResponse } from 'next/server';
import { getPriceBcv } from '@/utils/getPriceDolar';

export async function GET() {
  try {
    const rate = await getPriceBcv();
    const numericRate = parseFloat(rate);

    // Validar que la tasa sea un número válido
    if (isNaN(numericRate) || numericRate <= 0) {
      throw new Error('Tasa BCV inválida: ' + rate);
    }

    return NextResponse.json({
      rate: numericRate,
      source: 'BCV',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Return a default rate if the service fails
    const defaultRate = 36.5;
    return NextResponse.json({
      rate: defaultRate,
      source: 'default',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
