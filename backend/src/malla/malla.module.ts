import { Module } from "@nestjs/common";
import { MallaController } from "./malla.controller";
import { MallaService } from "./malla.service";


@Module({
    controllers: [MallaController],
    providers: [MallaService]
})

export class MallaModule {}