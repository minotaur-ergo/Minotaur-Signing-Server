import { Injectable } from '@nestjs/common';

import { Cron } from '@nestjs/schedule';
import { AppService } from './app.service';
import { NodeService } from './node.service';
import { loggers } from 'winston';

const logger = loggers.get('default');


@Injectable()
export class JobsService {
  constructor(private readonly appService: AppService, private nodeService: NodeService) {}

  /**
   * Hanles the jobs that need to be run every minute
   * Currently, it checks for unconfirmed transactions and broadcasts them
   */
  @Cron('*/60 * * * * *')
  async handleCron() {
    logger.info('Running cron job - broadcast unconfirmed txs')
    const txs = await this.appService.getUnconfimrdTxs();
    txs.forEach(async (tx: any) => {
      const txJson = JSON.parse(tx.tx)
      const txId = txJson['id']
      const numConfs = await this.nodeService.getTxConfirmationNum(txId)
      if (numConfs > 0) {
        logger.info(`Tx ${txId} already has ${numConfs} confirmations`)
        await this.appService.addOrUpdateTx(tx.tx, tx.reduced, '', true)
      } else {
        try {
          logger.info(`Broadcasting tx ${txId}`)
          const res = await this.nodeService.broadcastTx(txJson)

        } catch (error) {
          logger.error(`Error broadcasting tx ${txId}, ${error.response.data}`)
          const res = error.response.data
          await this.appService.addOrUpdateTx(tx.tx, tx.reduced, JSON.stringify(res), false)
        }
      }
    })
  }
}