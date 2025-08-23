import { useState, useCallback, useEffect } from "react";
import { SupportedTokens } from "../../utils/Tokens";
import { getTokenInfo } from "../../utils/Helpers";
import { Dialog, IconButton, DialogTitle, DialogContent, List, ListItem, Typography } from "@mui/material";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import WETH from "../../contracts/WETH-address.json";

const TokenSelectModal = ({ open, handleClose, selectToken }) => {
  const [tokens, setTokens] = useState([]);
  const getSupportedTokens = useCallback(async () => {
    const _tokens = [
      { address: WETH.address, name: "Ether", symbol: "ETH", decimals: 18 },
      { address: WETH.address, name: "Wrapped ETH", symbol: "WETH", decimals: 18 },
    ];
    for (let address of SupportedTokens) {
      _tokens.push(await getTokenInfo(address));
    }
    setTokens(_tokens);
  }, []);

  useEffect(() => {
    getSupportedTokens();
  }, [getSupportedTokens]);

  return (
    <Dialog open={open} onClose={handleClose}>
      <IconButton>
        <ClearOutlinedIcon />
      </IconButton>
      <DialogTitle>
        <Typography>Please select a token</Typography>
      </DialogTitle>
      <DialogContent>
        <List>
          {tokens.map((item, index) => (
            <ListItem
              key={index}
              sx={{ "&: hover": { background: "#1976d2", cursor: "pointer" } }}
              onClick={() => {
                handleClose();
                selectToken(item);
              }}
            >
              <Typography>
                {item.name} ({item.symbol})
              </Typography>
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSelectModal;
