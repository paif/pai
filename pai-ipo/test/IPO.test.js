const { expectRevert, time } = require('@openzeppelin/test-helpers');
const MockBEP20 = artifacts.require('MockBEP20');
const IPO = artifacts.require('IPO');

contract('IPO', ([alice, bob, carol, dev, minter]) => {
  beforeEach(async () => {
    this.lp = await MockBEP20.new('LPToken', 'LP1', '1000000', { from: minter });
    this.ipoToken = await MockBEP20.new('WOW', 'WOW', '1000000', { from: minter });

    await this.lp.transfer(bob, '10', { from: minter });
    await this.lp.transfer(alice, '10', { from: minter });
    await this.lp.transfer(carol, '10', { from: minter });
  });

  it('raise not enough lp', async () => {
    // 10 lp raising, 100 ipo to offer
    this.ipo = await IPO.new(this.lp.address, this.ipoToken.address, '20', '30', '100', '10', alice, { from: minter });
    await this.ipoToken.transfer(this.ipo.address, '100', { from: minter });

    await this.lp.approve(this.ipo.address, '1000', { from: alice });
    await this.lp.approve(this.ipo.address, '1000', { from: bob });
    await this.lp.approve(this.ipo.address, '1000', { from: carol });
    await expectRevert(
      this.ipo.deposit('1', {from: bob}),
      'not ipo time',
    );

    await time.advanceBlockTo('20');

    await this.ipo.deposit('1', {from: bob});
    await this.ipo.deposit('2', {from: alice});
    await this.ipo.deposit('3', {from: carol});
    assert.equal((await this.ipo.totalAmount()).toString(), '6');
    assert.equal((await this.ipo.getUserAllocation(carol)).toString(), '500000');
    assert.equal((await this.ipo.getUserAllocation(alice)).toString(), '333333');
    assert.equal((await this.ipo.getOfferingAmount(carol)).toString(), '30');
    assert.equal((await this.ipo.getOfferingAmount(bob)).toString(), '10');
    assert.equal((await this.ipo.getRefundingAmount(bob)).toString(), '0');
    await expectRevert(
      this.ipo.harvest({from: bob}),
      'not harvest time',
    );

    await time.advanceBlockTo('30');
    assert.equal((await this.lp.balanceOf(carol)).toString(), '7');
    assert.equal((await this.ipoToken.balanceOf(carol)).toString(), '0');
    await this.ipo.harvest({from: carol});
    assert.equal((await this.lp.balanceOf(carol)).toString(), '7');
    assert.equal((await this.ipoToken.balanceOf(carol)).toString(), '30');
    await expectRevert(
      this.ipo.harvest({from: carol}),
      'nothing to harvest',
    );

  })

  it('raise enough++ lp', async () => {
    // 10 lp raising, 100 ipo to offer
    this.ipo = await IPO.new(this.lp.address, this.ipoToken.address, '50', '100', '100', '10', alice, { from: minter });
    await this.ipoToken.transfer(this.ipo.address, '100', { from: minter });

    await this.lp.approve(this.ipo.address, '1000', { from: alice });
    await this.lp.approve(this.ipo.address, '1000', { from: bob });
    await this.lp.approve(this.ipo.address, '1000', { from: carol });
    await expectRevert(
      this.ipo.deposit('1', {from: bob}),
      'not ipo time',
    );

    await time.advanceBlockTo('50');

    await this.ipo.deposit('1', {from: bob});
    await this.ipo.deposit('2', {from: alice});
    await this.ipo.deposit('3', {from: carol});
    await this.ipo.deposit('1', {from: bob});
    await this.ipo.deposit('2', {from: alice});
    await this.ipo.deposit('3', {from: carol});
    await this.ipo.deposit('1', {from: bob});
    await this.ipo.deposit('2', {from: alice});
    await this.ipo.deposit('3', {from: carol});
    assert.equal((await this.ipo.totalAmount()).toString(), '18');
    assert.equal((await this.ipo.getUserAllocation(carol)).toString(), '500000');
    assert.equal((await this.ipo.getUserAllocation(alice)).toString(), '333333');
    assert.equal((await this.ipo.getOfferingAmount(carol)).toString(), '50');
    assert.equal((await this.ipo.getOfferingAmount(bob)).toString(), '16');
    assert.equal((await this.ipo.getRefundingAmount(carol)).toString(), '4');
    assert.equal((await this.ipo.getRefundingAmount(bob)).toString(), '2');
    await expectRevert(
      this.ipo.harvest({from: bob}),
      'not harvest time',
    );
    assert.equal((await this.ipo.totalAmount()).toString(), '18');

    await time.advanceBlockTo('100');
    assert.equal((await this.lp.balanceOf(carol)).toString(), '1');
    assert.equal((await this.ipoToken.balanceOf(carol)).toString(), '0');
    await this.ipo.harvest({from: carol});
    assert.equal((await this.lp.balanceOf(carol)).toString(), '5');
    assert.equal((await this.ipoToken.balanceOf(carol)).toString(), '50');
    await expectRevert(
      this.ipo.harvest({from: carol}),
      'nothing to harvest',
    );
    assert.equal((await this.ipo.hasHarvest(carol)).toString(), 'true');
    assert.equal((await this.ipo.hasHarvest(bob)).toString(), 'false');

  })

  it('raise enough lp', async () => {
    // 10 lp raising, 100 ipo to offer
    this.ipo = await IPO.new(this.lp.address, this.ipoToken.address, '120', '170', '18', '18', alice, { from: minter });
    await this.ipoToken.transfer(this.ipo.address, '100', { from: minter });

    await this.lp.approve(this.ipo.address, '1000', { from: alice });
    await this.lp.approve(this.ipo.address, '1000', { from: bob });
    await this.lp.approve(this.ipo.address, '1000', { from: carol });
    await expectRevert(
      this.ipo.deposit('1', {from: bob}),
      'not ipo time',
    );

    await time.advanceBlockTo('120');

    await this.ipo.deposit('1', {from: bob});
    await this.ipo.deposit('2', {from: alice});
    await this.ipo.deposit('3', {from: carol});
    await this.ipo.deposit('1', {from: bob});
    await this.ipo.deposit('2', {from: alice});
    await this.ipo.deposit('3', {from: carol});
    await this.ipo.deposit('1', {from: bob});
    await this.ipo.deposit('2', {from: alice});
    await this.ipo.deposit('3', {from: carol});
    assert.equal((await this.ipo.totalAmount()).toString(), '18');
    assert.equal((await this.ipo.getUserAllocation(carol)).toString(), '500000');
    assert.equal((await this.ipo.getUserAllocation(alice)).toString(), '333333');
    assert.equal((await this.ipo.getOfferingAmount(carol)).toString(), '9');
    assert.equal((await this.ipo.getOfferingAmount(minter)).toString(), '0');
    assert.equal((await this.ipo.getOfferingAmount(bob)).toString(), '3');
    assert.equal((await this.ipo.getRefundingAmount(carol)).toString(), '0');
    assert.equal((await this.ipo.getRefundingAmount(bob)).toString(), '0');
    await expectRevert(
      this.ipo.harvest({from: bob}),
      'not harvest time',
    );
    assert.equal((await this.ipo.totalAmount()).toString(), '18');

    await time.advanceBlockTo('170');
    assert.equal((await this.lp.balanceOf(carol)).toString(), '1');
    assert.equal((await this.ipoToken.balanceOf(carol)).toString(), '0');
    await this.ipo.harvest({from: carol});
    assert.equal((await this.lp.balanceOf(carol)).toString(), '1');
    assert.equal((await this.ipoToken.balanceOf(carol)).toString(), '9');
    await expectRevert(
      this.ipo.harvest({from: carol}),
      'nothing to harvest',
    );
    assert.equal((await this.ipo.hasHarvest(carol)).toString(), 'true');
    assert.equal((await this.ipo.hasHarvest(bob)).toString(), 'false');
    assert.equal((await this.ipo.getAddressListLength()).toString(), '3');

  })
});
