import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class AvanceService{
    constructor(private readonly httpService: HttpService){}

    async obtenerAvance(rut: string, codCarrera: string): Promise<any[]>{    
        const url = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${rut}&codcarrera=${codCarrera}`;
        const response = await firstValueFrom(this.httpService.get(url));
        return response.data}
}