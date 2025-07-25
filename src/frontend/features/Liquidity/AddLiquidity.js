import {useSearchParams,} from 'react-react-dom';
import {useEffect, useCallback, useState} from 'react';
import {TokenPairABI} from '../../utils/TokenPairABI';
import {useWeb3React} from '@web3-react/core';
import {getTokenInfo, getErrorMessage} from '../../utils/Helpers';


const AddLiquidity = () => {
    const [searchParams,] = useSearchParams();
    const [active, account, library] = useWeb3React();
    const [tokenA, setTokenA] = useState({});
    const [tokenB, setTokenB] = useState({});
    const [tokensSelected, setTokensSelected] = useState(false)

     const setTokenInfo = useCallback(async (pairAddress) => {
        if (tokensSelected) {
            return;
        }
        try {
            const tokenPair =  new ethers.Contract(pairAddress, TokenPairABI, library.getSigners());
            const _tokenA = await getTokenInfo(await tokenPair.tokenA());
            const _tokenB = await getTokenInfo(await tokenPair.tokenB());
            setTokenA(_tokenA);
            setTokenB(_tokenB);
            setTokensSelected(true);
            


        }catch (error){
            toast.error(getErrorMessage(error, "Cannot fetch token infomation for the pair!"), {toastId: 'PAIR_0'})


        }
    }, [library, tokensSelected]);

    useEffect(() => {
        const pairAddress = searchParams.get('pair');
        if (active && pairAddress) {
            setTokenInfo(pairAddress);
        }
    }, []);

   

}
export default AddLiquidity;