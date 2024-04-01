import { mnemonicToSeedSync } from "bip39"
import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { extractCommitments } from "./multiSig/utils";
import fakeContext from "./multiSig/fakeContext";
const bip32 = BIP32Factory(ecc);
const RootPathWithoutIndex = "m/44'/429'/0'/0";
const calcPathFromIndex = (index: number) => `${RootPathWithoutIndex}/${index}`;

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
        pubs
    }
}
const exec = () => {
    const mnemonics = [
        "traffic earn page middle purpose wool salmon priority soldier seminar speak dizzy atom kangaroo rent",
        "divide decide goat excite father page scheme mesh magic beauty pipe minimum rough render secret",
        "mutual cheap barely dog prepare this draft evidence rely rice bag hurt almost put drill",
        "ski display venture enter latin assault heart hover rose can resist imitate kite tattoo super"
    ]
    const reducedBase64 = "iQQCKuMr8Jq2SSCI6LPCcULMaQjV1AUG4ytkB9eRtIGBbdAAAH3wHMwFG1FRWK+8HhFqXq2tIVS06LKtuOoDO/agrxnVAAAAAAOA5JfQEhAFBAgIzQJx95oYGNXQ9LdemlR55nDiUxyQ5kpIvWiTSGNuUN/jHAjNAn2FmMYkhON6n/Sn/yJ96TlS9NOA+TkUT+PFz35rszCMCM0C1F+B0GTsdX6U8ECESqvPPY8OL3txxM49hXW7Iur+BkMIzQOFsMAp13eMi800aP6fKxnlta6G1y5BB1gF54dkamzfUZhzAIMECHMBcwJzA3ME+No/AADA2s6EGhAFBAgIzQKC2JivLY0hjKSRXr48j+TGyqB1SFFJhYQ9Dd0doVVHHgjNAwE/1ygdZl2wwzqLaDupOa6za2YFm+G0cFRz2RM+/MhNCM0DwjST3PzximhcguC6o195Qlfjp++Y/aLsegEGf86aMJUIzQPxizfEdjk8t8zdjHFH2wSKx96tQ6PoT4GkHKuFJ8Xf1phzAIMECHMBcwJzA3ME+No/AADgkUMQBQQABAAONhACBKALCM0Ceb5mfvncu6xVoGKVzocLBwKb/NstzijZWfKBWxb4F5jqAtGSo5qMx6cBcwBzARABAgQC0ZaDAwGTo4zHsqVzAAABk8KypXMBAHRzAnMDgwEIze6sk7GlcwT42j8AAJYEzQKC2JivLY0hjKSRXr48j+TGyqB1SFFJhYQ9Dd0doVVHHs0DAT/XKB1mXbDDOotoO6k5rrNrZgWb4bRwVHPZEz78yE3NA8I0k9z88YpoXILguqNfeUJX46fvmP2i7HoBBn/OmjCVzQPxizfEdjk8t8zdjHFH2wSKx96tQ6PoT4GkHKuFJ8Xf1gCWBM0CgtiYry2NIYykkV6+PI/kxsqgdUhRSYWEPQ3dHaFVRx7NAwE/1ygdZl2wwzqLaDupOa6za2YFm+G0cFRz2RM+/MhNzQPCNJPc/PGKaFyC4LqjX3lCV+On75j9oux6AQZ/zpowlc0D8Ys3xHY5PLfM3YxxR9sEisferUOj6E+BpByrhSfF39YAAA=="
    const boxesBase64 = [
        "oJaTuQcQBQQICM0CgtiYry2NIYykkV6+PI/kxsqgdUhRSYWEPQ3dHaFVRx4IzQMBP9coHWZdsMM6i2g7qTmus2tmBZvhtHBUc9kTPvzITQjNA8I0k9z88YpoXILguqNfeUJX46fvmP2i7HoBBn/OmjCVCM0D8Ys3xHY5PLfM3YxxR9sEisferUOj6E+BpByrhSfF39aYcwCDBAhzAXMCcwNzBILjPgAA6wfmvXuU2ANcwB/jALdcuO5qszu+ByFz7k5lPfsEApYB",
        "gLqWnCUQBQQICM0CgtiYry2NIYykkV6+PI/kxsqgdUhRSYWEPQ3dHaFVRx4IzQMBP9coHWZdsMM6i2g7qTmus2tmBZvhtHBUc9kTPvzITQjNA8I0k9z88YpoXILguqNfeUJX46fvmP2i7HoBBn/OmjCVCM0D8Ys3xHY5PLfM3YxxR9sEisferUOj6E+BpByrhSfF39aYcwCDBAhzAXMCcwNzBI7jPgAAjW8q0M9arRsqd6jF0R0NT+POvS7eqz/1wZKPf5PztH4B"
    ]
    const boxes = wasm.ErgoBoxes.empty()
    boxesBase64.forEach(item => boxes.add(wasm.ErgoBox.sigma_parse_bytes(Buffer.from(item, "base64"))))
    const wallets = mnemonics.map(item => mnemonicToWallet(item, 2));
    const reduced = wasm.ReducedTransaction.sigma_parse_bytes(Buffer.from(reducedBase64, "base64"))
    const hints = wallets.map(item => {
        const cur = extractCommitments(item.wallet.generate_commitments_for_reduced_transaction(reduced), reduced.unsigned_tx().inputs().len())
        console.log(cur.public)
        return  cur
    })
    const allHints = wasm.TransactionHintsBag.empty()
    // Sign transaction
    wallets.map((wallet, walletIndex) => {
        const signHints = wasm.TransactionHintsBag.empty()
        for(let inputIndex=0; inputIndex < reduced.unsigned_tx().inputs().len(); inputIndex ++){
            hints.map((hint, hintIndex) => {
                console.log(JSON.stringify(hint.public.to_json(), undefined, 4));
                signHints.add_hints_for_input(inputIndex, hint.public.all_hints_for_input(inputIndex));
                if(hintIndex === walletIndex){
                    signHints.add_hints_for_input(inputIndex, hint.private.all_hints_for_input(inputIndex));
                }
            })
        }
        const tx = wallet.wallet.sign_reduced_transaction_multi(reduced, signHints);
        const simulated = new wasm.Propositions();
        const signed = new wasm.Propositions();
        wallet.pubs.forEach(element => signed.add_proposition_from_byte(Buffer.from('cd' + element, "hex")));
        const extracted = wasm.extract_hints(tx, fakeContext(), boxes, wasm.ErgoBoxes.empty(), signed, simulated)
        for(let inputIndex=0; inputIndex < reduced.unsigned_tx().inputs().len(); inputIndex ++ ){
            allHints.add_hints_for_input(inputIndex, extracted.all_hints_for_input(inputIndex));
        }
        // console.log(JSON.stringify(extracted.to_json(), undefined, 4));
    })
    // console.log(JSON.stringify(allHints.to_json(), undefined, 4));
    const signer = wasm.Wallet.from_secrets(new wasm.SecretKeys());
    const tx = signer.sign_reduced_transaction_multi(reduced, allHints)
    // console.log("=================")
    // console.log(tx.to_json())
}

// run exec function
exec();

export default exec;