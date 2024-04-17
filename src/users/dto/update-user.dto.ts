import { IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  name?: string;
  @IsString()
  lastname?: string;
  @IsString()
  phone?: string;
  image?: string;
  notification_token?: string;
}
