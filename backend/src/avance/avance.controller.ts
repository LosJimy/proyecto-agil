import { Controller, Query, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AvanceService } from "./avance.service";

@ApiTags('avance')
@ApiBearerAuth()
@Controller('avance')
export class AvanceController {
    constructor(private readonly avanceService: AvanceService){}

    @Get()
    @ApiQuery({ name: 'rut', required: true})
    @ApiQuery({ name: 'codCarrera', required: true})
    async getAvance(
        @Query('rut') rut: string,
        @Query('codCarrera') codCarrera: string
    ) {
        return this.avanceService.obtenerAvance(rut, codCarrera);
    }
}