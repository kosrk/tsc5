import {Blockchain, SandboxContract, TreasuryContract} from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Task3 } from '../wrappers/Task3';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Task3', () => {
    let code: Cell;
    let migrationV2V3Code: Cell;
    let v2code: Cell;

    beforeAll(async () => {
        code = await compile('Task3');
        migrationV2V3Code = await compile('Migration');
        v2code = await compile('V2Code');
    });

    let blockchain: Blockchain;
    let task3: SandboxContract<Task3>;
    let deployer: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        task3 = blockchain.openContract(Task3.createFromConfig({value: 0}, code));


        const deployResult = await task3.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task3.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task3 are ready to use
    });

    it('get first version', async () => {
        const value = await task3.getVersion();
        expect(value.out).toEqual(1);
        console.log("Get version gas used:", value.gasUsed)
    });

    it('update to v2', async () => {
        const result = await task3.sendV2(deployer.getSender(), toNano('0.05'),v2code);

        console.log("Get version gas used:", result.result)
    });

});
