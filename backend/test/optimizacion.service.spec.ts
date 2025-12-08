// backend/src/optimizacion/optimizacion.service.spec.ts - CREAR
import { Test, TestingModule } from '@nestjs/testing';
import { OptimizacionService } from '../src/malla/optimizacion.service';

describe('OptimizacionService', () => {
  let service: OptimizacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OptimizacionService],
    }).compile();

    service = module.get<OptimizacionService>(OptimizacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('obtenerRamosDisponibles', () => {
    it('debería retornar ramos sin prerrequisitos si no hay ramos aprobados', () => {
      const malla = [
        { codigo: 'MAT101', asignatura: 'Matemáticas I', creditos: 6, nivel: 1, prereq: '' },
        { codigo: 'MAT102', asignatura: 'Matemáticas II', creditos: 6, nivel: 2, prereq: 'MAT101' },
      ];
      const ramosAprobados: string[] = [];

      const resultado = service.obtenerRamosDisponibles(malla, ramosAprobados);

      expect(resultado).toHaveLength(1);
      expect(resultado[0].codigo).toBe('MAT101');
    });

    it('debería retornar ramos cuyos prerrequisitos estén aprobados', () => {
      const malla = [
        { codigo: 'MAT101', asignatura: 'Matemáticas I', creditos: 6, nivel: 1, prereq: '' },
        { codigo: 'MAT102', asignatura: 'Matemáticas II', creditos: 6, nivel: 2, prereq: 'MAT101' },
      ];
      const ramosAprobados = ['MAT101'];

      const resultado = service.obtenerRamosDisponibles(malla, ramosAprobados);

      expect(resultado).toHaveLength(1);
      expect(resultado[0].codigo).toBe('MAT102');
    });

    it('no debería retornar ramos ya aprobados', () => {
      const malla = [
        { codigo: 'MAT101', asignatura: 'Matemáticas I', creditos: 6, nivel: 1, prereq: '' },
      ];
      const ramosAprobados = ['MAT101'];

      const resultado = service.obtenerRamosDisponibles(malla, ramosAprobados);

      expect(resultado).toHaveLength(0);
    });
  });

  describe('calcularProyeccionOptima', () => {
    it('debería retornar proyección vacía si no hay ramos pendientes', () => {
      const malla = [
        { codigo: 'MAT101', asignatura: 'Matemáticas I', creditos: 6, nivel: 1, prereq: '' },
      ];
      const ramosAprobados = ['MAT101'];

      const resultado = service.calcularProyeccionOptima(malla, ramosAprobados);

      expect(resultado.semestres).toHaveLength(0);
      expect(resultado.totalSemestres).toBe(0);
      expect(resultado.sePuedeEgresar).toBe(true);
    });

    it('debería respetar el límite máximo de créditos por semestre', () => {
      const malla = [
        { codigo: 'MAT101', asignatura: 'Matemáticas I', creditos: 30, nivel: 1, prereq: '' },
        { codigo: 'FIS101', asignatura: 'Física I', creditos: 20, nivel: 1, prereq: '' },
      ];
      const ramosAprobados: string[] = [];
      const maxCreditos = 35;

      const resultado = service.calcularProyeccionOptima(malla, ramosAprobados, maxCreditos);

      // Verificar que ningún semestre supere el máximo
      resultado.semestres.forEach(semestre => {
        expect(semestre.totalCreditos).toBeLessThanOrEqual(maxCreditos);
      });
    });

    it('debería priorizar ramos que desbloquean más asignaturas', () => {
      const malla = [
        { codigo: 'BASE', asignatura: 'Ramo Base', creditos: 5, nivel: 1, prereq: '' },
        { codigo: 'DEP1', asignatura: 'Dependiente 1', creditos: 5, nivel: 2, prereq: 'BASE' },
        { codigo: 'DEP2', asignatura: 'Dependiente 2', creditos: 5, nivel: 2, prereq: 'BASE' },
        { codigo: 'INDEP', asignatura: 'Independiente', creditos: 5, nivel: 1, prereq: '' },
      ];
      const ramosAprobados: string[] = [];

      const resultado = service.calcularProyeccionOptima(malla, ramosAprobados, 40);

      // El primer semestre debería incluir BASE porque desbloquea 2 ramos
      const primerSemestre = resultado.semestres[0];
      const codigosEnPrimerSemestre = primerSemestre.ramos.map(r => r.codigo);
      expect(codigosEnPrimerSemestre).toContain('BASE');
    });
  });
});