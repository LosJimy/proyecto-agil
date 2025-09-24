import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MallaService{
    async obtenerMalla(codigo: string, catalogo: string){
        try{
            const url = 'https://losvilos.ucn.cl/hawaii/api/mallas/${codigo}-${catalogo}';
            const respuesta = await axios.get(url);
            return respuesta.data;
        } catch (error){
            console.error('Error al obtener malla:', error.message);
            throw new InternalServerErrorException('No se pudo obtener la malla');
        }
    }
}