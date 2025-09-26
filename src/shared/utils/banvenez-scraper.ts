import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface LoginCredentials {
  username: string;
  password: string;
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
      }
    } catch {
      // error
    }
  }

  async searchAndVerifyTransaction(
    referenceNumber: string = '957415',
    expectedAmount: string = '5.33',
  ): Promise<TransactionResult> {
    try {
      // Esperar a que aparezca el campo de búsqueda
      await this.waitForElement('input[placeholder="Buscar"]', 15000);
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

      // Presionar Enter para buscar
      await this.page!.keyboard.press('Enter');

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
            return result;
          }
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
        const _tableInfo = await this.page!.evaluate(() => {
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

        return transactionResult;
      }

      if (!transactionResult.amountMatches) {
        await this.takeScreenshot(
          ` Transacción encontrada pero el monto no coincide:${referenceNumber}_resultado`,
        );
      } else {
        await this.takeScreenshot(
          `Transacción verificada correctamente${referenceNumber}_resultado`,
        );
      }

      return transactionResult;
    } catch (error) {
      throw new Error(`❌ Error al buscar y verificar transacción: ${error}`);
    }
  }

  async verifyMultipleTransactions(
    transactions: Array<{ reference: string; expectedAmount: string }>,
  ): Promise<TransactionResult[]> {
    const results: TransactionResult[] = [];

    for (const transaction of transactions) {
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
      } catch {
        // Error verifying transaction - handled by result object
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
    return results;
  }

  private async waitForElement(
    selector: string,
    timeout: number = 30000,
  ): Promise<void> {
    try {
      await this.page!.waitForSelector(selector, {
        visible: true,
        timeout,
      });
    } catch {
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

      // Tipeo más rápido para mejorar velocidad
      for (const char of text) {
        await this.page!.type(selector, char, {
          delay: Math.random() * 30 + 20, // Reducido: entre 20-50ms por caracter
        });
      }
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
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Esperar 2s antes del siguiente intento
      }
    }
  }

  async initializeBrowser(useFastBrowser: boolean = false): Promise<void> {
    try {
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
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-domain-reliability',
        '--disable-features=TranslateUI',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-crash-upload',
        '--no-default-browser-check',
        '--no-first-run',
        '--no-pings',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-gpu',
        '--disable-software-rasterizer',
      ];

      this.browser = await puppeteer.launch({
        headless: 'new', // Siempre modo headless para máxima estabilidad
        defaultViewport: { width: 1366, height: 768 },
        args,
        ignoreDefaultArgs: ['--disable-extensions'],
        timeout: 30000, // Reducido de 60s a 30s
      });

      this.page = await this.browser.newPage();

      // Configuraciones agresivas para velocidad
      this.page.setDefaultNavigationTimeout(30000); // Reducido de 90s a 30s
      this.page.setDefaultTimeout(15000); // Reducido de 60s a 15s

      // Bloquear recursos innecesarios para acelerar carga
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (
          resourceType === 'image' ||
          resourceType === 'stylesheet' ||
          resourceType === 'font' ||
          resourceType === 'media'
        ) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // User agent optimizado
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      );
    } catch (error) {
      throw new Error(`❌ Error al inicializar navegador: ${error}`);
    }
  }

  async navigateToBank(): Promise<void> {
    try {
      await this.waitWithRetry(async () => {
        // Usar 'domcontentloaded' para cargar más rápido
        await this.page!.goto('https://bdvenlinea.banvenez.com/', {
          waitUntil: 'domcontentloaded',
          timeout: 30000, // Reducido de 90s a 30s
        });
      });

      // Esperar mínimo para que se estabilice
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Reducido de 5s a 2s

      //await this.takeScreenshot('01_pagina_inicial');
    } catch (error) {
      throw new Error(`❌ Error al cargar la página: ${error}`);
    }
  }

  async enterUsername(username: string): Promise<void> {
    try {
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
        } catch {
          //error
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
    } catch (error) {
      throw new Error(`❌ Error al ingresar usuario: ${error}`);
    }
  }

  async clickEnterButton(): Promise<void> {
    try {
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
        } catch {
          //error
        }
      }

      if (!enterButton) {
        throw new Error('No se encontró el botón Entrar con ningún selector');
      }
      await this.page!.click(enterButton);
      //await this.takeScreenshot('05_despues_click_entrar');
    } catch (error) {
      throw new Error(`❌ Error al hacer clic en Entrar: ${error}`);
    }
  }

  async waitForPasswordModal(): Promise<void> {
    try {
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
        } catch {}
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
        } catch {
          //error
        }
      }

      if (!passwordField) {
        throw new Error('No se encontró el campo de contraseña en el modal');
      }

      //await this.takeScreenshot('06_modal_contraseña_aparecido');
    } catch (error) {
      throw new Error(`❌ Error esperando modal de contraseña: ${error}`);
    }
  }

  async enterPassword(password: string): Promise<void> {
    try {
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
        } catch {
          continue;
        }
      }

      if (!passwordField) {
        throw new Error('No se encontró el campo de contraseña');
      }

      //await this.takeScreenshot('07_antes_ingresar_contraseña');
      await this.typeHumanLike(passwordField, password);
      //await this.takeScreenshot('08_despues_ingresar_contraseña');
    } catch (error) {
      throw new Error(`❌ Error al ingresar contraseña: ${error}`);
    }
  }

  async clickContinueButton(): Promise<void> {
    try {
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
        } catch {
          continue;
        }
      }

      if (!continueButton) {
        throw new Error('No se encontró el botón Continuar habilitado');
      }

      //await this.takeScreenshot('09_antes_click_continuar');
      await continueButton.click();
      //await this.takeScreenshot('10_despues_click_continuar');
    } catch (error) {
      throw new Error(`❌ Error al hacer clic en Continuar: ${error}`);
    }
  }

  async waitForLoginSuccess(): Promise<void> {
    try {
      await this.page!.waitForFunction(
        () => {
          const modal = document.querySelector('mat-dialog-container');
          return modal === null;
        },
        { timeout: 30000 },
      );
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
        // error
      });

      // Esperar un poco más para que cargue completamente
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      throw new Error(`❌ Error esperando confirmación de login: ${error}`);
    }
  }

  async getPageInfo(): Promise<{ url: string; title: string }> {
    try {
      const url = await this.page!.url();
      const title = await this.page!.title();

      return { url, title };
    } catch {
      return { url: 'unknown', title: 'unknown' };
    }
  }

  async clickConsultasMenu(): Promise<boolean> {
    try {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (consultasButton as any).click();
      //await this.takeScreenshot('13_despues_click_consultas');
      return true;
    } catch {
      return false;
    }
  }

  async clickMovimientosEnLinea(): Promise<void> {
    try {
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

      // Esperar un momento para que la navegación se complete
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      // Capturar el estado actual para debugging
      throw new Error(
        `❌ Error al hacer clic en Movimientos en Línea: ${error}`,
      );
    }
  }

  async selectFirstAccount(): Promise<void> {
    try {
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
        } catch {
          // error
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
        } catch {
          // error
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
    } catch (error) {
      throw new Error(`❌ Error al seleccionar cuenta: ${error}`);
    }
  }

  async clickProcesarButton(): Promise<void> {
    try {
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
    } catch (error) {
      throw new Error(`❌ Error al hacer clic en Procesar: ${error}`);
    }
  }

  async waitForMovimientos(): Promise<void> {
    try {
      // Esperar un momento para que la página cargue
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verificar si aparece el mensaje de "NO HAY MOVIMIENTOS"
      const noMovements = await this.page!.evaluate(() => {
        // Buscar el elemento del anunciador de accesibilidad
        const announcer = document.querySelector('.cdk-live-announcer-element');
        if (
          announcer &&
          announcer.textContent?.includes('NO HAY MOVIMIENTOS')
        ) {
          return true;
        }

        // También buscar en otros posibles elementos
        const allElements = document.querySelectorAll('*');
        for (const element of allElements) {
          if (
            element.textContent?.trim() === 'NO HAY MOVIMIENTOS' ||
            element.textContent?.includes('No hay movimientos') ||
            element.textContent?.includes('Sin movimientos')
          ) {
            return true;
          }
        }
        return false;
      });

      if (noMovements) {
        // Si no hay movimientos, cerrar sesión y lanzar error específico
        await this.clickSalirButton();
        throw new Error(
          'NO_MOVEMENTS: No hay movimientos bancarios asociados a esta cuenta',
        );
      }

      // Si no detectamos "no hay movimientos", intentar esperar por los elementos de tabla
      await Promise.race([
        // Esperar tabla de movimientos
        this.page!.waitForSelector(
          'table, .table, mat-table, [class*="movement"], [class*="transaction"]',
          {
            timeout: 15000,
          },
        ),

        // Esperar elementos típicos de resultados
        this.page!.waitForSelector(
          '[class*="result"], [class*="data"], .list, ul li',
          {
            timeout: 15000,
          },
        ),
      ]).catch(async () => {
        // Si no encontramos elementos de tabla después del timeout, verificar de nuevo si no hay movimientos
        const hasNoMovements = await this.page!.evaluate(() => {
          const announcer = document.querySelector(
            '.cdk-live-announcer-element',
          );
          return (
            announcer && announcer.textContent?.includes('NO HAY MOVIMIENTOS')
          );
        });

        if (hasNoMovements) {
          await this.clickSalirButton();
          throw new Error(
            'NO_MOVEMENTS: No hay movimientos bancarios asociados a esta cuenta',
          );
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('NO_MOVEMENTS')) {
        throw error;
      }
      throw new Error(`❌ Error esperando movimientos: ${error}`);
    }
  }

  async navigateToMovimientos(): Promise<void> {
    try {
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
      const _pageInfo = await this.getPageInfo();

      // Paso 10: Capturar el home/dashboard
      //await this.takeScreenshot('11_home_dashboard');
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
      // Paso 1: Realizar login
      await this.performLogin(credentials, useFastBrowser);

      // Paso 2: Navegar a movimientos
      await this.navigateToMovimientos();

      await this.searchAndVerifyTransaction();
    } catch (error) {
      //await this.takeScreenshot('ERROR_flujo_completo');
      throw new Error(`❌ Error en flujo completo: ${error}`);
    }
  }

  async close(): Promise<void> {
    try {
      if (this.page) {
        try {
          await this.clickSalirButton();
        } catch {
          // Si falla el logout, continuar con el cierre
        }
      }

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }
    } catch (error) {
      // Asegurarse de cerrar el navegador aunque haya error
      if (this.browser) {
        try {
          await this.browser.close();
        } catch {
          // Ignorar error al cerrar
        }
        this.browser = null;
        this.page = null;
      }
    }
  }

  async clickSalirButton(): Promise<void> {
    try {
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

      // Esperar un momento para que se procese el logout
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      throw new Error(`❌ Error al cerrar sesión: ${error}`);
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
    await new Promise((resolve) => setTimeout(resolve, 60000));
  } catch {
    // error
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
