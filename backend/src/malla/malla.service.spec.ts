import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { MallaService, Ramo } from './malla.service';

jest.mock('axios');

describe('MallaService', () => {
  let service: MallaService;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MallaService],
    }).compile();

    service = module.get<MallaService>(MallaService);
    jest.clearAllMocks();
  });

  describe('obtenerMalla', () => {
    const mockRamos: Ramo[] = [
      {
        codigo: 'INF010',
        asignatura: 'Introducción a la Programación',
        creditos: 4,
        nivel: 1,
        prereq: 'Ninguno',
      },
      {
        codigo: 'INF020',
        asignatura: 'Programación Orientada a Objetos',
        creditos: 4,
        nivel: 2,
        prereq: 'INF010',
      },
    ];

    it('debería retornar array de ramos cuando la solicitud es exitosa', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockRamos });

      const result = await service.obtenerMalla('INF010-2020', '2020');

      expect(result).toEqual(mockRamos);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://losvilos.ucn.cl/hawaii/api/mallas/?INF010-2020-2020',
        {
          headers: {
            'X-HAWAII-AUTH': 'jf400fejof13f',
          },
        }
      );
    });

    it('debería retornar array vacío cuando no hay ramos', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const result = await service.obtenerMalla('INF010-2020', '2020');

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('debería lanzar UnauthorizedException en error 401', async () => {
      const error = new Error('Unauthorized');
      (error as any).response = { status: 401 };

      mockedAxios.get.mockRejectedValue(error);

      await expect(service.obtenerMalla('INF010-2020', '2020')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('debería lanzar NotFoundException en error 404', async () => {
      const error = new Error('Not Found');
      (error as any).response = { status: 404 };

      mockedAxios.get.mockRejectedValue(error);

      await expect(service.obtenerMalla('INVALID-2020', '2020')).rejects.toThrow(
        NotFoundException
      );
    });

    it('debería pasar headers correctos en la solicitud', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockRamos });

      await service.obtenerMalla('INF010-2020', '2020');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-HAWAII-AUTH': 'jf400fejof13f',
          }),
        })
      );
    });

    it('debería construir URL correctamente con código y catálogo', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockRamos });

      await service.obtenerMalla('INF100-2021', '2021');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://losvilos.ucn.cl/hawaii/api/mallas/?INF100-2021-2021',
        expect.any(Object)
      );
    });

    it('debería validar estructura de ramos retornados', async () => {
      const validRamo: Ramo = {
        codigo: 'INF010',
        asignatura: 'Test Course',
        creditos: 4,
        nivel: 1,
        prereq: 'None',
      };

      mockedAxios.get.mockResolvedValue({ data: [validRamo] });

      const result = await service.obtenerMalla('INF010-2020', '2020');

      expect(result[0]).toHaveProperty('codigo');
      expect(result[0]).toHaveProperty('asignatura');
      expect(result[0]).toHaveProperty('creditos');
      expect(result[0]).toHaveProperty('nivel');
      expect(result[0]).toHaveProperty('prereq');
    });

    it('debería lanzar error en problemas de conexión', async () => {
      const error = new Error('Network Error');
      mockedAxios.get.mockRejectedValue(error);

      await expect(service.obtenerMalla('INF010-2020', '2020')).rejects.toThrow(Error);
    });
  });
});
