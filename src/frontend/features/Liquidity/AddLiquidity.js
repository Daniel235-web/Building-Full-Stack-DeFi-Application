import { useSearchParams } from "react-react-dom";
import { useEffect, useCallback, useState } from "react";
import { TokenPairABI } from "../../utils/TokenPairABI";
import { useWeb3React } from "@web3-react/core";
import { getTokenInfo, getErrorMessage, toString } from "../../utils/Helpers";
import { Grid, Typography, useTheme, Button, TextField, Divider } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDownIcon";

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

  useEffect(() => {
    const pairAddress = searchParams.get("pair");
    if (active && pairAddress) {
      setTokenInfo(pairAddress);
    }
  }, []);
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
    </>
  );
};
export default AddLiquidity;
