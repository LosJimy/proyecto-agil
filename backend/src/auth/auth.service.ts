//backend/src/auth/auth.service.ts
import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

function isAxiosError(error: any): boolean{
    return error?.isAxiosError == true;
};

interface LoginResponse{
    error?: string;
    rut?: string;
    carreras?: {
        codigo: string;
        nombre: string;
        catalogo: string;
    }[];
};

@Injectable()
export class AuthService {
    constructor(private configService: ConfigService){}

    async login(email: string, password:string): Promise<{token: string; rut: string; carreras: any[]}> {
        try{
            const respuesta = await axios.get<LoginResponse>('https://puclaro.ucn.cl/eross/avance/login.php',{
                params:{
                    email,
                    password
                },
            });
            console.log('Respuesta cruda:', respuesta.data);
            const data = respuesta.data;

            if (data.error){
                throw new UnauthorizedException('Credenciales incorrectas');
            }

            const jwtSecret = this.configService.get<string>('JWT_SECRET');
            if(!jwtSecret){
                throw new InternalServerErrorException('JWT_SECRET no está definido en el archivo .env');
            }
            
            const payload = { email };
            const token = jwt.sign(payload, jwtSecret, {expiresIn: '1h'});

            return{
                token,
                rut: data.rut ?? '',
                carreras: data.carreras ?? []
            };
        } catch (error) {
            console.error('Error recibido:', error.response?.data || error.message);
            if(error instanceof UnauthorizedException || error instanceof InternalServerErrorException){
                throw error;
            }

            if(isAxiosError(error)){
                console.error('Error al conectar con puclaro', error.response?.data || error.message);
            }

            throw new InternalServerErrorException('Error al validar credenciales');
        }
    }
}
