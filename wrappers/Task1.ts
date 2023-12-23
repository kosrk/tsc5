import {
    Address,
    beginCell,
    Builder,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    Slice
} from 'ton-core';

// storage$_ public_key:uint256 execution_time:uint32 receiver:MsgAddressInt seqno:uint32 = Storage;

export type Task1Config = {
    publicKey: bigint,
    executionTime: bigint,
    receiver: Address,
    seqno: bigint,
};

export function task1ConfigToCell(config: Task1Config): Cell {
    return beginCell()
        .storeUint(config.publicKey, 256) // public_key:uint256
        .storeUint(config.executionTime,32) // execution_time:uint32
        .storeAddress(config.receiver) // receiver:MsgAddressInt
        .storeUint(config.seqno, 32) // seqno:uint32
        .endCell();
}

// update#9df10277 query_id:uint64 signature:bits512 ^[ locked_for:uint32 new_seqno:uint32 ] = ExtInMsgBody
export type UpdateMessage = {
    $$type: 'UpdateMessage';
    signature: Buffer;
    seqno: bigint;
    valid_until: bigint;
}

// export function storeExtMessage(src: ExtMessage) {
//     return (builder: Builder) => {
//         let b_0 = builder;
//         b_0.storeUint(3240438462, 32);
//         b_0.storeBuffer(src.signature);
//         b_0.storeUint(src.seqno, 32);
//         b_0.storeUint(src.valid_until, 32);
//         let b_1 = new Builder();
//         b_1.store(storeSendParameters(src.message_parameters));
//         b_0.storeRef(b_1.endCell());
//     };
// }

// claim#bb4be234 query_id:uint64 = ExtInMsgBody
export type ClaimMessage = {
    $$type: 'ClaimMessage';
    query_id: bigint;
}

export function storeClaimMessage(src: ClaimMessage) {
    return (builder: Builder) => {
        let b_0 = builder;
        b_0.storeUint(0xbb4be234, 32);
        b_0.storeUint(src.query_id, 64);
    };
}

export class Task1 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task1(address);
    }

    static createFromConfig(config: Task1Config, code: Cell, workchain = 0) {
        const data = task1ConfigToCell(config);
        const init = { code, data };
        return new Task1(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendExternal(provider: ContractProvider, message: ClaimMessage | Slice) {

        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'ClaimMessage') {
            body = beginCell().store(storeClaimMessage(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }

        await provider.external(body);

    }

    async getSeqno(provider: ContractProvider) {
        const result = await provider.get('get_seqno', [
        ]);
        return {
            out: result.stack.readNumber(),
            gasUsed: result.gasUsed,
        };
    }

    async getExecutionTime(provider: ContractProvider) {
        const result = await provider.get('get_execution_time', [
        ]);
        return {
            out: result.stack.readNumber(),
            gasUsed: result.gasUsed,
        };
    }
}
