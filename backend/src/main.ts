import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { SequelizeExceptionFilter } from './common/filters/sequelize-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Все маршруты приложения начинаются с /api
  app.setGlobalPrefix('api');

  // Разрешаем запросы с клиентской части (Vue на порту 5173)
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });

  // Глобальная валидация всех входящих данных по правилам DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // удалять свойства, которых нет в DTO
      forbidNonWhitelisted: true, // ошибка 400, если прислали лишнее поле
      transform: true,            // преобразовывать строки в числа и т.д.
    }),
  );

  // Превращаем ошибки базы данных в понятные ответы 409 / 400
  app.useGlobalFilters(new SequelizeExceptionFilter());

  // Настройка Swagger UI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Электронный журнал API')
    .setDescription('REST API серверной части курсового проекта «Электронный журнал»')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Аутентификация', 'Регистрация и вход')
    .addTag('Ученики', 'Список учеников, перевод между классами')
    .addTag('Родители', 'Список родителей')
    .addTag('Родители и дети', 'Привязка родителей к ученикам')
    .addTag('Классы', 'Школьные классы')
    .addTag('Предметы', 'Учебные предметы')
    .addTag('Назначения', 'Какой учитель какой предмет в каком классе ведёт')
    .addTag('Оценки', 'Журнал оценок и средний балл')
    .addTag('Пропуски', 'Журнал пропусков')
    .addTag('Отчёты', 'Отчёт об успеваемости для родителей')
    .addTag('Импорт', 'Загрузка оценок из таблицы Excel')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, documentFactory);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server running: http://localhost:${port}/api`);
  console.log(`📚 Swagger UI:    http://localhost:${port}/api/docs`);
}
await bootstrap();