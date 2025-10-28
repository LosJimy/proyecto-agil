import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MallaService{
    async obtenerMalla(codigo: string, catalogo: string){
        const url = `https://losvilos.ucn.cl/hawaii/api/mallas/?${codigo}-${catalogo}`;

        try{
            const respuesta = await axios.get(url, {
                headers: {
                    'X-HAWAII-AUTH': 'jf400fejof13f'
                }
            });
            return respuesta.data
        } catch(error){
            if (error.response?.status == 401){
                throw new UnauthorizedException('No autorizado para acceder a la malla');
            } else if (error.response?.status == 404){
                throw new NotFoundException('No existe la pagina');
            }
            throw error;
        }
    }
}