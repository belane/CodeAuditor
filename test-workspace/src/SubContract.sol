pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT


contract Contract {

  event SetPurpose(address sender, string purpose);

  string public purpose = "test contract";
  address public lastSender;

  constructor() payable {
    lastSender = msg.sender;
  }

  function setPurpose(string memory newPurpose) public {
      purpose = newPurpose;
      lastSender = msg.sender;
      emit SetPurpose(lastSender, purpose);
  }

  // to support receiving ETH
  receive() external payable {}
  fallback() external payable {}
}
