"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  IconButton,
  Input,
  SimpleGrid,
  Float,
  Circle,
  Badge,
  Card,
  Image,
  Spinner,
  Text,
  Button,
  Center,
  ActionBar,
} from "@chakra-ui/react";
import { CiSearch } from "react-icons/ci";
import { TbShoppingCartHeart } from "react-icons/tb";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogCloseTrigger,
  DialogBody,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import AccountCard from "@/components/AccountCard";
import {useCartStore} from "@/lib/cartStore";
import { IoMdArrowBack } from "react-icons/io";

import {useRouter} from "next/navigation";
import refreshToken from "@/lib/refreshToken";
import {LuTrash2} from "react-icons/lu";

interface AccountGroup {
  sys_id: number;
  name: string;
  description: string;
  image_url: string;
}

interface SubItem {
  sys_id: number;
  display_name: string;
  is_tax_deducible: number;
  alert: number;
  has_fees: number;
  fees: number | null;
  notes: string;
  isPrefered: number;
  need_Inventory: boolean;
  defaultValues: string;
  advanceNoticeDays: number;
  cutOffTime: string;
  weekSchedule: string;
}

export default function GroupsPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [subItems, setSubItems] = useState<SubItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subItemsLoading, setSubItemsLoading] = useState<boolean>(false);

  const [otherAvailable, setOtherAvailable] = useState<boolean>(false);

  const { cart, totalAmount, clearCart } = useCartStore();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = sessionStorage.getItem("swayam_jwt_token");
        if (!token) {
          setError("No token found in session storage.");
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/swayam/groups/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          let refreshTokenResponse = false;
          if(response.status === 403) {
            refreshTokenResponse = refreshToken();

            if (refreshTokenResponse){
              await fetchGroups()
              return
            } else {
              router.push("/login")
            }
          }
          setError(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setGroups(data.data.groups);
        setOtherAvailable(data.data?.other_available);
      } catch(error) {
        console.error(error);
        // setError(error);
        setError("Error: Unable to load account groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups().then(r => {return r});
  }, []);

  // Fetch sub-items when a group is clicked
  const handleGroupClick = async (groupName: string, groupId: number) => {
    setSelectedGroup(groupName);
    setSubItemsLoading(true);
    const token = sessionStorage.getItem("swayam_jwt_token");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/swayam/${groupId}/accounts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });



      if (!response.ok) {
        let refreshTokenResponse = false;
        if(response.status === 403) {
          refreshTokenResponse = refreshToken();

          if (refreshTokenResponse){
            await handleGroupClick(groupName, groupId)
            return
          } else {
            router.push("/login")
          }
        }

        setError(`Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === 1) {
        setSubItems(data.data);
        setOpen(true); // Open the dialog only after data is fetched
      } else {
        setError("Failed to load sub-items.");
      }
    } catch (err) {
      let message = 'Unknown Error'
      if (err instanceof Error) message = err.message
      setError(message);
    } finally {
      setSubItemsLoading(false);
    }
  };

  const handleCartClick = () => {
    router.push("/cart");
  };
  return (
    <Box position="fixed" width={'100vw'} maxH="98%">
      <Header>
        <Box position="sticky">
          <IconButton
            aria-label="Cart"
            position="absolute"
            top={0}
            right={3}
            size="lg"
            onClick={handleCartClick}
          >
            <TbShoppingCartHeart/>
            <Float>
              <Circle size="5" bg="red" color="white">
                {cart.length}
              </Circle>
            </Float>
            <Float placement="bottom-center">
              <Badge bg="red" color="white">
                ${totalAmount()}
              </Badge>
            </Float>
          </IconButton>

          {/* Search Area*/} 
          <Flex mb={4} mr={16} gap={2}>
            <Input placeholder="Search..." size="lg" />
            <IconButton aria-label="Search" size="lg" variant="outline">
              <CiSearch />
            </IconButton> 
          </Flex>
        </Box>
      </Header>
      {/* Floating Cart Button */}

      {/* Heading */}
      <Heading size="2xl" mb={4}>
        Select a Group
      </Heading>
      {/* Loader & Error Handling */}
      {loading ? (
        <Flex justify="center" align="center" minH="50vh">
          <Spinner size="xl" />
        </Flex>
      ) : error ? (
        <Flex justify="center" align="center" minH="50vh">
          <Text color="red.500">{error}</Text>
        </Flex>
      ) : (
        <Box height="calc(100vh - 150px)" overflowY="auto" pr={2}>
          <SimpleGrid columns={[2, 3, 4, 5, 6]} gap={4}>
            {groups.map((group) => (
              <Card.Root
                key={group.sys_id}
                maxW="xl"
                overflow="hidden"
                cursor="pointer"
                onClick={() => handleGroupClick(group.name, group.sys_id)}
              >
                <Image
                  fit="contain"
                  aspectRatio={1}
                  src={group.image_url}
                  alt={`Image for ${group.name}`}
                />
                <Card.Body gap="1">
                  <Card.Title fontSize="lg" fontWeight="bold">
                    {group.name}
                  </Card.Title>
                  <Card.Description color="gray.600" fontSize="sm">
                    {group.description}
                  </Card.Description>
                </Card.Body>
              </Card.Root>
            ))}
            { otherAvailable ?
              (
                <Card.Root
                  key={0}
                  maxW="xs"
                  overflow="hidden"
                  cursor="pointer"
                  onClick={() => handleGroupClick('Others', 0)}
                >
                  <Image
                    fit="contain"
                    aspectRatio={1}
                    src={'https://www.pngkey.com/png/detail/237-2376425_donate-comments-donation-symbol.png'}
                    alt={`Image for Others`}
                  />
                  <Card.Body gap="1">
                    <Card.Title fontSize="lg" fontWeight="bold">
                      More
                    </Card.Title>
                    <Card.Description color="gray.600" fontSize="sm">
                      More ways to donate.
                    </Card.Description>
                  </Card.Body>
                </Card.Root>
              ) : (
                <></>
              )
            }
          </SimpleGrid>
        </Box>
      )}

      {/* Dialog for sub-items */}
      <DialogRoot open={open} size="cover" placement="center" motionPreset="slide-in-bottom">
        <DialogContent>
          <DialogHeader>
            <IconButton size={"xl"} variant={"ghost"} onClick={() => setOpen(false)}> <IoMdArrowBack /> </IconButton>
            <Center>
              <DialogTitle textAlign={'center'}>
                {selectedGroup ? `${selectedGroup} Accounts` : "Accounts"}
              </DialogTitle>
            </Center>
            <Box>
              <DialogCloseTrigger onClick={() => setOpen(false)} asChild>
                <Button>Close</Button>
              </DialogCloseTrigger>
            </Box>

          </DialogHeader>
          <DialogBody>

            {subItemsLoading ? (
              <Flex justify="center" align="center" minH="50vh">
                <Spinner size="xl" />
              </Flex>
            ) : subItems.length > 0 ? (
              <Box maxH="80vh" overflowY="auto" pr={2}>
                <SimpleGrid columns={[1, 3, 3, 4, 5]} gap={4}>
                  {subItems.map((item) => (
                    <AccountCard key={item.sys_id} id={item.sys_id} name={item.display_name} amount={item.fees} isAlert={item.alert === 1} advanceNoticeDays={item.advanceNoticeDays} cutOffTime={item.cutOffTime} weekSchedule={item.weekSchedule} defaultValues={(item.defaultValues).split(",").map(str => Number(str)) } />
                  ))}
                </SimpleGrid>
              </Box>
            ) : (
              <Text>No Donation accounts in this group found.</Text>
            )}
          </DialogBody>
        </DialogContent>
      </DialogRoot>

      <ActionBar.Root open={cart.length>0}>
        <ActionBar.Positioner>
          <ActionBar.Content background={'colorPalette.500'}>
            <Button onClick={clearCart} colorScheme={'red'} variant="solid" size="2xl">
              <LuTrash2 />
              Reset
            </Button>
            <ActionBar.Separator />
            <Button onClick={() => router.push('/cart')} variant="solid" size="2xl">
              Finish & Pay ${totalAmount()}
            </Button>
          </ActionBar.Content>
        </ActionBar.Positioner>
      </ActionBar.Root>

    </Box>
  );
}
