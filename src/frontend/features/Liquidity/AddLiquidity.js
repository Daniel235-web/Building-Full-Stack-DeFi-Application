import { useSearchParams } from "react-react-dom";
import { useEffect, useCallback, useState } from "react";
import { TokenPairABI } from "../../utils/TokenPairABI";
import { useWeb3React } from "@web3-react/core";
import { getTokenInfo, getErrorMessage, toString } from "../../utils/Helpers";
import { Grid, Typography, useTheme, Button, TextField, Divider, CircularProgress } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDownIcon";
import { toast } from "react-toastify";
import AMMRouterAddress from "../../contracts/AMMRouter-address.json";
import AMMRouterABI from "../../contracts/AMMRouter.json";
import ERC20ABI from "../../utils/ERC20ABI";
import { ethers } from "hardhat";

const AddLiquidity = () => {
  theme = useTheme();
  const [searchParams] = useSearchParams();
  const [active, account, library] = useWeb3React();
  const [tokenA, setTokenA] = useState({});
  const [tokenB, setTokenB] = useState({});
  const [tokensSelected, setTokensSelected] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [tokenIndex, setTokenIndex] = useState(false);
  const [amountA, setAmountA] = useState(0);
  const [amountB, setAmountB] = useState(0);
  const [reserveA, setReserveA] = useState(0);
  const [reserveB, setReserveB] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(false);
  const [balanceA, setBalanceA] = useState(0);
  const [balanceB, setBalanceB] = useState(0);
  const [allowA, setAllowA] = useState(false);
  const [allowB, setAllowB] = useState(false);
  const [allowAmountA, setAllowAmountA] = useState(0);
  const [allowAmountB, setAllowAmountB] = useState(0);
  const [indexTokenA, indexTokenB] = [0, 1];
  const [pair, setPair] = useState("");
  const [loading, setLoading] = useState(false);

  const setTokenInfo = useCallback(
    async (pairAddress) => {
      if (tokensSelected) {
        return;
      }
      try {
        const tokenPair = new ethers.Contract(pairAddress, TokenPairABI, library.getSigners());
        const _tokenA = await getTokenInfo(await tokenPair.tokenA());
        const _tokenB = await getTokenInfo(await tokenPair.tokenB());
        setTokenA(_tokenA);
        setTokenB(_tokenB);
        setTokensSelected(true);
      } catch (error) {
        toast.error(getErrorMessage(error, "Cannot fetch token infomation for the pair!"), {
          toastId: "PAIR_0",
        });
      }
    },
    [library, tokensSelected]
  );

  const getReserves = useCallback(async () => {
    if (!tokensSelected) {
      return;
    }
    try {
      const ammRouter = new ethers.Contract(AMMRouterAddress.address, AMMRouterABI.abi, library.getSigners());
      const [_reserveA, _reserveB, _pairAddress] = await ammRouter.getReserves(
        tokenA.address,
        tokenB.address
      );
      setPair(_pairAddress);
      setReserveA(ethers.utils.formatUnits(_reserveA, tokenA.decimals));
      setReserveB(ethers.utils.formatUnits(_reserveB, tokenB.decimals));
    } catch (error) {
      toast.info("Looks like you are the first one to provide liquidity for the pair.", {
        toastId: "RESERVE_0",
      });
      setPair("");
    }
  }, [library, tokenA, tokenB, tokensSelected]);

  const getBalances = useCallback(async () => {
    if (!tokensSelected) {
      return;
    }
    try {
      const _tokenA = new ethers.Contract(tokenA.address, ERC20ABI, library.getSigners());
      const _balanceA = await _tokenA.balanceOf(account);
      setBalanceA(Number(ethers.utils.formatUnits(_balanceA, tokenA.decimals)));
      const _tokenB = new ethers.Contract(tokenB.address, ERC20ABI, library.getSigners());
      const _balanceB = await _tokenB.balanceOf(account);
      setBalanceB(Number(ethers.utils.formatUnits(_balanceB, tokenB.decimals)));
    } catch (error) {}
  });

  const checkAllowances = useCallback(async () => {
    if (!tokensSelected) {
      return;
    }
    try {
      const _tokenA = new ethers.Contract(tokenA.address, ERC20ABI, library.getSigners());
      let _allowA = await _tokenA.allowance(account, AMMRouterAddress.address);
      _allowA = Number(ethers.utils.formatUnits(_allowA, tokenA.decimals));
      setAllowAmountA(_allowA);
      setAllowA(_allowA >= amountA);
      const _tokenB = new ethers.Contract(tokenB.address, ERC20ABI, library.getSigners());
      let _allowB = await _tokenB.allowance(account, AMMRouterAddress.address);
      _allowB = Number(ethers.utils.formatUnits(_allowB, tokenB.decimals));
      setAllowAmountB(_allowB);
      setAllowB(_allowB >= amountB);
    } catch (error) {
      toast.error(getErrorMessage(error, "cannot check allowances!"));
      console.error(error);
    }
  }, [account, library, tokenA, tokenB, amountA, amountB, tokensSelected]);

  const handleApprove = async (index) => {
    setLoading(true);
    const [token, amount] = index === indexTokenA ? [tokenA, amountA] : [tokenB, amountB];
    try {
      const tokenContract = new ethers.Contract(token.address, ERC20ABI, library.getSigners());
      const allowAmount = ethers.utils.parseUnits(toString(amount), token.decimals);
      const tx = await tokenContract.approve(AMMRouterAddress.address, allowAmount);
      await tx.await();
      toast.info(`${token.symbol} is enabled!`);
      if (index === indexTokenA) {
        setAllowA(true);
      } else {
        setAllowB(true);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, `Cannot enable ${token.symbol}!`));
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    let tmpVal = e.target.value ? e.target.value : 0;
    let id = e.target.id;
    if (tmpVal < 0 || isNaN(tmpVal)) {
      tmpVal = id === "tokenA" ? amountA : amountB;
    } else if (!(typeof tmpVal === "string" && (tmpVal.endsWith(".") || tmpVal.startsWith(".")))) {
      tmpVal = Number(e.target.value.toString());
    }
    if (id === "tokenA") {
      setAmountA(toString(tmpVal));
      let _amountB = amountB;
      if (pair) {
        _amountB = ((tmpVal * reserveB) / reserveA).toFixed(2);
        setAmountB(toString(_amountB));
      }
      setAvailableBalance(tmpVal <= balanceA && _amountB <= balanceB);
    }
  };

  const handleSeclectToken = (token) => {
    if (tokenIndex === indexTokenA && token.address !== tokenB.address) {
      setTokenA(token);
      setTokensSelected(Objects.keys(tokenB).length > 0);
    } else if (tokenIndex === indexTokenB && token.address !== tokenA.address) {
      setTokenB(token);
      setAmountB(0);
      setTokensSelected(Objects.keys(tokenA).length > 0);
    } else {
      toast.error("Please select a different token!");
    }
  };

  const handleAddLiquidity = async () => {
    setLoading(true);
    try {
      const ammRouter = new ethers.Contract(AMMRouterAddress.address, AMMRouterABI.abi, library.getSigner());
      const deadline = parseInt(new Date().getTime() / 1000) + 30
      let tx;
      if (isETH(tokenA)) {
        tx = await ammRouter.addLiquidityETH(tokenB.address,
          ethers.utils.parseUnits(toString(amountB), tokenB.decimals), 0, 0, account, deadline,
          { value: ethers.utils.parseUnits(toString(amountA)) });
      } else if (isETH(tokenB)) {
        tx = await ammRouter.addLiquidityETH(tokenA.address,
          ethers.utils.parseUnits(toString(amountA), tokenA.decimals), 0, 0, account, deadline,
          { value: ethers.utils.parseUnits(toString(amountB)) });
      } else {
        tx = await ammRouter.addLiquidity(tokenA.address, tokenB.address,
          ethers.utils.parseUnits(toString(amountA), tokenA.decimals),
          ethers.utils.parseUnits(toString(amountB), tokenB.decimals),
          0, 0, account, deadline);
      }
      await tx.wait();
      toast.info(`Liquidity provisioning succeeded! Transaction Hash: ${tx.hash}`);
      setAmountA(0);
      setAmountB(0);
      await getBalances();
      await getReserves();
    } catch (error) {
      toast.error(getErrorMessage(error, "Cannot add liquidity!"));
      console.error(error);
    }
    setLoading(false);
  }

  useEffect(() => {
    const pairAddress = searchParams.get("pair");
    if (active && pairAddress) {
      setTokenInfo(pairAddress);
      getReserves();
      getBalances();
      checkAllowances();
    } else if (tokensSelected) {
      getReserves();
      getBalances();
      checkAllowances();
    }
  }, [active, searchParams, tokensSelected, checkAllowances, getBalances, getReserves, setTokenInfo]);

  return (
    <>
      <Grid container spacing="8">
        <Grid item>
          <Typography sx={theme.component.hintText}>Input</Typography>
          <Button
            sx={theme.component.selectButton}
            endIcon={<KeyboardArrowDownIcon />}
            onClick={() => {
              setOpenModal(true);
              setTokenIndex(0);
            }}
          >
            {Object.keys(tokenA).length === 0 ? "Select a token" : tokenA.symbol}
          </Button>
        </Grid>
        <Grid item>
          <TextField
            id="tokenA"
            label="The amount to supply"
            value={amountA}
            sx={{ minWidth: 320 }}
            onChange={handleChange}
          />
          <Typography sx={theme.component.hintText}>Balance:{balanceA}</Typography>
        </Grid>
      </Grid>
      <Divider sx={theme.component.divider}>+</Divider>
      <Grid container spacing="8">
        <Grid item>
          <Typography sx={theme.component.hintText}>Input</Typography>
          <Button
            sx={theme.component.selectButton}
            endIcon={<KeyboardArrowDownIcon />}
            onClick={() => {
              setOpenModal(true);
              setTokenIndex(1);
            }}
          >
            {Object.keys(tokenB).length === 0 ? "Select a token" : tokenB.symbol}
          </Button>
        </Grid>
        <Grid item>
          <TextField
            id="tokenB"
            label="The amount to supply"
            value={amountB}
            sx={{ minWidth: 320 }}
            onChange={handleChange}
          />
          <Typography sx={theme.component.hintText}>Balance: {balanceB}</Typography>
        </Grid>
      </Grid>
      {tokensSelected && (
        <Grid container sx={{ mt: 2 }} spacing={1}>
          {!allowA && (
            <Grid item xs={12}>
              <Button sx={theme.component.primaryButton} fullWidth onClick={() => handleApprove(indexTokenA)}>
                Enable {tokenA.symbol}
              </Button>
            </Grid>
          )}
          {!allowB && (
            <Grid item xs={12}>
              <Button sx={theme.component.primaryButton} fullWidth onClick={() => handleApprove(indexTokenB)}>
                Enable {tokenB.symbol}
              </Button>
            </Grid>
          )}
          <Grid item xs={12}>
            <Button
              sx={theme.component.primaryButton}
              fullWidth
              disabled={!allowA || !allowB || !availableBalance || amountA <= 0 || amountB <= 0}
              onClick={handleAddLiquidity}
            >
              {availableBalance ? (
                loading ? (
                  <CircularProgress sx={{ color: "white" }} />
                ) : (
                  "Supply"
                )
              ) : (
                "Insufficient Balance"
              )}
            </Button>
          </Grid>
        </Grid>
      )}
    </>
  );
};
export default AddLiquidity;
