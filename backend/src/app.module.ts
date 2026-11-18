import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

// Модули приложения
import { UserModule } from './user/user.module.js';
import { TeacherModule } from './teacher/teacher.module.js';
import { StudentModule } from './student/student.module.js';
import { ParentModule } from './parent/parent.module.js';
import { SchoolClassModule } from './school-class/school-class.module.js';
import { ParentStudentModule } from './parent-student/parent-student.module.js';
import { SubjectModule } from './subject/subject.module.js';
import { TeacherSubjectClassModule } from './teacher-subject-class/teacher-subject-class.module.js';
import { GradeModule } from './grade/grade.module.js';
import { AbsenceModule } from './absence/absence.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    // Загружает переменные из .env, ConfigService доступен везде
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // Подключение к PostgreSQL.
    // autoLoadModels: true — автоматически подключает все модели,
    // зарегистрированные в модулях через SequelizeModule.forFeature([...]).
    // synchronize: true — создаёт в БД таблицы, которых ещё нет.
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: config.get<'postgres'>('DB_DIALECT', 'postgres'),
        host: config.get<string>('DB_HOST'),
        port: Number(config.get('DB_PORT')),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadModels: true,
        synchronize: true,
        logging: false,
      }),
    }),

    UserModule,
    TeacherModule,
    StudentModule,
    ParentModule,
    SchoolClassModule,
    ParentStudentModule,
    SubjectModule,
    TeacherSubjectClassModule,
    GradeModule,
    AbsenceModule,
    AuthModule,
  ],
})
export class AppModule {}