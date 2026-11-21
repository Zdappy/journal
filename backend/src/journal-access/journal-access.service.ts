import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Teacher } from '../teacher/teacher.model.js';
import { Student } from '../student/student.model.js';
import { Parent } from '../parent/parent.model.js';
import { ParentStudent } from '../parent-student/parent-student.model.js';
import { TeacherSubjectClass } from '../teacher-subject-class/teacher-subject-class.model.js';
import { Role } from '../common/enums/role.enum.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';
import { User } from '../user/user.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';

/**
 * Единая точка проверки прав на данные журнала.
 * Используется модулями оценок, пропусков и отчётов, чтобы правила
 * «учитель работает со своими предметами» и «родитель видит только своего
 * ребёнка» проверялись на сервере одинаково во всех маршрутах.
 */
@Injectable()
export class JournalAccessService {
  constructor(
    @InjectModel(Teacher) private readonly teacherModel: typeof Teacher,
    @InjectModel(Student) private readonly studentModel: typeof Student,
    @InjectModel(Parent) private readonly parentModel: typeof Parent,
    @InjectModel(ParentStudent) private readonly parentStudentModel: typeof ParentStudent,
    @InjectModel(TeacherSubjectClass)
    private readonly assignmentModel: typeof TeacherSubjectClass,
  ) {}

  // ---------- Профили по токену ----------

  async teacherIdOf(user: JwtPayload): Promise<number> {
    const teacher = await this.teacherModel.findOne({ where: { user_id: user.sub } });
    if (!teacher) {
      throw new NotFoundException('Профиль учителя для текущего пользователя не найден');
    }
    return teacher.id;
  }

  async studentIdOf(user: JwtPayload): Promise<number> {
    const student = await this.studentModel.findOne({ where: { user_id: user.sub } });
    if (!student) {
      throw new NotFoundException('Профиль ученика для текущего пользователя не найден');
    }
    return student.id;
  }

  async parentIdOf(user: JwtPayload): Promise<number> {
    const parent = await this.parentModel.findOne({ where: { user_id: user.sub } });
    if (!parent) {
      throw new NotFoundException('Профиль родителя для текущего пользователя не найден');
    }
    return parent.id;
  }

  // ---------- Учитель и назначения ----------

  /** Назначение по id. Если не найдено — 404 */
  async assignmentById(assignmentId: number): Promise<TeacherSubjectClass> {
    const assignment = await this.assignmentModel.findByPk(assignmentId);
    if (!assignment) {
      throw new NotFoundException(`Назначение с id=${assignmentId} не найдено`);
    }
    return assignment;
  }

  /** Учитель может работать только с назначениями, где teacher_id = его профиль */
  async assertTeacherOwnsAssignment(
    user: JwtPayload,
    assignmentId: number,
  ): Promise<TeacherSubjectClass> {
    const assignment = await this.assignmentById(assignmentId);
    const teacherId = await this.teacherIdOf(user);
    if (assignment.teacher_id !== teacherId) {
      throw new ForbiddenException(
        'Это назначение закреплено за другим учителем: изменять его журнал нельзя',
      );
    }
    return assignment;
  }

  /** Все id назначений учителя — для фильтрации списка оценок и пропусков */
  async teacherAssignmentIds(user: JwtPayload): Promise<number[]> {
    const teacherId = await this.teacherIdOf(user);
    const rows = await this.assignmentModel.findAll({
      where: { teacher_id: teacherId },
      attributes: ['id'],
    });
    return rows.map((row) => row.id);
  }

  // ---------- Ученик ----------

  async studentById(studentId: number): Promise<Student> {
    const student = await this.studentModel.findByPk(studentId);
    if (!student) {
      throw new NotFoundException(`Ученик с id=${studentId} не найден`);
    }
    return student;
  }
    async studentsByIds(ids: number[]): Promise<Student[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.studentModel.findAll({
      where: { id: ids },
      include: [
        { model: User, as: 'user', attributes: ['lastname', 'firstname', 'middlename'] },
        { model: SchoolClass, as: 'schoolClass', attributes: ['id', 'name', 'academic_year'] },
      ],
      order: [['id', 'ASC']],
    });
  }

  /** Ученик видит только себя. Про чужих данных не сообщаем (404, а не 403) */
  async assertCanViewStudent(user: JwtPayload, studentId: number): Promise<Student> {
    const student = await this.studentById(studentId);
    if (user.role === Role.Student) {
      const ownId = await this.studentIdOf(user);
      if (ownId !== studentId) {
        throw new NotFoundException(`Ученик с id=${studentId} не найден`);
      }
    }
    return student;
  }

  // ---------- Родитель и дети ----------

  /** Дети родителя (только свои — связь через parent_student) */
  async childrenIdsOf(user: JwtPayload): Promise<number[]> {
    const parentId = await this.parentIdOf(user);
    const links = await this.parentStudentModel.findAll({
      where: { parent_id: parentId },
      attributes: ['student_id'],
    });
    return links.map((link) => link.student_id);
  }

  async assertParentOfStudent(user: JwtPayload, studentId: number): Promise<void> {
    const childrenIds = await this.childrenIdsOf(user);
    if (!childrenIds.includes(studentId)) {
      throw new NotFoundException(`Ученик с id=${studentId} не найден`);
    }
  }

  /**
   * Какие ученики доступны пользователю:
   * Учитель — все, Ученик — только себя, Родитель — только своих детей.
   * Возвращает null, если ограничений нет (учитель).
   */
  async readableStudentIds(user: JwtPayload): Promise<number[] | null> {
    if (user.role === Role.Teacher) {
      return null;
    }
    if (user.role === Role.Student) {
      return [await this.studentIdOf(user)];
    }
    return this.childrenIdsOf(user);
  }

  /**
   * Проверка права читать журнал ученика.
   * Если studentId не передан: ученик получает себя, родитель должен указать ребёнка.
   */
  async resolveStudentId(user: JwtPayload, studentId?: number): Promise<number> {
    if (user.role === Role.Student) {
      const ownId = await this.studentIdOf(user);
      if (studentId !== undefined && studentId !== ownId) {
        throw new NotFoundException(`Ученик с id=${studentId} не найден`);
      }
      return ownId;
    }

    if (studentId === undefined) {
      throw new ForbiddenException('Укажите идентификатор ученика (student_id)');
    }

    if (user.role === Role.Parent) {
      await this.assertParentOfStudent(user, studentId);
    } else {
      await this.studentById(studentId);
    }
    return studentId;
  }
}