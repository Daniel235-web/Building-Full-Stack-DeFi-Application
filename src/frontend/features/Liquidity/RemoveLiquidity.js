import {useState, useEffect, useCallback} from 'react';
import {useNavigate, useSearchParams}   from 'react-router-dom';
import {useWeb3React}    from "@web3-react/core";
import {ethers} from 'ethers';
import {TokenPairABI} from '../../utils/TokenPairABI';
import {getTokenInfo, getErrorMessage}from '../../utils/Helpers';
import {toast }  from 'react-toastify';

const RemoveLiquidity = () => {
    const [searchParam , ] = useSearchParams();
    const navigate = useNavigate();
    const [active , account, library] = useWeb3React();

    const [tokenA, setTokenA] = useState({});
    const [tokenB, setTokenB] = useState({});
    const [pair , setPair] = useState();
    const [balance , setBalance] = useState(0)


    
   
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
    });
    const getBalance = useCallback(async () => {
        try{
            const tokenPair = new ethers.Contract(pair, TokenPairABI, library.getSigners());
            const _balance = await tokenPair.balanceOf(account);
            setBalance(ethers.utils.formatUnits(_balance));


        }catch (error) {
            toast.error(getErrorMessage(error, "Cannot get Lp token balance!"));
            console.error(error);

        }
    })

    useEffect(() => {
        const pairAddress = searchParam.get('pair');
        if (pairAddress && active ) {
            if (!pair ){
                setTokenInfo(pairAddress);
            }else {
                getBalance();
                getTotalSupply();
                getReserves() ;
                getAllowance();
            }
        }
    }, [pair, active, searchParam, setTokenInfo, getBalance, getTotalSupply, getReserve, getAllowance])

}
export default RemoveLiquidity;