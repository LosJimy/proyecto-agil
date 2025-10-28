# Backend - Malla UCN

Este backend de NestJs permite consultar la malla academica de un usuario, utilizando JWT y un endpoint protegido por header. Además permite crear proyecciones e igualmente proyecciones a futuro

## Tecnologías

-NestJs
-JWT
-Axios
-Docker (implementando)
-dotenv

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Autenticación 

- Estrategia JWT con 'passport-jwt'
- Token requerido en 'Authorization: Bearer <token>'
- Payload debe incluir 'rut' y 'carreras'

## Endpoint principal

```http
Post /auth/login
```

## Endpoint malla

```http
Get /usuario/malla
```







## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
