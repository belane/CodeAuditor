pragma solidity ^0.4.15;

contract Payments {
    mapping (address => uint) userBalance;

    function getBalance(address u) public constant returns(uint) {
        return userBalance[u];
    }

    function addToBalance() public payable {
        userBalance[msg.sender] += msg.value;
    }   

    function withdrawBalance() public {
        if(!(msg.sender.call.value(userBalance[msg.sender])())) {
            revert();
        }
        userBalance[msg.sender] = 0;
    }   
}
