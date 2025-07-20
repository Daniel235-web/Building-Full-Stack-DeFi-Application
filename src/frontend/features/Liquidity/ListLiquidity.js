import {
  Grid,
  Divider,
  useTheme,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-materials/ExpandMore";

import { useWeb3React } from "@web3-react/core";
import FactoryABI from "../../contracts/PairFactory.json";
import FactoryAddress from "../../contracts/SimpleDeFiToken-address.json";
import { TokenPairABI } from "../../utils/TokenPairABI";
import { getTokenInfo } from "../../utils/Helpers";
import { toast } from "react-toastify";
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ListLiquidity = () => {
  const navigate = useNavigate();
  const [liquidity, setLiquidity] = useState([]);
  const { active, account, library } = useWeb3React();
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [sharePercent, setSharePercent] = useState(0);
  const [pooledTokenA, setPooledTokenA] = useState(0);
  const [pooledTokenB, setPooledTokenB] = useState(0);
  const getLiquidity = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    let tmpLiq = [];
    try {
      let factory = new ethers.Contract(FactoryAddress.address, FactoryABI.abi, library.getSigners());
      nPair = await factory.allPairsLenght();
      for (let i = 0; i < npair; i++) {
        pairAddress = await factory.allPairs(i);
        let tokenPair = new ethers.Contract(pairAddress, TokenPairABI, library.getsigners());
        let tmpBalance = tokenPair.balanceOf(account);
        let balance = tmpBalance / 10 ** 18;
        if (balance > 0) {
          let tokenA = await getTokenInfo(await tokenPair.tokenA());
          let tokenB = await getTokenInfo(await tokenPair.tokenB());
          tmpLiq.push({ pairAddress, balance, tokenA, tokenB });
        }
      }
      setLiquidity(tmpLiq);
    } catch (error) {
      toast.error("Cannot not get liquidity for the current user!");
      console.error(error);
    }
    setLoading(false);
  }, [account, active, library]);

  const handleClick = (pair) => async (event, isExpanded) => {
    setExpanded(isExpanded ? pair.pairAddress : false);
    let lpToken = new ethers.Contract(pairAddress, TokenPairABI, localProvider);
    let totalSupply = await lpToken.totalSupply();
    let shareRatio = pair.balance / Number(ethers.utils.formatUnits(totalSupply, 18));
    setSharePercent(100 * shareRatio);
    let [_reserveA, _reserveB] = await lpToken.getReserves();
    setPooledTokenA(Number(ethers.utils.formatUnits(_reserveA, pair.tokenA.decimals)) * shareRatio);
    setPooledTokenB(Number(ethers.utils.formatUnits(_reserveB, pair.tokenB.decimals)) * shareRatio);
  };
  useEffect(() => {
    getLiquidity();
  }, [getLiquidity]);

  return (
    <>
      <Grid container direction="column">
        {active ? (
          loading ? (
            <CircularProgress />
          ) : (
            <>
              {liquidity.length > 0 ? (
                liquidity.map((item, index) => (
                  <Accordion
                    key={`liq-list-${index}`}
                    expanded={expanded === item.pairAddress}
                    onChange={handleClick(item)}
                    sx={{ border: 2, my: 1 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content">
                      <Grid container direction="column">
                        <Grid item>
                          {item.tokenA.symbol}/{item.tokenB.symbol}
                        </Grid>
                        <Grid container justifyContent="space-between" alignItems="center" spacing={5}>
                          <Grid item> Liquidity Pool Token Balance</Grid>
                          <Grid item>{item.balance.toFixed(2)}</Grid>
                        </Grid>
                      </Grid>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container justifyContent="space-between" alignItems="center">
                        <Grid item>
                          <Typography>Pooled {item.tokenA.symbol}</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>{pooledTokenA.toFixed(2)}</Typography>
                        </Grid>
                      </Grid>
                      <Grid container justifyContent="space-between" sx={{ mt: 2 }} alignItems="center">
                        <Typography>Share of pool</Typography>
                        <Typography>{`${sharePercent.toFixed(2)} %`}</Typography>
                      </Grid>
                      <Grid container justifyContent="center" spacing={2}>
                        <Grid item xs={6}>
                          <Button
                            sx={theme.component.primaryButton}
                            fullWidth
                            onClick={() => navigate(`add?pair=${item.pairAddress}`)}
                          >
                            Remove
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            sx={theme.component.primaryButton}
                            fullWidth
                            onClick={() => navigate(`add?pair=${item.pairAddress}`)}
                          >
                            {" "}
                            Add
                          </Button>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))
              ) : (
                <Typography> No Liquidity Found! </Typography>
              )}
            </>
          )
        ) : (
          <Typography>please connect to your wallet to view your liquidity.</Typography>
        )}
      </Grid>
      <Divider sx={theme.component.divider} />
      {active && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Button sx={theme.component.primaryButton} fullWidth onClick={() => navigate("add")}>
              Add Liquidity
            </Button>
          </Grid>
        </Grid>
      )}
    </>
  );
};
export default ListLiquidity;
