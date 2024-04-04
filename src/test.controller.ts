import { Controller, Get, Post, Res, Body, HttpException, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { AddReducedTxDto, CreateTeamDto, SetPkDto, AddPartialProofDto, AddCommitmentDto } from './dto';
import { EncryptService } from './encryption.service';
import { UtilsService } from './utils.service';
import { NetworkPrefix } from 'ergo-lib-wasm-nodejs';
import { ApiTags } from '@nestjs/swagger';

@Controller()
export class TestController {
  constructor(private readonly appService: AppService, private readonly encryptService: EncryptService,
    private utilService: UtilsService) {}


  @Post('/mnemToXpub')
  @ApiTags('Test')
  async mnemToXpub(@Body() body: any) {
    const mnemonic = body.mnemonic;
    return {
      "xpub": this.utilService.mnemonicToXpub(mnemonic)
    }
  }

  @Post('/signMessage')
  @ApiTags('Test')
  async signMessage(@Body() body: any) {
    const mnemonic = body.mnemonic;
    const message = this.utilService.base64ToBytes(body.message);
    return {
      "signiture": this.utilService.bytesToBase64(this.utilService.signMessage(mnemonic, message))
    }
  }

  @Post('/signBody')
  @ApiTags('Test')
  async signBody(@Body() body: any) {
    const mnemonic = body.mnemonic;
    const message = Buffer.from(JSON.stringify(body.data), 'utf-8');
    return {
      "signiture": this.utilService.bytesToBase64(this.utilService.signMessage(mnemonic, message))
    }
  }

  @Post('/signJson')
  @ApiTags('Test')
  async signJson(@Body() body: any) {
    const secret = Buffer.from(body.secret, 'base64');
    const data = JSON.parse(JSON.stringify(body.data));
    const dataBytes = Buffer.from(JSON.stringify(data), 'utf-8');
    const signature = this.encryptService.sign(dataBytes, secret);
    data['signature'] = signature;
    return data
  }

  @Post('/verifyJson')
  @ApiTags('Test')
  async verifyJson(@Body() body: any) {
    const pk = Buffer.from(body.pk, 'base64');
    const data = JSON.parse(JSON.stringify(body));
    const signature = this.utilService.base64ToBytes(body.signature);
    delete data['signature'];
    const verified = this.encryptService.verify(Buffer.from(JSON.stringify(data), 'utf-8'), signature, pk);
    return {
      "verified": verified
    }
  }


  @Get('/getNewPair')
  @ApiTags('Test')
  async getNewPair() {
    const derKeys = this.encryptService.generateKeys();
    const pk16 = derKeys.publicKey.toString('base64');
    const pr16 = derKeys.privateKey.toString('base64');
    return {pub: pk16, priv: pr16};
  }

  @Get('/teams')
  @ApiTags('Test')
  async getAllTeams() {
    return await this.appService.getTeams();
  }


}
