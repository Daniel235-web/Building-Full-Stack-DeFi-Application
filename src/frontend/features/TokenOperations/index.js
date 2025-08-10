import { Button, Divider, Grid, Typography, useTheme, TextField } from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import TokenABI from "../../contracts/SimpleDeFiToken.json";
import TokenAddress from "../../contracts/SimpleDeFiToken-address.json";
import { useWeb3React } from "@web3-react/core";

import { localProvider } from "../../components/wallet";
import { toast } from "react-toastify";
const TokenOperations = () => {
  const { active, account, library } = useWeb3React();
  const theme = useTheme();
  const [totalSupply, setTotalSupply] = useState(0);
  const [yourBalance, setYourBalance] = useState(0);
  const [addressNormal, setAddressNormal] = useState("");
  const [amountNormal, setAmountNormal] = useState(0);
  const [addressBurn, setAddressBurn] = useState("");
  const [amountBurn, setAmountBurn] = useState(0);
  const getTotalSupply = useCallback(async () => {
    try {
      const contract = new ethers.Contract(TokenAddress.address, TokenABI.abi, localProvider);
      const response = await contract.totalSupply();
      setTotalSupply(ethers.utils.formatEther(response));
    } catch (error) {
      console.error("can not get total supply ", error);
    }
  }, []);
  const getYourBalance = useCallback(async () => {
    if (!active) return;
    try {
      let contract = new ethers.Contract(TokenAddress.address, TokenABI.abi, library.getSigner());
      const response = await contract.balanceOf(account);
      setYourBalance(ethers.utils.formatEther(response));
    } catch (error) {
      console.error("cannot get your balance ", error);
    }
  }, [account, library, active]);
  const handleTransfer = async (autoBurn) => {
    if (!active) {
      toast.error("You would have to connect your wallet before any transactions!");
    }
    const type = autoBurn ? "auto Burn " : "normal";
    const address = autoBurn ? addressBurn : addressNormal;
    const amount = autoBurn ? amountBurn : amountNormal;
    if (!ethers.utils.isAddress(address)) {
      toast.error(`the reciepient address for ${type} transfer is not valide`);
      return;
    }
    if (isNaN(amount)) {
      toast.error(`the amount for ${type} transfer is not a valid`);
    }
    try {
      const contract = new ethers.Contract(TokenAddress.address, TokenABI.abi, library.getSigner());
      const tx = autoBurn
        ? await contract.transferWithAutoBurn(address, ethers.utils.parseUnits(amount, "ether"))
        : await contract.transfer(address, ethers.utils.parseUnits(amount, "ether"));
      toast.info(`Transaction Submitted! TxHash: ${tx.hash}`);
      await tx.wait();
      toast.info(`Transaction succeeded! TxHash: ${tx.hash}`);
      if (autoBurn) {
        setAddressBurn("");
        setAmountBurn(0);
      } else {
        setAddressNormal("");
        setAmountNormal(0);
      }
      getTotalSupply();
      getYourBalance();
    } catch (error) {
      toast.error(`cannot perform ${type} transfer!`);
      console.error(error);
    }
  };

  useEffect(() => {
    getTotalSupply();
    getYourBalance();
  }, [getTotalSupply, getYourBalance]);

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6">Simple DeFi Token</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="h6">Total Supply</Typography>
          <Typography>{totalSupply}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="h6">Your Balance </Typography>
          <Typography>{yourBalance}</Typography>
        </Grid>
      </Grid>
      <Divider sx={theme.component.divider} />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="6">Normal Transfer</Typography>
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="please enter the address you want to send to "
            value={addressNormal}
            fullWidth
            onChange={(e) => setAddressNormal(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="please enter amount to transfer"
            value={amountNormal}
            fullWidth
            onChange={(e) => setAmountNormal(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            sx={theme.component.primaryButton}
            fullwidth
            onClick={() => {
              handleTransfer(false);
            }}
          >
            Transfer!
          </Button>
        </Grid>
      </Grid>
      <Divider sx={theme.component.divider} />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6">Transfer With Burn</Typography>
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="please enter the address you want to send to"
            value={addressBurn}
            fullWidth
            onChange={(e) => setAddressBurn(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="please enter the amount you would transfer (10% fo the token will be burnt )"
            value={amountBurn}
            fullWidth
            onChange={(e) => setAmountBurn(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            sx={theme.component.primaryButton}
            fullWidth
            onClick={() => {
              handleTransfer(true);
            }}
          >
            {" "}
            Tansfer With Burn!
          </Button>
        </Grid>
      </Grid>
    </>
  );
};

export default TokenOperations;
