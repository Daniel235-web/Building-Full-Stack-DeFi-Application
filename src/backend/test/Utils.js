const {ethers} = require("hardhat");
const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) =>  ethers.utils.parseEther(num);
exports.toWei = toWei;
exports.fromWei = fromWei;
