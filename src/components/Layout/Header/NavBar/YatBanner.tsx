import { Box, Flex, Heading, Link, Tooltip, useMediaQuery } from '@chakra-ui/react'
import { YatIcon } from 'components/Icons/YatIcon'
import { Text } from 'components/Text'
import { breakpoints } from 'theme/theme'

type YatBannerProps = {
  isCompact?: boolean
}

export const YatBanner = ({ isCompact }: YatBannerProps) => {
  const [isLargerThan2xl] = useMediaQuery(`(min-width: ${breakpoints['2xl']})`, { ssr: false })

  const isBig = isLargerThan2xl || !isCompact

  return (
    <Tooltip label='Get a Yat' isDisabled={isBig} placement='right'>
      <Link href='https://y.at' isExternal aria-label='Get a Yat'>
        <Flex
          w='100%'
          position='relative'
          p='3'
          gap='3'
          overflow='hidden'
          borderRadius='lg'
          justifyContent='center'
        >
          <Box
            left='-10px'
            top='28px'
            w={isBig ? '91px' : '29px'}
            h={isBig ? '91px' : '29px'}
            filter={`blur(${isBig ? 40 : 8}px)`}
            position='absolute'
            zIndex='hide'
            bgImage='radial-gradient(circle at center,#00C1C1, transparent)'
          />
          <Box
            left={isBig ? '179px' : '24px'}
            top={isBig ? '-44px' : '0px'}
            w={isBig ? '100px' : '24px'}
            h={isBig ? '100px' : '24px'}
            filter={`blur(${isBig ? 40 : 8}px)`}
            position='absolute'
            zIndex='hide'
            bgImage='radial-gradient(circle at center,#7B61FF, transparent)'
          />
          <YatIcon w={isBig ? '29px' : '19px'} h={isBig ? '36px' : '24px'} />
          {isBig && (
            <Flex flexDir='column' gap='1'>
              <Heading as='h2' size='24px' lineHeight='24px' fontWeight='semibold'>
                Get a Yat
              </Heading>
              <Text
                translation='Your Yat is your universal emoji username, website&nbsp;URL, payment address, and more.'
                fontSize='10px'
                lineHeight='14px'
                fontWeight='medium'
              />
            </Flex>
          )}
        </Flex>
      </Link>
    </Tooltip>
  )
}
