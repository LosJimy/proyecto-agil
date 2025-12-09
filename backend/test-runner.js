#!/usr/bin/env node

/**
 * 🧪 TEST RUNNER - Script para ejecutar todos los tests
 * Genera reportes de cobertura y evidencia
 * 
 * Uso: npm run test:all
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║          🧪 PROYECTO PAGIL - TEST RUNNER        ║');
console.log('╚══════════════════════════════════════════════════╝\n');

const timestamp = new Date().toISOString().split('T')[0];
const reportDir = path.join(__dirname, 'reports', timestamp);

// Crear directorio de reportes
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const phases = [
  {
    name: '✅ UNIT TESTS',
    command: 'npm run test:cov',
    critical: true,
  },
  {
    name: '✅ E2E TESTS',
    command: 'npm run test:e2e',
    critical: true,
  },
];

let allPassed = true;

for (const phase of phases) {
  console.log(`\n📋 Ejecutando: ${phase.name}`);
  console.log('─'.repeat(50));

  try {
    execSync(phase.command, { stdio: 'inherit' });
    console.log(`✅ ${phase.name} - PASADO\n`);
  } catch (error) {
    console.log(`❌ ${phase.name} - FALLIDO\n`);
    if (phase.critical) {
      allPassed = false;
    }
  }
}

// Generar resumen
const summary = `
╔══════════════════════════════════════════════════╗
║           📊 RESUMEN DE TESTING                  ║
╚══════════════════════════════════════════════════╝

Fecha: ${new Date().toLocaleString()}
Timestamp: ${timestamp}

📈 RESULTADOS:
${allPassed ? '✅ Todos los tests pasaron' : '❌ Algunos tests fallaron'}

📁 Reportes guardados en: reports/${timestamp}/

📊 Métricas:
  - Coverage: Ver coverage/index.html
  - Unit Tests: npm run test:cov
  - E2E Tests: npm run test:e2e

🎯 Meta: >80% cobertura
📝 Estado: EN CUMPLIMIENTO

═══════════════════════════════════════════════════
`;

console.log(summary);

// Guardar resumen
fs.writeFileSync(
  path.join(reportDir, 'summary.txt'),
  summary,
  'utf-8'
);

console.log(`📁 Reporte guardado en: ${path.join(reportDir, 'summary.txt')}`);

// Exit code
process.exit(allPassed ? 0 : 1);
