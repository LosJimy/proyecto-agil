//backend/src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}

    @Post('login')
    async login(@Body() loginDto: LoginDto){
        const { email, password } = loginDto;
        const respuesta = await this.authService.login(email,password);
        return await this.authService.login(email, password);
    }

}
