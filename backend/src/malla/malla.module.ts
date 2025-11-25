// backend/src/malla/malla.module.ts
import { Module } from '@nestjs/common';
import { MallaController } from './malla.controller';
import { MallaService } from './malla.service';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { AvanceModule } from 'src/avance/avance.module';

@Module({
  imports: [Neo4jModule, AvanceModule],
  controllers: [MallaController],
  providers: [MallaService],
  exports: [MallaService]
})
export class MallaModule {}