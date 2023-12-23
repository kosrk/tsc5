import {Blockchain, SandboxContract, TreasuryContract} from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import {ClaimMessage, Task1, UpdateMessage} from '../wrappers/Task1';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Task1', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task1');
    });

    let blockchain: Blockchain;
    let task1: SandboxContract<Task1>;
    let deployer: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        task1 = blockchain.openContract(
            Task1.createFromConfig({
                publicKey: 123n,
                executionTime: 4101725062n,
                receiver: deployer.address,
                seqno: 100n,
            }, code));

        const deployResult = await task1.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task1.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task1 are ready to use
    });

    it("should get seqno", async () => {
        const value = await task1.getSeqno();
        console.log("Get seqno gas used:", value.gasUsed)
        expect(value.out).toEqual(100);
    });

    it("should get execution time", async () => {
        const value = await task1.getExecutionTime();
        console.log("Get execution time gas used:", value.gasUsed)
        expect(value.out).toEqual(4101725062);
    });

    it('claim message it is too early', async () => {
        const result = await task1.sendExternal({
            $$type: 'ClaimMessage',
            query_id: 1n,
        });

        expect(result.transactions).toHaveTransaction({
            success: false,
            exitCode: 124,
            op: 0xbb4be234,
        })
    });

    it('claim message it is time', async () => {
        let contract = blockchain.openContract(
            Task1.createFromConfig({
                publicKey: 123n,
                executionTime: 10000n,
                receiver: deployer.address,
                seqno: 100n,
            }, code));

        const deployResult = await contract.sendDeploy(deployer.getSender(), toNano('0.05'));

        const result = await contract.sendExternal({
            $$type: 'ClaimMessage',
            query_id: 1n,
        });
        console.log("Get execution time gas used:", result)
        expect(result.transactions).toHaveTransaction({
            success: true,
            exitCode: 0,
            op: 0xbb4be234,
        })
        expect(result.transactions).toHaveTransaction({
            success: true,
            exitCode: 0,
            from: contract.address,
            to: deployer.address,
        })
    });

});
