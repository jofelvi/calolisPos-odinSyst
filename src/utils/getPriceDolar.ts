import type { Browser, ElementHandle, Page } from 'puppeteer';
import puppeteer from 'puppeteer';

type TextCleaner = (text: string) => string;

export const getPriceBcv = async (): Promise<string> => {
  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] as string[],
    });

    const page: Page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    );

    await page.goto(
      'https://www.bcv.org.ve/seccionportal/tipo-de-cambio-oficial-del-bcv',
      {
        waitUntil: 'domcontentloaded' as const,
        timeout: 30000,
      },
    );

    await page.waitForSelector('#dolar .centrado strong', { timeout: 10000 });

    const element: ElementHandle<Element> | null = await page.$(
      '#dolar .centrado strong',
    );
    if (!element) {
      throw new Error('Elemento de precio no encontrado');
    }

    // Obtener el contenido de texto del elemento
    const rawText: string | null = await element.evaluate(
      (el: Element) => el.textContent,
    );
    if (!rawText) {
      throw new Error('El elemento de precio no contiene texto');
    }

    // Función de limpieza con tipado específico
    const cleanPriceText: TextCleaner = (text: string): string => {
      return text
        .replace(/\s+/g, ' ') // Normalizar espacios
        .replace(/[^\d,]/g, '') // Mantener solo dígitos y comas
        .replace(',', '.') // Convertir a formato decimal
        .trim(); // Eliminar espacios sobrantes
    };

    const precioDolar: string = cleanPriceText(rawText);

    console.log(`Precio del dólar BCV: ${precioDolar}`);
    return precioDolar;
  } catch (error: unknown) {
    // Manejo de errores fuertemente tipado
    if (error instanceof Error) {
      console.error('Error al obtener el precio:', error.message);
      throw new Error(`Fallo en getPriceBcv: ${error.message}`);
    } else {
      const message = 'Error desconocido al obtener el precio del BCV';
      console.error(message);
      throw new Error(message);
    }
  } finally {
    // Cerrar el navegador siempre
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error cerrando el navegador:', closeError);
      }
    }
  }
};

// Ejecutar la función con manejo de promesas tipado
/*getPriceBcv()
  .then((price: string) => price)
  .catch((err: Error) => console.error('Error en el proceso:', err.message));*/
