// backend/src/proyecciones/dto/crear-proyeccion.dto.ts
import { IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RamoDto {
  @IsString()
  codigo: string;

  @IsString()
  asignatura: string;

  @IsNumber()
  creditos: number;

  @IsNumber()
  nivel: number;

  @IsString()
  razon?: string;
}

export class SemestreDto {
  @IsNumber()
  numero: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RamoDto)
  ramos: RamoDto[];

  @IsNumber()
  totalCreditos: number;
}

export class CrearProyeccionDto {
  @IsString()
  nombre: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SemestreDto)
  semestres: SemestreDto[];

  @IsNumber()
  totalSemestres: number;

  @IsNumber()
  totalCreditos: number;
}