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
import {Maybe} from "ton-core/dist/utils/maybe";

export type Task3Config = {
    value: number,
};

export function task3ConfigToCell(config: Task3Config): Cell {
    return beginCell().storeUint(config.value, 32).endCell();
}

export type MigrationPayload = {
    new_version: number,
    migration_code: Maybe<Cell>
}

export class Task3 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task3(address);
    }

    static createFromConfig(config: Task3Config, code: Cell, workchain = 0) {
        const data = task3ConfigToCell(config);
        const init = { code, data };
        return new Task3(contractAddress(workchain, init), init);
    }

//     ;; Inbound Message Structure
//     ;; _ new_version:uint32 migration_code:(Maybe ^Cell) = MigrationPayload;
//     ;; _ expected_version:uint32 new_code:(Maybe ^Cell) migrations:(HashmapE 32 MigrationPayload) payload:^Cell = InternalMsgBody;

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0, 32) // ver 0
                .storeBit(false) // empty new code
                .storeDict(Dictionary.empty<number, MigrationPayload>()) // empty migration dict
                .storeRef(beginCell().endCell()) // empty body
                .endCell(),
        });
    }

    async getVersion(provider: ContractProvider) {
        const result = await provider.get('version', [        ]);
        return {
            out: result.stack.readNumber(),
            gasUsed: result.gasUsed,
        };
    }

    async sendV2(provider: ContractProvider, via: Sender, value: bigint, code: Cell, dict: Cell) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(2, 32) // ver 2
                .storeMaybeRef(code)
                .storeSlice(dict.beginParse())
                .storeRef(beginCell().storeUint(100, 32).endCell()) // body with received_amount
                .endCell(),
        });
    }

    async sendV3(provider: ContractProvider, via: Sender, value: bigint, code: Cell, dict: Cell) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(3, 32) // ver 3
                .storeMaybeRef(code)
                .storeSlice(dict.beginParse())
                .storeRef(beginCell().storeUint(10000, 40).endCell()) // body with received_amount
                .endCell(),
        });
    }

    async sendV4(provider: ContractProvider, via: Sender, value: bigint, code: Cell, dict: Cell) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(4, 32) // ver 4
                .storeMaybeRef(code)
                .storeSlice(dict.beginParse())
                .storeRef(beginCell().storeUint(5000, 40).storeUint(5000, 40).endCell()) // body with received_amount
                .endCell(),
        });
    }

    async getAmount(provider: ContractProvider) {
        const result = await provider.get('get_amount', [        ]);
        return {
            out: result.stack.readNumber(),
            gasUsed: result.gasUsed,
        };
    }

    async getUsdAmount(provider: ContractProvider) {
        const result = await provider.get('get_USD_amount', [        ]);
        return {
            out: result.stack.readNumber(),
            gasUsed: result.gasUsed,
        };
    }
}
