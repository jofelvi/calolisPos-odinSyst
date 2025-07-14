import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthenticationResult {
  success: boolean;
  errorMessage?: string;
  errorType?: 'INVALID_CREDENTIALS' | 'TIMEOUT' | 'NETWORK_ERROR' | 'UNKNOWN';
}

interface TransactionResult {
  found: boolean;
  referenceNumber: string;
  amount: string;
  date: string;
  description: string;
  type: string;
  balance: string;
  amountMatches: boolean;
}

class BankScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private screenshotDir: string;

  constructor() {
    // Crear directorio para capturas si no existe
    this.screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  private async takeScreenshot(
    name: string,
    format: 'png' | 'jpeg' | 'webp' = 'png',
  ): Promise<void> {
    try {
      if (this.page) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${timestamp}_${name}.${format}`;
        const filepath = path.join(this.screenshotDir, filename);

        const typedPath = filepath as
          | `${string}.png`
          | `${string}.jpeg`
          | `${string}.webp`;

        await this.page.screenshot({
          path: typedPath,
          fullPage: true,
          type: format,
          quality: format === 'jpeg' ? 90 : undefined,
        });
        console.log(`📸 Captura guardada: ${filename}`);
      }
    } catch (error) {
      console.error(`❌ Error al tomar captura ${name}:`, error);
    }
  }

  async searchAndVerifyTransaction(
    referenceNumber: string = '957415',
    expectedAmount: string = '5.33',
  ): Promise<TransactionResult> {
    try {
      console.log(
        `🔍 Buscando transacción con referencia: ${referenceNumber} y monto esperado: ${expectedAmount}`,
      );

      // Esperar a que aparezca el campo de búsqueda
      await this.waitForElement('input[placeholder="Buscar"]', 15000);

      console.log('✅ Campo de búsqueda encontrado');

      // Limpiar el campo de búsqueda y escribir el número de referencia
      const searchInput = 'input[placeholder="Buscar"]';
      await this.page!.click(searchInput);

      // Limpiar completamente el campo
      await this.page!.evaluate((selector) => {
        const element = document.querySelector(selector) as HTMLInputElement;
        if (element) {
          element.value = '';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, searchInput);

      // Escribir el número de referencia
      await this.typeHumanLike(searchInput, referenceNumber);

      console.log(`✅ Número de referencia ${referenceNumber} ingresado`);

      // Presionar Enter para buscar
      await this.page!.keyboard.press('Enter');

      console.log('⏳ Búsqueda iniciada, esperando resultados...');

      // Esperar un momento para que se procese la búsqueda
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verificar si hay resultados en la tabla
      const transactionResult = await this.page!.evaluate(
        (refNumber, expAmount) => {
          const result: TransactionResult = {
            found: false,
            referenceNumber: '',
            amount: '',
            date: '',
            description: '',
            type: '',
            balance: '',
            amountMatches: false,
          };

          // Buscar todas las filas de la tabla (excluyendo el header)
          const rows = document.querySelectorAll('mat-row');

          if (rows.length === 0) {
            console.log('No se encontraron filas en la tabla');
            return result;
          }

          console.log(`Encontradas ${rows.length} filas en la tabla`);

          // Buscar la fila que contiene nuestro número de referencia
          for (const row of rows) {
            const cells = row.querySelectorAll('mat-cell');

            if (cells.length >= 6) {
              const fecha = cells[0]?.textContent?.trim() || '';
              const referencia = cells[1]?.textContent?.trim() || '';
              const descripcion = cells[2]?.textContent?.trim() || '';
              const tipo = cells[3]?.textContent?.trim() || '';
              const monto = cells[4]?.textContent?.trim() || '';
              const saldo = cells[5]?.textContent?.trim() || '';

              console.log(
                `Verificando fila - Referencia: ${referencia}, Monto: ${monto}`,
              );

              // Verificar si la referencia contiene nuestro número
              if (referencia.includes(refNumber)) {
                result.found = true;
                result.referenceNumber = referencia;
                result.amount = monto;
                result.date = fecha;
                result.description = descripcion;
                result.type = tipo;
                result.balance = saldo;

                // Verificar si el monto coincide (normalizar formato)
                const normalizedMonto = monto
                  .replace(/[,\s]/g, '')
                  .replace('.', ',');
                const normalizedExpected = expAmount.replace('.', ',');

                result.amountMatches =
                  normalizedMonto === normalizedExpected ||
                  monto.replace(',', '.') === expAmount ||
                  monto === expAmount;

                console.log(`Transacción encontrada:`);
                console.log(`- Referencia: ${referencia}`);
                console.log(`- Monto: ${monto}`);
                console.log(`- Monto esperado: ${expAmount}`);
                console.log(`- Coincide: ${result.amountMatches}`);

                break;
              }
            }
          }

          return result;
        },
        referenceNumber,
        expectedAmount,
      );
      if (!transactionResult.found) {
        console.log(
          `❌ No se encontró transacción con referencia: ${referenceNumber}`,
        );
        const tableInfo = await this.page!.evaluate(() => {
          const rows = document.querySelectorAll('mat-row');
          const rowsData = Array.from(rows).map((row) => {
            const cells = row.querySelectorAll('mat-cell');
            return Array.from(cells).map(
              (cell) => cell.textContent?.trim() || '',
            );
          });

          return {
            totalRows: rows.length,
            rowsData: rowsData,
          };
        });

        console.log(
          '📊 Información de la tabla:',
          JSON.stringify(tableInfo, null, 2),
        );

        return transactionResult;
      }

      if (!transactionResult.amountMatches) {
        await this.takeScreenshot(
          ` Transacción encontrada pero el monto no coincide:${referenceNumber}_resultado`,
        );
        console.log(`⚠️ Transacción encontrada pero el monto no coincide:`);
        console.log(`   - Monto encontrado: ${transactionResult.amount}`);
        console.log(`   - Monto esperado: ${expectedAmount}`);
      } else {
        await this.takeScreenshot(
          `Transacción verificada correctamente${referenceNumber}_resultado`,
        );
        console.log(`✅ Transacción verificada correctamente:`);
        console.log(`   - Referencia: ${transactionResult.referenceNumber}`);
        console.log(`   - Monto: ${transactionResult.amount}`);
        console.log(`   - Fecha: ${transactionResult.date}`);
        console.log(`   - Tipo: ${transactionResult.type}`);
      }

      return transactionResult;
    } catch (error) {
      console.error('❌ Error en búsqueda y verificación:', error);
      //await this.takeScreenshot(`ERROR_busqueda_${referenceNumber}`);

      throw new Error(`❌ Error al buscar y verificar transacción: ${error}`);
    }
  }

  // Función auxiliar para verificar múltiples transacciones
  async verifyMultipleTransactions(
    transactions: Array<{ reference: string; expectedAmount: string }>,
  ): Promise<TransactionResult[]> {
    const results: TransactionResult[] = [];

    for (const transaction of transactions) {
      console.log(`\n🔄 Verificando transacción ${transaction.reference}...`);

      try {
        const result = await this.searchAndVerifyTransaction(
          transaction.reference,
          transaction.expectedAmount,
        );
        results.push(result);

        // Limpiar búsqueda antes de la siguiente
        await this.page!.click('input[placeholder="Buscar"]');
        //await this.page!.keyboard.selectAll();
        await this.page!.keyboard.press('Delete');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Error verificando ${transaction.reference}:`, error);
        results.push({
          found: false,
          referenceNumber: transaction.reference,
          amount: '',
          date: '',
          description: '',
          type: '',
          balance: '',
          amountMatches: false,
        });
      }
    }

    // Resumen final
    console.log('\n📋 RESUMEN DE VERIFICACIONES:');
    results.forEach((result, index) => {
      const transaction = transactions[index];
      console.log(`${index + 1}. Ref: ${transaction.reference}`);
      console.log(`   Encontrada: ${result.found ? '✅' : '❌'}`);
      console.log(`   Monto correcto: ${result.amountMatches ? '✅' : '❌'}`);
      if (result.found) {
        console.log(`   Monto: ${result.amount}`);
      }
    });

    return results;
  }

  private async waitForElement(
    selector: string,
    timeout: number = 30000,
  ): Promise<void> {
    try {
      console.log(`⏳ Esperando elemento: ${selector}`);
      await this.page!.waitForSelector(selector, {
        visible: true,
        timeout,
      });
      console.log(`✅ Elemento encontrado: ${selector}`);
    } catch (error) {
      console.log(error);
      throw new Error(
        `❌ No se encontró el elemento ${selector} en ${timeout}ms`,
      );
    }
  }

  private async typeHumanLike(selector: string, text: string): Promise<void> {
    try {
      await this.page!.click(selector);
      await this.page!.evaluate((sel) => {
        const element = document.querySelector(sel) as HTMLInputElement;
        if (element) element.value = '';
      }, selector);

      // Escribir caracter por caracter con delays aleatorios para simular humano
      for (const char of text) {
        await this.page!.type(selector, char, {
          delay: Math.random() * 100 + 50, // Entre 50-150ms por caracter
        });
      }

      console.log(`✅ Texto ingresado en: ${selector}`);
    } catch (error) {
      throw new Error(`❌ Error al escribir en ${selector}: ${error}`);
    }
  }

  private async waitWithRetry(
    operation: () => Promise<void>,
    retries: number = 3,
  ): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await operation();
        return;
      } catch (error) {
        console.log(`⚠️ Intento ${i + 1}/${retries} falló:`, error);
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Esperar 2s antes del siguiente intento
      }
    }
  }

  async initializeBrowser(useFastBrowser: boolean = false): Promise<void> {
    try {
      console.log('🚀 Iniciando navegador...');

      const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--no-first-run',
        '--no-zygote',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--safebrowsing-disable-auto-update',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-background-networking',
      ];

      if (useFastBrowser) {
        args.push(
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-background-media-suspend',
          '--disable-client-side-phishing-detection',
          '--disable-default-apps',
          '--disable-hang-monitor',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-sync',
          '--disable-translate',
          '--metrics-recording-only',
          '--no-first-run',
          '--safebrowsing-disable-auto-update',
          '--enable-automation',
          '--password-store=basic',
          '--use-mock-keychain',
        );
      }

      this.browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1366, height: 768 },
        args,
        ignoreDefaultArgs: ['--disable-extensions'],
        timeout: 60000,
      });

      this.page = await this.browser.newPage();

      // Configuraciones adicionales para mejorar velocidad
      this.page.setDefaultNavigationTimeout(90000);
      this.page.setDefaultTimeout(60000);

      // SOLUCIÓN 1: Eliminar bloqueo de recursos para cargar estilos correctamente
      await this.page.setRequestInterception(false);

      // SOLUCIÓN 2: Configurar user agent actualizado
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      );

      console.log('✅ Navegador iniciado correctamente');
    } catch (error) {
      throw new Error(`❌ Error al inicializar navegador: ${error}`);
    }
  }

  async navigateToBank(): Promise<void> {
    try {
      console.log('🌐 Navegando al sitio del banco...');

      await this.waitWithRetry(async () => {
        // SOLUCIÓN 3: Cambiar a 'networkidle0' para esperar recursos críticos
        await this.page!.goto('https://bdvenlinea.banvenez.com/', {
          waitUntil: 'networkidle0',
          timeout: 90000,
        });
      });

      // Esperar a que la página se estabilice
      await new Promise((resolve) => setTimeout(resolve, 5000));

      //await this.takeScreenshot('01_pagina_inicial');
      console.log('✅ Página cargada correctamente');
    } catch (error) {
      throw new Error(`❌ Error al cargar la página: ${error}`);
    }
  }

  async enterUsername(username: string): Promise<void> {
    try {
      console.log('👤 Ingresando usuario...');

      // Usar selectores más específicos basados en el HTML proporcionado
      const usernameSelectors = [
        'input[formcontrolname="username"]',
        'input[aria-label="usuario"]',
        'input[type="text"][maxlength="16"]',
        '#mat-input-0',
      ];

      let usernameElement = null;
      for (const selector of usernameSelectors) {
        try {
          await this.waitForElement(selector, 10000);
          usernameElement = selector;
          break;
        } catch (error) {
          console.log(
            `⚠️ Selector ${selector} no encontrado, probando siguiente...`,
          );
        }
      }

      if (!usernameElement) {
        throw new Error(
          'No se encontró el campo de usuario con ningún selector',
        );
      }

      //await this.takeScreenshot('02_antes_ingresar_usuario');
      await this.typeHumanLike(usernameElement, username);
      //await this.takeScreenshot('03_despues_ingresar_usuario');

      console.log('✅ Usuario ingresado correctamente');
    } catch (error) {
      throw new Error(`❌ Error al ingresar usuario: ${error}`);
    }
  }

  async clickEnterButton(): Promise<void> {
    try {
      console.log('🔘 Haciendo clic en botón Entrar...');

      // Selectores múltiples para el botón entrar
      const enterButtonSelectors = [
        'button[type="submit"].mat-raised-button.mat-accent',
        'button.mat-raised-button.mat-accent[tabindex="2"]',
        'button:contains("Entrar")',
        'button[type="submit"]',
      ];

      let enterButton = null;
      for (const selector of enterButtonSelectors) {
        try {
          await this.waitForElement(selector, 10000);
          enterButton = selector;
          break;
        } catch (error) {
          console.log(
            `⚠️ Selector ${selector} no encontrado, probando siguiente...`,
          );
        }
      }

      if (!enterButton) {
        throw new Error('No se encontró el botón Entrar con ningún selector');
      }

      //await this.takeScreenshot('04_antes_click_entrar');
      await this.page!.click(enterButton);
      //await this.takeScreenshot('05_despues_click_entrar');

      console.log('✅ Botón Entrar presionado');
    } catch (error) {
      throw new Error(`❌ Error al hacer clic en Entrar: ${error}`);
    }
  }

  async waitForPasswordModal(): Promise<void> {
    try {
      console.log('⏳ Esperando modal de contraseña...');

      // Selectores múltiples para el modal
      const modalSelectors = [
        'mat-dialog-container',
        'app-confirmar-acceso',
        '[role="dialog"]',
        '.mat-dialog-container',
      ];

      let modalFound = false;
      for (const selector of modalSelectors) {
        try {
          await this.waitForElement(selector, 15000);
          modalFound = true;
          break;
        } catch (error) {
          console.log(
            `⚠️ Modal selector ${selector} no encontrado, probando siguiente...`,
          );
        }
      }

      if (!modalFound) {
        throw new Error('No se encontró el modal con ningún selector');
      }

      // Esperar específicamente el campo de contraseña
      const passwordFieldSelectors = [
        'input[formcontrolname="password"]',
        'input[type="password"]',
        'input[name="password"]',
        '#mat-input-1',
      ];

      let passwordField = null;
      for (const selector of passwordFieldSelectors) {
        try {
          await this.waitForElement(selector, 10000);
          passwordField = selector;
          break;
        } catch (error) {
          console.log(
            `⚠️ Campo contraseña ${selector} no encontrado, probando siguiente...`,
          );
        }
      }

      if (!passwordField) {
        throw new Error('No se encontró el campo de contraseña en el modal');
      }

      //await this.takeScreenshot('06_modal_contraseña_aparecido');
      console.log('✅ Modal de contraseña cargado');
    } catch (error) {
      throw new Error(`❌ Error esperando modal de contraseña: ${error}`);
    }
  }

  async enterPassword(password: string): Promise<void> {
    try {
      console.log('🔐 Ingresando contraseña...');

      const passwordSelectors = [
        'input[formcontrolname="password"]',
        'input[type="password"]',
        'input[name="password"]',
        '#mat-input-1',
      ];

      let passwordField = null;
      for (const selector of passwordSelectors) {
        try {
          const element = await this.page!.$(selector);
          if (element) {
            passwordField = selector;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!passwordField) {
        throw new Error('No se encontró el campo de contraseña');
      }

      //await this.takeScreenshot('07_antes_ingresar_contraseña');
      await this.typeHumanLike(passwordField, password);
      //await this.takeScreenshot('08_despues_ingresar_contraseña');

      console.log('✅ Contraseña ingresada correctamente');
    } catch (error) {
      throw new Error(`❌ Error al ingresar contraseña: ${error}`);
    }
  }

  async clickContinueButton(): Promise<void> {
    try {
      console.log('🔘 Haciendo clic en botón Continuar...');

      // Esperar a que el botón se habilite
      console.log('⏳ Esperando que el botón Continuar se habilite...');

      await this.page!.waitForFunction(
        () => {
          const buttons = document.querySelectorAll('button[type="submit"]');
          for (const button of buttons) {
            const buttonElement = button as HTMLButtonElement;
            if (
              buttonElement.textContent?.includes('Continuar') &&
              !buttonElement.disabled
            ) {
              return true;
            }
          }
          return false;
        },
        { timeout: 20000 },
      );

      const continueButtonSelectors = [
        'button[type="submit"]:not([disabled])',
        'button.mat-raised-button:not([disabled])',
        'button:not([disabled])',
      ];

      let continueButton = null;
      for (const selector of continueButtonSelectors) {
        try {
          const buttons = await this.page!.$$(selector);
          for (const button of buttons) {
            const text = await this.page!.evaluate(
              (el) => el.textContent,
              button,
            );
            if (text?.includes('Continuar')) {
              continueButton = button;
              break;
            }
          }
          if (continueButton) break;
        } catch (error) {
          continue;
        }
      }

      if (!continueButton) {
        throw new Error('No se encontró el botón Continuar habilitado');
      }

      //await this.takeScreenshot('09_antes_click_continuar');
      await continueButton.click();
      console.log('✅ Botón Continuar presionado');
      //await this.takeScreenshot('10_despues_click_continuar');
    } catch (error) {
      throw new Error(`❌ Error al hacer clic en Continuar: ${error}`);
    }
  }

  async waitForLoginSuccess(): Promise<void> {
    try {
      console.log('⏳ Esperando redirección después del login...');

      // Esperar a que desaparezca el modal de contraseña
      await this.page!.waitForFunction(
        () => {
          const modal = document.querySelector('mat-dialog-container');
          return modal === null;
        },
        { timeout: 30000 },
      );

      console.log('✅ Modal de contraseña cerrado');

      // Esperar a que la URL cambie o aparezcan elementos del dashboard
      await Promise.race([
        // Opción 1: Esperar cambio de URL
        this.page!.waitForFunction(
          () => {
            return (
              window.location.href !== 'https://bdvenlinea.banvenez.com/' &&
              !window.location.href.includes('login')
            );
          },
          { timeout: 30000 },
        ),

        // Opción 2: Esperar elementos típicos del dashboard/home
        this.page!.waitForSelector(
          '[class*="dashboard"], [class*="home"], [class*="menu"], nav, .sidebar, [class*="main-content"]',
          { timeout: 30000 },
        ),
      ]).catch(() => {
        console.log(
          '⚠️ No se detectó cambio específico, verificando estado actual...',
        );
      });

      // Esperar un poco más para que cargue completamente
      await new Promise((resolve) => setTimeout(resolve, 5000));

      console.log('✅ Login completado exitosamente');
    } catch (error) {
      throw new Error(`❌ Error esperando confirmación de login: ${error}`);
    }
  }

  async getPageInfo(): Promise<{ url: string; title: string }> {
    try {
      const url = await this.page!.url();
      const title = await this.page!.title();

      console.log(`📍 URL actual: ${url}`);
      console.log(`📄 Título: ${title}`);

      return { url, title };
    } catch (error) {
      console.error('❌ Error obteniendo información de la página:', error);
      return { url: 'unknown', title: 'unknown' };
    }
  }

  async clickConsultasMenu(): Promise<boolean> {
    try {
      console.log('📋 Haciendo clic en menú Consultas...');
      let consultasButton = null;
      // Método alternativo: buscar por texto
      await this.page!.waitForFunction(
        () => {
          const buttons = document.querySelectorAll('button');
          for (const button of buttons) {
            if (button.textContent?.includes('Consultas')) {
              return true;
            }
          }
          return false;
        },
        { timeout: 15000 },
      );

      // Hacer clic en el botón que contiene "Consultas"
      consultasButton = await this.page!.evaluateHandle(() => {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent?.includes('Consultas')) {
            return button;
          }
        }
        return null;
      });

      if (!consultasButton || consultasButton.toString() === 'JSHandle@null') {
        throw new Error('No se encontró el botón de Consultas');
      }

      //await this.takeScreenshot('12_antes_click_consultas');
      await (consultasButton as any).click();
      //await this.takeScreenshot('13_despues_click_consultas');

      console.log('✅ Menú Consultas desplegado');
      return true;
    } catch (error) {
      console.log(`❌ Error al hacer clic en Consultas login fallo: ${error}`);
      return false;
    }
  }

  async clickMovimientosEnLinea(): Promise<void> {
    try {
      console.log('📋 Haciendo clic en Movimientos en Línea...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await this.page!.waitForFunction(
        () => {
          // Buscar por aria-label exacto
          const buttonByAriaLabel = document.querySelector(
            'button[aria-label="movimientos en líneas"]',
          );
          if (buttonByAriaLabel) return true;

          // Buscar por routerlink
          const buttonByRouterLink = document.querySelector(
            'button[routerlink="/main/movimientos-cuenta-enlinea"]',
          );
          if (buttonByRouterLink) return true;

          // Buscar por texto exacto en span
          const spans = document.querySelectorAll('span[role="listitem"]');
          for (const span of spans) {
            if (span.textContent?.trim() === 'Movimientos en Línea') {
              return true;
            }
          }

          return false;
        },
        { timeout: 15000 },
      );

      console.log('✅ Elemento "Movimientos en Línea" encontrado');
      const clicked = await this.page!.evaluate(() => {
        // Método 1: Por aria-label exacto
        const buttonByAriaLabel = document.querySelector(
          'button[aria-label="movimientos en líneas"]',
        ) as HTMLButtonElement;
        if (buttonByAriaLabel && !buttonByAriaLabel.disabled) {
          buttonByAriaLabel.click();
          return 'aria-label';
        }

        // Método 2: Por routerlink
        const buttonByRouterLink = document.querySelector(
          'button[routerlink="/main/movimientos-cuenta-enlinea"]',
        ) as HTMLButtonElement;
        if (buttonByRouterLink && !buttonByRouterLink.disabled) {
          buttonByRouterLink.click();
          return 'routerlink';
        }

        // Método 3: Por texto exacto del span y luego hacer clic en el botón padre
        const spans = document.querySelectorAll('span[role="listitem"]');
        for (const span of spans) {
          if (span.textContent?.trim() === 'Movimientos en Línea') {
            const parentButton = span.closest('button') as HTMLButtonElement;
            if (parentButton && !parentButton.disabled) {
              parentButton.click();
              return 'span-parent';
            }
          }
        }

        return null;
      });

      if (!clicked) {
        throw new Error(
          'No se pudo hacer clic en ningún elemento "Movimientos en Línea"',
        );
      }

      console.log(`✅ Clic realizado usando método: ${clicked}`);

      // Esperar un momento para que la navegación se complete
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      // Capturar el estado actual para debugging
      const currentUrl = await this.page!.url();
      const currentTitle = await this.page!.title();

      console.error('❌ Error en clickMovimientosEnLinea:');
      console.error('   URL actual:', currentUrl);
      console.error('   Título actual:', currentTitle);
      console.error('   Error:', error);

      // Intentar obtener información del DOM actual
      const domInfo = await this.page!.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        const buttonInfo = Array.from(buttons).map((btn) => ({
          text: btn.textContent?.trim(),
          ariaLabel: btn.getAttribute('aria-label'),
          routerLink: btn.getAttribute('routerlink'),
          disabled: btn.hasAttribute('disabled'),
        }));

        return {
          totalButtons: buttons.length,
          buttonsWithMovimientos: buttonInfo.filter(
            (btn) =>
              btn.text?.toLowerCase().includes('movimientos') ||
              btn.ariaLabel?.toLowerCase().includes('movimientos'),
          ),
        };
      });

      console.error(
        '   Información del DOM:',
        JSON.stringify(domInfo, null, 2),
      );

      throw new Error(
        `❌ Error al hacer clic en Movimientos en Línea: ${error}`,
      );
    }
  }

  async selectFirstAccount(): Promise<void> {
    try {
      console.log('🏦 Seleccionando primera cuenta...');

      // Esperar a que cargue la página de movimientos
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Selectores para el dropdown de cuentas
      const accountSelectors = [
        'mat-select[role="listbox"]',
        'app-listado-cuentas mat-select',
        '[formcontrolname="cuentaOrigen"] mat-select',
        '#mat-select-0',
      ];

      let accountDropdown = null;
      for (const selector of accountSelectors) {
        try {
          await this.waitForElement(selector, 10000);
          accountDropdown = selector;
          break;
        } catch (error) {
          console.log(
            `⚠️ Selector cuenta ${selector} no encontrado, probando siguiente...`,
          );
        }
      }

      if (!accountDropdown) {
        throw new Error('No se encontró el dropdown de cuentas');
      }

      //await this.takeScreenshot('16_antes_seleccionar_cuenta');

      // Hacer clic en el dropdown para abrirlo
      await this.page!.click(accountDropdown);

      // Esperar a que se abra el dropdown
      await new Promise((resolve) => setTimeout(resolve, 1500));

      //await this.takeScreenshot('17_dropdown_cuentas_abierto');

      // Buscar y hacer clic en la primera opción
      const optionSelectors = [
        'mat-option:first-child',
        '.mat-option:first-child',
        '[role="option"]:first-child',
        'mat-option:nth-child(1)',
      ];

      let firstOption = null;
      for (const selector of optionSelectors) {
        try {
          await this.page!.waitForSelector(selector, { timeout: 5000 });
          firstOption = selector;
          break;
        } catch (error) {
          console.log(
            `⚠️ Opción ${selector} no encontrada, probando siguiente...`,
          );
        }
      }

      if (!firstOption) {
        // Método alternativo: buscar todas las opciones y seleccionar la primera
        await this.page!.evaluate(() => {
          const options = document.querySelectorAll(
            'mat-option, .mat-option, [role="option"]',
          );
          if (options.length > 0) {
            (options[0] as HTMLElement).click();
          }
        });
      } else {
        await this.page!.click(firstOption);
      }

      //await this.takeScreenshot('18_cuenta_seleccionada');
      console.log('✅ Primera cuenta seleccionada');
    } catch (error) {
      throw new Error(`❌ Error al seleccionar cuenta: ${error}`);
    }
  }

  async clickProcesarButton(): Promise<void> {
    try {
      console.log('⚙️ Haciendo clic en botón Procesar...');

      // Esperar un momento para que se actualice la interfaz
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Método alternativo: buscar por texto
      await this.page!.waitForFunction(
        () => {
          const buttons = document.querySelectorAll('button');
          for (const button of buttons) {
            if (button.textContent?.includes('Procesar')) {
              return true;
            }
          }
          return false;
        },
        { timeout: 15000 },
      );

      //await this.takeScreenshot('19_antes_click_procesar');

      // Hacer clic en el botón Procesar
      await this.page!.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent?.includes('Procesar')) {
            (button as HTMLElement).click();
            return;
          }
        }
      });

      //await this.takeScreenshot('20_despues_click_procesar');
      console.log('✅ Botón Procesar presionado');
    } catch (error) {
      throw new Error(`❌ Error al hacer clic en Procesar: ${error}`);
    }
  }

  async waitForMovimientos(): Promise<void> {
    try {
      console.log('⏳ Esperando que carguen los movimientos...');

      // Esperar a que aparezcan los datos de movimientos
      await Promise.race([
        // Esperar tabla de movimientos
        this.page!.waitForSelector(
          'table, .table, mat-table, [class*="movement"], [class*="transaction"]',
          {
            timeout: 30000,
          },
        ),

        // Esperar elementos típicos de resultados
        this.page!.waitForSelector(
          '[class*="result"], [class*="data"], .list, ul li',
          {
            timeout: 30000,
          },
        ),

        // Esperar por timeout mínimo
        new Promise((resolve) => setTimeout(resolve, 10000)),
      ]).catch(() => {
        console.log(
          '⚠️ No se detectaron elementos específicos de movimientos, continuando...',
        );
      });

      //await this.takeScreenshot('21_movimientos_cargados');
      console.log('✅ Movimientos cargados');
    } catch (error) {
      throw new Error(`❌ Error esperando movimientos: ${error}`);
    }
  }

  async navigateToMovimientos(): Promise<void> {
    try {
      console.log('🚀 Navegando a movimientos...');

      // Paso 1: Hacer clic en Consultas
      const consultasMenu = await this.clickConsultasMenu();

      if (consultasMenu) {
        // Paso 2: Hacer clic en Movimientos en Línea
        await this.clickMovimientosEnLinea();
        // Paso 3: Seleccionar primera cuenta
        await this.selectFirstAccount();
        // Paso 4: Hacer clic en Procesar
        await this.clickProcesarButton();
        // Paso 5: Esperar que carguen los movimientos
        await this.waitForMovimientos();
      }
      console.log('🎉 Navegación a movimientos completada');
    } catch (error) {
      //await this.takeScreenshot('ERROR_navegacion_movimientos');
      throw new Error(`❌ Error navegando a movimientos: ${error}`);
    }
  }

  async performLogin(
    credentials: LoginCredentials,
    useFastBrowser: boolean = false,
  ): Promise<void> {
    try {
      console.log('🔐 Iniciando proceso de login...');

      // Paso 1: Inicializar navegador
      await this.initializeBrowser(useFastBrowser);

      // Paso 2: Navegar al sitio
      await this.navigateToBank();

      // Paso 3: Ingresar usuario
      await this.enterUsername(credentials.username);

      // Paso 4: Hacer clic en Entrar
      await this.clickEnterButton();

      // Paso 5: Esperar modal de contraseña
      await this.waitForPasswordModal();

      // Paso 6: Ingresar contraseña
      await this.enterPassword(credentials.password);

      // Paso 7: Hacer clic en Continuar
      await this.clickContinueButton();

      // Paso 8: Esperar confirmación de login exitoso
      await this.waitForLoginSuccess();

      // Paso 9: Obtener información de la página actual
      const pageInfo = await this.getPageInfo();

      // Paso 10: Capturar el home/dashboard
      //await this.takeScreenshot('11_home_dashboard');

      console.log('🎉 Login completado exitosamente - Home capturado');
      console.log(`📊 Estado final: ${pageInfo.url} - ${pageInfo.title}`);
    } catch (error) {
      //await this.takeScreenshot('ERROR_login_fallido');
      throw new Error(`❌ Error en proceso de login: ${error}`);
    }
  }

  async performFullFlow(
    credentials: LoginCredentials,
    useFastBrowser: boolean = false,
  ): Promise<void> {
    try {
      console.log('🚀 Iniciando flujo completo...');

      // Paso 1: Realizar login
      await this.performLogin(credentials, useFastBrowser);

      // Paso 2: Navegar a movimientos
      await this.navigateToMovimientos();

      console.log('🎉 Flujo completo exitoso - Movimientos obtenidos');
      await this.searchAndVerifyTransaction();
    } catch (error) {
      //await this.takeScreenshot('ERROR_flujo_completo');
      throw new Error(`❌ Error en flujo completo: ${error}`);
    }
  }

  async close(): Promise<void> {
    try {
      if (this.browser) {
        await this.clickSalirButton();
        await this.browser.close();
        console.log('✅ Navegador cerrado correctamente');
      }
    } catch (error) {
      console.error('❌ Error al cerrar navegador:', error);
    }
  }

  async clickSalirButton(): Promise<void> {
    try {
      console.log('🚪 Haciendo clic en botón Salir...');
      await this.page!.waitForFunction(
        () => {
          const buttons = document.querySelectorAll('button');
          for (const button of buttons) {
            if (button.textContent?.includes('Salir')) {
              return true;
            }
          }
          return false;
        },
        { timeout: 15000 },
      );

      console.log('✅ Elemento "Salir" encontrado');

      // Hacer clic usando evaluate para ejecutar directamente en el DOM
      const clicked = await this.page!.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent?.includes('Salir')) {
            const buttonElement = button as HTMLButtonElement;
            if (!buttonElement.disabled) {
              buttonElement.click();
              return true;
            }
          }
        }
        return false;
      });

      if (!clicked) {
        throw new Error('No se pudo hacer clic en el botón Salir');
      }

      console.log('✅ Clic en botón Salir ejecutado');

      // Esperar un momento para que se procese el logout
      await new Promise((resolve) => setTimeout(resolve, 3000));

      console.log('✅ Sesión cerrada exitosamente');
    } catch (error) {
      throw new Error(`❌ Error al cerrar sesión: ${error}`);
    }
  }

  async checkAuthenticationResult(): Promise<AuthenticationResult> {
    try {
      console.log('🔍 Verificando resultado de autenticación...');

      // Esperar un momento para que aparezcan posibles mensajes de error
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verificar si hay mensajes de error en snackbar
      const authError = await this.page!.evaluate(() => {
        // Buscar contenedores de snackbar con mensajes de error
        const snackbarSelectors = [
          '.mat-snack-bar-container',
          '.mat-simple-snackbar',
          'snack-bar-container',
          'simple-snack-bar',
        ];

        for (const selector of snackbarSelectors) {
          const snackbars = document.querySelectorAll(selector);
          for (const snackbar of snackbars) {
            const text = snackbar.textContent?.trim().toLowerCase();
            if (text) {
              // Verificar mensajes de error comunes
              if (
                text.includes('autenticación incorrecta') ||
                text.includes('authentication failed') ||
                text.includes('credenciales incorrectas') ||
                text.includes('usuario o contraseña incorrectos') ||
                text.includes('error de autenticación')
              ) {
                return {
                  found: true,
                  message:
                    snackbar.textContent?.trim() || 'Error de autenticación',
                  type: 'INVALID_CREDENTIALS',
                };
              }

              if (text.includes('timeout') || text.includes('tiempo agotado')) {
                return {
                  found: true,
                  message: snackbar.textContent?.trim() || 'Tiempo agotado',
                  type: 'TIMEOUT',
                };
              }

              if (
                text.includes('error de conexión') ||
                text.includes('network error')
              ) {
                return {
                  found: true,
                  message: snackbar.textContent?.trim() || 'Error de conexión',
                  type: 'NETWORK_ERROR',
                };
              }
            }
          }
        }

        // También verificar mensajes de error en elementos comunes
        const errorSelectors = [
          '.error-message',
          '.alert-danger',
          '.mat-error',
          '[class*="error"]',
          '[class*="danger"]',
        ];

        for (const selector of errorSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const text = element.textContent?.trim().toLowerCase();
            if (
              text &&
              (text.includes('error') || text.includes('incorrecto'))
            ) {
              return {
                found: true,
                message: element.textContent?.trim() || 'Error desconocido',
                type: 'UNKNOWN',
              };
            }
          }
        }

        return { found: false };
      });

      if (authError.found) {
        console.log(
          `❌ Error de autenticación detectado: ${authError.message}`,
        );
        await this.takeScreenshot(`auth_error_${Date.now()}`);

        return {
          success: false,
          errorMessage: authError.message,
          errorType: authError.type as AuthenticationResult['errorType'],
        };
      }

      // Verificar si estamos en una página que indica login exitoso
      const loginSuccess = await this.page!.evaluate(() => {
        const url = window.location.href;
        const title = document.title.toLowerCase();

        // Indicadores de login exitoso
        const successIndicators = [
          // URL cambió de la página de login
          !url.includes('login') && url !== 'https://bdvenlinea.banvenez.com/',
          // Título indica dashboard/home
          title.includes('dashboard') ||
            title.includes('home') ||
            title.includes('principal'),
          // Elementos del navbar están presentes (como en tu HTML)
          document.querySelector('app-navbar') !== null,
          // Mensaje de bienvenida presente
          document.querySelector('.welcome-text') !== null,
          // Menús principales visibles
          document.querySelector('button:has(span:contains("Consultas"))') !==
            null,
        ];

        return successIndicators.some((indicator) => indicator);
      });

      if (loginSuccess) {
        console.log('✅ Autenticación exitosa confirmada');
        return { success: true };
      }

      // Si no hay error explícito pero tampoco indicadores de éxito,
      // considerar como posible error
      console.log('⚠️ Estado de autenticación incierto');
      //await this.takeScreenshot(`auth_uncertain_${Date.now()}`);

      return {
        success: false,
        errorMessage: 'No se pudo confirmar el login exitoso',
        errorType: 'UNKNOWN',
      };
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
      return {
        success: false,
        errorMessage: `Error verificando autenticación: ${error}`,
        errorType: 'UNKNOWN',
      };
    }
  }

  // Método para manejar errores de autenticación
  async handleAuthenticationError(
    authResult: AuthenticationResult,
  ): Promise<void> {
    try {
      console.log('🔧 Manejando error de autenticación...');

      // Si hay un botón "Aceptar" en el snackbar, hacer clic
      const acceptButtonClicked = await this.page!.evaluate(() => {
        const acceptButtons = document.querySelectorAll('button');
        for (const button of acceptButtons) {
          const text = button.textContent?.trim().toLowerCase();
          if (text === 'aceptar' || text === 'ok' || text === 'cerrar') {
            (button as HTMLElement).click();
            return true;
          }
        }
        return false;
      });

      if (acceptButtonClicked) {
        console.log('✅ Botón de aceptar presionado');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Tomar captura del estado actual
      await this.takeScreenshot(`auth_error_handled_${Date.now()}`);

      // Log detallado del error
      console.log('📋 DETALLES DEL ERROR DE AUTENTICACIÓN:');
      console.log(`   Tipo: ${authResult.errorType}`);
      console.log(`   Mensaje: ${authResult.errorMessage}`);

      const pageInfo = await this.getPageInfo();
      console.log(`   URL actual: ${pageInfo.url}`);
      console.log(`   Título: ${pageInfo.title}`);
    } catch (error) {
      console.error('❌ Error manejando error de autenticación:', error);
    }
  }
}

// Función principal para usar el scraper
async function main() {
  const scraper = new BankScraper();

  try {
    // Configurar credenciales (deberían venir de variables de entorno)
    const credentials: LoginCredentials = {
      username: process.env.NEXT_PUBLIC_BANK_USERNAME || 'jofelvi08',
      password: process.env.NEXT_PUBLIC_BANK_PASSWORD || 'Dylan*04',
    };

    // Ejecutar flujo completo: login + navegación a movimientos
    await scraper.performFullFlow(credentials, true);

    console.log(
      '✅ Proceso completado. Navegador permanece abierto para debugging...',
    );

    // Mantener el navegador abierto por 60 segundos para verificar
    await new Promise((resolve) => setTimeout(resolve, 60000));
  } catch (error) {
    console.error('💥 Error en el proceso:', error);
  } finally {
    await scraper.close();
  }
}

// Exportar la clase para uso modular
export { BankScraper };
export type { LoginCredentials };

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}
