import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

@Injectable()
export class AuthService {
    constructor(private configService: ConfigService){}

    async login(email: string, password:string): Promise<string> {
        try{
            const respuesta = await axios.get('https://puclaro.ucn.cl/eross/avance/login.php',{
                params:{
                    email,
                    password
                },
            });

            const data = respuesta.data;

            if (data.error){
                throw new Error('Credenciales incorrectas;')
            }

            const jwtSecret = this.configService.get<string>('JWT_SECRET');
            if(!jwtSecret){
                throw new Error('JWT_SECRET no está definido en el archivo .env');
            }
            
            const payload = { email };
            return jwt.sign(payload,jwtSecret,{ expiresIn: '1h' });
        } catch (error){
            throw new Error('Error al validar credenciales: ' + error.message);
        }
    }
}
