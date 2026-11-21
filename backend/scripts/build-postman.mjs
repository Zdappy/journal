// =====================================================================
// Генератор коллекции Postman для проекта «Электронный журнал».
// Запуск: node scripts/build-postman.mjs
// Результат: postman/electronic-journal.postman_collection.json
//
// ВАЖНО: перед прогоном выполнить database/seed.sql — все автотесты
// рассчитаны на эталонный набор тестовых данных.
// =====================================================================
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = '{{baseUrl}}';

// Короткие помощники для автотестов
const st = (code) => `pm.test('Статус ${code}', () => pm.response.to.have.status(${code}));`;
const J = 'const json = pm.response.json();';

/**
 * Сборка одного запроса.
 * auth: 'teacherToken' — наследует авторизацию коллекции;
 *       имя другой переменной — свой Bearer-токен;
 *       null — запрос без авторизации.
 * rawBody — тело «как есть» (нужно, когда значение подставляется без кавычек).
 */
function req(name, method, path, o = {}) {
  const { query, body, rawBody, tests = [], auth = 'teacherToken', pre } = o;

  const url = {
    raw:
      BASE + path + (query?.length ? '?' + query.map((q) => `${q.key}=${q.value}`).join('&') : ''),
    host: [BASE],
    path: path.split('/').filter(Boolean),
  };
  if (query?.length) url.query = query;

  const request = { method, header: [], url };

  if (rawBody !== undefined || body !== undefined) {
    request.header = [{ key: 'Content-Type', value: 'application/json' }];
    request.body = {
      mode: 'raw',
      raw: rawBody ?? JSON.stringify(body, null, 2),
      options: { raw: { language: 'json' } },
    };
  }

  if (auth === null) {
    request.auth = { type: 'noauth' };
  } else if (auth !== 'teacherToken') {
    request.auth = {
      type: 'bearer',
      bearer: [{ key: 'token', value: `{{${auth}}}`, type: 'string' }],
    };
  }

  const event = [];
  if (pre) event.push({ listen: 'prerequest', script: { type: 'text/javascript', exec: pre } });
  if (tests.length) event.push({ listen: 'test', script: { type: 'text/javascript', exec: tests } });

  return { name, event, request };
}

/** Запрос входа: сохраняет токен в переменную коллекции */
const login = (name, username, varName) =>
  req(name, 'POST', '/auth/login', {
    auth: null,
    body: { username, password: '123456' },
    tests: [
      st(200),
      J,
      "pm.test('Выдан токен', () => pm.expect(json.access_token).to.be.a('string'));",
      `pm.collectionVariables.set('${varName}', json.access_token);`,
    ],
  });

const folders = [
  // ===================================================================
  {
    name: '1. Аутентификация',
    item: [
      login('Вход — учитель Иванов', 'teacher1', 'teacherToken'),
      login('Вход — учитель Смирнова', 'teacher2', 'teacher2Token'),
      login('Вход — ученик Петров', 'student1', 'studentToken'),
      login('Вход — родитель Петров', 'parent1', 'parentToken'),
      login('Вход — родитель Сидорова', 'parent2', 'parent2Token'),

      req('Регистрация родителя', 'POST', '/auth/register', {
        auth: null,
        body: {
          username: 'parent_test',
          password: '123456',
          lastname: 'Тестовая',
          firstname: 'Мама',
          phone: '+7-900-000-00-00',
        },
        tests: [
          "pm.test('Создан или уже существует', () => pm.expect([201, 409]).to.include(pm.response.code));",
          J,
          "pm.test('Пароль не возвращается', () => pm.expect(json).to.not.have.property('password'));",
        ],
      }),

      req('Регистрация с подменой роли — 400', 'POST', '/auth/register', {
        auth: null,
        body: { username: 'hacker1', password: '123456', lastname: 'Х', firstname: 'Х', role: 'Учитель' },
        tests: [
          st(400),
          J,
          "pm.test('Роль отклонена', () => pm.expect(JSON.stringify(json.message)).to.include('should not exist'));",
        ],
      }),

      req('Профиль учителя', 'GET', '/auth/profile', {
        tests: [
          st(200),
          J,
          "pm.test('Роль Учитель', () => pm.expect(json.role).to.eql('Учитель'));",
          "pm.test('Есть профиль учителя', () => pm.expect(json.teacher).to.be.an('object'));",
          "pm.test('Пароль скрыт', () => pm.expect(json).to.not.have.property('password'));",
        ],
      }),

      req('Профиль родителя', 'GET', '/auth/profile', {
        auth: 'parentToken',
        tests: [
          st(200),
          J,
          "pm.test('Роль Родитель', () => pm.expect(json.role).to.eql('Родитель'));",
          "pm.test('Есть профиль родителя', () => pm.expect(json.parent).to.be.an('object'));",
        ],
      }),

      req('Создание ученика учителем', 'POST', '/auth/users', {
        body: {
          username: 'student_test',
          password: '123456',
          role: 'Ученик',
          lastname: 'Тестовый',
          firstname: 'Ученик',
          class_id: 2,
        },
        tests: ["pm.test('Создан или уже существует', () => pm.expect([201, 409]).to.include(pm.response.code));"],
      }),

      req('Создание ученика без класса — 400', 'POST', '/auth/users', {
        body: { username: 'student_bad', password: '123456', role: 'Ученик', lastname: 'Х', firstname: 'Х' },
        tests: [st(400)],
      }),
    ],
  },

  // ===================================================================
  {
    name: '2. Предметы',
    item: [
      req('Список предметов', 'GET', '/subjects', {
        auth: null,
        tests: [
          st(200),
          J,
          "pm.test('Есть items и total', () => { pm.expect(json).to.have.property('items'); pm.expect(json.total).to.be.at.least(6); });",
          "pm.test('items — массив', () => pm.expect(json.items).to.be.an('array'));",
        ],
      }),

      req('Поиск без учёта регистра', 'GET', '/subjects', {
        auth: null,
        query: [{ key: 'search', value: 'мат' }],
        tests: [
          st(200),
          J,
          "pm.test('Найдена Математика', () => pm.expect(json.items.some((i) => i.name === 'Математика')).to.be.true);",
        ],
      }),

      req('Сортировка по названию', 'GET', '/subjects', {
        auth: null,
        query: [
          { key: 'sort', value: 'name_asc' },
          { key: 'limit', value: '50' },
        ],
        tests: [
          st(200),
          J,
          'const names = json.items.map((i) => i.name);',
          "pm.test('Отсортировано по алфавиту', () => pm.expect(names).to.eql(names.slice().sort((a, b) => a.localeCompare(b, 'ru'))));",
        ],
      }),

      req('Страница 2 по 3 записи', 'GET', '/subjects', {
        auth: null,
        query: [
          { key: 'page', value: '2' },
          { key: 'limit', value: '3' },
        ],
        tests: [
          st(200),
          J,
          "pm.test('Страница 2', () => pm.expect(json.page).to.eql(2));",
          "pm.test('Не более 3 записей', () => pm.expect(json.items.length).to.be.at.most(3));",
        ],
      }),

      req('Добавление предмета', 'POST', '/subjects', {
        pre: ["pm.collectionVariables.set('subjectName', 'Автотест ' + Date.now());"],
        body: { name: '{{subjectName}}', description: 'Создан автотестом' },
        tests: [
          st(201),
          J,
          "pm.test('Присвоен id', () => pm.expect(json.id).to.be.a('number'));",
          "pm.collectionVariables.set('subjectId', json.id);",
        ],
      }),

      req('Получение созданного предмета', 'GET', '/subjects/{{subjectId}}', {
        auth: null,
        tests: [
          st(200),
          J,
          "pm.test('Название совпадает', () => pm.expect(json.name).to.eql(pm.collectionVariables.get('subjectName')));",
        ],
      }),

      req('Изменение предмета', 'PATCH', '/subjects/{{subjectId}}', {
        body: { description: 'Обновлено автотестом' },
        tests: [
          st(200),
          J,
          "pm.test('Описание обновилось', () => pm.expect(json.description).to.eql('Обновлено автотестом'));",
        ],
      }),

      req('Дубликат названия — 409', 'POST', '/subjects', {
        body: { name: 'Математика' },
        tests: [
          st(409),
          J,
          "pm.test('Сообщение фильтра Sequelize', () => pm.expect(json.message).to.eql('Предмет с таким названием уже существует'));",
        ],
      }),

      req('Удаление предмета', 'DELETE', '/subjects/{{subjectId}}', {
        tests: [
          st(200),
          J,
          "pm.test('Сообщение об удалении', () => pm.expect(json.message).to.include('удалён'));",
        ],
      }),
    ],
  },

  // ===================================================================
  {
    name: '3. Классы',
    item: [
      req('Список классов', 'GET', '/classes', {
        auth: null,
        tests: [
          st(200),
          J,
          "pm.test('Не менее 3 классов', () => pm.expect(json.total).to.be.at.least(3));",
        ],
      }),

      req('Фильтр по учебному году', 'GET', '/classes', {
        auth: null,
        query: [{ key: 'academic_year', value: '2026' }],
        tests: [
          st(200),
          J,
          "pm.test('Все классы 2026 года', () => json.items.forEach((i) => pm.expect(i.academic_year).to.eql(2026)));",
        ],
      }),

      req('Класс 1: руководитель и ученики', 'GET', '/classes/1', {
        auth: null,
        tests: [
          st(200),
          J,
          "pm.test('Руководитель Иванов', () => pm.expect(json.homeroomTeacher.user.lastname).to.eql('Иванов'));",
          "pm.test('Двое учеников', () => pm.expect(json.students).to.have.lengthOf(2));",
        ],
      }),

      req('Добавление класса', 'POST', '/classes', {
        pre: ["pm.collectionVariables.set('classYear', String(2030 + (Date.now() % 70)));"],
        // Год подставляется БЕЗ кавычек, иначе DTO получит строку и вернёт 400
        rawBody: '{\n  "name": "9А",\n  "academic_year": {{classYear}}\n}',
        tests: [st(201), J, "pm.collectionVariables.set('classId', json.id);"],
      }),

      req('Назначение классного руководителя', 'PATCH', '/classes/{{classId}}', {
        body: { homeroom_teacher_id: 1 },
        tests: [
          st(200),
          J,
          "pm.test('ФИО подтянулись (include)', () => pm.expect(json.homeroomTeacher.user.lastname).to.eql('Иванов'));",
        ],
      }),

      req('Дубликат класса в том же году — 409', 'POST', '/classes', {
        body: { name: '5А', academic_year: 2026 },
        tests: [
          st(409),
          J,
          "pm.test('Сообщение про учебный год', () => pm.expect(json.message).to.include('учебном году'));",
        ],
      }),

      req('Неверный формат названия — 400', 'POST', '/classes', {
        body: { name: '5а', academic_year: 2026 },
        tests: [st(400)],
      }),

      req('Удаление класса с учениками — 409', 'DELETE', '/classes/1', {
        tests: [
          st(409),
          J,
          "pm.test('Сообщение про учеников', () => pm.expect(json.message).to.include('ученик'));",
        ],
      }),

      req('Удаление созданного класса', 'DELETE', '/classes/{{classId}}', {
        tests: [st(200)],
      }),
    ],
  },

  // ===================================================================
  {
    name: '4. Назначения',
    item: [
      req('Мои назначения (Иванов)', 'GET', '/assignments/my', {
        tests: [
          st(200),
          J,
          "pm.test('Три назначения', () => pm.expect(json).to.have.lengthOf(3));",
        ],
      }),

      req('Мои назначения (Смирнова)', 'GET', '/assignments/my', {
        auth: 'teacher2Token',
        tests: [
          st(200),
          J,
          "pm.test('Два назначения', () => pm.expect(json).to.have.lengthOf(2));",
        ],
      }),

      req('Мои назначения под учеником — 403', 'GET', '/assignments/my', {
        auth: 'studentToken',
        tests: [st(403)],
      }),

      req('Список назначений', 'GET', '/assignments', {
        tests: [
          st(200),
          J,
          "pm.test('Пять назначений', () => pm.expect(json.total).to.eql(5));",
          "pm.test('Подтянуты предмет и класс', () => { pm.expect(json.items[0].subject).to.be.an('object'); pm.expect(json.items[0].schoolClass).to.be.an('object'); });",
        ],
      }),

      req('Фильтр по классу 5А', 'GET', '/assignments', {
        query: [{ key: 'class_id', value: '1' }],
        tests: [
          st(200),
          J,
          "pm.test('Три назначения класса 5А', () => pm.expect(json.total).to.eql(3));",
        ],
      }),

      req('Создание назначения', 'POST', '/assignments', {
        body: { teacher_id: 1, subject_id: 3, class_id: 1 },
        tests: [st(201), J, "pm.collectionVariables.set('assignmentId', json.id);"],
      }),

      req('Дубликат назначения — 409', 'POST', '/assignments', {
        body: { teacher_id: 1, subject_id: 1, class_id: 1 },
        tests: [
          st(409),
          J,
          "pm.test('Сообщение фильтра', () => pm.expect(json.message).to.include('уже ведёт'));",
        ],
      }),

      req('Несуществующий предмет — 404', 'POST', '/assignments', {
        body: { teacher_id: 1, subject_id: 9999, class_id: 1 },
        tests: [st(404)],
      }),

      req('Удаление назначения с журналом — 409', 'DELETE', '/assignments/1', {
        tests: [st(409)],
      }),

      req('Удаление созданного назначения', 'DELETE', '/assignments/{{assignmentId}}', {
        tests: [st(200)],
      }),
    ],
  },

  // ===================================================================
  {
    name: '5. Ученики',
    item: [
      req('Список учеников', 'GET', '/students', {
        tests: [
          st(200),
          J,
          "pm.test('Не менее 3 учеников', () => pm.expect(json.total).to.be.at.least(3));",
          "pm.test('Есть ФИО и класс', () => { pm.expect(json.items[0].user).to.be.an('object'); pm.expect(json.items[0].schoolClass).to.be.an('object'); });",
        ],
      }),

      req('Поиск по фамилии', 'GET', '/students', {
        query: [{ key: 'search', value: 'петров' }],
        tests: [
          st(200),
          J,
          "pm.test('Найдены Петровы', () => pm.expect(json.total).to.be.at.least(2));",
        ],
      }),

      req('Фильтр по классу 5А', 'GET', '/students', {
        query: [{ key: 'class_id', value: '1' }],
        tests: [
          st(200),
          J,
          "pm.test('Двое в 5А', () => pm.expect(json.total).to.eql(2));",
        ],
      }),

      req('Список под родителем — 403', 'GET', '/students', {
        auth: 'parentToken',
        tests: [st(403)],
      }),

      req('Ученик 1 под учителем', 'GET', '/students/1', {
        tests: [
          st(200),
          J,
          "pm.test('Петров', () => pm.expect(json.user.lastname).to.eql('Петров'));",
        ],
      }),

      req('Ученик смотрит себя', 'GET', '/students/1', {
        auth: 'studentToken',
        tests: [st(200)],
      }),

      req('Ученик смотрит чужого — 404', 'GET', '/students/3', {
        auth: 'studentToken',
        tests: [st(404)],
      }),

      req('Перевод в 6Б', 'PATCH', '/students/1', {
        body: { class_id: 2 },
        tests: [
          st(200),
          J,
          "pm.test('Класс изменён', () => pm.expect(json.class_id).to.eql(2));",
        ],
      }),

      req('Возврат в 5А', 'PATCH', '/students/1', {
        body: { class_id: 1 },
        tests: [
          st(200),
          J,
          "pm.test('Класс возвращён', () => pm.expect(json.class_id).to.eql(1));",
        ],
      }),

      req('Перевод в несуществующий класс — 404', 'PATCH', '/students/1', {
        body: { class_id: 9999 },
        tests: [st(404)],
      }),

      req('Удаление ученика с оценками — 409', 'DELETE', '/students/1', {
        tests: [
          st(409),
          J,
          "pm.test('Сообщение про оценки', () => pm.expect(json.message).to.include('оценки'));",
        ],
      }),
    ],
  },

  // ===================================================================
  {
    name: '6. Родители и дети',
    item: [
      req('Список родителей', 'GET', '/parents', {
        tests: [
          st(200),
          J,
          "pm.test('Не менее 2 родителей', () => pm.expect(json.total).to.be.at.least(2));",
        ],
      }),

      req('Родитель 1 с детьми', 'GET', '/parents/1', {
        tests: [
          st(200),
          J,
          "pm.test('Двое детей', () => pm.expect(json.children).to.have.lengthOf(2));",
        ],
      }),

      req('Мои дети (родитель Петров)', 'GET', '/parent-student/my-children', {
        auth: 'parentToken',
        tests: [
          st(200),
          J,
          "pm.test('Двое детей', () => pm.expect(json).to.have.lengthOf(2));",
        ],
      }),

      req('Мои дети под учителем — 403', 'GET', '/parent-student/my-children', {
        tests: [st(403)],
      }),

      req('Список связей', 'GET', '/parent-student', {
        tests: [
          st(200),
          J,
          "pm.test('Три связи', () => pm.expect(json).to.have.lengthOf(3));",
        ],
      }),

      req('Привязка родителя 2 к ученику 1', 'POST', '/parent-student', {
        body: { parent_id: 2, student_id: 1 },
        tests: [st(201), J, "pm.collectionVariables.set('linkId', json.id);"],
      }),

      req('Повторная привязка — 409', 'POST', '/parent-student', {
        body: { parent_id: 1, student_id: 1 },
        tests: [
          st(409),
          J,
          "pm.test('Сообщение фильтра', () => pm.expect(json.message).to.include('уже привязан'));",
        ],
      }),

      req('Несуществующий родитель — 404', 'POST', '/parent-student', {
        body: { parent_id: 9999, student_id: 1 },
        tests: [st(404)],
      }),

      req('Отвязка', 'DELETE', '/parent-student/{{linkId}}', {
        tests: [st(200)],
      }),
    ],
  },

  // ===================================================================
  {
    name: '7. Оценки',
    item: [
      req('Оценки учителя Иванова', 'GET', '/grades', {
        tests: [
          st(200),
          J,
          "pm.test('Семь оценок по своим назначениям', () => pm.expect(json.total).to.eql(7));",
        ],
      }),

      req('Оценки учителя Смирновой', 'GET', '/grades', {
        auth: 'teacher2Token',
        tests: [
          st(200),
          J,
          "pm.test('Четыре оценки', () => pm.expect(json.total).to.eql(4));",
        ],
      }),

      req('Оценки ученика', 'GET', '/grades', {
        auth: 'studentToken',
        tests: [
          st(200),
          J,
          "pm.test('Шесть своих оценок', () => pm.expect(json.total).to.eql(6));",
        ],
      }),

      req('Оценки детей родителя', 'GET', '/grades', {
        auth: 'parentToken',
        tests: [
          st(200),
          J,
          "pm.test('Девять оценок двоих детей', () => pm.expect(json.total).to.eql(9));",
        ],
      }),

      req('Средний балл ученика', 'GET', '/grades/average', {
        auth: 'studentToken',
        tests: [
          st(200),
          J,
          'const s = json[0].subjects;',
          "const math = s.find((x) => x.subject_name === 'Математика');",
          "const rus = s.find((x) => x.subject_name === 'Русский язык');",
          "pm.test('Математика 3.75', () => pm.expect(math.average).to.eql(3.75));",
          "pm.test('Русский язык 4.67', () => pm.expect(rus.average).to.eql(4.67));",
          "pm.test('Вес контрольной учтён', () => pm.expect(math.total_weight).to.eql(4));",
        ],
      }),

      req('Средний балл двоих детей', 'GET', '/grades/average', {
        auth: 'parentToken',
        tests: [
          st(200),
          J,
          "pm.test('Два ученика', () => pm.expect(json).to.have.lengthOf(2));",
        ],
      }),

      req('Средний балл без student_id под учителем — 400', 'GET', '/grades/average', {
        tests: [st(400)],
      }),

      req('Чужой средний балл — 404', 'GET', '/grades/average', {
        auth: 'parent2Token',
        query: [{ key: 'student_id', value: '1' }],
        tests: [st(404)],
      }),

      req('Постановка оценки', 'POST', '/grades', {
        body: {
          student_id: 1,
          assignment_id: 1,
          value: 5,
          lesson_date: '2026-11-20',
          grade_type: 'Контрольная работа',
          comment: 'Автотест',
        },
        tests: [
          st(201),
          J,
          "pm.test('Вес контрольной = 3', () => pm.expect(json.weight).to.eql(3));",
          "pm.test('Автор — учитель 1 (из токена)', () => pm.expect(json.created_by).to.eql(1));",
          "pm.collectionVariables.set('gradeId', json.id);",
        ],
      }),

      req('Оценка по чужому назначению — 403', 'POST', '/grades', {
        body: { student_id: 1, assignment_id: 2, value: 5, lesson_date: '2026-11-20' },
        tests: [st(403)],
      }),

      req('Оценка ученику из другого класса — 400', 'POST', '/grades', {
        body: { student_id: 3, assignment_id: 1, value: 5, lesson_date: '2026-11-20' },
        tests: [
          st(400),
          J,
          "pm.test('Сообщение про класс', () => pm.expect(json.message).to.include('не учится в классе'));",
        ],
      }),

      req('Оценка 6 — 400', 'POST', '/grades', {
        body: { student_id: 1, assignment_id: 1, value: 6, lesson_date: '2026-11-20' },
        tests: [st(400)],
      }),

      req('Подмена веса — 400', 'POST', '/grades', {
        body: { student_id: 1, assignment_id: 1, value: 5, lesson_date: '2026-11-20', weight: 10 },
        tests: [st(400)],
      }),

      req('Изменение оценки', 'PATCH', '/grades/{{gradeId}}', {
        body: { value: 4 },
        tests: [
          st(200),
          J,
          "pm.test('Оценка изменена', () => pm.expect(json.value).to.eql(4));",
        ],
      }),

      req('Изменение чужой оценки — 403', 'PATCH', '/grades/1', {
        auth: 'teacher2Token',
        body: { value: 2 },
        tests: [st(403)],
      }),

      req('Удаление оценки', 'DELETE', '/grades/{{gradeId}}', {
        tests: [st(200)],
      }),
    ],
  },

  // ===================================================================
  {
    name: '8. Пропуски',
    item: [
      req('Пропуски учителя Иванова', 'GET', '/absences', {
        tests: [
          st(200),
          J,
          "pm.test('Один пропуск', () => pm.expect(json.total).to.eql(1));",
        ],
      }),

      req('Пропуски ученика', 'GET', '/absences', {
        auth: 'studentToken',
        tests: [
          st(200),
          J,
          "pm.test('Один свой пропуск', () => pm.expect(json.total).to.eql(1));",
        ],
      }),

      req('Сводка по детям родителя', 'GET', '/absences/summary', {
        auth: 'parentToken',
        tests: [
          st(200),
          J,
          "pm.test('Два ученика', () => pm.expect(json).to.have.lengthOf(2));",
          "pm.test('У ученика 1 один пропуск', () => pm.expect(json.find((s) => s.student_id === 1).total).to.eql(1));",
        ],
      }),

      req('Отметка пропуска', 'POST', '/absences', {
        body: {
          student_id: 1,
          assignment_id: 1,
          lesson_date: '2026-11-20',
          absence_type: 'Болезнь',
          reason: 'Автотест',
        },
        tests: [st(201), J, "pm.collectionVariables.set('absenceId', json.id);"],
      }),

      req('Повторная отметка на ту же дату — 409', 'POST', '/absences', {
        body: { student_id: 1, assignment_id: 1, lesson_date: '2026-11-10', absence_type: 'Болезнь' },
        tests: [
          st(409),
          J,
          "pm.test('Сообщение про дату', () => pm.expect(json.message).to.include('уже отмечен пропуск'));",
        ],
      }),

      req('Пропуск по чужому назначению — 403', 'POST', '/absences', {
        body: { student_id: 1, assignment_id: 2, lesson_date: '2026-11-21' },
        tests: [st(403)],
      }),

      req('Удаление пропуска', 'DELETE', '/absences/{{absenceId}}', {
        tests: [st(200)],
      }),
    ],
  },

  // ===================================================================
  {
    name: '9. Отчёты',
    item: [
      req('Отчёт родителю по двоим детям', 'GET', '/reports/parent', {
        auth: 'parentToken',
        tests: [
          st(200),
          J,
          "pm.test('Два ребёнка', () => pm.expect(json).to.have.lengthOf(2));",
          "const first = json.find((r) => r.student_id === 1);",
          "pm.test('Общий балл 4.25', () => pm.expect(first.overall_average).to.eql(4.25));",
          "pm.test('Есть предметы и пропуски', () => { pm.expect(first.subjects).to.be.an('array'); pm.expect(first.absences).to.be.an('object'); });",
        ],
      }),

      req('Отчёт по одному ребёнку', 'GET', '/reports/parent', {
        auth: 'parentToken',
        query: [{ key: 'student_id', value: '2' }],
        tests: [
          st(200),
          J,
          "pm.test('Один ребёнок', () => pm.expect(json).to.have.lengthOf(1));",
        ],
      }),

      req('Отчёт под учеником — 403', 'GET', '/reports/parent', {
        auth: 'studentToken',
        tests: [st(403)],
      }),

      req('Отчёт учителем по ученику', 'GET', '/reports/parent', {
        query: [{ key: 'student_id', value: '1' }],
        tests: [st(200)],
      }),
    ],
  },

  // ===================================================================
  {
    name: '10. Права доступа и ошибки',
    item: [
      req('Профиль без токена — 401', 'GET', '/auth/profile', { auth: null, tests: [st(401)] }),
      req('Оценки без токена — 401', 'GET', '/grades', { auth: null, tests: [st(401)] }),
      req('Добавление предмета без токена — 401', 'POST', '/subjects', {
        auth: null,
        body: { name: 'Х' },
        tests: [st(401)],
      }),
      req('Добавление предмета родителем — 403', 'POST', '/subjects', {
        auth: 'parentToken',
        body: { name: 'Х' },
        tests: [st(403)],
      }),
      req('Добавление класса учеником — 403', 'POST', '/classes', {
        auth: 'studentToken',
        body: { name: '7А', academic_year: 2026 },
        tests: [st(403)],
      }),
      req('Создание аккаунта родителем — 403', 'POST', '/auth/users', {
        auth: 'parentToken',
        body: { username: 'x1', password: '123456', role: 'Ученик', lastname: 'Х', firstname: 'Х', class_id: 1 },
        tests: [st(403)],
      }),
      req('Испорченный токен — 401', 'GET', '/auth/profile', {
        auth: 'badToken',
        tests: [st(401)],
      }),
      req('Неверный пароль — 401', 'POST', '/auth/login', {
        auth: null,
        body: { username: 'teacher1', password: 'wrong' },
        tests: [st(401)],
      }),
      req('Предмет не найден — 404', 'GET', '/subjects/999999', { auth: null, tests: [st(404)] }),
      req('id не число — 400', 'GET', '/subjects/abc', { auth: null, tests: [st(400)] }),
      req('Пустое тело — 400', 'POST', '/subjects', {
        body: {},
        tests: [
          st(400),
          J,
          "pm.test('Массив сообщений валидации', () => pm.expect(json.message).to.be.an('array'));",
        ],
      }),
      req('Лишнее поле — 400', 'POST', '/subjects', {
        body: { name: 'Химия', id: 1 },
        tests: [st(400)],
      }),
      req('limit больше 50 — 400', 'GET', '/subjects', {
        auth: null,
        query: [{ key: 'limit', value: '100' }],
        tests: [st(400)],
      }),

      // --- Проверка закрытой уязвимости: родитель не видит чужих детей ---
      req('Родитель 2 читает чужую оценку — 404', 'GET', '/grades/1', {
        auth: 'parent2Token',
        tests: [
          st(404),
          J,
          // 'не найден' — подстрока и «не найден», и «не найдена»
          "pm.test('Чужие данные не раскрыты', () => pm.expect(json.message).to.include('не найден'));",
        ],
      }),
      req('Родитель 2 читает чужого ученика — 404', 'GET', '/students/1', {
        auth: 'parent2Token',
        tests: [st(404)],
      }),
      req('Родитель 2 читает чужой пропуск — 404', 'GET', '/absences/1', {
        auth: 'parent2Token',
        tests: [st(404)],
      }),
    ],
  },

  // ===================================================================
  {
    name: '11. Импорт Excel (запускать вручную)',
    item: [
      {
        name: 'Импорт оценок из .xlsx',
        event: [
          {
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: [
                '// Без выбранного файла сервер отвечает 400 — это тоже корректное поведение',
                "pm.test('Импорт: 201 (файл выбран) или 400 (файл не выбран)', () => pm.expect([201, 400]).to.include(pm.response.code));",
              ],
            },
          },
        ],
        request: {
          method: 'POST',
          header: [],
          url: {
            raw: BASE + '/import/grades?academic_year=2026',
            host: [BASE],
            path: ['import', 'grades'],
            query: [{ key: 'academic_year', value: '2026' }],
          },
          body: { mode: 'formdata', formdata: [{ key: 'file', type: 'file', src: [] }] },
        },
      },
    ],
  },
];

const collection = {
  info: {
    _postman_id: 'electronic-journal-2026',
    name: 'Электронный журнал',
    description:
      'Автотесты REST API курсового проекта «Электронный журнал». ' +
      'Перед прогоном выполнить database/seed.sql. ' +
      'Папку «11. Импорт Excel» в Runner отключать не обязательно: тест принимает 201 или 400.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  // Авторизация по умолчанию — токен учителя Иванова.
  // Запросы с другой ролью переопределяют её на вкладке Authorization.
  auth: {
    type: 'bearer',
    bearer: [{ key: 'token', value: '{{teacherToken}}', type: 'string' }],
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000/api' },
    ...[
      'teacherToken',
      'teacher2Token',
      'studentToken',
      'parentToken',
      'parent2Token',
      'subjectId',
      'subjectName',
      'classId',
      'classYear',
      'assignmentId',
      'linkId',
      'gradeId',
      'absenceId',
    ].map((key) => ({ key, value: '' })),
    { key: 'badToken', value: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjF9.broken' },
  ],
  item: folders,
};

mkdirSync('postman', { recursive: true });
writeFileSync(
  'postman/electronic-journal.postman_collection.json',
  JSON.stringify(collection, null, 2),
  'utf8',
);

const count = folders.reduce((sum, f) => sum + f.item.length, 0);
console.log(
  `Готово: postman/electronic-journal.postman_collection.json (${folders.length} папок, ${count} запросов)`,
);