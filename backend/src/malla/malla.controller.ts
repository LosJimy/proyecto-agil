import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { MallaService } from './malla.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('usuario')
export class MallaController{
    constructor(private readonly mallaService: MallaService){}
}




