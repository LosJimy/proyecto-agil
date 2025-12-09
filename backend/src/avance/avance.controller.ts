import { Controller, Get, NotFoundException, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AvanceService } from "./avance.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags('avance')
@ApiBearerAuth()
@Controller('usuario')
export class AvanceController {
    constructor(private readonly avanceService: AvanceService){}

    @UseGuards(JwtAuthGuard)
    @Get('avance')
    async getAvance(@Req() req) {
        const {rut, carreras} = req.user;

        if (!carreras || carreras.length === 0) {
            throw new NotFoundException ('no hay carreras asociadas');
        }

        const ultimaCarrera = carreras.reduce((prev, curr) =>
            parseInt(curr.catalogo) > parseInt(prev.catalogo) ? curr : prev
        );


        console.log('Consultando avance para:', rut, ultimaCarrera.codigo);

        return this.avanceService.obtenerAvance(rut, ultimaCarrera.codigo);
    }
}