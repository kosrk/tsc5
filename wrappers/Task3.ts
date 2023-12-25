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
}
