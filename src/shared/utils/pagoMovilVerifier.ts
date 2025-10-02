import { BankScraper, LoginCredentials } from './banvenez-scraper';
import {
  PagoMovilVerificationRequest,
  PagoMovilVerificationResult,
} from '@/modelTypes/pagoMovil';

export class PagoMovilVerifier {
  private scraper: BankScraper;
  private credentials: LoginCredentials;

  constructor() {
    this.scraper = new BankScraper();
    this.credentials = {
      username:
        process.env.BANK_USERNAME ||
        process.env.NEXT_PUBLIC_BANK_USERNAME ||
        'jofelvi07',
      password:
        process.env.BANK_PASSWORD ||
        process.env.NEXT_PUBLIC_BANK_PASSWORD ||
        'Dylan*04',
    };
  }

  async verifyPayment(
    request: PagoMovilVerificationRequest,
  ): Promise<PagoMovilVerificationResult> {
    try {
      // Realizar login y navegar a movimientos
      await this.scraper.performLogin(this.credentials, true);
      await this.scraper.navigateToMovimientos();

      // Buscar y verificar la transacción
      const transactionResult = await this.scraper.searchAndVerifyTransaction(
        request.referenceNumber,
        request.expectedAmount,
      );

      if (!transactionResult.found) {
        return {
          success: false,
          found: false,
          amountMatches: false,
          errorMessage: `No se encontró transacción con referencia: ${request.referenceNumber}`,
        };
      }

      if (!transactionResult.amountMatches) {
        return {
          success: true,
          found: true,
          amountMatches: false,
          actualAmount: transactionResult.amount,
          errorMessage: `Monto no coincide. Esperado: ${request.expectedAmount}, Encontrado: ${transactionResult.amount}`,
        };
      }

      return {
        success: true,
        found: true,
        amountMatches: true,
        actualAmount: transactionResult.amount,
      };
    } catch (error) {
      // Verificar si es un error de "no hay movimientos"
      if (error instanceof Error && error.message.includes('NO_MOVEMENTS')) {
        return {
          success: false,
          found: false,
          amountMatches: false,
          errorMessage:
            'No hay movimientos bancarios asociados a esta cuenta. Por favor, intente más tarde.',
        };
      }

      return {
        success: false,
        found: false,
        amountMatches: false,
        errorMessage:
          error instanceof Error ? error.message : 'Error desconocido',
      };
    } finally {
      await this.scraper.close();
    }
  }
}

export const pagoMovilVerifier = new PagoMovilVerifier();
