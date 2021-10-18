const { expectRevert } = require("@openzeppelin/test-helpers");
const { assert } = require("chai");

const PaiToken = artifacts.require('PaiToken');

contract('PaiToken', ([alice, bob, carol, operator, owner]) => {
    beforeEach(async () => {
        this.pai = await PaiToken.new({ from: owner });
        this.burnAddress = '0x000000000000000000000000000000000000dEaD';
        this.zeroAddress = '0x0000000000000000000000000000000000000000';
    });

    it('only operator', async () => {
        assert.equal((await this.pai.owner()), owner);
        assert.equal((await this.pai.operator()), owner);

        await expectRevert(this.pai.updateTransferTaxRate(500, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.pai.updateBurnRate(20, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.pai.updateMaxTransferAmountRate(100, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.pai.updateSwapAndLiquifyEnabled(true, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.pai.setExcludedFromAntiWhale(operator, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.pai.updatePaiSwapRouter(operator, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.pai.updateMinAmountToLiquify(100, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.pai.transferOperator(alice, { from: operator }), 'operator: caller is not the operator');
    });

    it('transfer operator', async () => {
        await expectRevert(this.pai.transferOperator(operator, { from: operator }), 'operator: caller is not the operator');
        await this.pai.transferOperator(operator, { from: owner });
        assert.equal((await this.pai.operator()), operator);

        await expectRevert(this.pai.transferOperator(this.zeroAddress, { from: operator }), 'PAI::transferOperator: new operator is the zero address');
    });

    it('update transfer tax rate', async () => {
        await this.pai.transferOperator(operator, { from: owner });
        assert.equal((await this.pai.operator()), operator);

        assert.equal((await this.pai.transferTaxRate()).toString(), '500');
        assert.equal((await this.pai.burnRate()).toString(), '20');

        await this.pai.updateTransferTaxRate(0, { from: operator });
        assert.equal((await this.pai.transferTaxRate()).toString(), '0');
        await this.pai.updateTransferTaxRate(1000, { from: operator });
        assert.equal((await this.pai.transferTaxRate()).toString(), '1000');
        await expectRevert(this.pai.updateTransferTaxRate(1001, { from: operator }), 'PAI::updateTransferTaxRate: Transfer tax rate must not exceed the maximum rate.');

        await this.pai.updateBurnRate(0, { from: operator });
        assert.equal((await this.pai.burnRate()).toString(), '0');
        await this.pai.updateBurnRate(100, { from: operator });
        assert.equal((await this.pai.burnRate()).toString(), '100');
        await expectRevert(this.pai.updateBurnRate(101, { from: operator }), 'PAI::updateBurnRate: Burn rate must not exceed the maximum rate.');
    });

    it('transfer', async () => {
        await this.pai.transferOperator(operator, { from: owner });
        assert.equal((await this.pai.operator()), operator);

        await this.pai.mint(alice, 10000000, { from: owner }); // max transfer amount 25,000
        assert.equal((await this.pai.balanceOf(alice)).toString(), '10000000');
        assert.equal((await this.pai.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.pai.balanceOf(this.pai.address)).toString(), '0');

        await this.pai.transfer(bob, 12345, { from: alice });
        assert.equal((await this.pai.balanceOf(alice)).toString(), '9987655');
        assert.equal((await this.pai.balanceOf(bob)).toString(), '11728');
        assert.equal((await this.pai.balanceOf(this.burnAddress)).toString(), '123');
        assert.equal((await this.pai.balanceOf(this.pai.address)).toString(), '494');

        await this.pai.approve(carol, 22345, { from: alice });
        await this.pai.transferFrom(alice, carol, 22345, { from: carol });
        assert.equal((await this.pai.balanceOf(alice)).toString(), '9965310');
        assert.equal((await this.pai.balanceOf(carol)).toString(), '21228');
        assert.equal((await this.pai.balanceOf(this.burnAddress)).toString(), '346');
        assert.equal((await this.pai.balanceOf(this.pai.address)).toString(), '1388');
    });

    it('transfer small amount', async () => {
        await this.pai.transferOperator(operator, { from: owner });
        assert.equal((await this.pai.operator()), operator);

        await this.pai.mint(alice, 10000000, { from: owner });
        assert.equal((await this.pai.balanceOf(alice)).toString(), '10000000');
        assert.equal((await this.pai.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.pai.balanceOf(this.pai.address)).toString(), '0');

        await this.pai.transfer(bob, 19, { from: alice });
        assert.equal((await this.pai.balanceOf(alice)).toString(), '9999981');
        assert.equal((await this.pai.balanceOf(bob)).toString(), '19');
        assert.equal((await this.pai.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.pai.balanceOf(this.pai.address)).toString(), '0');
    });

    it('transfer without transfer tax', async () => {
        await this.pai.transferOperator(operator, { from: owner });
        assert.equal((await this.pai.operator()), operator);

        assert.equal((await this.pai.transferTaxRate()).toString(), '500');
        assert.equal((await this.pai.burnRate()).toString(), '20');

        await this.pai.updateTransferTaxRate(0, { from: operator });
        assert.equal((await this.pai.transferTaxRate()).toString(), '0');

        await this.pai.mint(alice, 10000000, { from: owner });
        assert.equal((await this.pai.balanceOf(alice)).toString(), '10000000');
        assert.equal((await this.pai.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.pai.balanceOf(this.pai.address)).toString(), '0');

        await this.pai.transfer(bob, 10000, { from: alice });
        assert.equal((await this.pai.balanceOf(alice)).toString(), '9990000');
        assert.equal((await this.pai.balanceOf(bob)).toString(), '10000');
        assert.equal((await this.pai.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.pai.balanceOf(this.pai.address)).toString(), '0');
    });

    it('transfer without burn', async () => {
        await this.pai.transferOperator(operator, { from: owner });
        assert.equal((await this.pai.operator()), operator);

        assert.equal((await this.pai.transferTaxRate()).toString(), '500');
        assert.equal((await this.pai.burnRate()).toString(), '20');

        await this.pai.updateBurnRate(0, { from: operator });
        assert.equal((await this.pai.burnRate()).toString(), '0');

        await this.pai.mint(alice, 10000000, { from: owner });
        assert.equal((await this.pai.balanceOf(alice)).toString(), '10000000');
        assert.equal((await this.pai.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.pai.balanceOf(this.pai.address)).toString(), '0');

        await this.pai.transfer(bob, 1234, { from: alice });
        assert.equal((await this.pai.balanceOf(alice)).toString(), '9998766');
        assert.equal((await this.pai.balanceOf(bob)).toString(), '1173');
        assert.equal((await this.pai.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.pai.balanceOf(this.pai.address)).toString(), '61');
    });

    it('transfer all burn', async () => {
        await this.pai.transferOperator(operator, { from: owner });
        assert.equal((await this.pai.operator()), operator);

        assert.equal((await this.pai.transferTaxRate()).toString(), '500');
        assert.equal((await this.pai.burnRate()).toString(), '20');

        await this.pai.updateBurnRate(100, { from: operator });
        assert.equal((await this.pai.burnRate()).toString(), '100');

        await this.pai.mint(alice, 10000000, { from: owner });
        assert.equal((await this.pai.balanceOf(alice)).toString(), '10000000');
        assert.equal((await this.pai.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.pai.balanceOf(this.pai.address)).toString(), '0');

        await this.pai.transfer(bob, 1234, { from: alice });
        assert.equal((await this.pai.balanceOf(alice)).toString(), '9998766');
        assert.equal((await this.pai.balanceOf(bob)).toString(), '1173');
        assert.equal((await this.pai.balanceOf(this.burnAddress)).toString(), '61');
        assert.equal((await this.pai.balanceOf(this.pai.address)).toString(), '0');
    });

    it('max transfer amount', async () => {
        assert.equal((await this.pai.maxTransferAmountRate()).toString(), '50');
        assert.equal((await this.pai.maxTransferAmount()).toString(), '0');

        await this.pai.mint(alice, 1000000, { from: owner });
        assert.equal((await this.pai.maxTransferAmount()).toString(), '5000');

        await this.pai.mint(alice, 1000, { from: owner });
        assert.equal((await this.pai.maxTransferAmount()).toString(), '5005');

        await this.pai.transferOperator(operator, { from: owner });
        assert.equal((await this.pai.operator()), operator);

        await this.pai.updateMaxTransferAmountRate(100, { from: operator }); // 1%
        assert.equal((await this.pai.maxTransferAmount()).toString(), '10010');
    });

    it('anti whale', async () => {
        await this.pai.transferOperator(operator, { from: owner });
        assert.equal((await this.pai.operator()), operator);

        assert.equal((await this.pai.isExcludedFromAntiWhale(operator)), false);
        await this.pai.setExcludedFromAntiWhale(operator, true, { from: operator });
        assert.equal((await this.pai.isExcludedFromAntiWhale(operator)), true);

        await this.pai.mint(alice, 10000, { from: owner });
        await this.pai.mint(bob, 10000, { from: owner });
        await this.pai.mint(carol, 10000, { from: owner });
        await this.pai.mint(operator, 10000, { from: owner });
        await this.pai.mint(owner, 10000, { from: owner });

        // total supply: 50,000, max transfer amount: 250
        assert.equal((await this.pai.maxTransferAmount()).toString(), '250');
        await expectRevert(this.pai.transfer(bob, 251, { from: alice }), 'PAI::antiWhale: Transfer amount exceeds the maxTransferAmount');
        await this.pai.approve(carol, 251, { from: alice });
        await expectRevert(this.pai.transferFrom(alice, carol, 251, { from: carol }), 'PAI::antiWhale: Transfer amount exceeds the maxTransferAmount');

        //
        await this.pai.transfer(bob, 250, { from: alice });
        await this.pai.transferFrom(alice, carol, 250, { from: carol });

        await this.pai.transfer(this.burnAddress, 251, { from: alice });
        await this.pai.transfer(operator, 251, { from: alice });
        await this.pai.transfer(owner, 251, { from: alice });
        await this.pai.transfer(this.pai.address, 251, { from: alice });

        await this.pai.transfer(alice, 251, { from: operator });
        await this.pai.transfer(alice, 251, { from: owner });
        await this.pai.transfer(owner, 251, { from: operator });
    });

    it('update SwapAndLiquifyEnabled', async () => {
        await expectRevert(this.pai.updateSwapAndLiquifyEnabled(true, { from: operator }), 'operator: caller is not the operator');
        assert.equal((await this.pai.swapAndLiquifyEnabled()), false);

        await this.pai.transferOperator(operator, { from: owner });
        assert.equal((await this.pai.operator()), operator);

        await this.pai.updateSwapAndLiquifyEnabled(true, { from: operator });
        assert.equal((await this.pai.swapAndLiquifyEnabled()), true);
    });

    it('update min amount to liquify', async () => {
        await expectRevert(this.pai.updateMinAmountToLiquify(100, { from: operator }), 'operator: caller is not the operator');
        assert.equal((await this.pai.minAmountToLiquify()).toString(), '500000000000000000000');

        await this.pai.transferOperator(operator, { from: owner });
        assert.equal((await this.pai.operator()), operator);

        await this.pai.updateMinAmountToLiquify(100, { from: operator });
        assert.equal((await this.pai.minAmountToLiquify()).toString(), '100');
    });
});
