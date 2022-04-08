pragma solidity >=0.4.0 <0.5.17;

contract Owner {
    address public owner;

    constructor() public payable {
        owner = msg.sender;
    }

    function() public payable {}
}
