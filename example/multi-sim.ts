import { mnemonicToSeedSync } from "bip39"
import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { extractCommitments } from "./multiSig/utils";
import fakeContext from "./multiSig/fakeContext";
const bip32 = BIP32Factory(ecc);
const RootPathWithoutIndex = "m/44'/429'/0'/0";
const calcPathFromIndex = (index: number) => `${RootPathWithoutIndex}/${index}`;
const fs = require('fs');


const mnemonicToXpub = (mnemonic: string) => {
    const bip32 = BIP32Factory(ecc);
    const seed = mnemonicToSeedSync(mnemonic, '');
    const master = bip32.fromSeed(seed);
    const xpub = master
      .derivePath(RootPathWithoutIndex)
      .neutered();
    const xpubBase58 = xpub.toBase58()
    return xpubBase58;
  }

const mnemonicToWallet = (mnemonic: string, addressCount: number) => {
    const secrets = new wasm.SecretKeys();
    const seed = mnemonicToSeedSync(mnemonic);
    const pubs: Array<string> = []
    const master = bip32.fromSeed(seed);
    for(let index=0; index < addressCount; index ++){
        const path = calcPathFromIndex(index);
        const extended = bip32.fromSeed(seed).derivePath(path);
        const secret = wasm.SecretKey.dlog_from_bytes(
           extended.privateKey ? extended.privateKey : Buffer.from(''),
        );
        pubs.push(Buffer.from(secret.get_address().content_bytes()).toString("hex"));
        secrets.add(secret);
    }
    return {
        wallet: wasm.Wallet.from_secrets(secrets),
        pubs,
        xpub: mnemonicToXpub(mnemonic)
    }
}
const exec = () => {
    const mnemonics = [
        "traffic earn page middle purpose wool salmon priority soldier seminar speak dizzy atom kangaroo rent",
        "divide decide goat excite father page scheme mesh magic beauty pipe minimum rough render secret",
        "mutual cheap barely dog prepare this draft evidence rely rice bag hurt almost put drill",
        "ski display venture enter latin assault heart hover rose can resist imitate kite tattoo super"
    ]
    const reducedBase64 = "5wMBL7Ullx+UtfT6T/piOn0dx8W0yCkpoXljh1EVwnQNeI4AAAAAA4CU69wDEAUEBgjNAoLYmK8tjSGMpJFevjyP5MbKoHVIUUmFhD0N3R2hVUceCM0DAT/XKB1mXbDDOotoO6k5rrNrZgWb4bRwVHPZEz78yE0IzQPCNJPc/PGKaFyC4LqjX3lCV+On75j9oux6AQZ/zpowlQjNA/GLN8R2OTy3zN2McUfbBIrH3q1Do+hPgaQcq4Unxd/WmHMAgwQIcwFzAnMDcwSqrkEAAKCigcMhEAUEBgjNAoLYmK8tjSGMpJFevjyP5MbKoHVIUUmFhD0N3R2hVUceCM0DAT/XKB1mXbDDOotoO6k5rrNrZgWb4bRwVHPZEz78yE0IzQPCNJPc/PGKaFyC4LqjX3lCV+On75j9oux6AQZ/zpowlQjNA/GLN8R2OTy3zN2McUfbBIrH3q1Do+hPgaQcq4Unxd/WmHMAgwQIcwFzAnMDcwSqrkEAAOCRQxAFBAAEAA42EAIEoAsIzQJ5vmZ++dy7rFWgYpXOhwsHApv82y3OKNlZ8oFbFvgXmOoC0ZKjmozHpwFzAHMBEAECBALRloMDAZOjjMeypXMAAAGTwrKlcwEAdHMCcwODAQjN7qyTsaVzBKquQQAAmAMEzQJx95oYGNXQ9LdemlR55nDiUxyQ5kpIvWiTSGNuUN/jHM0CfYWYxiSE43qf9Kf/In3pOVL004D5ORRP48XPfmuzMIzNAtRfgdBk7HV+lPBAhEqrzz2PDi97ccTOPYV1uyLq/gZDzQOFsMAp13eMi800aP6fKxnlta6G1y5BB1gF54dkamzfUQAA"
    const boxesBase64 = [
        "gMivoCUQBQQGCM0CcfeaGBjV0PS3XppUeeZw4lMckOZKSL1ok0hjblDf4xwIzQJ9hZjGJITjep/0p/8ifek5UvTTgPk5FE/jxc9+a7MwjAjNAtRfgdBk7HV+lPBAhEqrzz2PDi97ccTOPYV1uyLq/gZDCM0DhbDAKdd3jIvNNGj+nysZ5bWuhtcuQQdYBeeHZGps31GYcwCDBAhzAXMCcwNzBIrxLQAAkIe+Zp9j6RfrubmUWvd3vOmGoFVvnlScFq4qw3D7gS8A",
    ]
    const boxes = wasm.ErgoBoxes.empty()
    boxesBase64.forEach(item => boxes.add(wasm.ErgoBox.sigma_parse_bytes(Buffer.from(item, "base64"))))
    const wallets = mnemonics.map(item => mnemonicToWallet(item, 3));
    const reduced = wasm.ReducedTransaction.sigma_parse_bytes(Buffer.from(reducedBase64, "base64"))
    
    const publicData = {}
    const privateData = {}
    const hints = wallets.slice(0, 3).map(item => {
        const cur = extractCommitments(item.wallet.generate_commitments_for_reduced_transaction(reduced), reduced.unsigned_tx().inputs().len())
        publicData[item.xpub] = cur.public.to_json()
        privateData[item.xpub] = cur.private.to_json()
        return cur 
    })
    // write public data to file named public.json
    fs.writeFileSync('public.json', JSON.stringify(publicData, undefined, 4));
    fs.writeFileSync('private.json', JSON.stringify(privateData, undefined, 4));

    const allHints = wasm.TransactionHintsBag.empty()
    const emptyWallet = wasm.Wallet.from_secrets(new wasm.SecretKeys())
    const signHints = wasm.TransactionHintsBag.empty()
    const signHintsTmp = wasm.TransactionHintsBag.empty()
    for(let inputIndex=0; inputIndex < reduced.unsigned_tx().inputs().len(); inputIndex ++){
        hints.map((hint) => {
            signHints.add_hints_for_input(inputIndex, hint.public.all_hints_for_input(inputIndex));
        })
    }
    const txSim = emptyWallet.sign_reduced_transaction_multi(reduced, signHints);
    const simulated = new wasm.Propositions();
    wallets[3].pubs.forEach(element => simulated.add_proposition_from_byte(Buffer.from('cd' + element, "hex")));
    const signed = new wasm.Propositions();
    const extracted = wasm.extract_hints(txSim, fakeContext(), boxes, wasm.ErgoBoxes.empty(), signed, simulated)
    console.log(extracted.to_json().publicHints['0'][0].pubkey, wallets[3].pubs)
    const simulatedHints = JSON.stringify(extracted.to_json(), undefined, 4);

    // for(let inputIndex=0; inputIndex < reduced.unsigned_tx().inputs().len(); inputIndex ++){
    //     hints.map((hint, hintIndex) => {
    //         signHints.add_hints_for_input(inputIndex, extracted.all_hints_for_input(inputIndex))
    //         signHintsTmp.add_hints_for_input(inputIndex, extracted.all_hints_for_input(inputIndex))
    //     })
    // }
    // console.log(signHintsTmp.to_json().publicHints, wallets.slice(0, 3).length)

    // Sign transaction
    wallets.slice(0, 3).map((wallet, walletIndex) => {
        const signHints = wasm.TransactionHintsBag.empty()
        const simulatedHintsObjects = wasm.TransactionHintsBag.from_json(simulatedHints);
        for(let inputIndex=0; inputIndex < reduced.unsigned_tx().inputs().len(); inputIndex ++){
            hints.map((hint, hintIndex) => {
                signHints.add_hints_for_input(inputIndex, hint.public.all_hints_for_input(inputIndex));
                if(hintIndex === walletIndex){
                    signHints.add_hints_for_input(inputIndex, hint.private.all_hints_for_input(inputIndex));
                }
                signHints.add_hints_for_input(inputIndex, simulatedHintsObjects.all_hints_for_input(inputIndex))
                // signHints.add_hints_for_input(inputIndex, extracted.all_hints_for_input(inputIndex))
            })
        }
        // console.log(walletIndex, signHints.to_json().publicHints)
        const tx = wallet.wallet.sign_reduced_transaction_multi(reduced, signHints);
        const simulated = new wasm.Propositions();
        wallets[3].pubs.forEach(element => simulated.add_proposition_from_byte(Buffer.from('cd' + element, "hex")));
        const signed = new wasm.Propositions();
        wallet.pubs.forEach(element => signed.add_proposition_from_byte(Buffer.from('cd' + element, "hex")));
        const extracted = wasm.extract_hints(tx, fakeContext(), boxes, wasm.ErgoBoxes.empty(), signed, simulated)
        for(let inputIndex=0; inputIndex < reduced.unsigned_tx().inputs().len(); inputIndex ++ ){
            allHints.add_hints_for_input(inputIndex, extracted.all_hints_for_input(inputIndex));
            // console.log('yo', allHints.all_hints_for_input(inputIndex).len())
        }
        // console.log(JSON.stringify(extracted.to_json(), undefined, 4));
    })
    // console.log(JSON.stringify(allHints.to_json(), undefined, 4));
    const signer = wasm.Wallet.from_secrets(new wasm.SecretKeys());
    const tx = signer.sign_reduced_transaction_multi(reduced, allHints)
    // console.log("=================")
    // console.log(tx.to_json())
    console.log(wasm.verify_tx_input_proof(0, fakeContext(), tx, boxes, wasm.ErgoBoxes.empty()))
}

export default exec;
exec();