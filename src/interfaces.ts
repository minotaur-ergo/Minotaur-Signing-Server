import * as mongoose from 'mongoose'

export interface Auth extends mongoose.Document {
  xpub: string
  pub: string
}

export interface Team extends mongoose.Document {
  address: string
  name: string
  xpubs: string[]
  m: number
}

export interface Reduced extends mongoose.Document {
  reduced: string
  boxes: [string]
  dataInputs: [string]
  maxDerived: number
  team: Team['_id']
  proposer: Auth['_id']
}

export interface PartialProof extends mongoose.Document {
  proof: string
  reduced: Reduced['_id']
  xpub: string
}

export interface Commitment extends mongoose.Document {
  commitment: string
  simulated: boolean
  xpub: string
  reduced: Reduced['_id']
}

export interface Tx extends mongoose.Document {
  tx: string
  mined: boolean
  reduced: Reduced['_id']
  error: string
}
