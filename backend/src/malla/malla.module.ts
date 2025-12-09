// backend/src/malla/malla.module.ts

import { Module } from '@nestjs/common';
import { MallaController } from './malla.controller';
import { MallaService } from './malla.service';
import { OptimizacionService } from './optimizacion.service';
import { AvanceModule } from '../avance/avance.module';

@Module({
  imports: [AvanceModule],
  controllers: [MallaController],
  providers: [MallaService, OptimizacionService],
  exports: [MallaService, OptimizacionService]
})
export class MallaModule {}