import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import {Cell, toNano, TupleBuilder, Tuple, contractAddress} from 'ton-core';
import {buildMaze, Task4Basic, Task4BasicConfig, task4BasicConfigToCell} from '../wrappers/Task4Basic';
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

    let m1_in_valid: number[][] = [
        [x,x,x,x,x,x,e,d], // X	X X	X X X E	.
        [x,x,d,x,x,x,x,d], // X	X .	X X X X	.
        [x,d,x,d,x,x,d,x], // X	. X	. X X .	X
        [d,q,x,s,q,q,d,d], // .	? X	S ?	? .	.
        [x,d,x,x,x,x,x,d], // X	. X	X X	X X	.
        [x,x,d,d,x,x,x,d], // X	X .	. X	X X	.
        [x,x,d,d,x,x,q,x], // X	X .	. X	X ?	X
        [x,x,x,d,d,d,x,x], // X	X X . .	. X	X
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

    let m2_in_neighbours: number[][] = [
        [s,x,d,q,x], // S X . ? X
        [d,e,x,d,x], // . E X . X
        [x,d,q,d,d], // X . ? . .
        [d,q,q,d,d], // . ? ? . .
        [x,q,d,d,d], // X ? . . .
        [d,d,x,d,x], // . . X . X
        [d,d,q,d,d], // . . ? . .
        [x,d,d,d,d], // X . . . .
    ];

    let m3_in: number[][] = [
        [x,s], // X S
        [e,x], // E X
    ];

    let m4_in: number[][] = [
        [s,x,d,q], // S . . ?
        [d,x,x,d], // . ? ? .
        [d,x,e,d], // X X E .
    ];

    let m5_in: number[][] = [
        [s,x], // S X
        [d,x], // . X
        [d,x], // . X
        [q,d], // ? .
        [d,x], // . X
        [q,x], // ? X
        [q,x], // ? X
        [e,x], // E X
    ];

    let m6_in: number[][] = [
        [d,d,d,d,d,d,d,d],
        [d,q,q,q,q,q,q,d],
        [d,q,d,d,d,d,q,d],
        [d,q,e,q,q,d,q,d],
        [d,q,q,q,q,d,q,d],
        [d,d,d,d,d,d,q,d],
        [q,q,q,q,q,q,q,d],
        [s,d,d,d,d,d,d,d],
    ];

    let maze1 = buildMaze(m1_in)
    let maze2 = buildMaze(m2_in)
    let maze3 = buildMaze(m1_in_valid)
    let maze4 = buildMaze(m2_in_neighbours)
    let maze5 = buildMaze(m3_in)
    let maze6 = buildMaze(m4_in)
    let maze7 = buildMaze(m5_in)
    let maze8 = buildMaze(m6_in)

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

    it('Maze 1', async () => {
        const value = await task4Basic.getSolve(maze1);
        console.log("Distance:", value.length, "\nObstacles in superposition:", value.obstacles, "\nGas used:", value.gasUsed)
        expect(value.length).toEqual(0);
        expect(value.obstacles).toEqual(0);
        expect(value.changes).toEqual(-1);
        expect(value.maze).toEqual(null);
    });

    it('Maze 2', async () => {
        const value = await task4Basic.getSolve(maze2);
        console.log("Distance:", value.length, "\nObstacles in superposition:", value.obstacles, "\nGas used:", value.gasUsed)
        await task4Basic.plotMaze(value.maze)
        expect(value.length).toEqual(7);
        expect(value.obstacles).toEqual(1);
        expect(value.changes).toEqual(-1);
    });

    it('Valid maze 1', async () => {
        const value = await task4Basic.getSolve(maze3);
        console.log("Distance:", value.length, "\nObstacles in superposition:", value.obstacles, "\nGas used:", value.gasUsed)
        await task4Basic.plotMaze(value.maze)
        // expect(value.length).toEqual(7);
        // expect(value.obstacles).toEqual(1);
        expect(value.changes).toEqual(-1);
    });

    it('Neighbours', async () => {
        const value = await task4Basic.getSolve(maze4);
        console.log("Distance:", value.length, "\nObstacles in superposition:", value.obstacles, "\nGas used:", value.gasUsed)
        await task4Basic.plotMaze(value.maze)
        // expect(value.length).toEqual(7);
        // expect(value.obstacles).toEqual(1);
        expect(value.changes).toEqual(-1);
    });

    it('2x2', async () => {
        const value = await task4Basic.getSolve(maze5);
        console.log("Distance:", value.length, "\nObstacles in superposition:", value.obstacles, "\nGas used:", value.gasUsed)
        await task4Basic.plotMaze(value.maze)
        // expect(value.length).toEqual(7);
        // expect(value.obstacles).toEqual(1);
        expect(value.changes).toEqual(-1);
    });

    it('3x4', async () => {
        const value = await task4Basic.getSolve(maze6);
        console.log("Distance:", value.length, "\nObstacles in superposition:", value.obstacles, "\nGas used:", value.gasUsed)
        await task4Basic.plotMaze(value.maze)
        expect(value.changes).toEqual(-1);
    });

    it('8x2', async () => {
        const value = await task4Basic.getSolve(maze7);
        console.log("Distance:", value.length, "\nObstacles in superposition:", value.obstacles, "\nGas used:", value.gasUsed)
        await task4Basic.plotMaze(value.maze)
        expect(value.changes).toEqual(-1);
    });

    it('Maze 6', async () => {
        const value = await task4Basic.getSolve(maze8);
        console.log("Distance:", value.length, "\nObstacles in superposition:", value.obstacles, "\nGas used:", value.gasUsed)
        await task4Basic.plotMaze(value.maze)
        // expect(value.length).toEqual(7);
        // expect(value.obstacles).toEqual(1);
        expect(value.changes).toEqual(-1);
    });

});
