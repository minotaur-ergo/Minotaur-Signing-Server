import { Controller, Get, Post, Res, Body, HttpException, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { AddReducedTxDto, CreateTeamDto, SetPkDto, AddPartialProofDto, AddCommitmentDto, getCommitmentsDto, getReducedTxsDto, getTxDto, getTeamsDto, getReducedStatusDto } from './dto';
import { EncryptService } from './encryption.service';
import { UtilsService } from './utils.service';
import { NodeService } from './node.service';
import { loggers } from 'winston';

const logger = loggers.get('default');

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly encryptService: EncryptService,
    private utilService: UtilsService, private nodeService: NodeService) {}

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

    const exists = await this.appService.reducedExists(body.reducedTx, body.teamId)
    if (exists) {
      throw new HttpException(`This reduced tx already exists`, 400);
    }

    const reduced = await this.appService.addReduced(body.xpub, body.pub, body.maxDerived, body.reducedTx, body.teamId, body.inputBoxes, body.dataInputs)
    return {message: 'Success', reducedId: reduced.id};
  }
   
  @Post('/addPartialProof')
  async addPartialProof(@Body() body: AddPartialProofDto) {
    const reduced = await this.appService.getReduced(body.reducedId, true)
    const auth = await this.encryptService.validUser(body, reduced.team._id)

    const team = await this.appService.getTeamByReducedId(body.reducedId)

    const commitments = await this.appService.getCommitments(body.reducedId)

    if (commitments.length < team.xpubs.length) {
      logger.info(`Not enough commitments collected but trying to add proof by ${body.xpub} for reduced ${body.reducedId}`)
      throw new HttpException('Not enough commitments collected or not simulated', 400);
    }

    if (!(await this.utilService.isProofOkay(body.reducedId, JSON.stringify(body.proof), body.xpub))) {
      logger.info(`Invalid proof by ${body.xpub} for reduced ${body.reducedId}`)
      throw new HttpException('Invalid proof', 400);
    }


    let proofs = await this.appService.getPartialProofs(body.reducedId)
    const proofXpubs = proofs.map((p) => p.xpub)
    if (proofXpubs.includes(body.xpub)) {
      logger.info(`Proof already collected by ${body.xpub} for reduced ${body.reducedId}, updating it`)
      await this.appService.updatePartialProof(body.xpub, JSON.stringify(body.proof), body.reducedId)

    } else if (proofs.length < team.m) {
      logger.info(`Adding proof by ${body.xpub} for reduced ${body.reducedId}`)
      await this.appService.addPartialProof(body.xpub, JSON.stringify(body.proof), body.reducedId)
    }

    
    proofs = await this.appService.getPartialProofs(body.reducedId)
    if (proofs.length >= team.m) {
      logger.info(`All proofs collected for reduced ${body.reducedId}, signing the tx`)
      const tx = await this.utilService.signReduced(body.reducedId, true)
      logger.info(`Tx signed for reduced ${body.reducedId} - ${tx}`)
    }

    return {message: 'Success'};
  }


  @Post('/addCommitment')
  async addCommitment(@Body() body: AddCommitmentDto) {
    const reduced = await this.appService.getReduced(body.reducedId, true)
    const auth = await this.encryptService.validUser(body, reduced.team._id)

    const proofs = await this.appService.getPartialProofs(body.reducedId)
    if (proofs.length > 0) {
      logger.info(`Proofs are being collected for reduced ${body.reducedId} but trying to add commitment by ${body.xpub}`)
      throw new HttpException('Proofs are being collected', 400);
    }

    let commitments = await this.appService.getCommitments(body.reducedId)
    const committedXpubs = commitments.map((c) => c.xpub)
    if (committedXpubs.includes(body.xpub)) {
      logger.info(`Commitment already collected by ${body.xpub} for reduced ${body.reducedId}, updating it`)
      await this.appService.updateCommitment(body.xpub, JSON.stringify(body.commitment), body.reducedId)

    } else if (commitments.length < reduced.team.m) {
      logger.info(`Adding commitment by ${body.xpub} for reduced ${body.reducedId}`)
      await this.appService.addCommitment(body.xpub, JSON.stringify(body.commitment), body.reducedId)
    }

    commitments = await this.appService.getCommitments(body.reducedId)
    if (commitments.length >= reduced.team.m) {
      logger.info(`enough commitments collected for reduced ${body.reducedId}, simulating the tx`)
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
    const bagXpubs = commitments.map((c) => c.xpub)
    const team = await this.appService.getTeamByReducedId(body.reducedId)
    const result = {
      commitments: bag.to_json(),
      collected: commitments.length,
      enoughCollected: commitments.length >= team.m,
      committedXpubs: bagXpubs,
      userCommitted: bagXpubs.includes(body.xpub)
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
    const teamExists = await this.appService.teamExists(body.xpubs, body.m);
    if (teamExists) {
      logger.info(`Team already exists but ${body.xpubs} trying to add it`)
      throw new HttpException('Team already exists', 400);
    }

    const xpub = body.xpub;
    const address = this.utilService.deriveAddressFromXPub(xpub);

    const bodyWithoutSignature = {...body};
    delete bodyWithoutSignature.signature;
    const bodyBytes = Buffer.from(JSON.stringify(bodyWithoutSignature), 'utf-8');

    const signature = body.signature;
    const sigBytes = this.utilService.base64ToBytes(signature);
    const isValid = this.utilService.verifySignature(address, bodyBytes, sigBytes);
    if (isValid) {
      const team = await this.appService.addTeam(body);
      return team;
    }
    throw new HttpException('Invalid', 400);
  }

  @Post('/getTeams')
  async getMyTeams(@Body() body: getTeamsDto) {
    const auth = await this.encryptService.validUser(body)

    if (!body.xpub) {
      logger.info(`Invalid xpub ${body.xpub}`)
      throw new HttpException('Invalid', 400);
    }
    return await this.appService.getTeams(body.xpub);
  }

  @Post('/getReducedStatus')
  async getReducedStatus(@Body() body: getReducedStatusDto) {
    const reduced = await this.appService.getReduced(body.reducedId, true)
    const auth = await this.encryptService.validUser(body, reduced.team._id)

    let commitments = await this.appService.getCommitments(body.reducedId)
    commitments = commitments.filter((c) => !c.simulated)

    const committedXpubs = commitments.map((c) => c.xpub)

    const proofs = await this.appService.getPartialProofs(body.reducedId)
    const proofXpubs = proofs.map((p) => p.xpub)

    let tx = await this.appService.getTx(body.reducedId)

    return {
      committedXpubs: committedXpubs,
      proofXpubs: proofXpubs,
      tx: tx
    }
  }
}
