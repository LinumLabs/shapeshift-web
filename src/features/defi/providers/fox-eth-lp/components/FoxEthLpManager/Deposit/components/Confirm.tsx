import { Alert, AlertIcon, Box, Stack, useToast } from '@chakra-ui/react'
import { ASSET_REFERENCE, ethAssetId, toAssetId } from '@shapeshiftoss/caip'
import { supportsETH } from '@shapeshiftoss/hdwallet-core'
import { Confirm as ReusableConfirm } from 'features/defi/components/Confirm/Confirm'
import { Summary } from 'features/defi/components/Summary'
import {
  DefiParams,
  DefiQueryParams,
  DefiStep,
} from 'features/defi/contexts/DefiManagerProvider/DefiCommon'
import { foxAssetId } from 'features/defi/providers/fox-eth-lp/constants'
import { useFoxEthLiquidityPool } from 'features/defi/providers/fox-eth-lp/hooks/useFoxEthLiquidityPool'
import { useContext, useMemo } from 'react'
import { useTranslate } from 'react-polyglot'
import { Amount } from 'components/Amount/Amount'
import { AssetIcon } from 'components/AssetIcon'
import { StepComponentProps } from 'components/DeFi/components/Steps'
import { Row } from 'components/Row/Row'
import { RawText, Text } from 'components/Text'
import { useFoxEth } from 'context/FoxEthProvider/FoxEthProvider'
import { useBrowserRouter } from 'hooks/useBrowserRouter/useBrowserRouter'
import { useWallet } from 'hooks/useWallet/useWallet'
import { bnOrZero } from 'lib/bignumber/bignumber'
import { logger } from 'lib/logger'
import {
  selectAssetById,
  selectMarketDataById,
  selectPortfolioCryptoHumanBalanceByAssetId,
} from 'state/slices/selectors'
import { useAppSelector } from 'state/store'

import { FoxEthLpDepositActionType } from '../DepositCommon'
import { DepositContext } from '../DepositContext'

const moduleLogger = logger.child({ namespace: ['FoxEthLpDeposit:Confirm'] })

export const Confirm: React.FC<StepComponentProps> = ({ onNext }) => {
  const { state, dispatch } = useContext(DepositContext)
  const translate = useTranslate()
  const { onOngoingTxIdChange } = useFoxEth()
  const { query } = useBrowserRouter<DefiQueryParams, DefiParams>()
  const { addLiquidity } = useFoxEthLiquidityPool()
  const opportunity = useMemo(() => state?.opportunity, [state])
  const { chainId, assetReference } = query

  const feeAssetId = toAssetId({
    chainId,
    assetNamespace: 'slip44',
    assetReference: ASSET_REFERENCE.Ethereum,
  })
  const foxAsset = useAppSelector(state => selectAssetById(state, foxAssetId))
  const ethAsset = useAppSelector(state => selectAssetById(state, ethAssetId))
  const feeAsset = useAppSelector(state => selectAssetById(state, feeAssetId))
  const feeMarketData = useAppSelector(state => selectMarketDataById(state, feeAssetId))

  // user info
  const { state: walletState } = useWallet()

  // notify
  const toast = useToast()

  const feeAssetBalance = useAppSelector(state =>
    selectPortfolioCryptoHumanBalanceByAssetId(state, { assetId: feeAsset?.assetId ?? '' }),
  )

  if (!state || !dispatch) return null

  const handleDeposit = async () => {
    try {
      if (!(assetReference && walletState.wallet && supportsETH(walletState.wallet) && opportunity))
        return

      dispatch({ type: FoxEthLpDepositActionType.SET_LOADING, payload: true })
      const txid = await addLiquidity(state.deposit.foxCryptoAmount, state.deposit.ethCryptoAmount)
      if (!txid) throw new Error('addLiquidity failed')
      dispatch({ type: FoxEthLpDepositActionType.SET_TXID, payload: txid })
      onOngoingTxIdChange(txid)
      onNext(DefiStep.Status)
    } catch (error) {
      moduleLogger.error({ fn: 'handleDeposit', error }, 'Error adding liquidity')
      toast({
        position: 'top-right',
        description: translate('common.transactionFailedBody'),
        title: translate('common.transactionFailed'),
        status: 'error',
      })
    } finally {
      dispatch({ type: FoxEthLpDepositActionType.SET_LOADING, payload: false })
    }
  }

  const handleCancel = () => {
    onNext(DefiStep.Info)
  }

  const hasEnoughBalanceForGas = bnOrZero(feeAssetBalance)
    .minus(bnOrZero(state.deposit.estimatedGasCrypto))
    .minus(bnOrZero(state.deposit.ethCryptoAmount))
    .gte(0)

  return (
    <ReusableConfirm
      onCancel={handleCancel}
      onConfirm={handleDeposit}
      isDisabled={!hasEnoughBalanceForGas}
      loading={state.loading}
      loadingText={translate('common.confirm')}
      headerText='modals.confirm.deposit.header'
    >
      <Summary>
        <Row variant='vertical' p={4}>
          <Row.Label>
            <Text translation='modals.confirm.amountToDeposit' />
          </Row.Label>
          <Row px={0} fontWeight='medium'>
            <Stack direction='row' alignItems='center'>
              <AssetIcon size='xs' src={foxAsset.icon} />
              <RawText>{foxAsset.name}</RawText>
            </Stack>
            <Row.Value>
              <Amount.Crypto value={state.deposit.foxCryptoAmount} symbol={foxAsset.symbol} />
            </Row.Value>
          </Row>
          <Row px={0} fontWeight='medium'>
            <Stack direction='row' alignItems='center'>
              <AssetIcon size='xs' src={ethAsset.icon} />
              <RawText>{ethAsset.name}</RawText>
            </Stack>
            <Row.Value>
              <Amount.Crypto value={state.deposit.ethCryptoAmount} symbol={ethAsset.symbol} />
            </Row.Value>
          </Row>
        </Row>
        <Row p={4}>
          <Row.Label>
            <Text translation='modals.confirm.estimatedGas' />
          </Row.Label>
          <Row.Value>
            <Box textAlign='right'>
              <Amount.Fiat
                fontWeight='bold'
                value={bnOrZero(state.deposit.estimatedGasCrypto)
                  .times(feeMarketData.price)
                  .toFixed(2)}
              />
              <Amount.Crypto
                color='gray.500'
                value={bnOrZero(state.deposit.estimatedGasCrypto).toFixed(5)}
                symbol={feeAsset.symbol}
              />
            </Box>
          </Row.Value>
        </Row>
      </Summary>
      {!hasEnoughBalanceForGas && (
        <Alert status='error' borderRadius='lg'>
          <AlertIcon />
          <Text translation={['modals.confirm.notEnoughGas', { assetSymbol: feeAsset.symbol }]} />
        </Alert>
      )}
    </ReusableConfirm>
  )
}
