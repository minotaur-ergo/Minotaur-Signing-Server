import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import axios from 'axios'
import { Model } from 'mongoose'
import { loggers } from 'winston'
import { Auth, Commitment, PartialProof, Reduced, Team, Tx } from './interfaces'

const logger = loggers.get('default')

@Injectable()
export class AppService {
  constructor(
    @InjectModel('Team') private teamModel: Model<Team>,
    @InjectModel('Auth') private authModel: Model<Auth>,
    @InjectModel('Reduced') private reducedModel: Model<Reduced>,
    @InjectModel('PartialProof') private partialProofModel: Model<PartialProof>,
    @InjectModel('Commitment') private commitmentModel: Model<Commitment>,
    @InjectModel('Tx') private TxModel: Model<Tx>,
  ) {}

  /**
   * Retrieves teams from the database. If an xpub is provided, it will return teams associated with that xpub.
   * @param {string} xpub - The xpub to filter teams by. If not provided, all teams are returned.
   * @returns {Promise} - A promise that resolves to the teams found.
   */
  async getTeams(xpub: string = '') {
    if (xpub) {
      return await this.teamModel.find({ xpubs: xpub }).exec()
    } else {
      return await this.teamModel.find().exec()
    }
  }

  /**
   * Retrieves a team from the database by its ID.
   * @param {string} teamId - The ID of the team to retrieve.
   * @returns {Promise} - A promise that resolves to the team found.
   */
  async getTeam(teamId: string) {
    return await this.teamModel.findOne({ _id: teamId }).exec()
  }

  /**
   * Adds a new team to the database.
   * @param {any} team - The team to add.
   * @returns {Promise} - A promise that resolves to the saved team.
   */
  async addTeam(team: any) {
    const newTeam = new this.teamModel(team)
    return await newTeam.save()
  }

  /**
   * Checks if a team exists in the database.
   * @param {string[]} xpubs - The xpubs of the team.
   * @param {number} m - The number of signatures required to spend funds.
   * @returns {Promise<boolean>} - A promise that resolves to true if the team exists, false otherwise.
   */
  async teamExists(xpubs: string[], m: number) {
    const teamExists = await this.teamModel
      .findOne({ xpubs: { $size: xpubs.length, $all: xpubs }, m: m })
      .exec()
    if (teamExists) {
      return true
    }
    return false
  }

  /**
   * Saves a new team to the database.
   * @param {any} team - The team to save.
   * @returns {Promise} - A promise that resolves to the saved team.
   */
  async saveTeam(team: any) {
    const newTeam = new this.teamModel(team)
    return await newTeam.save()
  }

  /**
   * Adds a new auth to the database, or returns the existing one if it already exists.
   * @param {string} xpub - The xpub of the auth.
   * @param {string} pub - The public key of the auth.
   * @returns {Promise} - A promise that resolves to the saved or existing auth.
   */
  async addAuth(xpub: string, pub: string) {
    const newAuth = new this.authModel({ xpub: xpub, pub: pub })
    const authExists = await this.authModel
      .findOne({ xpub: xpub, pub: pub })
      .exec()
    if (authExists) {
      return authExists
    }
    return await newAuth.save()
  }

  /**
   * Adds a new reduced object to the database.
   * @param {string} xpub - The xpub of user.
   * @param {string} pub - The public key of the user.
   * @param {number} maxDerived - The maximum number of derived keys.
   * @param {string} reduced - The reduced tx.
   * @param {string} teamId - The ID of the team.
   * @param {any[]} boxes - Input boxes.
   * @param {any[]} dataInputs - The data inputs.
   * @returns {Promise} - Reduced transaction
   */
  async addReduced(
    xpub: string,
    pub: string,
    maxDerived: number,
    reduced: string,
    teamId: string,
    boxes = [],
    dataInputs = [],
  ) {
    const team = await this.teamModel.findOne({ _id: teamId }).exec()
    const auth = await this.authModel.findOne({ xpub: xpub, pub: pub }).exec()
    const reducedObj = new this.reducedModel({
      reduced: reduced,
      team: team,
      proposer: auth,
      boxes: boxes,
      dataInputs: dataInputs,
      maxDerived: maxDerived,
    })
    return await reducedObj.save()
  }

  /**
   * Checks if a reduced tx exists in the database.
   * @param {string} reduced - The reduced tx.
   * @param {string} teamId - The ID of the team.
   * @returns {Promise<boolean>} - A promise that resolves to true if the reduced tx exists, false otherwise.
   */
  async reducedExists(reduced: string, teamId: string = ''): Promise<any> {
    const reducedTx = await this.reducedModel.find({ reduced: reduced }).exec()
    const teamIds = reducedTx.map((tx) => tx.team._id.toString())
    if (reducedTx && (teamIds.includes(teamId) || teamId === '')) {
      return true
    }
    return false
  }

  /**
   * Adds a new partial proof to the database.
   * @param xpub xpub of the user
   * @param proof proof of the reduced tx
   * @param reducedId id of the reduced tx
   * @returns PartialProof
   */
  async addPartialProof(xpub: string, proof: string, reducedId: string) {
    const reduced = await this.reducedModel.findOne({ _id: reducedId }).exec()
    const partialProof = new this.partialProofModel({
      proof: proof,
      reduced: reduced,
      xpub: xpub,
    })
    return await partialProof.save()
  }

  /**
   * Updates a partial proof in the database.
   * @param xpub xpub of the user
   * @param proof proof of the reduced tx
   * @param reducedId id of the reduced tx
   * @returns PartialProof
   */
  async updatePartialProof(xpub: string, proof: string, reducedId: string) {
    const tx = await this.getTx(reducedId)
    if (tx && !tx.error) {
      logger.error(
        `Transaction ${reducedId} is already signed but ${xpub} tried to update a partial proof`,
      )
      throw new HttpException(
        'Transaction is already signed',
        HttpStatus.BAD_REQUEST,
      )
    }

    const partialProof = await this.partialProofModel
      .findOne({ reduced: reducedId, xpub: xpub })
      .exec()
    partialProof.proof = proof
    return await partialProof.save()
  }

  /**
   * Adds a new commitment to the database.
   * @param xpub xpub of the user
   * @param commitment commitment of the reduced tx
   * @param reducedId id of the reduced tx
   * @param simulated boolean indicating if the commitment is simulated
   * @returns Commitment
   */
  async addCommitment(
    xpub: string,
    commitment: string,
    reducedId: string,
    simulated: boolean = false,
  ) {
    const reduced = await this.reducedModel.findOne({ _id: reducedId }).exec()
    const commitmentObj = new this.commitmentModel({
      commitment: commitment,
      reduced: reduced,
      xpub: xpub,
      simulated: simulated,
    })
    return await commitmentObj.save()
  }

  /**
   * Updates a commitment in the database.
   * @param xpub xpub of the user
   * @param commitment commitment of the reduced tx
   * @param reducedId id of the reduced tx
   * @param simulated boolean indicating if the commitment is simulated
   * @returns Commitment
   */
  async updateCommitment(
    xpub: string,
    commitment: string,
    reducedId: string,
    simulated: boolean = false,
  ) {
    const commitmentObj = await this.commitmentModel
      .findOne({ reduced: reducedId, xpub: xpub })
      .exec()
    commitmentObj.commitment = commitment
    commitmentObj.simulated = simulated
    return await commitmentObj.save()
  }

  /**
   * Deletes a commitment from the database.
   * @param xpub xpub of the user
   * @param reducedId id of the reduced tx
   * @returns Commitment
   */
  async deleteCommitment(xpub: string, reducedId: string) {
    return await this.commitmentModel
      .deleteOne({ reduced: reducedId, xpub: xpub })
      .exec()
  }

  /**
   * Adds a new tx to the database or upates an existing one.
   * @param tx tx of the reduced tx
   * @param reducedId id of the reduced tx
   * @param error error message
   * @param mined boolean indicating if the tx is mined
   * @returns Tx
   */
  async addOrUpdateTx(
    tx: string,
    reducedId: string,
    error: string = '',
    mined: boolean = false,
  ) {
    const reduced = await this.reducedModel.findOne({ _id: reducedId }).exec()
    let txObj = await this.TxModel.findOne({ reduced: reducedId }).exec()
    if (txObj) {
      txObj.tx = tx
      txObj.error = error
      txObj.mined = mined
      return await txObj.save()
    }
    txObj = new this.TxModel({
      tx: tx,
      reduced: reduced,
      error: error,
      mined: mined,
    })
    return await txObj.save()
  }

  /**
   * Retrieves a Reduced object from the database.
   */
  async getReduced(
    reducedId: string,
    populate: boolean = false,
  ): Promise<Reduced> {
    if (populate) {
      return await this.reducedModel
        .findOne({ _id: reducedId })
        .populate('team')
        .populate('proposer')
        .exec()
    }
    return await this.reducedModel.findOne({ _id: reducedId }).exec()
  }

  /**
   * @returns {Promise} - Uncorfirmed transactions.
   */
  async getUnconfimrdTxs() {
    return await this.TxModel.find({ mined: false }).exec()
  }

  /**
   * @returns {Promise} - Reduced transactions for a team.
   */
  async getReducedsByTeam(teamId: string) {
    return await this.reducedModel.find({ team: teamId }).exec()
  }

  /**
   * @returns {Promise} - Team of a reduced tx.
   */
  async getTeamByReducedId(reducedId: string) {
    const reduced = await this.reducedModel
      .findOne({ _id: reducedId })
      .populate('team')
      .exec()
    return reduced.team
  }

  /**
   * Partial proofs for a reduced tx.
   * @param reducedId Reduced tx id
   * @returns PartialProof[]
   */
  async getPartialProofs(reducedId: string): Promise<PartialProof[]> {
    return await this.partialProofModel.find({ reduced: reducedId }).exec()
  }

  /**
   * Commitments for a reduced tx.
   * @param reducedId Reduced tx id
   * @returns Commitment[]
   */
  async getCommitments(reducedId: string) {
    return await this.commitmentModel.find({ reduced: reducedId }).exec()
  }

  /**
   * Tx for a reduced tx.
   * @param reducedId Reduced tx id
   * @returns Tx
   */
  async getTx(reducedId: string) {
    return await this.TxModel.findOne({ reduced: reducedId }).exec()
  }

  /**
   * True if the authentification exists.
   * @param xpub xpub of the user
   * @param pub public key of the user
   * @returns boolean
   */
  async authExists(xpub: string, pub: string) {
    const authExists = await this.authModel
      .findOne({ xpub: xpub, pub: pub })
      .exec()
    if (authExists) {
      return true
    }
    return false
  }

  /**
   * @param xpub xpub of the user
   * @param pub public key of the user
   * @returns Authentification
   */
  async getAuth(xpub: string, pub: string) {
    return await this.authModel.findOne({ xpub: xpub, pub: pub }).exec()
  }
}
