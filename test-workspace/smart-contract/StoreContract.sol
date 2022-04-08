pragma solidity ^0.4.15;

import "./lib/Payments.sol";
import "./lib/Owner.sol";
import "./Purpose.sol";

contract StoreContract is Payments, Purpose, Owner {
    uint private sellerBalance = 0;

    function add(uint value) public returns (bool) {
        sellerBalance += value;
    }

    function safe_add(uint value) public returns (bool) {
        require(value + sellerBalance >= sellerBalance);
        sellerBalance += value;
    }
}
