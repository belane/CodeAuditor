pragma solidity >=0.4.0 <0.5.17;

contract Purpose {
    event SetPurpose(address sender, string purpose);
    string public purpose = "test contract";
    address public lastSender;

    constructor() public payable {
        lastSender = msg.sender;
    }

    function setPurpose(string memory newPurpose) public {
        purpose = newPurpose;
        lastSender = msg.sender;
        emit SetPurpose(lastSender, purpose);
    }
}
