import { Model } from 'mongoose';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Address, verify_signature } from 'ergo-lib-wasm-nodejs';
import { UtilsService } from './utils.service';
import { Reduced, Tx, PartialProof, Commitment, Auth, Team } from './interfaces';


@Injectable()
export class AppService {
  constructor(@InjectModel('Team') private teamModel: Model<Team>,
      @InjectModel('Auth') private authModel: Model<Auth>,
      @InjectModel('Reduced') private reducedModel: Model<Reduced>,
      @InjectModel('PartialProof') private partialProofModel: Model<PartialProof>,
      @InjectModel('Commitment') private commitmentModel: Model<Commitment>,
      @InjectModel('Tx') private TxModel: Model<Tx>
  ) {}

  getHello(): string {
    const address = Address.from_base58('9hFmeUHVttZmgtq4DEosEzJb3bTjx9HMJVptmMgfaHH9tYyGYTE')
    return 'Hello World!';
  }

  async getTeams(xpub: string = "") {
    if (xpub) {
      return await this.teamModel.find({ xpubs: xpub }).exec();
    } else {
      return await this.teamModel.find().exec();
    }
  }

  async getTeam(teamId: String) {
    return await this.teamModel.findOne({_id: teamId}).exec();
  }

  async addTeam(team: any) {
    const newTeam = new this.teamModel(team);
    return await newTeam.save();
  }

  async saveTeam(team: any) {
    const newTeam = new this.teamModel(team);
    return await newTeam.save();
  }

  async addAuth(xpub: String, pub: String) {
    const newAuth = new this.authModel({xpub: xpub, pub: pub});
    const authExists = await this.authModel.findOne({xpub: xpub, pub: pub}).exec();
    if (authExists) {
      return authExists;
    }
    return await newAuth.save();
  }

  async addReduced(xpub: string, pub: string, reduced: string, teamId: string, boxes = [], dataInputs = []) {
    const team = await this.teamModel.findOne({ _id: teamId }).exec();
    const auth = await this.authModel.findOne({ xpub: xpub, pub: pub }).exec();
    const reducedObj = new this.reducedModel({ reduced: reduced, team: team, proposer: auth, boxes: boxes, dataInputs: dataInputs });
    return await reducedObj.save();
  }

  async addPartialProof(xpub: String, proof: String, reducedId: String) {
    const reduced = await this.reducedModel.findOne({_id: reducedId }).exec();
    const partialProof = new this.partialProofModel({proof: proof, reduced: reduced, xpub: xpub});
    return await partialProof.save();
  }
  
  async addCommitment(xpub: String, commitment: String, reducedId: String, simulated: boolean = false) {
    const reduced = await this.reducedModel.findOne({_id: reducedId }).exec();
    const commitmentObj = new this.commitmentModel({commitment: commitment, reduced: reduced, xpub: xpub, simulated: simulated});
    return await commitmentObj.save();
  }

  async addTx(tx: String, reducedId: String) {
    const reduced = await this.reducedModel.findOne({_id: reducedId }).exec();
    const txObj = new this.TxModel({tx: tx, mined: false, reduced: reduced, error: ""});
    return await txObj.save();
  }

  async getReduced(reducedId: String, populate: boolean = false): Promise<Reduced> {
    if (populate) {
      return await this.reducedModel.findOne({_id: reducedId}).populate('team').populate('proposer').exec();
    }
    return await this.reducedModel.findOne({_id: reducedId}).exec();
  }

  async getReducedsByTeam(teamId: String) {
    return await this.reducedModel.find({team: teamId}).exec();
  }

  async getTeamByReducedId(reducedId: String) {
    // get reduced and populate team
    const reduced = await this.reducedModel.findOne({_id: reducedId}).populate('team').exec();
    return reduced.team;
  }

  async getPartialProofs(reducedId: String): Promise<PartialProof[]> {
    return await this.partialProofModel.find({reduced: reducedId}).exec();
  }

  async getCommitments(reducedId: String) {
    return await this.commitmentModel.find({reduced: reducedId}).exec();
  }

  async getTx(reducedId: String) {
    return await this.TxModel.find({reduced: reducedId}).exec();
  }

  async authExists(xpub: String, pub: String) {
    const authExists = await this.authModel.findOne({xpub: xpub, pub: pub}).exec();
    if (authExists) {
      return true;
    }
    return false;
  }

  async getAuth(xpub: String, pub: String) {
    return await this.authModel.findOne({xpub: xpub, pub: pub}).exec();
  }

}
