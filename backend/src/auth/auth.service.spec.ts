//backend/src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { AuthService } from './auth.service';

jest.mock('axios');

describe('AuthService', () => {
  let service: AuthService;
  let configService: ConfigService;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret-key',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
    // Limpiar llamadas previas y asegurarnos de que el mock devuelva
    // el valor por defecto para cada ejecución (evita persistencia de
    // `mockReturnValue` entre tests).
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret-key',
      };
      return config[key];
    });
  });

  describe('login', () => {
    it('debería retornar token y datos cuando las credenciales son válidas', async () => {
      const mockResponse = {
        data: {
          rut: '12.345.678-9',
          carreras: [
            {
              codigo: 'INF010',
              nombre: 'Ingeniería Informática',
              catalogo: '2020',
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.login('test@example.com', 'password123');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('rut', '12.345.678-9');
      expect(result).toHaveProperty('carreras');
      expect(Array.isArray(result.carreras)).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://puclaro.ucn.cl/eross/avance/login.php',
        {
          params: {
            email: 'test@example.com',
            password: 'password123',
          },
        }
      );
    });

    it('debería lanzar UnauthorizedException cuando las credenciales son inválidas', async () => {
      const mockResponse = {
        data: {
          error: 'Credenciales incorrectas',
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await expect(service.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('debería lanzar InternalServerErrorException cuando JWT_SECRET no está definido', async () => {
      const mockResponse = {
        data: {
          rut: '12.345.678-9',
          carreras: [],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);
      mockConfigService.get.mockReturnValue(undefined);

      await expect(service.login('test@example.com', 'password123')).rejects.toThrow(
        InternalServerErrorException
      );
    });

    it('debería generar JWT válido con payload correcto', async () => {
      const mockResponse = {
        data: {
          rut: '12.345.678-9',
          carreras: [
            {
              codigo: 'INF010',
              nombre: 'Ingeniería Informática',
              catalogo: '2020',
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.login('test@example.com', 'password123');

      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      // El token debe ser un JWT válido (3 partes separadas por puntos)
      expect(result.token.split('.').length).toBe(3);
    });

    it('debería manejar respuesta sin carreras', async () => {
      const mockResponse = {
        data: {
          rut: '12.345.678-9',
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.login('test@example.com', 'password123');

      expect(result.carreras).toEqual([]);
      expect(result.rut).toBe('12.345.678-9');
    });

    it('debería lanzar InternalServerErrorException en error de conexión', async () => {
      const error = new Error('Network Error');
      (error as any).isAxiosError = true;

      mockedAxios.get.mockRejectedValue(error);

      await expect(service.login('test@example.com', 'password123')).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });
});

