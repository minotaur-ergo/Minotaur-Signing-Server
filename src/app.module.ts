import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { EncryptService } from './encryption.service';
import { AuthSchema, CommitmentSchema, PartiallProofSchema, ReducedSchema, TeamSchema, TxSchema } from './schema';
import { UtilsService } from './utils.service';
import { TestController } from './test.controller';
import { NodeService } from './node.service';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsService } from './jobs.service';
// import winston logger
import {createLogger, format, transports, loggers} from 'winston';

loggers.add('default', {
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json(),
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs.log' }),
  ],
});


@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    MongooseModule.forFeature([
      { name: 'Team', schema: TeamSchema },
      { name: 'Auth', schema: AuthSchema},
      { name: 'Commitment', schema: CommitmentSchema },
      { name: 'PartialProof', schema: PartiallProofSchema },
      { name: 'Tx', schema: TxSchema },
      { name: 'Reduced', schema: ReducedSchema},
    ]),

  ],
  controllers: [AppController, TestController],
  providers: [AppService, EncryptService, UtilsService, NodeService, JobsService],
})
export class AppModule {}

