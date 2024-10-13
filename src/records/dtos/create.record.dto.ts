/* eslint-disable prettier/prettier */

import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateRecordDto {
  @IsEmail()
  readonly email: string;

  @IsString()
  readonly imageUrl?: string;

  @IsOptional()
  @IsString()
  readonly state?: string;

  @IsOptional()
  @IsString()
  readonly resultUrl?: string;

  @IsOptional()
  @IsString()
  readonly imageCaption?: string;
}
