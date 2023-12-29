import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import {Cell, toNano, TupleBuilder, Tuple, contractAddress} from 'ton-core';
import {Task4Basic, Task4BasicConfig, task4BasicConfigToCell} from '../wrappers/Task4Basic';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Task4Basic', () => {
    let code: Cell;
    let x = 88;
    let d = 46;
    let q = 63;
    let s = 83;
    let e = 69;
    let p = 33;

    let m1_in: number[][] = [
        [x,x,x,x,x,x,e,d], // X	X X	X X X E	.
        [x,x,d,x,x,x,x,d], // X	X .	X X X X	.
        [x,d,x,d,x,x,x,x], // X	. X	. X X X	X
        [d,q,x,s,x,x,x,d], // .	? X	S X	X X	.
        [q,d,x,x,x,x,x,d], // ?	. X	X X	X X	.
        [x,x,d,d,x,x,x,d], // X	X .	. X	X X	.
        [x,x,d,d,x,x,q,x], // X	X .	. X	X ?	X
        [x,x,x,d,d,d,x,x], // X	X X . .	. X	X
    ];
    let m1_out: number[][] = [[]];
    let m1_out_advanced: number[][] = [
        [x,x,x,x,x,x,e,d], // X	X X	X X X E	.
        [x,x,d,x,x,x,x,d], // X	X !	X X X X	!
        [x,d,x,d,x,x,x,x], // X	! X	! X X !	X
        [d,q,x,s,x,x,x,d], // !	? X	S X	X X	!
        [q,d,x,x,x,x,x,d], // ?	! X	X X	X X	!
        [x,x,d,d,x,x,x,d], // X	X !	. X	X X	!
        [x,x,d,d,x,x,q,x], // X	X .	! X	X !	X
        [x,x,x,d,d,d,x,x], // X	X X . !	! X	X
    ];

    let m2_in: number[][] = [
        [s,x,d,q,x], // S X . ? X
        [d,x,x,d,x], // . X X . X
        [x,d,q,d,d], // X . ? . .
        [d,q,q,d,d], // . ? ? . .
        [x,q,d,d,d], // X ? . . .
        [d,d,x,d,x], // . . X . X
        [d,d,q,d,d], // . . ? . .
        [x,d,d,d,e], // X . . . E
    ];
    let m2_out: number[][] = [
        [s,x,d,q,x], // S X . ? X
        [d,p,x,d,x], // ! X X . X
        [x,p,q,d,d], // X ! ? . .
        [d,p,q,d,d], // . ! ? . .
        [x,q,p,d,d], // X ? ! . .
        [d,d,x,p,x], // . . X ! X
        [d,d,q,p,d], // . . ? ! .
        [x,d,d,d,e], // X . . . E
    ];

    let m1_tb = new TupleBuilder();
    for (let i= 0; i < m1_in.length; i++) {
        let row = new TupleBuilder();
        for (let j= 0; j < m1_in[0].length; j++) {
            row.writeNumber(m1_in[i][j])
        }
        m1_tb.writeTuple(row.build())
    }
    let maze1: Tuple = {type: 'tuple', items: m1_tb.build()};

    let m2_tb = new TupleBuilder();
    for (let i= 0; i < m2_in.length; i++) {
        let row = new TupleBuilder();
        for (let j= 0; j < m2_in[0].length; j++) {
            row.writeNumber(m2_in[i][j])
        }
        m2_tb.writeTuple(row.build())
    }
    let maze2: Tuple = {type: 'tuple', items: m2_tb.build()};

    beforeAll(async () => {
        code = await compile('Task4Basic');
    });

    let blockchain: Blockchain;
    let task4Basic: SandboxContract<Task4Basic>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task4Basic = blockchain.openContract(Task4Basic.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task4Basic.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task4Basic.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task4Basic are ready to use
    });

    it('solve', async () => {
        const value = await task4Basic.getSolve(maze1);
        console.log("Solve gas used:", value.gasUsed)
        // console.log("Resulting maze:", value.maze)
        await task4Basic.plotMaze(value.maze)
    });

});
