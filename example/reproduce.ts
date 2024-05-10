import { mnemonicToSeedSync } from 'bip39';
import { sign, constants } from 'crypto';
import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';
import * as wasm from 'ergo-lib-wasm-nodejs';
import axios from 'axios';
import { extractCommitments } from './multiSig/utils';
import {writeFileSync, readFileSync, existsSync, mkdirSync} from 'fs'
import fakeContext from './multiSig/fakeContext';
const bip32 = BIP32Factory(ecc);
const RootPathWithoutIndex = "m/44'/429'/0'/0";
const calcPathFromIndex = (index: number) => `${RootPathWithoutIndex}/${index}`;

const baseUrl = 'http://10.10.9.10:3000'
const instance = axios.create({baseURL: baseUrl});
const mnemonics = [
    "traffic earn page middle purpose wool salmon priority soldier seminar speak dizzy atom kangaroo rent",
    "divide decide goat excite father page scheme mesh magic beauty pipe minimum rough render secret",
    "mutual cheap barely dog prepare this draft evidence rely rice bag hurt almost put drill",
    "ski display venture enter latin assault heart hover rose can resist imitate kite tattoo super"
]

const keys = [
    {
        priv: 'MIIEpQIBAAKCAQEAv9GKfS/3E4r6XJSmM1ccJxA9d4rT9HJitKjEk8XRE4io+hX4Z7taSmVlNm2XNbaTiR4wEFOtn4fcYmR3V264q74tKMcOeUwF909gywuD40S6XRbBuzN+cKPM42FL5tV5+gIOzWHLK4gBCqWC+VNhPI3+yoNAlqdMJ7EToaIPcTGxgqzt/g7dUI3cUtCoS3ZIFPq42FARN1A9biuqo+pDPwWFedtODoGTFU+CKjWM3F7ZZEzUwbZeZZNK/7/Rkhy0ZYEs3M3WcGzrp+Qjxfebi219sVsVIMpqaAgGWQIVpdY14IVyWuZeTUbAiM5HCi8ax3bLpal4MeIRgyW+3Gv0FQIDAQABAoIBAAYu2nBzmdrC6ZQPZJYWEj2+G8UdL/zarQzWvdNnlngzOQMqryGk2+G3B/6rpKqiEnpigzkbgWa5ieSQCXrDgmdiz3DXjcNiLHUO1XdmDR/HyNwUTjVbERHPbdzMd5ZevjpNU63SH6rtDN+Lez/PLLy3dQWRGoVgqidDYXcd0rKa0ayuXx/koUhrpDdx4RgKJ5U6abse1asgiEBB28QxHrsta6faQ6T73vUJLy90Q02x3jw8zP0qA1cAjRgNngMU6gHodF1/odBJsVmL4EAVW2OsOonl9+XkIDYkwzt7aoZ9MkoOX2pZ+ObmMutSqaI0+OczO7lKBXlFFG3sN5O6nOECgYEA2a+YR/eYOyjlHoqiVrM42YW0bjgb73axR+x9F1fxVMQP8w/x9c/VEhNOpcOsu7bnWNd5bdrQmpiKHphUjcMTnP+W7XCUHmMVkzYJ5y3Ae1+JqKabznhz3ovNLBOFr8c3XOiGld0gbp4LAeFBeQ2ewWMLk1JMMZL70SXeCT+5//ECgYEA4ZRsWSmyaoaOEHqsKbwzimKt+AkE9NvNYxT3leVnhVFQes95EZCXi91zDKzjP8q9fnoov41IOdTtDBiQR0yHqBzYlRrpZag2fPPa3gQOOsSBll/wMr1rzTTB7TT8q3C9p61TsXGrH7/SwuStWP/xtOzqWcUBNIdxphj5ulhDmmUCgYEAqL/KmN+DDzlghBCMUBGXHGjduiOc5EFqpIrbXeE6n69tfcr6kseOMPjumunZWZssNF61L0fVNkLRr23+/fYfmjE4WtBOwk+lRf06KA/7iqhBGpAtcB1IFVjisCxiEiWo8UkAK+TDY3z4o3hvPNwmGVwieQ3vKu76buOgACN6mMECgYEArgEohqq0VpmOUkXeMZ9b/n5aBb8nVJ2MU8ajqLu5W8w6kVEi6ZqoW5opmfhunxGLlFk0v3WC5iFJ7Q+xk14EMnh11KZarTDRPxd3l9R3CXv1HgLJLMqSskrk4E4ELVac5Q+9RF4TCz2TnQR6dvGPB+nMaAyf/l4QG3iegdB97UUCgYEAt6s5ibKyVtuWpZ0VZIGdAyWlwHZ/sdcvlV9jugJHMZLFMrk+VIRSrqe9fG3vxCPeqEO2KLFjV5IBoFGNh8EK3To2JXLul8idP9RyyXSp4AQwJt2e+EzGelNBZ5kXecesxAFl1aS2DPT5X9DrVOBvjTf5Cj1dxStC1cYYMJUYtqU=',
        pub: 'MIIBCgKCAQEAv9GKfS/3E4r6XJSmM1ccJxA9d4rT9HJitKjEk8XRE4io+hX4Z7taSmVlNm2XNbaTiR4wEFOtn4fcYmR3V264q74tKMcOeUwF909gywuD40S6XRbBuzN+cKPM42FL5tV5+gIOzWHLK4gBCqWC+VNhPI3+yoNAlqdMJ7EToaIPcTGxgqzt/g7dUI3cUtCoS3ZIFPq42FARN1A9biuqo+pDPwWFedtODoGTFU+CKjWM3F7ZZEzUwbZeZZNK/7/Rkhy0ZYEs3M3WcGzrp+Qjxfebi219sVsVIMpqaAgGWQIVpdY14IVyWuZeTUbAiM5HCi8ax3bLpal4MeIRgyW+3Gv0FQIDAQAB'
    }, {
        priv: 'MIIEowIBAAKCAQEAr6yjc8ZwYQyscn2K4EMoBS3jupbskrVlxAlrkTE33hDC+hzZ5D+tIMzMgQx946yhk6HlfCqDyKajym4/m4vWRIO2rMPtsY+1rRbt7siplfPXQv6Nc5HPPyyhfqvrysfUU/UZN1KXzm1UvP7kVzDPosPLNkKpmCoHPF6NgOWrOtjHVzzw6c3d1jQrt4fG/R7AyBClxymgQ85nX+WJ2pLaEFuUxDYzdSEKZyEqnP1WpoSVaUQGUgmP3rRHTSHOXGH5f+3MeOeGlO5F8qxE0mWPILPNLnCuzv+rLGIaAB9vvOQ2kJPilAzwFv9jAdPcRFZLmzrJ4wc1swCyfnZMYLIBfQIDAQABAoIBABJbj48bJwY1PVYPgXIzAl0cMQaAHAOuug40z81R390wUjexySE9eDmLvTklFYizswTK78C8bp4Kr+YJBFOcVs09GFtQdCfQdTM7yKxhwrr9Srrg/+YaUBZxcwTaMV80557IZ5Ss6Fk1epvvZOwpmSEQpc0rRS62AaCQ3uef2HdjIIsu/IzGG/YHmXdxU+UW3QBAEQmF8e/QfnBhzzKmKSf8NWu4CCGEPBD3FoETL9mXhTFbeGWgzcAp0xamweAQzu7VjshrW3xuhJUten5EA9TXVT5Et0T514w0tI1FdBGUoRtR8fhx9h1mZc5GTJZTKVPl6xzHf5gwOFnDB+JHy48CgYEA1DiX7Na6noDwgxYAc8xXcCEOBbEvE1mViErwZyb3J0/1qQL4UxfMjNfk6dWT6MBlhXEv3iHu96oA6RnysllLddK0MCLQyJRW9nQ+p11Erj0kUwgARbMuVp47pYY8zXAUzERC5Ntlyg9t57YjeZIzTnIwJhqAGTbCpqOHXYdzmpsCgYEA0+oDBN5TTwcUsLjmKkynnPEO8zw8/uWbtuvUbLdoWERICexvxCjCbFtmz9PtWQLyTq3o6r/ckPSNkSG25JVelXutd44F/9GHZ5QII7NF6zrgApqLV37MBXmjOKZLBl3BPbSDLqNBUmyNFOxAt3ONcVYmizxUCR2CMH0c4wZWKccCgYARQnEIsAYJcg8deiKbSFksI2QSjnB3sGd66C1ZFlAvgE9IaZdsmpjmM4DIi7g1y7/19FiiRjw7JDZivtuAKcb7VCGXcJ1uUrIn5RhbYDh/uzVDE3mCMappHQFY2uwDAUSPwFV4a2eB4XNczvFfp8ZIcPz9fFZCtrNp/g66SpPaVQKBgQC1tpNyKEadnH/EbjiHiwWrURW1wzC2jiLxPtX/h2IFVj/DqqfIN/9HtTS6/4ol6p3mk8AHFBBJiDqgeZ1/8wmQ+uWrf/BrBburOMel/UL2S5zs/qJ/m23NQBmTKR1qTxi2FcTrR/hqekSb7V4tMPvXdL1GZavVySTq+U286qEV3wKBgDODYc8DpdksNLD0kgD8802uqAr36eEJSyhZJdo5Pn7PfgUyXUIyNiFfcmMtNjPSVRg9++gh9VShHRMt9eWD77Uez8dtTE88CO5hCj7bA59bqp2rpKztXC6ObJkh0mjeefTtGvup9+/weKf9Ct1M83PZlO/5ZqloWV0Wf4rChsaI',
        pub: 'MIIBCgKCAQEAr6yjc8ZwYQyscn2K4EMoBS3jupbskrVlxAlrkTE33hDC+hzZ5D+tIMzMgQx946yhk6HlfCqDyKajym4/m4vWRIO2rMPtsY+1rRbt7siplfPXQv6Nc5HPPyyhfqvrysfUU/UZN1KXzm1UvP7kVzDPosPLNkKpmCoHPF6NgOWrOtjHVzzw6c3d1jQrt4fG/R7AyBClxymgQ85nX+WJ2pLaEFuUxDYzdSEKZyEqnP1WpoSVaUQGUgmP3rRHTSHOXGH5f+3MeOeGlO5F8qxE0mWPILPNLnCuzv+rLGIaAB9vvOQ2kJPilAzwFv9jAdPcRFZLmzrJ4wc1swCyfnZMYLIBfQIDAQAB'
    }, {
        priv: 'MIIEpQIBAAKCAQEAl9eirDLvq2zqJ7esWayoFgyWLRcGdYWo1fTbat6sV1LOSbLlGsoGZRFrkJREmwDRTMtRhgxV+o3463V0VjGqlhOPPdGH8OYsleB+x9ox9JTcqggmqO7ifbXuJWiccgX6xzuwa8dhuy05zMq0A64qO5XkWv1E2huyaXS534iYMce3splvs/Z6jIlXlgliqji6uzZVv14fwv/3bM4AxC9nU5uMZ2P6oZoTeVxvxPWJ/4P1gaNcEtw0bYtPH9J63cIJ+7GveS2tbdL83IMf20ciZ4CoJxf13BAw6jufHHcmvlnU/tUqWRiQV+VeWNTVtSdjxs7TKeX4nDyvFq1j4zh86wIDAQABAoIBADqbZPLhICfC/KgC2VetcB0+k3Jo6jnPMqkOfuhDdTKpR+0jSxGpe4lkDWf7CnXnfWGOMnOybDcuuC6toY8pUWXmu8mJB9bgCMJ6qYSa/+Ae2wMX7VAUEECkSXyP4Z6TF0XyEHixNtQnsyEL9ipbfXqNMtw52Gr0+MqCXsHcN54ylwF1J/FrjY0jAeKVeIHl2+/niNDx/T90ywy0rGBZcdfDQgDd6qujGhuCngXo2O3DcEDX+aN8953m8mjnbvmWsLI1SXwbVRwrjP0STZWZ65gkfELzC80ZmP+yq7TtUjFBF9FHqBy+FHQXIO+RRCKAUMu0Fpmh8ee2cDhd/KqARgUCgYEA0fJAYnDD+V0kYQpgOqaSn1KGE1kvpPN2pyHfSa2XSu41ns7qibaeOrKVESSj/S33BpPxUh4dF3tl8Dzd9cD4tLtHaCXJ3ZsbOhJ+SPcv9KDR7I/mhn3covTFgJo66R784db++l31hjc09/33UeTuRmDxePJKTd8IP54g39JRHyUCgYEAuSZ/CiZS6llfhKExffZ/r80mEtGCl+HMVfXK5K4p8ETmji86c5Q6qVdUty3k0YEipiE4luhwZ+TGvKX2Ex3FgnsJoIcfPnqzA0j54KH/1tizeaMCtjbVilAAa48p79JEBH48Dh/SQG1GMPaBKMsFkE3yQg7BuByPg7LMuB7Mts8CgYEAq4OhHcrKD1oMckqrur6CYi5k4kGmLrfHY1rEs8hhJRHeNFMOQFs0gPeL2Gl6n0eB25nZOCDp21kwOkc/fZmclOm6uFbGx4gDgjnBeZKXVt5bIUueJJmGOoqFHz7gibqLFWUzAQ7pmjBX0ZFlDz5bepuQKiKmmV9vualRagjDxRECgYEAm6fym9zWTnDurbk6u5RVir3k6WM78GaDfC0U8yY82eODFTw9XtfabW2fKhUqTrvLHnHFepFVlvKt5gF8nFumJek8kbmnmcZb40Ih2Sk4xi4OzQ8vg3McGZjikYqdjiJuznw2DwXPpBx6K0XCFkKAne354nE3iYpxWR4joBM8td8CgYEAtSQyrOc9SiV9wRRpzx3XB9srH+Hx5r55BUfgrwgGzo92G6Bw9amLaOIw775IB1kQgp4h06kJiU6b4lNKfRTJkqrV3sz8dKu9xJv1poD2jjtarGpy0mMC9vJBF52sQNOhjB6DxnUqhlTPNfYMupVZe94V2xgD+eG1jAy0OrjfRwI=',
        pub: 'MIIBCgKCAQEAl9eirDLvq2zqJ7esWayoFgyWLRcGdYWo1fTbat6sV1LOSbLlGsoGZRFrkJREmwDRTMtRhgxV+o3463V0VjGqlhOPPdGH8OYsleB+x9ox9JTcqggmqO7ifbXuJWiccgX6xzuwa8dhuy05zMq0A64qO5XkWv1E2huyaXS534iYMce3splvs/Z6jIlXlgliqji6uzZVv14fwv/3bM4AxC9nU5uMZ2P6oZoTeVxvxPWJ/4P1gaNcEtw0bYtPH9J63cIJ+7GveS2tbdL83IMf20ciZ4CoJxf13BAw6jufHHcmvlnU/tUqWRiQV+VeWNTVtSdjxs7TKeX4nDyvFq1j4zh86wIDAQAB'
    }, {
        priv: 'MIIEpAIBAAKCAQEA5KnsPdR6KJoAf+gAqcFqw9SbKz/n53MFpm9afQCVO6Xb6FWdwkcmu1pqioap9Mh5CtmkolS8B0x8aJ3zv2APdGtTzeoQnLxyrU7oICyCdLIJgVrU/y1Wk3w+oKbSiFHGWywik17CMSpYTPnG/V71XOgom5xM0dUrB98dNAFpVuERVGH5qiws4bI+BuuyLKc7AkduXz9d/QZn8ka68chFak+75s0umO+uWO/oF7UHNaAIfhgXdpNQOVqfmJW51W4ju5Py2IXakkx5J6RmMqQbxroMMMzGTjyH68FyBcMobCefpuane1wAXkWs3S8LcqrXilHV5Dq0ejWe+nbJX7Ap3wIDAQABAoIBAAeFkdBxQww/QwSLsV6w9ReFNw5G9BSIYEdnfFBTJGJc6o0lW9Yky9P35Ajm5+pPoEoVR+jrGD0cbMjVAUw3SoR0dcJDqjfUEk8773JqsTPjgC2+h8K8T0L0uet3V8LFZdzHG+NBh7b6tjYTm7iz8FnioFgi3eGjihHTngm0gWGRLKC3rGcQvlvaf9eUrAQE2PDsUlTDSlHhUeC47GaJdzV4gEQHgQ0i3Ad2LM4vGkiFxwfreUlKPQzyC0gDjh4kauC27p8Siz/CqGsJM0DhQTq8kBQvn+AJl6UIJppbc9OpQxM4HnR4O5TGqNOkxn84ZtN4iknzmsKZ7sIzrpBWw4ECgYEA9zN5O2IW4R4McA1eUYmJXprThx4KeUI1JQJ/bfC0pNrS1zB0Ax9VVwWumky5Pd+MbXZ1l4OBezgAiVj6R65B5LpG6776+30q1CmI6vYriDM5sCIXTGTleAuyDG21deyBQG2Ld0CkeNsZjuTFtjge2MbgwH3s4IswOKUiApMBJcECgYEA7M2I+DDo4XveXY6d4lMScSczrV3AXeGkzoJ7PTQPT6b2pJJ3QFisIkb/6ZjVrwSzx8NXZuXNamruwgxZwwiXNpT5+2P6jX1DECopRPtiKtcYMNa32Ax1SS5K9RoHsMBbl1XbVX6JQi95EP2cyD/5T3T540CyZTYFsIMRkYatd58CgYARLl+vs+qZLOh6ZUN38VI95A7tpjXeJa7h6qGGt6Mmjhr3X+PAT84zpS50hP6fAUmWVhRoOnimYscOxMNodgEYb6X8PqLdFd8DLfvZMNDnv3+z8TqjUaPtSwrN+FYTYyO8oaB+4lxMFhZZqybeulnSgUgfuODc3m+0kC2j9imvQQKBgQDVEE3YOnGfSEuYVFT8qZAjXYliyMLn9bnK0Z4/QFMycODkzKAdtmsS4F0seoZxVkLIT5uZitUbliFDWcd984HS65JNPfTXT8iCh9zgI2t9blFmyBtcekEhWlS5WfVndHw0m1yg/RxU/8/nmLlzeBRDCNY6QiEBbe0Kl7O8A7iaswKBgQDKD0GlTMiBmd1l59deZjxg0OLB8vJY+LtwDUQiGn9QNr2AknOqLTsQ4PlMzaOdpduBvgH+yWNAWyTuZOCUhbYloV0nptLpI3yqcLQO5TRF/apJeyqsBtZdf6LWJixZNP/H70MpAuP6Tjwap1T9MeXKeq1O5o0QWTwkQ1m1HMc3Hg==',
        pub: 'MIIBCgKCAQEA5KnsPdR6KJoAf+gAqcFqw9SbKz/n53MFpm9afQCVO6Xb6FWdwkcmu1pqioap9Mh5CtmkolS8B0x8aJ3zv2APdGtTzeoQnLxyrU7oICyCdLIJgVrU/y1Wk3w+oKbSiFHGWywik17CMSpYTPnG/V71XOgom5xM0dUrB98dNAFpVuERVGH5qiws4bI+BuuyLKc7AkduXz9d/QZn8ka68chFak+75s0umO+uWO/oF7UHNaAIfhgXdpNQOVqfmJW51W4ju5Py2IXakkx5J6RmMqQbxroMMMzGTjyH68FyBcMobCefpuane1wAXkWs3S8LcqrXilHV5Dq0ejWe+nbJX7Ap3wIDAQAB'
    }
]

interface HintPk {
    hint: string;
    pubkey: {
        op: string;
        h: string;
    },
    secret?: string;
    type: string;
    a: string;
    position: string;
}

interface HintBag {
    secretHints: {
        [key: string]: Array<HintPk>;
    }
    publicHints: {
        [key: string]: Array<HintPk>;
    }
}

const mnemonicToWallet = (mnemonic: string, addressCount: number) => {
    const secrets = new wasm.SecretKeys();
    const seed = mnemonicToSeedSync(mnemonic);
    const pubs: Array<string> = [];
    const secretsBytes: Array<string> = [];
    const master = bip32.fromSeed(seed);
    for(let index=0; index < addressCount; index ++){
        const path = calcPathFromIndex(index);
        const extended = bip32.fromSeed(seed).derivePath(path);
        const secret = wasm.SecretKey.dlog_from_bytes(
           extended.privateKey ? extended.privateKey : Buffer.from(''),
        );
        secretsBytes.push(extended.privateKey?.toString("hex") ?? '');
        pubs.push(Buffer.from(secret.get_address().content_bytes()).toString("hex"));
        secrets.add(secret);
    }
    return {
        wallet: wasm.Wallet.from_secrets(secrets),
        pubs,
        secrets: secretsBytes,
        xpub: master.derivePath(RootPathWithoutIndex).neutered().toBase58()
    }
}

const signWithWallet = (index: number, data: Buffer): string => {
    const w = mnemonicToWallet(mnemonics[index], 1);
    const secret = wasm.SecretKey.from_bytes(Buffer.from(w.secrets[0], "hex"))
    return Buffer.from(
        w.wallet.sign_message_using_p2pk(secret.get_address(), data)
    ).toString("base64");
}

const signWithPk = (index: number, data: Buffer): string => {
    const signature = sign(
        'sha256',
        data,
        {
            key: Buffer.from(keys[index].priv, "base64"),
            format: 'der',
            type: 'pkcs1',
            padding: constants.RSA_PKCS1_PSS_PADDING,
        })
    return signature.toString('base64');
}

const registerPK = async (index: number) => {
    const pub = keys[index].pub
    const w = mnemonicToWallet(mnemonics[index], 1);
    const sign = signWithWallet(index, Buffer.from(pub, "base64"))
    const res = await instance.post('addPk', {
        "pub": pub,
        "xpub": w.xpub,
        "signature": sign
    })
    // console.log(res.data);
}

const registerTeam = async (index: number) => {
    const xpubs = mnemonics.map(mnemonic => {
        const w = mnemonicToWallet(mnemonic, 1);
        return w.xpub
    });
    const w = mnemonicToWallet(mnemonics[index], 1);
    const data = {
        name: "team1",
        xpubs,
        m: 3,
        xpub: xpubs[index],
    }
    const signature = signWithWallet(index, Buffer.from(JSON.stringify(data), 'utf-8'))
    const res = await instance.post('addTeam', {...data, signature})
    // console.log(res.data)
    return res.data.teamId;
}

const getTeams = async (index: number) => {
    const w = mnemonicToWallet(mnemonics[index], 1);
    const data = {
        xpub: w.xpub,
        pub: keys[index].pub
    }
    const signature = signWithPk(index, Buffer.from(JSON.stringify(data), "utf-8"))
    const res = await instance.post("getTeams", {...data, signature});
    return res.data
}

const addTx = async (index: number, teamId: string, reduced: string, boxes: Array<string>, dataBoxes: Array<string>) => {
    const w = mnemonicToWallet(mnemonics[index], 1);
    const data = {
        reducedTx: reduced,
        xpub: w.xpub,
        pub: keys[index].pub,
        teamId: teamId,
        inputBoxes: boxes,
        dataInputs: []
    }
    const signature = signWithPk(index, Buffer.from(JSON.stringify(data), "utf-8"))
    const res = await instance.post("addReducedTx", {...data, signature})
    // console.log(res.data);
    return res.data.reducedId
}

const getTxs = async (index: number, teamId: string) => {
    // const teamId = '66111f2ead105af647c14c44';
    const w = mnemonicToWallet(mnemonics[index], 3);
    const data = {
        xpub: w.xpub,
        teamId,
        pub: keys[index].pub
    }
    const signature = signWithPk(index, Buffer.from(JSON.stringify(data), "utf-8"))
    const res = await instance.post("getReducedTxs", {...data, signature})
    // console.log(res.data)
    return res.data;
}


const getTx = async (index: number, txId: string) => {
    const w = mnemonicToWallet(mnemonics[index], 3);
    const data = {
        xpub: w.xpub,
        reducedId: txId,
        pub: keys[index].pub,
    }
    const signature = signWithPk(index, Buffer.from(JSON.stringify(data), "utf-8"))
    const res = await instance.post("getTx", {...data, signature})
    // console.log(res.data)
    return res.data;
}

const commitTx = async (index: number, txId: string) => {
    const txData = await getTx(index, txId)
    const w = mnemonicToWallet(mnemonics[index], 3);
    const reduced = wasm.ReducedTransaction.sigma_parse_bytes(Buffer.from(txData.reduced, "base64"))
    const boxes = txData.boxes.map((item: string) => wasm.ErgoBox.sigma_parse_bytes(Buffer.from(item, "base64")))
    const committed = w.wallet.generate_commitments_for_reduced_transaction(reduced)
    if(!existsSync('txs')){
        mkdirSync('txs')
    }
    const path_priv = `txs/${reduced.unsigned_tx().id().to_str()}.priv.${index}.json`
    const path_pub = `txs/${reduced.unsigned_tx().id().to_str()}.pub.${index}.json`
    if(!existsSync(path_priv)){
        const commits = extractCommitments(committed, boxes.length);
        // console.log(JSON.stringify(commits.public.to_json()))
        writeFileSync(path_priv, JSON.stringify(commits.private.to_json()))
        writeFileSync(path_pub, JSON.stringify(commits.public.to_json()))
    }
    const pub = JSON.parse(readFileSync(path_pub).toString('utf-8'))
    const data = {
        xpub: w.xpub,
        pub: keys[index].pub,
        commitment: pub,
        reducedId: txId
    }
    const signature = signWithPk(index, Buffer.from(JSON.stringify(data), "utf-8"))
    const res = await instance.post("addCommitment", {...data, signature});
    // console.log(res.data);
}

const getCommitments = async (index: number, txId: string) => {
    const w = mnemonicToWallet(mnemonics[index], 3);
    const data = {
        xpub: w.xpub,
        reducedId: txId,
        pub: keys[index].pub,
    }
    const signature = signWithPk(index, Buffer.from(JSON.stringify(data), "utf-8"))
    const res = await instance.post("getCommitments", {...data, signature})
    // console.log(JSON.stringify(res.data, undefined, 4))
    return res.data;
}

const addPartialProof = async (index: number, tx_id: string, hints: HintBag) => {
    const tx = await getTx(index, tx_id);
    const w = mnemonicToWallet(mnemonics[index], 3);
    const reduced = wasm.ReducedTransaction.sigma_parse_bytes(Buffer.from(tx.reduced, "base64"))
    const path_priv = `txs/${reduced.unsigned_tx().id().to_str()}.priv.${index}.json`
    const prHint = readFileSync(path_priv)
    const privateHint = JSON.parse(prHint.toString('utf-8')) as HintBag;
    tx.boxes.forEach((item: string, index: number) => {
        hints.publicHints[index.toString()].forEach(h => {
            privateHint.publicHints[index.toString()].forEach(p => {
                if(p.pubkey.h === h.pubkey.h){
                    h.secret = p.secret
                    h.hint = p.hint
                }
            })
        })
    });
    const newHints = wasm.TransactionHintsBag.from_json(JSON.stringify(hints));
    // console.log(JSON.stringify(hints, undefined, 4))
    // tx.boxes.forEach((item: string, index: number) => {
    //     hints.add_hints_for_input(index, privateHint.all_hints_for_input(index));
    // });
    // for(let inputIndex=0; inputIndex < reduced.unsigned_tx().inputs().len(); inputIndex ++){
    //     hints.add_hints_for_input(inputIndex, privateHint.all_hints_for_input(inputIndex))
    // }
    // console.log(JSON.stringify(hints.to_json(), undefined, 4))
    const boxes = wasm.ErgoBoxes.empty()
    tx.boxes.forEach((item: string) => boxes.add(wasm.ErgoBox.sigma_parse_bytes(Buffer.from(item, "base64"))))
    const partial = w.wallet.sign_reduced_transaction_multi(reduced, newHints);
    const signed = new wasm.Propositions();
    const simulated = new wasm.Propositions()
    w.pubs.forEach(element => {
        signed.add_proposition_from_byte(Buffer.from('cd' + element, "hex"))
    });
    // Object.values(hints.publicHints).forEach(items => {
    //     items.forEach(element => {
    //         if(element.hint === 'cmtSimulated'){
    //             simulated.add_proposition_from_byte(Buffer.from('cd' + element.pubkey.h, "hex"))
    //         }
    //     });
    // })
    const extracted = wasm.extract_hints(partial, fakeContext(), boxes, wasm.ErgoBoxes.empty(), signed, simulated)
    // console.log(JSON.stringify(extracted.to_json(), undefined, 4));
    const data = {
        xpub: w.xpub,
        pub: keys[index].pub,
        reducedId: tx_id,
        proof: extracted.to_json()
    }
    const signature = signWithPk(index, Buffer.from(JSON.stringify(data)))
    try{
        const res = await instance.post("addPartialProof", {...data, signature})
        // console.log(res.data)
    }catch(exp){
        // console.log(exp)
        // throw new Error("unhandled", exp.respons);
        console.log(exp.response.data)  
        throw new Error("unhandled");
    }
}

const getReducedStatus = async (index: number, txId: string) => {
    const w = mnemonicToWallet(mnemonics[index], 3);
    const data = {
        xpub: w.xpub,
        pub: keys[index].pub,
        reducedId: txId,
    }
    const signature = signWithPk(index, Buffer.from(JSON.stringify(data), "utf-8"))
    // const res = await instance.post("getReducedStatus", {...data, signature}).then(res => console.log(res)).catch(err => console.log(err))
    // console.log(JSON.stringify(res.data, undefined, 4))
    // return res.data;
}


const exec = async() => {
    // for(let i=0; i< 4; i++){
    //     await registerPK(i);
    // }
    // await registerTeam(0);
    const team = await getTeams(0)
    // const reduced = '5wMBFBy/eJSydN5koDbOyacIuxtrAeWzBOdmIONtpYpIkV8AAAAAA4C8wZYLEAUEBgjNAjVj7uv5q8eR8B4KMtU8xiFPiXxNVeleODHhA+4X4p5cCM0ClRrap1+bUABV1Px66rvACAdWTNLop+V/o5X8Awwr3w0IzQLDFhu9+Io++WzDrq7rNO6HcsjjIC1tCALR7fk1kK/7+gjNAuZ2OVVa7YV5QUIFQHvQJBBc+YJV0+CMm/JyJw+r+/6QmHMAgwQIcwFzAnMDcwSnkUUAAMCOk8g7EAUEBgjNAoLYmK8tjSGMpJFevjyP5MbKoHVIUUmFhD0N3R2hVUceCM0DAT/XKB1mXbDDOotoO6k5rrNrZgWb4bRwVHPZEz78yE0IzQPCNJPc/PGKaFyC4LqjX3lCV+On75j9oux6AQZ/zpowlQjNA/GLN8R2OTy3zN2McUfbBIrH3q1Do+hPgaQcq4Unxd/WmHMAgwQIcwFzAnMDcwSnkUUAAOCRQxAFBAAEAA42EAIEoAsIzQJ5vmZ++dy7rFWgYpXOhwsHApv82y3OKNlZ8oFbFvgXmOoC0ZKjmozHpwFzAHMBEAECBALRloMDAZOjjMeypXMAAAGTwrKlcwEAdHMCcwODAQjN7qyTsaVzBKeRRQAAmAMEzQKC2JivLY0hjKSRXr48j+TGyqB1SFFJhYQ9Dd0doVVHHs0DAT/XKB1mXbDDOotoO6k5rrNrZgWb4bRwVHPZEz78yE3NA8I0k9z88YpoXILguqNfeUJX46fvmP2i7HoBBn/OmjCVzQPxizfEdjk8t8zdjHFH2wSKx96tQ6PoT4GkHKuFJ8Xf1gAA'
    // const boxes = [
    //     'oNyX30YQBQQGCM0CgtiYry2NIYykkV6+PI/kxsqgdUhRSYWEPQ3dHaFVRx4IzQMBP9coHWZdsMM6i2g7qTmus2tmBZvhtHBUc9kTPvzITQjNA8I0k9z88YpoXILguqNfeUJX46fvmP2i7HoBBn/OmjCVCM0D8Ys3xHY5PLfM3YxxR9sEisferUOj6E+BpByrhSfF39aYcwCDBAhzAXMCcwNzBP/iQwAAGjfPx7mnCVhkxoXhxqu8L2Xq49OyqyDfVMag0uix9s0B'
    // ]
    // await addTx(1, team[0]._id, reduced, boxes, []);
    const txs = await getTxs(1, team[0]._id);
    const tx = await getTx(2, txs[1]._id);
    // for(let index = 0; index < 3; index ++){
    //     console.log('committing', index)
    //     await commitTx(index, tx._id);
    // }
    const commitResponse = await getCommitments(0, tx._id);
    console.log("========")
    console.log(JSON.stringify(commitResponse.commitments, undefined, 4))
    for(let index=0; index < 3; index ++){
        console.log('handling', index)  
        const commitResponse = await getCommitments(index, tx._id);
        await addPartialProof(index, tx._id, commitResponse.commitments);
        await getReducedStatus(index, tx._id);
    }
}

export default exec;

exec();