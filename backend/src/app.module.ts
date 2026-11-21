import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

// Учётные записи и профили ролей
import { UserModule } from './user/user.module.js';
import { TeacherModule } from './teacher/teacher.module.js';
import { StudentModule } from './student/student.module.js';
import { ParentModule } from './parent/parent.module.js';

// Справочники и связи
import { SchoolClassModule } from './school-class/school-class.module.js';
import { ParentStudentModule } from './parent-student/parent-student.module.js';
import { SubjectModule } from './subject/subject.module.js';
import { TeacherSubjectClassModule } from './teacher-subject-class/teacher-subject-class.module.js';

// Журнал
import { GradeModule } from './grade/grade.module.js';
import { AbsenceModule } from './absence/absence.module.js';

// Аутентификация, права доступа и отчёты
import { AuthModule } from './auth/auth.module.js';
import { JournalAccessModule } from './journal-access/journal-access.module.js';
import { ReportModule } from './report/report.module.js';

@Module({
  imports: [
    // Загружает переменные из файла .env.
    // isGlobal: true — ConfigService доступен во всех модулях без повторного импорта
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // Подключение к PostgreSQL.
    // autoLoadModels: true — автоматически подключает все модели,
    //   зарегистрированные в модулях через SequelizeModule.forFeature([...]).
    // synchronize: true — создаёт в БД таблицы, которых ещё нет
    //   (существующие таблицы не изменяются, данные не теряются).
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
        logging: false, // true — выводить каждый SQL-запрос в консоль (для отладки)
      }),
    }),

    // Учётные записи и профили ролей
    UserModule,
    TeacherModule,
    StudentModule,
    ParentModule,

    // Справочники и связи
    SchoolClassModule,
    ParentStudentModule,
    SubjectModule,
    TeacherSubjectClassModule,

    // Журнал: оценки и пропуски
    GradeModule,
    AbsenceModule,

    // Аутентификация, права доступа к данным журнала, отчёты для родителей
    AuthModule,
    JournalAccessModule,
    ReportModule,
  ],
})
export class AppModule {}