import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Teacher } from './teacher.model.js';
import { TeacherService } from './teacher.service.js';

@Module({
  imports: [SequelizeModule.forFeature([Teacher])],
  providers: [TeacherService],
  exports: [TeacherService], // нужен модулю прав доступа
})
export class TeacherModule {}