/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RecordDocument = Record & Document;

@Schema()
export class Record {
  @Prop({ required: true })
  email: string;
  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  state: string;

  @Prop()
  resultUrl: string;

  @Prop()
  imageCaption: string;
}

export const RecordSchema = SchemaFactory.createForClass(Record);
