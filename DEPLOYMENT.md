# 📦 Guía de Deployment - CalolisPos OdinSyst

## 🌐 Información del Proyecto

**Nombre del Proyecto:** OdinSystem
**Framework:** Next.js 15.3.2
**Package Manager:** pnpm (v10.17.1)
**Plataforma:** Vercel
**URL de Producción:** https://odinsystem-otr612i2g-jonathan-zambranos-projects.vercel.app
**Usuario Vercel:** jonathan-zambranos-projects

---

## 📂 Estructura del Repositorio

```
Ruta Local: /mnt/c/Users/jofel/RepositoriosPersonales/calolisPos-odinSyst
Ruta WSL: /home/jofelvi/caolis (INCORRECTA - NO USAR)
Git Remote: git@github-personal:jofelvi/calolisPos-odinSyst.git
Branch Principal: master
```

**⚠️ IMPORTANTE:** El repositorio está en `/mnt/c/Users/jofel/RepositoriosPersonales/calolisPos-odinSyst`, NO en `/home/jofelvi/caolis`

---

## 🔑 Configuración de Variables de Entorno en Vercel

Las siguientes variables están configuradas en Vercel (Production):

### Firebase Configuration
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=<configurado>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=odinsysnext.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<configurado>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<configurado>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<configurado>
NEXT_PUBLIC_FIREBASE_APP_ID=<configurado>
```

### NextAuth Configuration
```bash
NEXTAUTH_SECRET=<configurado>
NEXTAUTH_URL=<configurado>
```

**Comando para agregar nuevas variables:**
```bash
cd /mnt/c/Users/jofel/RepositoriosPersonales/calolisPos-odinSyst
cmd.exe /c "vercel env add NOMBRE_VARIABLE production"
# Luego ingresar el valor cuando se solicite
```

---

## 🚀 Proceso de Deployment

### Método 1: Deploy Directo (Recomendado)

```bash
# 1. Navegar al directorio correcto
cd /mnt/c/Users/jofel/RepositoriosPersonales/calolisPos-odinSyst

# 2. Verificar cambios
git status

# 3. Agregar archivos modificados
git add <archivos>

# 4. Hacer commit (SIN referencias a Claude)
git commit -m "Descripción breve de los cambios"

# 5. Deploy a producción
cmd.exe /c "vercel --prod --yes"
```

### Método 2: Deploy vía GitHub (Actualmente con problemas)

**Problema Actual:** El hostname `github-personal` no está resolviendo.

```bash
# Cuando GitHub funcione:
git push origin master
# Vercel despliega automáticamente
```

---

## 🛠️ Comandos Útiles

### Build Local
```bash
cd /mnt/c/Users/jofel/RepositoriosPersonales/calolisPos-odinSyst
cmd.exe /c "npm run build"
```

### Formateo con Prettier
```bash
cmd.exe /c "npx prettier --write src/"
```

### Vercel CLI
```bash
# Ver deployments
cmd.exe /c "vercel list"

# Ver logs
cmd.exe /c "vercel logs"

# Deploy preview (no producción)
cmd.exe /c "vercel"

# Deploy producción
cmd.exe /c "vercel --prod --yes"

# Inspeccionar deployment
cmd.exe /c "vercel inspect"
```

---

## 🐛 Problemas Comunes y Soluciones

### 1. Error de ESLint en Build

**Error:** `'error' is defined but never used`

**Solución:** Usar prefijo `_` para variables no utilizadas
```typescript
// ❌ Incorrecto
} catch (error) {

// ✅ Correcto
} catch (_error) {
```

### 2. Puppeteer - Chrome no encontrado

**Error:** `Could not find Chrome (ver. 138.0.7204.49)`

**Solución:**
```bash
cd /mnt/c/Users/jofel/RepositoriosPersonales/calolisPos-odinSyst
cmd.exe /c "npx puppeteer browsers install chrome"
```

**Ubicación:** `C:\Users\jofel\.cache\puppeteer\chrome\win64-138.0.7204.49\chrome-win64\chrome.exe`

### 3. Git Remote con hostname incorrecto

**Problema Actual:** `ssh: Could not resolve hostname github-personal`

**Solución Temporal:** Usar Vercel CLI directo (Método 1)

### 4. Build Warnings de pnpm

**Warning:** Ignored build scripts: `puppeteer`, `sharp`, etc.

**Si es necesario aprobar:**
```bash
cmd.exe /c "pnpm approve-builds"
```

---

## 📋 Checklist de Pre-Deployment

- [ ] ✅ Build local exitoso (`npm run build`)
- [ ] ✅ Sin errores de ESLint
- [ ] ✅ Prettier ejecutado si hay cambios de formato
- [ ] ✅ Variables de entorno configuradas en Vercel
- [ ] ✅ Commit message descriptivo (sin referencias a Claude)
- [ ] ✅ Chrome instalado para Puppeteer (si se usa scraping)

---

## 🔍 Últimos Deployments Exitosos

### Deployment más reciente: 2025-10-02

**Commit:** `f4991d9 - Fix: ESLint error - prefijo de error no usado con guion bajo`

**Cambios incluidos:**
- Fix de toasts duplicados de tasa BCV
- Mejoras al scraping del BCV con múltiples selectores
- Agregado useRef para controlar toasts
- Chrome instalado para Puppeteer (ver. 138.0.7204.49)
- Logging detallado para debugging

**URL:** https://odinsystem-otr612i2g-jonathan-zambranos-projects.vercel.app

---

## 🎯 Puntos Clave para Recordar

### 1. Siempre usar la ruta correcta
```bash
cd /mnt/c/Users/jofel/RepositoriosPersonales/calolisPos-odinSyst
# NO usar /home/jofelvi/caolis
```

### 2. Usar cmd.exe para comandos Windows
```bash
cmd.exe /c "comando"
```

### 3. Build en Windows (no WSL)
```bash
# WSL puede fallar por dependencias nativas
cmd.exe /c "npm run build"
```

### 4. Timeouts para comandos largos
```bash
# Usar timeout de 300000ms (5 minutos) para builds y deployments
```

### 5. No incluir referencias a Claude en commits
```bash
# ❌ No hacer:
git commit -m "Fix por Claude Code"

# ✅ Hacer:
git commit -m "Fix: Descripción técnica del cambio"
```

---

## 📞 Información de Contacto y Accesos

**Plataforma:** Vercel
**CLI Version:** 48.1.6
**Organización:** jonathan-zambranos-projects
**Proyecto:** odinsystem

**Dashboard:** https://vercel.com/jonathan-zambranos-projects/odinsystem

---

## 🔄 Workflow Típico de Desarrollo

1. Hacer cambios en código
2. Probar localmente (`npm run dev`)
3. Build local (`npm run build`)
4. Commit cambios (`git commit`)
5. Deploy a Vercel (`vercel --prod --yes`)
6. Verificar deployment en URL de producción
7. Monitorear logs si hay problemas

---

## 📚 Recursos Adicionales

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Puppeteer Docs:** https://pptr.dev/
- **Firebase Docs:** https://firebase.google.com/docs

---

**Última actualización:** 2025-10-02
**Mantenido por:** jofelvi
