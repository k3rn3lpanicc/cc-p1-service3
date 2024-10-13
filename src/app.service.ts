import { Injectable } from '@nestjs/common';
import {
  Record,
  RecordDocument,
} from './records/schemas/record.schema/record.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { STATE } from './records/enums/state.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { configDotenv } from 'dotenv';
import { Recipient, EmailParams, MailerSend, Sender } from 'mailersend';
configDotenv();
@Injectable()
export class AppService {
  private readonly s3: S3Client;
  private readonly mailersend: MailerSend;
  constructor(
    @InjectModel(Record.name) private recordModel: Model<RecordDocument>,
  ) {
    this.s3 = new S3Client({
      endpoint: process.env.LIARA_ENDPOINT,
      credentials: {
        accessKeyId: process.env.LIARA_ACCESS_KEY,
        secretAccessKey: process.env.LIARA_SECRET_KEY,
      },
      region: 'default',
    });
    this.mailersend = new MailerSend({
      apiKey: process.env.MAILERSENDAPIKEY,
    });
  }
  checkHealth(): string {
    return 'Service is running';
  }

  async getRequestStatus(requestId: string) {
    const req = await this.recordModel.findOne({ _id: requestId });
    return {
      result: {
        url: req.imageUrl,
        requestId: req._id,
        state: req.state,
        caption: req.imageCaption,
      },
    };
  }

  async updateState(requestId: string, state: string) {
    const req = await this.recordModel.findOne({ _id: requestId });
    req.state = state;
    return req.save();
  }

  async getImageResult(caption: string) {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/ZB-Tech/Text-to-Image',
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGAPIKEY}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ inputs: caption }),
      },
    );
    const result = await response.blob();
    return result;
  }

  async uploadResult(requestId: string, result: Blob) {
    const fileName = `result_${Date.now()}_${requestId}.jpg`;
    const uploadParams = {
      Bucket: process.env.LIARA_BUCKET_NAME,
      Key: fileName,
      Body: Buffer.from(await result.arrayBuffer()),
      ContentType: 'image/jpeg',
    };
    try {
      await this.s3.send(new PutObjectCommand(uploadParams));
      const resultURL = `https://cc-p1.storage.c2.liara.space/${fileName}`;
      return resultURL;
    } catch (err: any) {
      console.error('Error uploading file:', err);
      throw err;
    }
  }

  async sendMail(requestId: string, resultUrl: string, receiver: string) {
    const recipients = [new Recipient(receiver, 'Recipient')];
    const emailParams = new EmailParams()
      .setFrom(new Sender('k3rn3lpanic@gmail.com', 'k3rn3lpanic'))
      .setTo(recipients)
      .setSubject('CC-P1-Request result')
      .setText(
        `The result of your request with id of ${requestId} is: ${resultUrl}`,
      );
    await this.mailersend.email.send(emailParams);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkRequests() {
    console.log('Checking for ready requests.');
    const limit = 5;
    const readyRequests = await this.recordModel
      .find({
        state: STATE.READY,
      })
      .sort({ lastChecked: 'asc' })
      .limit(limit);
    for (const request of readyRequests) {
      const imageCaption = request.imageCaption;
      const createdImage = await this.getImageResult(imageCaption);
      console.log({ id: request.id });
      try {
        const resultURL = await this.uploadResult(request.id, createdImage);
        request.resultUrl = resultURL;
        request.state = STATE.DONE;
        console.log({ resultURL });
        await this.sendMail(request.id, resultURL, request.email);
        console.log('Sent email');
        request.save();
      } catch (err: any) {
        console.log(
          `Will be retried, Error uploading the image to liara: `,
          err,
        );
      }
    }
  }
}
