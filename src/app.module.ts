import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { EncryptService } from './encryption.service';
import { AuthSchema, CommitmentSchema, PartiallProofSchema, ReducedSchema, TeamSchema, TxSchema } from './schema';
import { UtilsService } from './utils.service';
import { TestController } from './test.controller';

@Module({
  imports: [
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
  providers: [AppService, EncryptService, UtilsService],
})
export class AppModule {}

