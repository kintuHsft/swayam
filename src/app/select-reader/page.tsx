"use client";

import React, {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {AbsoluteCenter, Box, Button, Flex, Heading, Icon, List, Spinner, Text,} from "@chakra-ui/react";
import LoginHeader from "@/components/LoginHeader";
import refreshToken from "@/lib/refreshToken";

interface Reader {
  id: number;
  name: string;
  reader_id: string;
}

const SelectReaderPage = () => {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  let token = ''
  if(typeof window !== "undefined"){
    token = window.sessionStorage.getItem("swayam_jwt_token") ?? ''
  }

  if (!token) {
    router.push("/login");
  }

  function getReaders() {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/swayam/readers/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => {
        let refreshTokenResponse = false;
        if(response.status === 403) {
          refreshTokenResponse = refreshToken();

          if (refreshTokenResponse){
            getReaders()
            return
          } else {
            router.push("/login")
          }
        }

        return response.json()
      })
      .then(data=> {
        if (data.status === 1) {
          setReaders(data.data);
          setLoading(false);

        } else {
          setError("Error while getting readers. Please contact Administrator");
        }
      })
      .catch(err => {
        console.error(err);
        setError("Error while getting readers. Please contact Administrator");
      });
  }

  function getDefaultMemberIds() {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/swayam/get-default-member-ids/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => {
        let refreshTokenResponse = false;
        if(response.status === 403) {
          refreshTokenResponse = refreshToken();

          if (refreshTokenResponse){
            getDefaultMemberIds()
            return
          } else {
            router.push("/login")
          }
        }

        return response.json()
      })
      .then(data=> {
        if (data.status === 1) {
          if (data.data.default_member === '-1' || data.data.anonymous_member === '-1') {
            setError('Please set default donation account ids.');
          }
          if(typeof window !== "undefined"){
            window.sessionStorage.setItem("svayam_default_member", data.data.default_member)
            window.sessionStorage.setItem("svayam_anonymous_member", data.data.anonymous_member)
          }
        } else {
          setError("Error while getting default Donation Ids. Please contact Administrator");
        }
      })
      .catch(err => {
        console.error(err)
        setError("Error while getting default Donation Ids. Please contact Administrator")
      });
  }

  useEffect(() => {
    getReaders();
    getDefaultMemberIds()
  }, []);

  const handleSelectReader = (reader: Reader) => {
    sessionStorage.setItem("SwayamReaderName", reader.name);
    router.push("/start");
  };

  return (
    <Box>
      <LoginHeader />
      <Box>
        <AbsoluteCenter h="100%" w="100vw" axis="both">
          <Flex direction="column" alignItems="center" justifyContent="space-between" borderRadius="2xl" borderWidth="1px" p={5}>
            <Heading size="xl" mb={4}>
              Pick a Stripe Card Machine
            </Heading>
            <Box w={500} h={400}>
              {loading ? (
                <Flex justify="center" align="center" minH="50vh">
                  <Spinner size="xl" />
                </Flex>
              ) : error ? (
                <Flex justify="center" align="center" minH="50vh">
                  <Text color="red.500">{error}</Text>
                </Flex>
              ) : readers.length > 0 ? (
                <List.Root h="100%" overflow="auto" listStyle="none">
                  {readers.map((reader) => (
                    <List.Item key={reader.id} p={4} border="d" borderRadius="md" mb={2}>

                      <Flex justify="space-between" width={"100%"} align="center">
                        <Text>
                          <List.Indicator>
                            <Icon size="2xl">
                              <svg width="200" height="400" viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg" fill="none">
                                <rect x="10" y="10" width="180" height="380" rx="20" ry="20" fill="#333" stroke="#000" strokeWidth="4"/>
                                <rect x="30" y="30" width="140" height="60" rx="10" ry="10" fill="#9ee" stroke="#000" strokeWidth="2"/>
                                <g fill="#ccc" stroke="#000" strokeWidth="1">
                                  <rect x="30" y="110" width="40" height="40" rx="5"/>
                                  <rect x="80" y="110" width="40" height="40" rx="5"/>
                                  <rect x="130" y="110" width="40" height="40" rx="5"/>
                                  <rect x="30" y="160" width="40" height="40" rx="5"/>
                                  <rect x="80" y="160" width="40" height="40" rx="5"/>
                                  <rect x="130" y="160" width="40" height="40" rx="5"/>
                                  <rect x="30" y="210" width="40" height="40" rx="5"/>
                                  <rect x="80" y="210" width="40" height="40" rx="5"/>
                                  <rect x="130" y="210" width="40" height="40" rx="5"/>
                                  <rect x="30" y="260" width="60" height="40" rx="5" fill="#c33"/>
                                  <rect x="110" y="260" width="60" height="40" rx="5" fill="#3c3"/>
                                </g>
                                <rect x="40" y="340" width="120" height="20" rx="5" fill="#222" stroke="#000" strokeWidth="1"/>
                              </svg>
                            </Icon>
                          </List.Indicator>
                          <strong>{reader.name}</strong>
                        </Text>

                        <Button ml={20} colorScheme="teal" onClick={() => handleSelectReader(reader)}>
                          Select
                        </Button>
                      </Flex>
                    </List.Item>
                  ))}
                </List.Root>
              ) : (
                <Text>No readers found.</Text>
              )}
            </Box>
          </Flex>
        </AbsoluteCenter>

      </Box>
      </Box>

  );
}

export default SelectReaderPage;