import {Blockchain, SandboxContract, TreasuryContract} from '@ton-community/sandbox';
import {Cell, Dictionary, toNano} from 'ton-core';
import { Task3 } from '../wrappers/Task3';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Task3', () => {
    let code: Cell;
    let migrationV2V3Code: Cell;
    let v2code: Cell;
    let v3code: Cell;
    let v4code: Cell;
    let migrationCell = Cell.fromBase64("te6ccgEBCgEATgABAcABAgmeAAAAAgIDAAlQAAAAJAIBIAQFAQkAAAAA8AYACQAAAAEQART/APSkE/S88sgLBwIBYggJAAbQXwQAGaFa7aGuFj9OyZGWT5M=")

    beforeAll(async () => {
        code = await compile('Task3');
        migrationV2V3Code = await compile('Migration');
        v2code = await compile('V2Code');
        v3code = await compile('V3Code');
        v4code = await compile('V4Code');
    });

    let blockchain: Blockchain;
    let task3: SandboxContract<Task3>;
    let deployer: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        task3 = blockchain.openContract(Task3.createFromConfig({value: 0}, code));


        const deployResult = await task3.sendDeploy(deployer.getSender(), toNano('1'));

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
        console.log("Migration code:", migrationV2V3Code.toBoc().toString("base64"))
    });

    it('get first version', async () => {
        const value = await task3.getVersion();
        expect(value.out).toEqual(1);
        console.log("Get version gas used:", value.gasUsed)
    });

    it('update to v2 with valid migration dict', async () => {
        const result = await task3.sendV2(deployer.getSender(), toNano('1'),v2code, migrationCell);
        const value = await task3.getVersion();
        expect(value.out).toEqual(2);
    });

    it('update to v3 with valid migration dict', async () => {
        const result = await task3.sendV3(deployer.getSender(), toNano('1'),v3code, migrationCell);
        const value = await task3.getVersion();
        expect(value.out).toEqual(3);
    });

    it('update to v4 with valid migration dict', async () => {
        const result = await task3.sendV4(deployer.getSender(), toNano('1'),v4code, migrationCell);
        const value = await task3.getVersion();
        expect(value.out).toEqual(4);
    });

    it('update to v3 with invalid migration dict', async () => {
        // NO 1->2 , 2->3, 3->4
        let c = Cell.fromBase64("te6ccgEBBgEALgABAcABAgmfAAAAAwIDAQkAAAAA8AQACQAAAAEQART/APSkE/S88sgLBQAG018E")
        const result = await task3.sendV3(deployer.getSender(), toNano('1'),v3code, c);
        const value = await task3.getVersion();
        expect(value.out).toEqual(1);
        expect(result.transactions).toHaveTransaction({
            exitCode: 400,
        })
    });

    it('update to v3 with invalid migration dict', async () => {
        // 1->2 , NO 2->3, 3->4
        let c = Cell.fromBase64("te6ccgEBBAEAGwABAcABAgmeAAAAAgIDAAlQAAAAJAAJUAAAAEQ=")
        const result = await task3.sendV3(deployer.getSender(), toNano('1'),v3code, c);
        const value = await task3.getVersion();
        expect(value.out).toEqual(1);
        expect(result.transactions).toHaveTransaction({
            exitCode: 400,
        })
    });

    it('valid migration dict', async () => {
        // 1->2 , 2->3 with data migration, 3->4
        let c = Cell.fromBase64("te6ccgEBCAEAOgABAcABAgmeAAAAAgIDAAlQAAAAJAIBIAQFAQkAAAAA8AYACQAAAAEQART/APSkE/S88sgLBwAG018E")
    });

});
