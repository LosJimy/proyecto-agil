import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import axios from 'axios';

export interface AvanceItem{
    nrc: number;
    period: number;
    student: string;
    course: string;
    excluded: boolean;
    inscriptionType: string;
    status: string;
}

@Injectable()
export class AvanceService{
    async obtenerAvance(rut: string, codCarrera: string): Promise<AvanceItem[]> {
        const url = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${rut}&codcarrera=${codCarrera}`;
        
        try {
            const respuesta = await axios.get<AvanceItem[]>(url, {
                headers: {
                    'X-HAWAII-AUTH': 'jf400fejof13f',
                },
            });

            return respuesta.data;
        } catch (error: any){
            if(error.response?.status === 401){
                throw new UnauthorizedException('No autorizado para acceder el avance');
            } else if (error.response?.status === 404){
                throw new NotFoundException('No existe el recurso de avance');
            }
            throw error;
        }
    }
}