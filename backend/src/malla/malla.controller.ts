import { Controller, Get, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { MallaService } from './malla.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('usuario')
@ApiBearerAuth()
@Controller('usuario')
export class MallaController{
    constructor(private readonly mallaService: MallaService){}

    @UseGuards(JwtAuthGuard)
    @Get('malla')
    @ApiResponse({ status: 200, description: 'Malla obtenida correctamente.' })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    async obtenerMalla(@Request() req){
        const { carreras } = req.user;

        if(!carreras || carreras.lenght == 0){
            throw new NotFoundException('No hay carreras asociadas');
        }

        const ultimaCarrera = carreras.reduce((prev, curr) => parseInt(curr.catalogo) > parseInt(prev.catalogo) ? curr : prev);
    
        console.log('Consultando malla para:', ultimaCarrera.codigo, ultimaCarrera.catalogo);

        return this.mallaService.obtenerMalla(
            ultimaCarrera.codigo,
            ultimaCarrera.catalogo
        );
    }
}



