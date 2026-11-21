// Проверка полноты проекта: node scripts/check-files.mjs
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const EXPECTED = `
src/app.module.ts
src/main.ts
src/common/enums/role.enum.ts
src/common/enums/grade-type.enum.ts
src/common/enums/absence-type.enum.ts
src/common/filters/sequelize-exception.filter.ts
src/user/user.model.ts
src/user/user.module.ts
src/user/user.service.ts
src/teacher/teacher.model.ts
src/teacher/teacher.module.ts
src/teacher/teacher.service.ts
src/student/student.model.ts
src/student/student.module.ts
src/student/student.service.ts
src/student/student.controller.ts
src/student/dto/student-query.dto.ts
src/student/dto/update-student.dto.ts
src/parent/parent.model.ts
src/parent/parent.module.ts
src/parent/parent.service.ts
src/parent/parent.controller.ts
src/parent/dto/parent-query.dto.ts
src/school-class/school-class.model.ts
src/school-class/school-class.module.ts
src/school-class/school-class.service.ts
src/school-class/school-class.controller.ts
src/school-class/dto/create-school-class.dto.ts
src/school-class/dto/update-school-class.dto.ts
src/school-class/dto/school-class-query.dto.ts
src/parent-student/parent-student.model.ts
src/parent-student/parent-student.module.ts
src/parent-student/parent-student.service.ts
src/parent-student/parent-student.controller.ts
src/parent-student/dto/create-link.dto.ts
src/parent-student/dto/link-query.dto.ts
src/subject/subject.model.ts
src/subject/subject.module.ts
src/subject/subject.service.ts
src/subject/subject.controller.ts
src/subject/dto/create-subject.dto.ts
src/subject/dto/update-subject.dto.ts
src/subject/dto/subject-query.dto.ts
src/teacher-subject-class/teacher-subject-class.model.ts
src/teacher-subject-class/teacher-subject-class.module.ts
src/teacher-subject-class/teacher-subject-class.service.ts
src/teacher-subject-class/teacher-subject-class.controller.ts
src/teacher-subject-class/dto/create-assignment.dto.ts
src/teacher-subject-class/dto/assignment-query.dto.ts
src/grade/grade.model.ts
src/grade/grade.module.ts
src/grade/grade.service.ts
src/grade/grade.controller.ts
src/grade/dto/create-grade.dto.ts
src/grade/dto/update-grade.dto.ts
src/grade/dto/grade-query.dto.ts
src/grade/dto/average-query.dto.ts
src/absence/absence.model.ts
src/absence/absence.module.ts
src/absence/absence.service.ts
src/absence/absence.controller.ts
src/absence/dto/create-absence.dto.ts
src/absence/dto/update-absence.dto.ts
src/absence/dto/absence-query.dto.ts
src/auth/auth.module.ts
src/auth/auth.service.ts
src/auth/auth.controller.ts
src/auth/interfaces/jwt-payload.interface.ts
src/auth/dto/register.dto.ts
src/auth/dto/login.dto.ts
src/auth/dto/create-user.dto.ts
src/auth/guards/auth.guard.ts
src/auth/guards/roles.guard.ts
src/auth/decorators/roles.decorator.ts
src/auth/decorators/current-user.decorator.ts
src/journal-access/journal-access.module.ts
src/journal-access/journal-access.service.ts
src/report/report.module.ts
src/report/report.service.ts
src/report/report.controller.ts
src/import/import.module.ts
src/import/import.service.ts
src/import/import.controller.ts
src/import/dto/import-query.dto.ts
src/import/dto/import-result.dto.ts
database/seed.sql
scripts/build-postman.mjs
`
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, result = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, result);
    else if (entry.name.endsWith('.ts')) result.push(full);
  }
  return result;
}

const missing = [];
for (const file of EXPECTED) {
  if (!(await exists(file))) missing.push(file);
}

console.log(`Ожидалось файлов: ${EXPECTED.length}`);
console.log(`Отсутствует: ${missing.length}`);
missing.forEach((f) => console.log('  НЕТ: ' + f));

// Поиск типичных ошибок во всех .ts файлах
const files = await walk('src');
const problems = [];

for (const file of files) {
  const text = await readFile(file, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const where = `${file}:${i + 1}`;
    // 1. Относительный импорт без расширения .js
    const imp = /from\s+'(\.[^']*)'/.exec(line);
    if (imp && !imp[1].endsWith('.js')) {
      problems.push(`${where}  импорт без .js → ${imp[1]}`);
    }
    // 2. Spread на DTO (ругается линтер)
    if (/\{\s*\.\.\.dto/.test(line)) {
      problems.push(`${where}  spread DTO → ${line.trim()}`);
    }
    // 3. Заглушка типа в sequelize.query
    if (line.includes('as never')) {
      problems.push(`${where}  as never → нужно QueryTypes.SELECT`);
    }
  });
}

console.log(`\nПроверено .ts файлов: ${files.length}`);
console.log(`Найдено проблем: ${problems.length}`);
problems.forEach((p) => console.log('  ' + p));