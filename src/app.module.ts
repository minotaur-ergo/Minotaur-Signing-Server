import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { EncryptService } from './encryption.service'
import { JobsService } from './jobs.service'
import { NodeService } from './node.service'
import {
  AuthSchema,
  CommitmentSchema,
  PartiallProofSchema,
  ReducedSchema,
  TeamSchema,
  TxSchema,
} from './schema'
import { TestController } from './test.controller'
import { UtilsService } from './utils.service'
// import winston logger
import { format, loggers, transports } from 'winston'

loggers.add('default', {
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs.log' }),
  ],
})

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    MongooseModule.forFeature([
      { name: 'Team', schema: TeamSchema },
      { name: 'Auth', schema: AuthSchema },
      { name: 'Commitment', schema: CommitmentSchema },
      { name: 'PartialProof', schema: PartiallProofSchema },
      { name: 'Tx', schema: TxSchema },
      { name: 'Reduced', schema: ReducedSchema },
    ]),
  ],
  controllers: [AppController, TestController],
  providers: [
    AppService,
    EncryptService,
    UtilsService,
    NodeService,
    JobsService,
  ],
})
export class AppModule {}
