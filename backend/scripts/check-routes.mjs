// Карта маршрутов: node scripts/check-routes.mjs  (сервер должен быть запущен)
const URL = 'http://localhost:3000/api/docs-json';

let doc;
try {
  const response = await fetch(URL);
  if (!response.ok) throw new Error(`код ответа ${response.status}`);
  doc = await response.json();
} catch (error) {
  console.error('Не удалось получить описание API:', error.message);
  console.error('Проверьте, что сервер запущён: npm run start:dev');
  process.exit(1);
}

const rows = [];
for (const [path, methods] of Object.entries(doc.paths ?? {})) {
  for (const [method, op] of Object.entries(methods)) {
    rows.push({
      tag: (op.tags ?? ['без тега']).join(','),
      method: method.toUpperCase(),
      path,
      auth: op.security ? 'JWT' : '—',
      summary: op.summary ?? '',
    });
  }
}

rows.sort((a, b) => a.tag.localeCompare(b.tag) || a.path.localeCompare(b.path));

let currentTag = '';
for (const row of rows) {
  if (row.tag !== currentTag) {
    currentTag = row.tag;
    console.log(`\n=== ${currentTag} ===`);
  }
  console.log(`${row.method.padEnd(7)} ${row.path.padEnd(34)} ${row.auth.padEnd(4)} ${row.summary}`);
}

console.log(`\nВсего маршрутов: ${rows.length}`);
console.log(`Разделов (тегов): ${new Set(rows.map((r) => r.tag)).size}`);
console.log(`Схем DTO: ${Object.keys(doc.components?.schemas ?? {}).length}`);
console.log(`Bearer-авторизация настроена: ${doc.components?.securitySchemes?.bearer ? 'да' : 'НЕТ'}`);