"use client";

import React, { useState, useEffect, Suspense } from "react";
import {Input, Button, Box, Text, Avatar, List, Flex, InputGroup, Center, SimpleGrid, GridItem} from "@chakra-ui/react";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import {useRouter, useSearchParams} from "next/navigation";
import { CiSearch } from "react-icons/ci";
import { Heading } from "@chakra-ui/react"
import {FaHeart} from "react-icons/fa";
import { IoMdPersonAdd } from "react-icons/io";
import {moveDonations} from "@/lib/moveDonation";
import {useCartStore} from "@/lib/cartStore";
import refreshToken from "@/lib/refreshToken";

const maskString = (str: string = '', visibleIndexes: number[]) => {
  if (!str) return 'N/A';
  const visibleSet = new Set(visibleIndexes);
  return [...str]
    .map((char, idx) => (visibleSet.has(idx) ? char : '• '))
    .join('');
};

function maskEmail(email: string): string {
  if (!email) return 'N/A';
  const [userPart, domainPart] = email.split('@');
  const [domainName, ...tldParts] = domainPart.split('.');
  const tld = tldParts.join('.');

  // Mask user part
  let maskedUser;
  if (userPart.length <= 5) {
    maskedUser = userPart.slice(0, 3);
  } else {
    maskedUser = userPart.slice(0, 3) + '• '.repeat(userPart.length - 5) + userPart.slice(-2);
  }

  // Mask domain name
  const maskedDomain = domainName.length > 3
    ? domainName.slice(0, 3) + '• '.repeat(domainName.length - 3)
    : domainName;

  return `${maskedUser}@${maskedDomain}.${tld}`;
}

function maskAddress(address: string): string {
  if (!address) return 'N/A';
  // Match all number groups
  const numberMatches = [...address.matchAll(/\d+/g)];

  // If no numbers found, return address as is
  if (numberMatches.length === 0) return address;

  // Get last match (assumed to be zip code)
  const lastMatch = numberMatches[numberMatches.length - 1];
  const zipStart = lastMatch.index!;
  const zipEnd = zipStart + lastMatch[0].length;

  // Mask all earlier number groups
  let masked = '';
  let currentIndex = 0;

  for (let i = 0; i < numberMatches.length - 1; i++) {
    const match = numberMatches[i];
    const start = match.index!;
    const end = start + match[0].length;
    masked += address.slice(currentIndex, start) + '• '.repeat(match[0].length);
    currentIndex = end;
  }

  // Add everything after the last masked number group
  masked += address.slice(currentIndex, zipStart);
  masked += address.slice(zipStart, zipEnd); // keep zip code
  masked += address.slice(zipEnd); // any remaining text

  return masked;
}

function SearchMember() {
  const searchParams = useSearchParams();
  const paymentIDs = searchParams.getAll("paymentId");
  const cardFingerPrint = searchParams.get("cardFingerprint");
  const router = useRouter();

  const { totalAmount } = useCartStore();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [firstSearchDone, setFirstSearchDone] = useState(false);
  const [isNumberMatch, setIsNumberMatch] = useState(false);
  const [isEmailMatch, setIsEmailMatch] = useState(false);
  const [selectedMemberName, setSelectedMemberName] = useState<string>("");


  let token: string | null = "";
  if (typeof window !== "undefined") {
    token = window.sessionStorage.getItem("swayam_jwt_token");
  }

  const handleAnonymousDonation = () => {
    if (typeof window !== "undefined") {
      const anonymousDonationId = window.sessionStorage.getItem("svayam_anonymous_member") ?? '0';
      const anonymousDonationIdInt = Number(anonymousDonationId);
      moveDonations(paymentIDs.map(Number), anonymousDonationIdInt).then(r => console.log(r));
      setIsDialogOpen(true);
    }
  }

  const handleSearch = async () => {
    const queryParams = new URLSearchParams();

    if (!firstSearchDone && cardFingerPrint) {
      queryParams.append("card_fingerprint", cardFingerPrint);
    } else if (searchTerm) {
      queryParams.append("name", searchTerm);
    } else {
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/v1/members/search/?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let refreshTokenResponse = false;
      if(res.status === 403) {
        refreshTokenResponse = refreshToken();

        if (refreshTokenResponse){
          await handleSearch()
          return
        } else {
          router.push("/login")
        }
      }

      const json = await res.json();

      if (res.ok && json.status === 1) {
        let membersFromAPI = json.data.map((member: any) => {
          const addressLine =
            member.addresses?.home_address?.[0]?.address_line ||
            member.addresses?.business_address?.[0]?.address_line ||
            member.addresses?.billing_address?.[0]?.address_line ||
            "N/A";
          const city = member.addresses?.home_address?.[0]?.city ||
            member.addresses?.business_address?.[0]?.city ||
            member.addresses?.billing_address?.[0]?.city ||
            "";
          const state = member.addresses?.home_address?.[0]?.state ||
            member.addresses?.business_address?.[0]?.state ||
            member.addresses?.billing_address?.[0]?.state ||
            "";
          const country = member.addresses?.home_address?.[0]?.country ||
            member.addresses?.business_address?.[0]?.country ||
            member.addresses?.billing_address?.[0]?.country ||
            "";
          const zipcode = member.addresses?.home_address?.[0]?.zipcode ||
            member.addresses?.business_address?.[0]?.zipcode ||
            member.addresses?.billing_address?.[0]?.zipcode ||
            "";

          let address = addressLine + " " + city + " " + state + " " + country + " " + zipcode;


          const email =
            member.contact_details?.personal_email?.[0] ||
            member.contact_details?.work_email?.[0] ||
            "";

          const phone =
            member.contact_details?.home_phone?.[0] ||
            member.contact_details?.work_phone?.[0] ||
            member.contact_details?.cell_phone?.[0] ||
            "";

          return {
            id: member.sys_id,
            name: member.display_name || `${member.first_name} ${member.last_name}`,
            address,
            email,
            phone,
          };
        });

        if (searchTerm) {
          membersFromAPI = membersFromAPI.filter((member: { email: string; phone: string; }) => {
            const lowerSearchTerm = searchTerm.toLowerCase().trim();

            if (member.email.toLowerCase().trim() === lowerSearchTerm) {
              setIsEmailMatch(true);
            } else if (member.phone.toLowerCase().trim() === lowerSearchTerm) {
              setIsNumberMatch(true);
            }

            return (
              member.email.toLowerCase().trim() === lowerSearchTerm ||
              member.phone.toLowerCase().trim() === lowerSearchTerm
            );
          });
        }

        setFilteredMembers(membersFromAPI);
      } else {
        setFilteredMembers([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setFilteredMembers([]);
    } finally {
      setFirstSearchDone(true);
    }
  };

  useEffect(() => {
    if (cardFingerPrint) {
      handleSearch().then(r => {console.log(r)});
    }
  }, [cardFingerPrint]);

  const handleSelectMember = (member: any) => {
    moveDonations(paymentIDs.map(Number), member.id, (cardFingerPrint!=null ? cardFingerPrint : '')).then(r => console.log(r))
    setSelectedMemberName(member.name);
    setIsDialogOpen(true);
  };

  return (
    <Suspense>
      <Header />
      <Box p={4}>
        <SimpleGrid columns={[4, 4, 4, 4, 6]} mb={2} gap={4}>
          <GridItem colSpan={3}>
            <InputGroup startElement={<CiSearch/>}>
              <Input
                placeholder="Enter email or phone number to search"
                value={searchTerm}
                size={"2xl"}
                onChange={(e) => setSearchTerm(e.target.value)}
                width={"100%"}
              />
            </InputGroup>
          </GridItem>
          <GridItem colSpan={[1, 1, 1, 1, 1]}>
            <Button width={'100%'} fontSize={['xs', 'md', 'md', 'lg', 'md']} size={"2xl"} colorScheme="blue" variant={'solid'} onClick={handleSearch}><CiSearch/> Search</Button>
          </GridItem>
          <GridItem colSpan={[2, 2, 2, 2, 1]}>
            <Button width={'100%'} fontSize={['xs', 'md', '3xl', '4xl', 'md']} size={"2xl"} colorScheme="blue" variant={'outline'} onClick={handleAnonymousDonation}><FaHeart/> Donate Anonymously</Button>
          </GridItem>
          <GridItem colSpan={[2, 2, 2, 2, 1]}>
            <Button width={'100%'} fontSize={['xs', 'md', '3xl', '4xl', 'md']} size={"2xl"} colorScheme="blue" variant={'surface'} onClick={() => {
              const params = new URLSearchParams();
              paymentIDs.forEach(id => {
                params.append('paymentId', id);
              });
              if(cardFingerPrint) {
                params.append('cardFingerprint', cardFingerPrint)
              }

              router.push(`/add-member?${params.toString()}`);
            }}><IoMdPersonAdd/> Register Member</Button>
          </GridItem>
        </SimpleGrid>

        <Box overflowY={'auto'} height={"70vh"}>
          { filteredMembers.length > 0 ? (
            <>
              <Heading>Found members</Heading>
              <List.Root width={"100%"} gap={2} listStyle={"none"}>
                {filteredMembers.map((member, index) => (
                  <List.Item width={"100%"} key={index}>
                    <Box
                      p={3}
                      width={"100%"}
                      borderWidth="1px"
                      borderRadius="md"
                      cursor="pointer"
                      onClick={() => handleSelectMember(member)}
                    >
                      <Flex align="center" alignItems={'center'} justify={''} gap={2}>
                        <Box width={'5%'}>
                          <Avatar.Root size={["sm", "md", "lg", "xl", "2xl"]}>
                            <Avatar.Fallback name={member.name} />
                          </Avatar.Root>
                        </Box>

                        <Flex width={'40%'} direction="column">
                          <Text fontSize={["lg", "xl", "2xl", "3xl", "4xl"]}><strong>{maskString(member.name, [0,1,2,5,6,7,10,11,12])}</strong></Text>
                        </Flex>
                        <Flex width={'60%'} direction="column">
                          <Text fontSize={["sm", "md", "lg", "xl", "2xl"]}><strong>Phone:</strong> {isNumberMatch ? member.phone : maskString(member.phone, [6,7,8,9])}</Text>
                          <Text fontSize={["sm", "md", "lg", "xl", "2xl"]}><strong>E-mail:</strong> {isEmailMatch ? member.email : maskEmail(member.email)}</Text>
                        </Flex>
                        <Flex width={'60%'} direction="column">
                          <Text fontSize={["xs", "sm", "md", "lg", "lg"]}><strong>Address:</strong> {maskAddress(member.address)}</Text>
                        </Flex>
                      </Flex>
                    </Box>
                  </List.Item>
                ))}
              </List.Root>
            </>
          ) : (
            <Box mt={10}>
              <Center>
                <Text fontSize={'6xl'} textAlign={'center'} >Are you here for the first time? You can register yourself by clicking below button.</Text>
              </Center>
              <Center>
                <Button fontSize={["md", "xl", "2xl", "3xl", "4xl", "5xl"]} width={"30%"} size={'2xl'} mt={10} colorScheme="blue" onClick={() => {
                  const params = new URLSearchParams();
                  paymentIDs.forEach(id => {
                    params.append('paymentId', id);
                  });
                  if(cardFingerPrint) {
                    params.append('cardFingerprint', cardFingerPrint ?? '')
                  }
                  router.push(`/add-member?${params.toString()}`);
                  }}><IoMdPersonAdd/> Register Member
                </Button>
            </Center>
            </Box>
          )}
        </Box>


        {/* Confirmation Dialog */}
        <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)} placement="center">
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payment Confirmation</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text fontWeight="bold" mt={3}>We sincerely thank you, {selectedMemberName}, for your generous donation of ${totalAmount()}. </Text>
              <Text mt={3}>
              A confirmation receipt has been sent to your registered email address for your records.
              </Text>
              <Text mt={3}>
                Your support is deeply appreciated and plays a vital role in helping us continue our mission. We warmly invite you to stay connected and consider supporting us again in the future.❤️
              </Text>
            </DialogBody>
            <DialogFooter>
                <Button onClick={() => {router.push('/start')}} colorScheme="blue">OK</Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
      </Box>
    </Suspense>
  );
}

function SearchMemberPage() {
  return (
    <Suspense>
      <SearchMember />
    </Suspense>
  )
}
export default SearchMemberPage;