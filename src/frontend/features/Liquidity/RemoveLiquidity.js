import {useState, useEffect, useCallback} from 'react';
import {useNavigate, useSearchParams}   from 'react-router-dom';
import {useWeb3React}    from "@web3-react/core";
import {ethers} from 'ethers';
import {TokenPairABI} from '../../utils/TokenPairABI';
import {getTokenInfo, getErrorMessage}from '../../utils/Helpers';
import {toast }  from 'react-toastify';
import AMMRouterAddress from '../../contracts/AMMRouter-address.json';

const RemoveLiquidity = () => {
    const [searchParam , ] = useSearchParams();
    const navigate = useNavigate();
    const [active , account, library] = useWeb3React();

    const [tokenA, setTokenA] = useState({});
    const [tokenB, setTokenB] = useState({});
    const [pair , setPair] = useState();
    const [balance , setBalance] = useState(0);
    const [reserveA, setReserveA] = useState(0);
    const [reserveB, setReserveB] = useState(0);
    const [allowAmount, setAllowAmount] = useState(0);


    
   
    const setTokenInfo = useCallback(async (pairAddress)=> {
        try {
            const tokenPair = new ethers.Contract(pairAddress, TokenPairABI, library.getSigners());
            const _tokenA = await getTokenInfo(await tokenPair.tokenA());
            const _tokenB = await getTokenInfo(await tokenPair.tokenB());
            setTokenA(_tokenA);
            setTokenB(_tokenB);
            setPair(pairAddress)


        }catch (error ) {
            toast.error(getErrorMessage(error, "cannot fetch token information for this pair"),{toastId:'PAIR_0'})
            console.error(error)

        }
    }, [library]);
    const getBalance = useCallback(async () => {
        try{
            const tokenPair = new ethers.Contract(pair, TokenPairABI, library.getSigners());
            const _balance = await tokenPair.balanceOf(account);
            setBalance(ethers.utils.formatUnits(_balance));


        }catch (error) {
            toast.error(getErrorMessage(error, "Cannot get Lp token balance!"));
            console.error(error);

        }
    }, [pair , library, account]);

    const getReserves = useCallback(async () => {
        try{
            const tokenPair = new ethers.Contract(pair , TokenPairABI, library.getSigners());
            const [_reserveA, _reserveB, ] = await tokenPair.getReserves();
            setReserveA(ethers.utils.formatUnits(_reserveA, tokenA.decimals));
            setReserveB(ethers.utils.formatUnits(_reserveB, tokenB.decimals));

        }catch (error) {
            toast.error(getErrorMessage(error, "cannot get reserves!"));
            console.error(error);

        }
    }, [library, pair , tokenA, tokenB]);
    const getAllowance = useCallback(async () => {
        try {
            const tokenPair = new ethers.Contract(pair , TokenPairABI, library.getSigners());
            const _allowAmount = await tokenPair.allowance(account, AMMRouterAddress.address);
            setAllowAmount(ethers.utils.formatUnits(_allowAmount));


        }catch (error) {
            toast.error(getErrorMessage(error, "cannot get allowance of token pair!"));
            console.error(error);

        }

    }, [account, library, pair])

    useEffect(() => {
        const pairAddress = searchParam.get('pair');
        if (pairAddress && active ) {
            if (!pair ){
                setTokenInfo(pairAddress);
            }else {
                getBalance();
                getTotalSupply();
                getReserves () ;
                getAllowance();
            }
        }
    }, [pair, active, searchParam, setTokenInfo, getBalance, getTotalSupply, getReserves, getAllowance])

}
export default RemoveLiquidity;