import { publicEncrypt, generateKeyPairSync, sign, verify, constants } from 'crypto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UtilsService } from './utils.service';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AppService } from './app.service';
import { Auth } from './interfaces';
import { loggers } from 'winston';

const logger = loggers.get('default');

@Injectable()
export class EncryptService {
  constructor(private utilService: UtilsService, private appService: AppService) {}

  /**
   * signs a message with a private key 
   * @param toSign Message to sign
   * @param privateKey Private key to sign with
   * @returns Signature
   */
  sign(toSign: Uint8Array, privateKey: Buffer): string {
    const signature = sign("sha256", toSign, {
      key: Buffer.from(privateKey),
      format: 'der',
      type: 'pkcs1',
      padding: constants.RSA_PKCS1_PSS_PADDING,
    });
    return signature.toString('base64');
  }

  /**
   * Verifies a signature with a public key 
   * @param toVerify message to verify
   * @param signature signature to verify
   * @param publicKey public key to verify with
   * @returns true if the signature is valid, false otherwise
   */
  verify(toVerify: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean {
    return verify(
      "sha256",
      Buffer.from(toVerify), {
        key: Buffer.from(publicKey),
        format: 'der',
        type: 'pkcs1',
        padding: constants.RSA_PKCS1_PSS_PADDING,
      },
      signature
    );
  }


  /**
   * @returns a pair of public and private keys
   */
  generateKeys() {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'pkcs1',
            format: 'der'
        },
        privateKeyEncoding: {
            type: 'pkcs1',
            format: 'der'
        }
    });

    return { publicKey, privateKey };
  }

  /**
   * validates a user
   * @param body sent by the user
   * @param teamId team id to be associated with the user
   * @returns the user if the user is valid
   */
  async validUser(body: any, teamId: string = undefined): Promise<Auth> {
    try {
      const xpub = body.xpub;
      const pub = body.pub;
      const signature = body.signature;
      const auth = await this.appService.getAuth(xpub, pub);
      const authExists = auth
      if (!authExists) {
        logger.error(`Unauthorized - user does not exist ${xpub}, ${pub}`);
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      if (teamId) {
        const team = await this.appService.getTeam(teamId);
        if (team.xpubs.indexOf(xpub) === -1) {
          logger.error(`Unauthorized - user is not in team ${xpub}, ${pub}, ${teamId}`);
          throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }
      }

      const bodyWithoutSignature = JSON.parse(JSON.stringify(body));
      delete bodyWithoutSignature.signature;
      const bodyBytes = Buffer.from(JSON.stringify(bodyWithoutSignature), 'utf-8');
      const isValid = this.verify(bodyBytes, Buffer.from(signature, 'base64'), Buffer.from(pub, 'base64'))
      
      if (isValid) {
        return auth;
      }
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    } catch (error) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }

}
