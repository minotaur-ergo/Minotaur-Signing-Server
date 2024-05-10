import { Model } from 'mongoose';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Address, BlockHeader, BlockHeaders, ErgoStateContext, PreHeader, verify_signature } from 'ergo-lib-wasm-nodejs';
import { UtilsService } from './utils.service';
import { Reduced, Tx, PartialProof, Commitment, Auth, Team } from './interfaces';
import axios from 'axios';

@Injectable()
export class AppService {
  private client: any;
  constructor(@InjectModel('Team') private teamModel: Model<Team>,
      @InjectModel('Auth') private authModel: Model<Auth>,
      @InjectModel('Reduced') private reducedModel: Model<Reduced>,
      @InjectModel('PartialProof') private partialProofModel: Model<PartialProof>,
      @InjectModel('Commitment') private commitmentModel: Model<Commitment>,
      @InjectModel('Tx') private TxModel: Model<Tx>
  ) {

    this.client = axios.create({
      baseURL: process.env.NODE_URL,
      timeout: 1000,
      headers: {'Content-Type': 'application/json'}
    });

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

  async teamExists(xpubs: string[], m: number) {
    const teamExists = await this.teamModel.findOne({ xpubs: { $size: xpubs.length, $all: xpubs }, m: m }).exec();
    if (teamExists) {
      return true;
    }
    return false;
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

  async addReduced(xpub: string, pub: string, maxDerived: number, reduced: string, teamId: string, boxes = [], dataInputs = []) {
    const team = await this.teamModel.findOne({ _id: teamId }).exec();
    const auth = await this.authModel.findOne({ xpub: xpub, pub: pub }).exec();
    const reducedObj = new this.reducedModel({ reduced: reduced, team: team, proposer: auth, boxes: boxes, dataInputs: dataInputs, maxDerived: maxDerived });
    return await reducedObj.save();
  }

  async reducedExists(reduced: string, teamId: string = ""): Promise<any> {
    const reducedTx = await this.reducedModel.find({ reduced: reduced }).exec();
    const teamIds = reducedTx.map((tx) => tx.team._id.toString())
    if (reducedTx && (teamIds.includes(teamId) || teamId === "")) {
      return true;
    }
    return false
  }

  async addPartialProof(xpub: String, proof: String, reducedId: String) {
    const reduced = await this.reducedModel.findOne({_id: reducedId }).exec();
    const partialProof = new this.partialProofModel({proof: proof, reduced: reduced, xpub: xpub});
    return await partialProof.save();
  }

  async updatePartialProof(xpub: string, proof: string, reducedId: string) {
    const tx = await this.getTx(reducedId);
    if (tx && !tx.error) {
      throw new HttpException('Transaction is already signed', HttpStatus.BAD_REQUEST);
    }

    const partialProof = await this.partialProofModel.findOne({reduced: reducedId, xpub: xpub}).exec();
    partialProof.proof = proof;
    return await partialProof.save();
  }
  
  async addCommitment(xpub: String, commitment: string, reducedId: string, simulated: boolean = false) {
    const reduced = await this.reducedModel.findOne({_id: reducedId }).exec();
    const commitmentObj = new this.commitmentModel({commitment: commitment, reduced: reduced, xpub: xpub, simulated: simulated});
    return await commitmentObj.save();
  }

  async updateCommitment(xpub: string, commitment: string, reducedId: string, simulated: boolean = false) {
    const commitmentObj = await this.commitmentModel.findOne({reduced: reducedId, xpub: xpub}).exec();
    commitmentObj.commitment = commitment;
    commitmentObj.simulated = simulated;
    return await commitmentObj.save();
  }

  async deleteCommitment(xpub: string, reducedId: string) {
    return await this.commitmentModel.deleteOne({reduced: reducedId, xpub: xpub}).exec();
  }

  async addOrUpdateTx(tx: string, reducedId: string, error: string = "", mined: boolean = false) {
    const reduced = await this.reducedModel.findOne({_id: reducedId }).exec();
    let txObj = await this.TxModel.findOne({reduced: reducedId}).exec();
    if (txObj) {
      txObj.tx = tx;
      txObj.error = error;
      txObj.mined = mined;
      return await txObj.save();
    } 
    txObj = new this.TxModel({tx: tx, reduced: reduced, error: error, mined: mined});
    return await txObj.save();
  }

  async getReduced(reducedId: String, populate: boolean = false): Promise<Reduced> {
    if (populate) {
      return await this.reducedModel.findOne({_id: reducedId}).populate('team').populate('proposer').exec();
    }
    return await this.reducedModel.findOne({_id: reducedId}).exec();
  }

  async getUnconfimrdTxs() {
    return await this.TxModel.find({mined: false}).exec();
  }

  async getReducedsByTeam(teamId: String) {
    return await this.reducedModel.find({team: teamId}).exec();
  }

  async getTeamByReducedId(reducedId: String) {
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
    return await this.TxModel.findOne({reduced: reducedId}).exec();
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
