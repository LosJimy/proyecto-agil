import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";

import { Strategy, ExtractJwt } from 'passport-jwt';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt'){
    constructor(configService: ConfigService){
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET')!,
        });
    }

    async validate(payload: any){
        return{
            rut: payload.rut,
            carreras: payload.carreras
        };
    }
}