const { expectRevert } = require('@openzeppelin/test-helpers');
const { assert } = require("chai");

const PaiReferral = artifacts.require('PaiReferral');

contract('PaiReferral', ([alice, bob, carol, referrer, operator, owner]) => {
    beforeEach(async () => {
        this.paiReferral = await PaiReferral.new({ from: owner });
        this.zeroAddress = '0x0000000000000000000000000000000000000000';
    });

    it('should allow operator and only owner to update operator', async () => {
        assert.equal((await this.paiReferral.operators(operator)).valueOf(), false);
        await expectRevert(this.paiReferral.recordReferral(alice, referrer, { from: operator }), 'Operator: caller is not the operator');

        await expectRevert(this.paiReferral.updateOperator(operator, true, { from: carol }), 'Ownable: caller is not the owner');
        await this.paiReferral.updateOperator(operator, true, { from: owner });
        assert.equal((await this.paiReferral.operators(operator)).valueOf(), true);

        await this.paiReferral.updateOperator(operator, false, { from: owner });
        assert.equal((await this.paiReferral.operators(operator)).valueOf(), false);
        await expectRevert(this.paiReferral.recordReferral(alice, referrer, { from: operator }), 'Operator: caller is not the operator');
    });

    it('record referral', async () => {
        assert.equal((await this.paiReferral.operators(operator)).valueOf(), false);
        await this.paiReferral.updateOperator(operator, true, { from: owner });
        assert.equal((await this.paiReferral.operators(operator)).valueOf(), true);

        await this.paiReferral.recordReferral(this.zeroAddress, referrer, { from: operator });
        await this.paiReferral.recordReferral(alice, this.zeroAddress, { from: operator });
        await this.paiReferral.recordReferral(this.zeroAddress, this.zeroAddress, { from: operator });
        await this.paiReferral.recordReferral(alice, alice, { from: operator });
        assert.equal((await this.paiReferral.getReferrer(alice)).valueOf(), this.zeroAddress);
        assert.equal((await this.paiReferral.referralsCount(referrer)).valueOf(), '0');

        await this.paiReferral.recordReferral(alice, referrer, { from: operator });
        assert.equal((await this.paiReferral.getReferrer(alice)).valueOf(), referrer);
        assert.equal((await this.paiReferral.referralsCount(referrer)).valueOf(), '1');

        assert.equal((await this.paiReferral.referralsCount(bob)).valueOf(), '0');
        await this.paiReferral.recordReferral(alice, bob, { from: operator });
        assert.equal((await this.paiReferral.referralsCount(bob)).valueOf(), '0');
        assert.equal((await this.paiReferral.getReferrer(alice)).valueOf(), referrer);

        await this.paiReferral.recordReferral(carol, referrer, { from: operator });
        assert.equal((await this.paiReferral.getReferrer(carol)).valueOf(), referrer);
        assert.equal((await this.paiReferral.referralsCount(referrer)).valueOf(), '2');
    });

    it('record referral commission', async () => {
        assert.equal((await this.paiReferral.totalReferralCommissions(referrer)).valueOf(), '0');

        await expectRevert(this.paiReferral.recordReferralCommission(referrer, 1, { from: operator }), 'Operator: caller is not the operator');
        await this.paiReferral.updateOperator(operator, true, { from: owner });
        assert.equal((await this.paiReferral.operators(operator)).valueOf(), true);

        await this.paiReferral.recordReferralCommission(referrer, 1, { from: operator });
        assert.equal((await this.paiReferral.totalReferralCommissions(referrer)).valueOf(), '1');

        await this.paiReferral.recordReferralCommission(referrer, 0, { from: operator });
        assert.equal((await this.paiReferral.totalReferralCommissions(referrer)).valueOf(), '1');

        await this.paiReferral.recordReferralCommission(referrer, 111, { from: operator });
        assert.equal((await this.paiReferral.totalReferralCommissions(referrer)).valueOf(), '112');

        await this.paiReferral.recordReferralCommission(this.zeroAddress, 100, { from: operator });
        assert.equal((await this.paiReferral.totalReferralCommissions(this.zeroAddress)).valueOf(), '0');
    });
});
