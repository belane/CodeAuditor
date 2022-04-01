pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT


contract Lib {

  address public owner;

  constructor() payable {
    owner = msg.sender;
  }

  receive() external payable {}
  fallback() external payable {}
}
