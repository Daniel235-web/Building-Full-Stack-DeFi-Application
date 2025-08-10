//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BarToken is ERC20 {
    constructor() ERC20("Bar Token", "BAR") {
        //initial supply token of 1,000,000,000 given to the msg.sender
        _mint(msg.sender, 1e27);
    }
}
