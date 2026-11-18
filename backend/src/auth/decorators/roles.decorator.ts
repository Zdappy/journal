import { SetMetadata } from '@nestjs/common';
import { Role } from '../../common/enums/role.enum.js';

export const ROLES_KEY = 'roles';

/** Использование: @Roles(Role.Teacher) */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);