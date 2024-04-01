import { Controller, Get, Post, Res, Body, HttpException, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { AddReducedTxDto, CreateTeamDto, SetPkDto, AddPartialProofDto, AddCommitmentDto, getCommitmentsDto, getReducedTxsDto, getTxDto, getTeamsDto } from './dto';
import { EncryptService } from './encryption.service';
import { UtilsService } from './utils.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly encryptService: EncryptService,
    private utilService: UtilsService) {}

  @Post('/addPk')
  async addPk(@Body() body: SetPkDto) {
    const pub = body.pub;
    const xpub = body.xpub;
    const address = this.utilService.deriveAddressFromXPub(xpub);
    const pkBytes = this.utilService.base64ToBytes(pub);

    const signature = body.signature;
    const sigBytes = this.utilService.base64ToBytes(signature);
    const isValid = this.utilService.verifySignature(address, pkBytes, sigBytes);
    if (isValid) {
      await this.appService.addAuth(xpub, pub);
      return {message: 'Success'};
      
    }
    throw new HttpException('Invalid', 400);
  }

  @Post('/addReducedTx')
  async addReducedTx(@Body() body: AddReducedTxDto) {
    await this.encryptService.validUser(body)

    const reduced = await this.appService.addReduced(body.xpub, body.pub, body.reducedTx, body.teamId, body.inputBoxes, body.dataInputs)
    return {message: 'Success', reducedId: reduced.id};
  }
   
  @Post('/addPartialProof')
  async addPartialProof(@Body() body: AddPartialProofDto) {
    const reduced = await this.appService.getReduced(body.reducedId, true)
    const auth = await this.encryptService.validUser(body, reduced.team._id)

    const commitments = await this.appService.getCommitments(body.reducedId)
    const simulatedNum = commitments.filter((c) => !c.simulated).length

    const proofs = await this.appService.getPartialProofs(body.reducedId)
    if (proofs.length < simulatedNum) {
      await this.appService.addPartialProof(body.xpub, JSON.stringify(body.proof), body.reducedId)
    }
    if (proofs.length + 1 >= simulatedNum) {
      await this.utilService.signReduced(body.reducedId, true)
    }

    return {message: 'Success'};
  }


  @Post('/addCommitment')
  async addCommitment(@Body() body: AddCommitmentDto) {
    const reduced = await this.appService.getReduced(body.reducedId, true)
    const auth = await this.encryptService.validUser(body, reduced.team._id)

    const commitments = await this.appService.getCommitments(body.reducedId)

    if (commitments.length < reduced.team.m) {
      await this.appService.addCommitment(body.xpub, JSON.stringify(body.commitment), body.reducedId)
    }
    if (commitments.length + 1 >= reduced.team.m && commitments.length < reduced.team.xpubs.length) {
      await this.utilService.getSimulationBag(body.reducedId, true)
    }
    return {message: 'Success'};
  }

  @Post('/getCommitments')
  async getCommitments(@Body() body: getCommitmentsDto) {
    const reduced = await this.appService.getReduced(body.reducedId, true)
    const auth = await this.encryptService.validUser(body, reduced.team._id)

    const commitments = await this.appService.getCommitments(body.reducedId)
    const bag = await this.utilService.mergeBags(body.reducedId, commitments.map((c) => c.commitment))
    const team = await this.appService.getTeamByReducedId(body.reducedId)
    const result = {
      commitments: bag.to_json(),
      collected: commitments.length,
      enoughCollected: commitments.length >= team.m
    }
    return result;
  }

  @Post('/getReducedTxs')
  async getReducedTxs(@Body() body: getReducedTxsDto) {
    const auth = await this.encryptService.validUser(body, body.teamId)

    const reduced = await this.appService.getReducedsByTeam(body.teamId)
    return reduced;
  }

  @Post('/getTx')
  async getTx(@Body() body: getTxDto) {
    const reduced = await this.appService.getReduced(body.reducedId, true)
    const auth = await this.encryptService.validUser(body, reduced.team._id)

    return reduced;
  }
  

  @Post('/addTeam')
  async addTeam(@Body() body: CreateTeamDto) {
    // TODO check if the user is valid

    const team = await this.appService.addTeam(body);
    return team;
  }

  @Post('/getTeams')
  async getMyTeams(@Body() body: getTeamsDto) {
    const auth = await this.encryptService.validUser(body)

    if (!body.xpub) {
      throw new HttpException('Invalid', 400);
    }
    return await this.appService.getTeams(body.xpub);
  }
}
