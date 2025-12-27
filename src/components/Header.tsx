import React, {useEffect, useState} from "react";
import {Box, Flex, Image, Separator, Text} from "@chakra-ui/react";
import {SwayamSettings} from "@/types";
import refreshToken from "@/lib/refreshToken";
import {useRouter} from "next/navigation";

interface HeaderProps {
  children?: React.ReactNode; // To pass additional elements
}

const Header: React.FC<HeaderProps> = ({ children }) => {

  const router = useRouter();

  const [logoSource, setLogoSource] = useState<string>('./favicon.ico')
  const [companyName, setCompanyName] = useState<string>('Swayam')

  function getSettings() {
    let token = sessionStorage.getItem("swayam_jwt_token");

    if (!token) router.push("/login");
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/swayam/get-settings/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    })
      .then(response => {
        let refreshTokenResponse = false;
        if(response.status === 403) {
          refreshTokenResponse = refreshToken();

          if (refreshTokenResponse){
            getSettings()
            return
          } else {
            router.push("/login")
          }
        }

        return response.json()
      })
      .then((data: SwayamSettings) => {
        setLogoSource(data.data.image_url)
        setCompanyName(data.data.tenant_name)
        if(typeof window !== "undefined"){
          window.localStorage.setItem("swayam_tenant_theme", data.data.theme)
        }
      })
      .catch(err => {
        console.error(err)
      })
  }

  useEffect(() => {
    getSettings()
  },[])

  return (
    <Box
      p={2}
      boxShadow="md"
      bgGradient="to-r"
      gradientFrom={{base:"colorPalette.400", _dark:"colorPalette.500"}}
      gradientVia={{base:"colorPalette.300", _dark:"colorPalette.600"}}
      gradientTo={{base:"colorPalette.400", _dark:"colorPalette.500"}}
    >
      <Flex
        justifyContent="space-between"
        alignItems="center"
      >
        <Flex align="center" css={{cursor :'pointer'}} onClick={() => {router.push('start/')}} gap={2}>
          <Image src={logoSource} alt="Company Logo" boxSize="80px" />
          <Separator orientation="vertical" size="lg" height="20" />
          <Text fontSize="5xl" fontWeight="bold">
            {companyName}
          </Text>
        </Flex>
        {children}
      </Flex>
    </Box>
  );
};

export default Header;