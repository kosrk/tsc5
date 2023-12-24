import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Dictionary,
    Sender,
    SendMode
} from 'ton-core';

export type Task2Config = {
    owner: Address,
    dict: Dictionary<Address, number>,
};

export function task2ConfigToCell(config: Task2Config): Cell {
    return beginCell()
        .storeAddress(config.owner)
        .storeDict(config.dict)
        .endCell();
}

export class Task2 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task2(address);
    }

    static createFromConfig(config: Task2Config, code: Cell, workchain = 0) {
        const data = task2ConfigToCell(config);
        const init = { code, data };
        return new Task2(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendAddUser(provider: ContractProvider, via: Sender, value: bigint, user: Address, share: number) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x368ddef3, 32).storeUint(0,64).storeAddress(user).storeUint(share, 32).endCell(),
        });
    }

    async sendRemoveUser(provider: ContractProvider, via: Sender, value: bigint, user: Address) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x278205c8, 32).storeUint(0,64).storeAddress(user).endCell(),
        });
    }

    async getUsers(provider: ContractProvider) {

        const result = await provider.get('get_users', [        ]);
        return {
            out: result.stack.readCell(),
            gasUsed: result.gasUsed,
        };
    }

    async getUserShare(provider: ContractProvider, user: Address) {
        let userSlice = beginCell().storeAddress(user).endCell()

        const result = await provider.get('get_user_share', [
            {type: 'slice', cell: userSlice}
        ]);
        return {
            out: result.stack.readNumber(),
            gasUsed: result.gasUsed,
        };
    }
}
