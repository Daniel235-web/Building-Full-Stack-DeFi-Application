//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; 

//very simple token that is used for demonstrating various of defi  applications

contract MemeToken is ERC20 {
    constructor () ERC20("Meme Token", "MEME") {

        //initial supply of 1,000,000,000 tokens are given to msg.sender which is the owner
        _mint(msg.sender, 1e27);

    }
}