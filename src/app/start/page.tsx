"use client"

import {AbsoluteCenter, Box, Card, Center, Image, SimpleGrid, Text} from "@chakra-ui/react";
import Header from "@/components/Header";
import {useRouter} from "next/navigation";
import {useCartStore} from "@/lib/cartStore";
import {useEffect} from "react";

export default () => {
  const router = useRouter()

  const { clearCart } = useCartStore();

  useEffect(() => {
    clearCart()
  }, []);

  return (
    <Box>
      <Header />
      <Box mt={10} height={'80vh'}>
        <AbsoluteCenter>
          <SimpleGrid columns={[1, 1, 1, 2, 2]} gap={10}>
            <Card.Root aspectRatio={1} maxH={['40vh']} pt={1} onClick= {() => router.push('add-member/')}>
              <Image
                fit={'contain'}
                aspectRatio={1}
                maxH={['20vh']}
                maxW={'xl'}
                src={'https://cdn4.iconfinder.com/data/icons/zeir-miscellaneous-elements-vol-1/25/add_new_user_member_account-512.png'}
                alt={'Image for register member'}
                filter={{ base: "invert(0)", _dark:"invert(1)" }}
              />
              <Card.Body>
                <Center>
                  <Card.Title textAlign={'center'}>
                    <Text fontSize={'3xl'}>Register</Text>
                  </Card.Title>
                </Center>

                <Center>
                  <Card.Description textAlign={'center'}>
                    <Text fontSize={['sm', 'md', 'lg', 'xl', '2xl']}>You can add yourself here</Text>
                  </Card.Description>
                </Center>

              </Card.Body>
              <Center>
                <h1></h1>
              </Center>
            </Card.Root>

            <Card.Root aspectRatio={1} maxH={'40vh'} pt={1} onClick= {() => router.push('select-accounts/')}>
              <Image
                fit={'contain'}
                aspectRatio={1}
                maxW={'xl'}
                src={'https://static.vecteezy.com/system/resources/previews/016/416/818/original/donate-icon-in-black-colors-donation-signs-illustration-png.png'}
                alt={'Image for donation'}
                maxH={'20vh'}
                filter={{ base: "invert(0)", _dark:"invert(1)" }}
              />
              <Card.Body>
                <Center>
                  <Card.Title textAlign={'center'}>
                    <Text fontSize={'3xl'}>Donate</Text>
                  </Card.Title>
                </Center>

                <Center>
                  <Card.Description textAlign={'center'}>
                    <Text fontSize={['sm', 'md', 'lg', 'xl', '2xl']}>You can add donations here.</Text>
                  </Card.Description>
                </Center>
              </Card.Body>
              <Center>
                <h1></h1>
              </Center>
            </Card.Root>
          </SimpleGrid>
        </AbsoluteCenter>
      </Box>
    </Box>
  )
}