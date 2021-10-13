pragma solidity =0.5.16;

import '../PaiERC20.sol';

contract ERC20 is PaiERC20 {
    constructor(uint _totalSupply) public {
        _mint(msg.sender, _totalSupply);
    }
}
