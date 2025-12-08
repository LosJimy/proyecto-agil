//backend/src/auth/dto/login.dto.ts
import { IsEmail, IsString, MinLength  } from "class-validator";

export class LoginDto{
    @IsEmail({}, { message: 'el email no es valido'})
    email: string;

    @IsString({ message: 'La contrasena debe ser un texto'})
    @MinLength(4, {message: 'La contrasena debe tener minimo 4 caracteres'})
    password:string;
}