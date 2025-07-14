import { NextRequest, NextResponse } from 'next/server';
import { getPriceBcv } from '@/utils/getPriceDolar';

export async function GET(request: NextRequest) {
  try {
    console.log('Intentando obtener tasa BCV...');
    const rate = await getPriceBcv();
    console.log('Tasa BCV obtenida:', rate);
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
    console.error('Error fetching BCV rate:', error);
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
