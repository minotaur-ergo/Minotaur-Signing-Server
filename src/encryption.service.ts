import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { blake2b } from 'blakejs'
// import * as secp from "@noble/secp256k1";
import { loggers } from 'winston'
import { AppService } from './app.service'
import { Auth } from './interfaces'
import { UtilsService } from './utils.service'
import * as secp from 'secp256k1'

const logger = loggers.get('default')

@Injectable()
export class EncryptService {
  constructor(
    private utilService: UtilsService,
    private appService: AppService,
  ) {}

  /**
   * Verifies a signature with a public key
   * @param toVerify message to verify
   * @param signature signature to verify
   * @param publicKey public key to verify with
   * @returns true if the signature is valid, false otherwise
   */
  verify(
    toVerify: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array,
  ): boolean {
    const msgHex = blake2b(toVerify, undefined, 32)
    return secp.ecdsaVerify(signature, msgHex, publicKey)
  }

  /**
   * validates a user
   * @param body sent by the user
   * @param teamId team id to be associated with the user
   * @returns the user if the user is valid
   */
  async validUser(body: any, teamId: string = undefined): Promise<Auth> {
    try {
      const xpub = body.xpub
      const pub = body.pub
      const signature = body.signature
      const auth = await this.appService.getAuth(xpub, pub)
      if (!auth) {
        logger.error(`Unauthorized - user does not exist ${xpub}, ${pub}`)
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
      }

      if (teamId) {
        const team = await this.appService.getTeam(teamId)
        if (team.xpubs.indexOf(xpub) === -1) {
          logger.error(
            `Unauthorized - user is not in team ${xpub}, ${pub}, ${teamId}`,
          )
          throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
        }
      }

      const bodyWithoutSignature = JSON.parse(JSON.stringify(body))
      delete bodyWithoutSignature.signature
      const bodyBytes = Buffer.from(
        JSON.stringify(bodyWithoutSignature),
        'utf-8',
      )
      const isValid = this.verify(
        bodyBytes,
        Buffer.from(signature, 'base64'),
        Buffer.from(pub, 'base64'),
      )

      if (isValid) {
        return auth
      }
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
    } catch (error) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
    }
  }
}
