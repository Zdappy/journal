import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model.js';

@Module({
  imports: [SequelizeModule.forFeature([User])],
})
export class UserModule {}