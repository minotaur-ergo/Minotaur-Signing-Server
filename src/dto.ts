import { ApiProperty } from '@nestjs/swagger';

export class SetPkDto {
    @ApiProperty({ description: 'Public key', example: 'examplePubKey' })
    pub: string;

    @ApiProperty({ description: 'Extended public key', example: 'xpub6Ezg8dc85qRafaHRUqPSvZk6dbQtu4fuJ1cWP8hQAsB9Km9G58EjEi5Cro7kM4RxAeixkUhiUwifN4jPw9by4Z41oXkXAe1aTKYgBFujMMH' })
    xpub: string;

    @ApiProperty({ description: 'signed hash of the entire body base64 encoded', example: 'fwYB5LsUGFNe41hvAGIulsMWDcOTg5gMq7kSULrzJEv7QgbIxFifunia/oBkWZqWHoZaGzw99NGGP3iBl38JFSd/+7xgrqVLB1Gl7CZZeCDwUsm3XyB3lPMHZHDxywiZZIq9ZT32UXNYdCu/ogFoN8zM5DGNOfSyBCUz0z4HV/xX2VGG8x04goJKU5afvDGLvFsqebEvldl+YnUAnYue9yL50Uv+vJ2gcZZMuzychQ+BVNCoh2f9OIvacl5UzsDwhqwg7zTqeN/IKsMEQG2KLWNL0BvIh1GdU0LhyoYCRA7n2xfzs8qhejRAwpkkbxtTyjKnX1oPCfRdL/Y6TZivaA==' })
    signature: string;

}


export class CreateTeamDto {
    @ApiProperty({ description: 'Team name', example: 'exampleTeamName' })
    name: string;

    @ApiProperty({ type: [String], description: 'List of xpubs', example: ['xpub6Ezg8dc85qRafaHRUqPSvZk6dbQtu4fuJ1cWP8hQAsB9Km9G58EjEi5Cro7kM4RxAeixkUhiUwifN4jPw9by4Z41oXkXAe1aTKYgBFujMMH', 'xpub2'] })
    xpubs: string[];

    @ApiProperty({ description: 'm in (m of n)', example: 2 })
    m: number;
}

export class AddReducedTxDto {
    @ApiProperty({ description: 'Base64 encoding of a reduced Tx bytes', example: '5wMBL7Ullx+UtfT6T/piOn0dx8W0yCkpoXljh1EVwnQNeI4AAAAAA4CU69wDEAUEBgjNAoLYmK8tjSGMpJFevjyP5MbKoHVIUUmFhD0N3R2hVUceCM0DAT/XKB1mXbDDOotoO6k5rrNrZgWb4bRwVHPZEz78yE0IzQPCNJPc/PGKaFyC4LqjX3lCV+On75j9oux6AQZ/zpowlQjNA/GLN8R2OTy3zN2McUfbBIrH3q1Do+hPgaQcq4Unxd/WmHMAgwQIcwFzAnMDcwSqrkEAAKCigcMhEAUEBgjNAoLYmK8tjSGMpJFevjyP5MbKoHVIUUmFhD0N3R2hVUceCM0DAT/XKB1mXbDDOotoO6k5rrNrZgWb4bRwVHPZEz78yE0IzQPCNJPc/PGKaFyC4LqjX3lCV+On75j9oux6AQZ/zpowlQjNA/GLN8R2OTy3zN2McUfbBIrH3q1Do+hPgaQcq4Unxd/WmHMAgwQIcwFzAnMDcwSqrkEAAOCRQxAFBAAEAA42EAIEoAsIzQJ5vmZ++dy7rFWgYpXOhwsHApv82y3OKNlZ8oFbFvgXmOoC0ZKjmozHpwFzAHMBEAECBALRloMDAZOjjMeypXMAAAGTwrKlcwEAdHMCcwODAQjN7qyTsaVzBKquQQAAmAMEzQJx95oYGNXQ9LdemlR55nDiUxyQ5kpIvWiTSGNuUN/jHM0CfYWYxiSE43qf9Kf/In3pOVL004D5ORRP48XPfmuzMIzNAtRfgdBk7HV+lPBAhEqrzz2PDi97ccTOPYV1uyLq/gZDzQOFsMAp13eMi800aP6fKxnlta6G1y5BB1gF54dkamzfUQAA' })
    reducedTx: string;

    @ApiProperty({ description: 'user xpub', example: 'xpub6Ezg8dc85qRafaHRUqPSvZk6dbQtu4fuJ1cWP8hQAsB9Km9G58EjEi5Cro7kM4RxAeixkUhiUwifN4jPw9by4Z41oXkXAe1aTKYgBFujMMH' })
    xpub: string;

    @ApiProperty({ description: 'user public key', example: 'pub1' })
    pub: string;

    @ApiProperty({ description: 'the team to add the reduced TX to', example: 'teamId' })
    teamId: string;

    @ApiProperty({ description: 'input boxes base64 encoded', example: '["gMivoCUQBQQGCM0CcfeaGBjV0PS3XppUeeZw4lMckOZKSL1ok0hjblDf4xwIzQJ9hZjGJITjep/0p/8ifek5UvTTgPk5FE/jxc9+a7MwjAjNAtRfgdBk7HV+lPBAhEqrzz2PDi97ccTOPYV1uyLq/gZDCM0DhbDAKdd3jIvNNGj+nysZ5bWuhtcuQQdYBeeHZGps31GYcwCDBAhzAXMCcwNzBIrxLQAAkIe+Zp9j6RfrubmUWvd3vOmGoFVvnlScFq4qw3D7gS8A"]' })
    inputBoxes: [string];

    @ApiProperty({ description: 'dataInput boxes base64 encoded', example: '["gMivoCUQBQQGCM0CcfeaGBjV0PS3XppUeeZw4lMckOZKSL1ok0hjblDf4xwIzQJ9hZjGJITjep/0p/8ifek5UvTTgPk5FE/jxc9+a7MwjAjNAtRfgdBk7HV+lPBAhEqrzz2PDi97ccTOPYV1uyLq/gZDCM0DhbDAKdd3jIvNNGj+nysZ5bWuhtcuQQdYBeeHZGps31GYcwCDBAhzAXMCcwNzBIrxLQAAkIe+Zp9j6RfrubmUWvd3vOmGoFVvnlScFq4qw3D7gS8A"]' })
    dataInputs: [string];

    @ApiProperty({ description: 'signed hash of the entire body base64 encoded', example: 'fwYB5LsUGFNe41hvAGIulsMWDcOTg5gMq7kSULrzJEv7QgbIxFifunia/oBkWZqWHoZaGzw99NGGP3iBl38JFSd/+7xgrqVLB1Gl7CZZeCDwUsm3XyB3lPMHZHDxywiZZIq9ZT32UXNYdCu/ogFoN8zM5DGNOfSyBCUz0z4HV/xX2VGG8x04goJKU5afvDGLvFsqebEvldl+YnUAnYue9yL50Uv+vJ2gcZZMuzychQ+BVNCoh2f9OIvacl5UzsDwhqwg7zTqeN/IKsMEQG2KLWNL0BvIh1GdU0LhyoYCRA7n2xfzs8qhejRAwpkkbxtTyjKnX1oPCfRdL/Y6TZivaA==' })
    signature: string;

}


export class AddPartialProofDto {
    @ApiProperty({ description: 'user xpub', example: 'xpub6Ezg8dc85qRafaHRUqPSvZk6dbQtu4fuJ1cWP8hQAsB9Km9G58EjEi5Cro7kM4RxAeixkUhiUwifN4jPw9by4Z41oXkXAe1aTKYgBFujMMH' })
    xpub: string;

    @ApiProperty({ description: 'user public key', example: 'pub1' })
    pub: string;

    @ApiProperty({ description: 'reduced TX id', example: 'reducedTxId' })
    reducedId: string;

    @ApiProperty({ description: 'signed hash of the entire body base64 encoded', example: 'fwYB5LsUGFNe41hvAGIulsMWDcOTg5gMq7kSULrzJEv7QgbIxFifunia/oBkWZqWHoZaGzw99NGGP3iBl38JFSd/+7xgrqVLB1Gl7CZZeCDwUsm3XyB3lPMHZHDxywiZZIq9ZT32UXNYdCu/ogFoN8zM5DGNOfSyBCUz0z4HV/xX2VGG8x04goJKU5afvDGLvFsqebEvldl+YnUAnYue9yL50Uv+vJ2gcZZMuzychQ+BVNCoh2f9OIvacl5UzsDwhqwg7zTqeN/IKsMEQG2KLWNL0BvIh1GdU0LhyoYCRA7n2xfzs8qhejRAwpkkbxtTyjKnX1oPCfRdL/Y6TZivaA==' })
    signature: string;

    @ApiProperty({ description: 'partial proof', example: {
        "secretHints": {
            "0": []
        },
        "publicHints": {
            "0": [
                {
                    "hint": "cmtReal",
                    "pubkey": {
                        "op": "205",
                        "h": "027d8598c62484e37a9ff4a7ff227de93952f4d380f939144fe3c5cf7e6bb3308c"
                    },
                    "type": "dlog",
                    "a": "02d066d97adeb4da4e0d0db160d351203a235cb71c2c259d44f875179b2f406363",
                    "position": "0-1"
                }
            ]
        }
    } })
    proof: string;

}

export class AddCommitmentDto {
    @ApiProperty({ description: 'user xpub', example: 'xpub6Ezg8dc85qRafaHRUqPSvZk6dbQtu4fuJ1cWP8hQAsB9Km9G58EjEi5Cro7kM4RxAeixkUhiUwifN4jPw9by4Z41oXkXAe1aTKYgBFujMMH' })
    xpub: string;

    @ApiProperty({ description: 'user public key', example: 'pub1' })
    pub: string;

    @ApiProperty({ description: 'public commitment', example: {
        "secretHints": {
            "0": []
        },
        "publicHints": {
            "0": [
                {
                    "hint": "cmtReal",
                    "pubkey": {
                        "op": "205",
                        "h": "027d8598c62484e37a9ff4a7ff227de93952f4d380f939144fe3c5cf7e6bb3308c"
                    },
                    "type": "dlog",
                    "a": "02d066d97adeb4da4e0d0db160d351203a235cb71c2c259d44f875179b2f406363",
                    "position": "0-1"
                }
            ]
        }
    } })
    commitment: string;

    @ApiProperty({ description: 'reduced TX id', example: 'reducedTxId' })
    reducedId: string;

    @ApiProperty({ description: 'signed hash of the entire body base64 encoded', example: 'fwYB5LsUGFNe41hvAGIulsMWDcOTg5gMq7kSULrzJEv7QgbIxFifunia/oBkWZqWHoZaGzw99NGGP3iBl38JFSd/+7xgrqVLB1Gl7CZZeCDwUsm3XyB3lPMHZHDxywiZZIq9ZT32UXNYdCu/ogFoN8zM5DGNOfSyBCUz0z4HV/xX2VGG8x04goJKU5afvDGLvFsqebEvldl+YnUAnYue9yL50Uv+vJ2gcZZMuzychQ+BVNCoh2f9OIvacl5UzsDwhqwg7zTqeN/IKsMEQG2KLWNL0BvIh1GdU0LhyoYCRA7n2xfzs8qhejRAwpkkbxtTyjKnX1oPCfRdL/Y6TZivaA==' })
    signature: string;
}

export class getCommitmentsDto {
    @ApiProperty({ description: 'user xpub', example: 'xpub6Ezg8dc85qRafaHRUqPSvZk6dbQtu4fuJ1cWP8hQAsB9Km9G58EjEi5Cro7kM4RxAeixkUhiUwifN4jPw9by4Z41oXkXAe1aTKYgBFujMMH' })
    xpub: string;

    @ApiProperty({ description: 'reduced TX id', example: 'reducedTxId' })
    reducedId: string;

    @ApiProperty({ description: 'signed hash of the entire body base64 encoded', example: 'fwYB5LsUGFNe41hvAGIulsMWDcOTg5gMq7kSULrzJEv7QgbIxFifunia/oBkWZqWHoZaGzw99NGGP3iBl38JFSd/+7xgrqVLB1Gl7CZZeCDwUsm3XyB3lPMHZHDxywiZZIq9ZT32UXNYdCu/ogFoN8zM5DGNOfSyBCUz0z4HV/xX2VGG8x04goJKU5afvDGLvFsqebEvldl+YnUAnYue9yL50Uv+vJ2gcZZMuzychQ+BVNCoh2f9OIvacl5UzsDwhqwg7zTqeN/IKsMEQG2KLWNL0BvIh1GdU0LhyoYCRA7n2xfzs8qhejRAwpkkbxtTyjKnX1oPCfRdL/Y6TZivaA==' })
    signature: string;
}

export class getReducedTxsDto {
    @ApiProperty({ description: 'user xpub', example: 'xpub6Ezg8dc85qRafaHRUqPSvZk6dbQtu4fuJ1cWP8hQAsB9Km9G58EjEi5Cro7kM4RxAeixkUhiUwifN4jPw9by4Z41oXkXAe1aTKYgBFujMMH' })
    xpub: string;

    @ApiProperty({ description: 'team id', example: 'teamId' })
    teamId: string;

    @ApiProperty({ description: 'signed hash of the entire body base64 encoded', example: 'fwYB5LsUGFNe41hvAGIulsMWDcOTg5gMq7kSULrzJEv7QgbIxFifunia/oBkWZqWHoZaGzw99NGGP3iBl38JFSd/+7xgrqVLB1Gl7CZZeCDwUsm3XyB3lPMHZHDxywiZZIq9ZT32UXNYdCu/ogFoN8zM5DGNOfSyBCUz0z4HV/xX2VGG8x04goJKU5afvDGLvFsqebEvldl+YnUAnYue9yL50Uv+vJ2gcZZMuzychQ+BVNCoh2f9OIvacl5UzsDwhqwg7zTqeN/IKsMEQG2KLWNL0BvIh1GdU0LhyoYCRA7n2xfzs8qhejRAwpkkbxtTyjKnX1oPCfRdL/Y6TZivaA==' })
    signature: string;
}

export class getTxDto {
    @ApiProperty({ description: 'user xpub', example: 'xpub6Ezg8dc85qRafaHRUqPSvZk6dbQtu4fuJ1cWP8hQAsB9Km9G58EjEi5Cro7kM4RxAeixkUhiUwifN4jPw9by4Z41oXkXAe1aTKYgBFujMMH' })
    xpub: string;

    @ApiProperty({ description: 'reduced TX id', example: 'reducedTxId' })
    reducedId: string;

    @ApiProperty({ description: 'signed hash of the entire body base64 encoded base64 encoded', example: 'fwYB5LsUGFNe41hvAGIulsMWDcOTg5gMq7kSULrzJEv7QgbIxFifunia/oBkWZqWHoZaGzw99NGGP3iBl38JFSd/+7xgrqVLB1Gl7CZZeCDwUsm3XyB3lPMHZHDxywiZZIq9ZT32UXNYdCu/ogFoN8zM5DGNOfSyBCUz0z4HV/xX2VGG8x04goJKU5afvDGLvFsqebEvldl+YnUAnYue9yL50Uv+vJ2gcZZMuzychQ+BVNCoh2f9OIvacl5UzsDwhqwg7zTqeN/IKsMEQG2KLWNL0BvIh1GdU0LhyoYCRA7n2xfzs8qhejRAwpkkbxtTyjKnX1oPCfRdL/Y6TZivaA==' })
    signature: string;
}

export class getTeamsDto {
    @ApiProperty({ description: 'user xpub', example: 'xpub6Ezg8dc85qRafaHRUqPSvZk6dbQtu4fuJ1cWP8hQAsB9Km9G58EjEi5Cro7kM4RxAeixkUhiUwifN4jPw9by4Z41oXkXAe1aTKYgBFujMMH' })
    xpub: string;

    @ApiProperty({ description: 'signed hash of the entire body base64 encoded', example: 'fwYB5LsUGFNe41hvAGIulsMWDcOTg5gMq7kSULrzJEv7QgbIxFifunia/oBkWZqWHoZaGzw99NGGP3iBl38JFSd/+7xgrqVLB1Gl7CZZeCDwUsm3XyB3lPMHZHDxywiZZIq9ZT32UXNYdCu/ogFoN8zM5DGNOfSyBCUz0z4HV/xX2VGG8x04goJKU5afvDGLvFsqebEvldl+YnUAnYue9yL50Uv+vJ2gcZZMuzychQ+BVNCoh2f9OIvacl5UzsDwhqwg7zTqeN/IKsMEQG2KLWNL0BvIh1GdU0LhyoYCRA7n2xfzs8qhejRAwpkkbxtTyjKnX1oPCfRdL/Y6TZivaA==' })
    signature: string;
}