import * as mongoose from 'mongoose';

export const AuthSchema = new mongoose.Schema({
  xpub: { type: String , required: true},
  pub: { type: String, required: true },
},{ versionKey: false, timestamps: true});

export const TeamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    xpubs: [{ type: String , required: true}],
    m: { type: Number, required: true },
},{ versionKey: false, timestamps: true });

export const ReducedSchema = new mongoose.Schema({
    reduced: { type: String, required: true },
    boxes: [{ type: String }],
    dataInputs: [{ type: String }],
    maxDerived: [{ type: String }],

    team: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Team', 
      required: true
    },
    proposer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth',
        required: true
    },
}, { versionKey: false, timestamps: true });

export const PartiallProofSchema = new mongoose.Schema({
    proof: { type: String, required: true },
    reduced: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reduced',
        required: true
    },
    xpub: { type: String, required: true },
}, { versionKey: false, timestamps: true });

export const CommitmentSchema = new mongoose.Schema({
    commitment: { type: String, required: true },
    xpub: { type: String, required: true },
    simulated: { type: Boolean, required: true, default: false },
    reduced : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reduced',
        required: true
    },
}, { versionKey: false, timestamps: true });

export const TxSchema = new mongoose.Schema({
    tx: { type: String, required: true },
    mined: { type: Boolean, required: true },
    reduced: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reduced',
        required: true
    },
    error: { type: String },
}, { versionKey: false, timestamps: true });
