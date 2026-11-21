import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import {
  BaseError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} from 'sequelize';

/**
 * Фильтр превращает ошибки Sequelize в понятные HTTP-ответы.
 * Без него любая ошибка БД уходит клиенту как 500 Internal server error
 * (а в тексте ошибки могут быть имена таблиц и фрагменты SQL).
 */
@Catch(BaseError)
export class SequelizeExceptionFilter implements ExceptionFilter {
  catch(exception: BaseError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Ошибка при работе с базой данных';

    // ВНИМАНИЕ: UniqueConstraintError — наследник ValidationError,
    // поэтому он обязательно проверяется ПЕРВЫМ
    if (exception instanceof UniqueConstraintError) {
      status = HttpStatus.CONFLICT;
      message = this.uniqueMessage(exception);
    } else if (exception instanceof ForeignKeyConstraintError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Связанная запись не найдена или используется в других таблицах';
    } else if (exception instanceof ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.errors.map((e) => e.message);
    } else {
      // Неизвестную ошибку пишем в консоль сервера, клиенту подробности не отправляем
      console.error(exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.name,
    });
  }

  /**
   * Подбирает понятное сообщение под конкретное ограничение нашей схемы.
   * Имя нарушенного ограничения PostgreSQL приходит в поле constraint,
   * названия полей — в свойстве fields.
   */
  private uniqueMessage(exception: UniqueConstraintError): string {
    const parent = exception.parent as unknown as { constraint?: string } | undefined;
    const target = `${parent?.constraint ?? ''} ${Object.keys(exception.fields ?? {}).join(' ')}`;

    if (target.includes('username')) {
      return 'Пользователь с таким логином уже существует';
    }
    if (target.includes('user_id')) {
      return 'Профиль для этого пользователя уже создан';
    }
    // Пропуск: уникальность (student_id, assignment_id, lesson_date)
    if (target.includes('absence')) {
      return 'На эту дату у ученика уже отмечен пропуск по данному предмету';
    }
    if (target.includes('parent_id') && target.includes('student_id')) {
      return 'Этот родитель уже привязан к данному ученику';
    }
    if (target.includes('teacher_id') && target.includes('subject_id')) {
      return 'Этот учитель уже ведёт данный предмет в этом классе';
    }
    if (target.includes('academic_year')) {
      return 'Класс с таким названием уже существует в этом учебном году';
    }
    if (target.includes('subject') && target.includes('name')) {
      return 'Предмет с таким названием уже существует';
    }
    if (target.includes('name')) {
      return 'Запись с таким названием уже существует';
    }
    return 'Запись с такими данными уже существует';
  }
}