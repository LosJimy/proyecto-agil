import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { MallaService } from './malla.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('usuario')
export class MallaController{
    constructor(private readonly mallaService: MallaService){}
}

@Controller('malla')
export class MallaController {
    constructor(private readonly mallaService: MallaService) {}

    @Get(':codigo/:catalogo')
    async obtenerMalla(
        @Param('codigo') codigo: string,
        @Param('catalogo') catalogo: string
    ){
        return await this.mallaService.obtenerMalla(codigo, catalogo);
    }
}



