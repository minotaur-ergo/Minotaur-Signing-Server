import { Injectable } from '@nestjs/common'
// import axios from 'axios';
import {
  BlockHeader,
  BlockHeaders,
  ErgoStateContext,
  PreHeader,
} from 'ergo-lib-wasm-nodejs'
import { loggers } from 'winston'
import { Tx } from './interfaces'
import axios, { AxiosInstance } from 'axios'

const logger = loggers.get('default')

@Injectable()
export class NodeService {
  private client: AxiosInstance
  constructor() {
    this.client = axios.create({
      baseURL: process.env.NODE_URL,
      timeout: 1000,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * @returns {ErgoStateContext} - The current state of the blockchain
   */
  async getContext() {
    const res = await this.client.get('/blocks/lastHeaders/10')
    let headers = res.data
    headers = headers.map((header: any) => JSON.stringify(header))
    const blockHeaders = BlockHeaders.from_json(headers)
    const preHeader = PreHeader.from_block_header(
      BlockHeader.from_json(headers[0]),
    )
    return new ErgoStateContext(preHeader, blockHeaders)
  }

  /**
   * broadcast a transaction to the blockchain
   * @param tx transaction to be broadcasted
   * @returns broadcasted result
   */
  async broadcastTx(tx: Tx) {
    const res = await this.client.post('/transactions', tx)
    return res.data
  }

  /**
   * Number of confirmations for a transaction
   * @param txId transaction id
   * @returns number of confirmations
   */
  async getTxConfirmationNum(txId: string) {
    try {
      const res = await this.client.get(`/blockchain/transaction/byId/${txId}`)
      return res.data['numConfirmations']
    } catch (e) {
      return 0
    }
  }
}
