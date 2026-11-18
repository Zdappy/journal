import type { Role } from '../../common/enums/role.enum.js';

/**
 * Данные, которые хранятся внутри JWT-токена.
 * Payload не шифруется (его можно прочитать на jwt.io),
 * поэтому секретов здесь быть не должно — только id, логин и роль.
 */
export interface JwtPayload {
  /** id пользователя (sub — стандартное имя поля «subject») */
  sub: number;
  username: string;
  role: Role;
}