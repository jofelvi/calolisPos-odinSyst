import type { Browser, ElementHandle, Page } from 'puppeteer';
import puppeteer from 'puppeteer';

type TextCleaner = (text: string) => string;

export const getPriceBcv = async (): Promise<string> => {
  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ] as string[],
    });

    const page: Page = await browser.newPage();

    // Ignorar errores de certificado SSL
    await page.setBypassCSP(true);

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

    console.log('✅ Página del BCV cargada');

    // Intentar múltiples selectores
    const selectors = [
      '#dolar .centrado strong',
      '#dolar strong',
      '.centrado strong',
      '#dolar',
    ];

    let element: ElementHandle<Element> | null = null;
    let usedSelector = '';

    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        element = await page.$(selector);
        if (element) {
          usedSelector = selector;
          console.log(`✅ Elemento encontrado con selector: ${selector}`);
          break;
        }
      } catch (_error) {
        console.log(`⚠️ Selector ${selector} no encontrado`);
        continue;
      }
    }

    if (!element) {
      // Intentar extraer todo el HTML para debugging
      const bodyHTML = await page.evaluate(() => document.body.innerHTML);
      console.error('❌ HTML de la página:', bodyHTML.substring(0, 500));
      throw new Error('Elemento de precio no encontrado con ningún selector');
    }

    // Obtener el contenido de texto del elemento
    const rawText: string | null = await element.evaluate(
      (el: Element) => el.textContent,
    );

    console.log(`📊 Texto extraído (${usedSelector}):`, rawText);

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

    console.log('💰 Precio limpio:', precioDolar);

    return precioDolar;
  } catch (error: unknown) {
    // Manejo de errores fuertemente tipado
    if (error instanceof Error) {
      throw new Error(`Fallo en getPriceBcv: ${error.message}`);
    } else {
      const message = 'Error desconocido al obtener el precio del BCV';
      throw new Error(message);
    }
  } finally {
    // Cerrar el navegador siempre
    if (browser) {
      try {
        await browser.close();
      } catch {
        // console.error('Error cerrando el navegador:', closeError);
      }
    }
  }
};

// Ejecutar la función con manejo de promesas tipado
/*getPriceBcv()
  .then((price: string) => price)
  .catch((err: Error) => console.error('Error en el proceso:', err.message));*/
