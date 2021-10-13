pragma solidity 0.6.12;

import "@paiswap/pai-swap-lib/contracts/proxy/TransparentUpgradeableProxy.sol";

/**
 * @dev PaiSwap: Initial Pai Offering
 *
 * Website: https://paiswap.com
 * Dex: https://dex.paiswap.com
 * Twitter: https://twitter.com/PaiSwap
 *
 */
contract IPOUpgradeProxy is TransparentUpgradeableProxy {

    constructor(address admin, address logic, bytes memory data) TransparentUpgradeableProxy(logic, admin, data) public {

    }

}
