import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    Tuple, TupleBuilder,
    TupleReader
} from 'ton-core';
import {isNull} from "node:util";

export type Task4BasicConfig = {};

export function task4BasicConfigToCell(config: Task4BasicConfig): Cell {
    return beginCell().endCell();
}

const map: { [id: number]: string; } = {
    [88]: 'X',
    [46]: '.',
    [63]: '?',
    [83]: 'S',
    [69]: 'E',
    [33]: '!'
};

export function buildMaze(maze: number[][]) :Tuple {
    let m_tb = new TupleBuilder();
    for (let i= 0; i < maze.length; i++) {
        let row = new TupleBuilder();
        for (let j= 0; j < maze[0].length; j++) {
            row.writeNumber(maze[i][j])
        }
        m_tb.writeTuple(row.build())
    }
    return {type: 'tuple', items: m_tb.build()};
}

export class Task4Basic implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task4Basic(address);
    }

    static createFromConfig(config: Task4BasicConfig, code: Cell, workchain = 0) {
        const data = task4BasicConfigToCell(config);
        const init = { code, data };
        return new Task4Basic(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async plotMaze(t: TupleReader | null) {
        if (t == null) {
            console.log("Not solved.\n")
            return;
        }
        let res = '';
        while (t.remaining > 0) {
            let row = t.readTuple();
            while (row.remaining > 0) {
                res = res + map[row.readNumber()] + ' '
            }
            res = res + '\n'
        }
        console.log("Resulting maze: \n" + res)
        return;
    }

    async getSolve(provider: ContractProvider, maze: Tuple) {
        let n = maze.items.length;
        let m = 0;
        if (maze.items[0].type == 'tuple') {
            m = maze.items[0].items.length
        }
        const result = await provider.get('solve', [
            {type: 'int', value: BigInt(n)},
            {type: 'int', value: BigInt(m)},
            maze
        ]);
        return {
            changes: result.stack.readNumber(),
            obstacles: result.stack.readNumber(),
            length: result.stack.readNumber(),
            maze: result.stack.readTupleOpt(),
            gasUsed: result.gasUsed,
        };
    }
}
