import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { ReferralWood } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { utils, BigNumber } from "ethers";
import { toUtf8Bytes } from 'ethers/lib/utils';

describe("ReferralWood", function() {

    let Bob: SignerWithAddress;
    let Alice: SignerWithAddress;
    let Mike: SignerWithAddress;
    let Tony: SignerWithAddress;
    let Jacy: SignerWithAddress;
    let Tim: SignerWithAddress;
    let Ann: SignerWithAddress;
    let Alex: SignerWithAddress;
    let Paul: SignerWithAddress;
    let Dave: SignerWithAddress;
    let Val: SignerWithAddress;
    let Liza: SignerWithAddress;
    let Olga: SignerWithAddress;
    let Tonya: SignerWithAddress;
    let Sveta: SignerWithAddress;
    let Monica: SignerWithAddress;
    let Fred: SignerWithAddress;

    let referralWood: ReferralWood;

    beforeEach(async function() {
        [Bob, Alice, Mike, Tony, Jacy, Tim, Ann, Alex, Paul, Dave, Val, Liza, Olga, Tonya, Sveta, Monica, Fred] = await ethers.getSigners();

        const ReferralWood = await ethers.getContractFactory("ReferralWood", Bob);
        referralWood = await ReferralWood.deploy();
        await referralWood.deployed();
    })

    it("Should be deployed", async function() {
        expect(referralWood.address).to.be.properAddress;
    })

    describe("Set chest price", function() {

        it("Should set price for chest by chest index", async function() {
            await referralWood.connect(Bob).setPrice(0, 100);

            expect((await referralWood.chestsList(0)).priceInEth)
            .to.be.equal(100)
        })

        it("Should be reverted with error message because of Alice not a contract owner", async function() {
            await expect(referralWood.connect(Alice).setPrice(0, 100))
            .to.be.revertedWith("Ownable: caller is not the owner")
        })

        it("Should be reverted with message because of wrong chest number", async function() {
            await expect(referralWood.connect(Bob).setPrice(8, 100))
            .to.be.revertedWith("Chest total is 7")
        })
    })

    describe("Parent view function", function () {

        it("Should show a referrer of user", async function() {
            await referralWood.connect(Bob).setPrice(0, 100);

            await referralWood.connect(Bob).joinTo(Alice.address, { value: 100 });

            expect((await referralWood.connect(Bob).parent()))
            .to.be.equal(Alice.address)
        })
    })

    describe("User level view function", function() {

        it("Should retern 0 level because of 1 referral", async function() {
            await referralWood.connect(Bob).setPrice(0, 100);

            await referralWood.connect(Bob).joinTo(Alice.address, { value: 100 });

            expect((await referralWood.connect(Alice).userLevel(Alice.address)))
            .to.be.equal(0)
        })

        it("Should return 1 level because of 4 referrals", async function() {
            await referralWood.connect(Bob).setPrice(0, 100);

            await referralWood.connect(Bob).joinTo(Alice.address, { value: 100 });
            await referralWood.connect(Mike).joinTo(Alice.address, { value: 100 });
            await referralWood.connect(Tony).joinTo(Alice.address, { value: 100 });
            await referralWood.connect(Jacy).joinTo(Alice.address, { value: 100 });

            expect((await referralWood.connect(Alice).userLevel(Alice.address)))
            .to.be.equal(1)
        })
    })

    describe("Amount of referrals to unlock setting in constructor", function() {

        it("Should set amount of refferals to each of chests", async function() {
            expect((await referralWood.chestsList(1)).amountOfReferralsToUnlock)
            .to.be.equal(9)
        })
    })

    describe("Join To function", function() {

        it("Should set user referrer if user is not registered yet", async function() {
            await referralWood.connect(Bob).setPrice(0, 100);

            await referralWood.connect(Bob).joinTo(Alice.address, { value: 100 });

            expect((await referralWood.connect(Bob).usersList(Bob.address)).referrer)
            .to.be.equal(Alice.address)
        })

        it("Should stay users first referrer if user is already registered", async function() {
            await referralWood.connect(Bob).setPrice(0, 100);

            await referralWood.connect(Bob).joinTo(Alice.address, { value: 100 });
            await referralWood.connect(Bob).joinTo(Jacy.address, { value: 100});

            expect((await referralWood.connect(Bob).usersList(Bob.address)).referrer)
            .to.be.equal(Alice.address)
        })

        it("Should be reverted because of insufficient value of tx", async function() {
            await referralWood.connect(Bob).setPrice(0, 100);

            await expect(referralWood.joinTo(Alice.address, { value: 50 }))
            .to.be.reverted
        })

        it("Should send users money back if msg value greater then chest price", async function() {
            await referralWood.connect(Bob).setPrice(0, 100);

            await expect(() => referralWood.joinTo(Alice.address, { value: 150 }))
            .to.changeEtherBalance(Bob, -100)
        })

        it("Should add referrals to referrals list", async function() {
            await referralWood.connect(Bob).setPrice(0, 100);

            await referralWood.connect(Bob).joinTo(Alice.address, { value: 100 });

            expect((await referralWood.referralsNumberOnLevel(Alice.address, 0)))
            .to.be.equal(1)
        })

        it("Should unlock chest and transfer chest price to referrer", async function() {
            await referralWood.connect(Bob).setPrice(0, 100);

            await referralWood.connect(Bob).joinTo(Alice.address, { value: 100 });
            await referralWood.connect(Mike).joinTo(Alice.address, { value: 100 });
            await referralWood.connect(Tony).joinTo(Alice.address, { value: 100 });
            
            await expect(() => referralWood.connect(Jacy).joinTo(Alice.address, { value: 100 }))
            .to.changeEtherBalance(Alice, 100)
        })

        it("Should add 3 referral to next level", async function() {
            await referralWood.connect(Bob).setPrice(0, 100);

            await referralWood.connect(Bob).joinTo(Alice.address, { value: 100 });
            await referralWood.connect(Mike).joinTo(Alice.address, { value: 100 });
            await referralWood.connect(Tony).joinTo(Alice.address, { value: 100 });
            await referralWood.connect(Jacy).joinTo(Alice.address, { value: 100 });
            await referralWood.connect(Tim).joinTo(Alice.address, { value: 100 });
            await referralWood.connect(Ann).joinTo(Alice.address, { value: 100 });

            expect((await referralWood.referralsNumberOnLevel(Alice.address, 1)))
            .to.be.equal(3) 
        })
    })
})