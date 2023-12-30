import {Blockchain, SandboxContract, TreasuryContract} from '@ton-community/sandbox';
import {Address, beginCell, Cell, Dictionary, toNano} from 'ton-core';
import { Task2 } from '../wrappers/Task2';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import {DictionaryKey, DictionaryValue} from "ton-core/src/dict/Dictionary";

describe('Task2', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task2');
    });

    let blockchain: Blockchain;
    let task2: SandboxContract<Task2>;
    let deployer: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        task2 = blockchain.openContract(Task2.createFromConfig({
            owner: deployer.address,
            dict: Dictionary.empty<bigint, number>(),
        }, code));


        const deployResult = await task2.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task2.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task2 are ready to use
    });

    it("all tests", async () => {

        // ADD USER
        const result = await task2.sendAddUser(
            deployer.getSender(),
            toNano('0.01'),
            deployer.address,
            100
        );
        expect(result.transactions).toHaveTransaction({
            success: true,
            exitCode: 0,
            op: 0x368ddef3,
        })

        // ADD ANOTHER USER
        const result12 = await task2.sendAddUser(
            deployer.getSender(),
            toNano('0.01'),
            task2.address,
            100
        );

        // GET DICT
        // const value = await task2.getUsers();
        // let d = value.out.beginParse().loadDict(Dictionary.Keys.BigInt(256), Dictionary.Values.Uint(32))
        // let addr = deployer.address.hash.toString("hex")
        //
        // expect(d.get(BigInt(`0x${addr}`))).toEqual(100);
        // console.log("Get users gas used:", value.gasUsed)

        // GET SHARE
        const value2 = await task2.getUserShare(deployer.address);
        expect(value2.out).toEqual(100);
        console.log("Get user share gas used:", value2.gasUsed)

        // SEND SPLIT
        const result3 = await task2.sendSplitTon(
            deployer.getSender(),
            toNano('100'),
        );
        expect(result3.transactions).toHaveTransaction({
            success: true,
            exitCode: 0,
            op: 0x068530b3,
        })

        // SEND TRANSFER NOTIFICATION
        const result4 = await task2.sendTransferNotification(
            deployer.getSender(),
            toNano('100'),
            100n
        );
        expect(result4.transactions).toHaveTransaction({
            success: true,
            exitCode: 0,
            op: 0x7362d09c,
        })
        let body  = result4.transactions[3].inMessage?.body.beginParse()
        body?.loadUint(32)
        console.log("Query ID:", body?.loadUint(64))
        console.log("Amount:", body?.loadCoins())
        console.log("Destination:", body?.loadAddress())
        console.log("Resp destination:", body?.loadAddress())
        console.log("Custom payload:", body?.loadBoolean())
        console.log("Forward ton amount:", body?.loadCoins())
        console.log("Forward payload:", body?.loadBoolean())



        // REMOVE USER
        const result2 = await task2.sendRemoveUser(
            deployer.getSender(),
            toNano('0.01'),
            deployer.address
        );
        expect(result2.transactions).toHaveTransaction({
            success: true,
            exitCode: 0,
            op: 0x278205c8,
        })
        const value3 = await task2.getUsers();
        // let d2 = value3.out.beginParse().loadDict(Dictionary.Keys.Address(), Dictionary.Values.Uint(32))
        // expect(d2.size).toEqual(1);

    });

});
