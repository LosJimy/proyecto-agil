// backend/src/malla/malla.controller.spec.ts - CREAR

import { Test, TestingModule } from '@nestjs/testing';
import { MallaController } from '../src/malla/malla.controller';
import { MallaService } from '../src/malla/malla.service';
import { OptimizacionService } from '../src/malla/optimizacion.service';
import { AvanceService } from '../src/avance/avance.service';

describe('MallaController', () => {
  let controller: MallaController;
  let mallaService: MallaService;

  const mockMallaService = {
    obtenerMalla: jest.fn(),
  };

  const mockOptimizacionService = {
    obtenerRamosDisponibles: jest.fn(),
    calcularProyeccionOptima: jest.fn(),
  };

  const mockAvanceService = {
    obtenerAvance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MallaController],
      providers: [
        { provide: MallaService, useValue: mockMallaService },
        { provide: OptimizacionService, useValue: mockOptimizacionService },
        { provide: AvanceService, useValue: mockAvanceService },
      ],
    }).compile();

    controller = module.get<MallaController>(MallaController);
    mallaService = module.get<MallaService>(MallaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('obtenerMalla', () => {
    it('debería retornar la malla curricular del estudiante', async () => {
      const mockRequest = {
        user: {
          carreras: [
            { codigo: 'ITI', catalogo: '2020' },
          ],
        },
      };

      const mockMalla = [
        { codigo: 'MAT101', asignatura: 'Matemáticas I', creditos: 6, nivel: 1, prereq: '' },
      ];

      mockMallaService.obtenerMalla.mockResolvedValue(mockMalla);

      const result = await controller.obtenerMalla(mockRequest);

      expect(result).toEqual(mockMalla);
      expect(mockMallaService.obtenerMalla).toHaveBeenCalledWith('ITI', '2020');
    });

    it('debería lanzar NotFoundException si no hay carreras', async () => {
      const mockRequest = {
        user: {
          carreras: [],
        },
      };

      await expect(controller.obtenerMalla(mockRequest)).rejects.toThrow('No hay carreras asociadas');
    });
  });
});