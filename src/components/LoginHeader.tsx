"use client"
import React, {useEffect, useState} from "react"
import {Box, Flex, Image, Separator, Text} from "@chakra-ui/react"
import {SwayamSettings} from "@/types";


const LoginHeader = () => {

  const [logoSource, setLogoSource] = useState<string>('./favicon.ico')
  const [companyName, setCompanyName] = useState<string>('')
  const [companyNameLogo, setCompanyNameLogo] = useState<string>('./name_logo.png')

  const companyNameDiv = (
    <Box>
      {(logoSource === '') ? (
        <Text fontSize="5xl" fontWeight="bold">
          {companyName}
        </Text>
      ) : (
        <Image src={companyNameLogo} alt="Company Logo" height={"60px"}/>
      )}
    </Box>
  )

  useEffect(() => {
    const tenant_id = window.localStorage.getItem("swayam_tenant_id")
    if (tenant_id != '0' && tenant_id != null) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/swayam/get-settings/${tenant_id}/`)
        .then(response => {
          return response.json()
        })
        .then((data: SwayamSettings) => {
          setLogoSource(data.data.image_url)
          setCompanyName(data.data.tenant_name)
          setCompanyNameLogo(data.data.company_name_logo_url)
        })
        .catch(err => {
          console.error(err)
        })
    }
  },[])

  return (
    <Flex
      as="header"
      w="100%"
      py={4}
      justify="center"
      align="center"
      boxShadow="md"
      bgGradient="to-r"
      gradientFrom="colorPalette.300"
      gradientVia="colorPalette.500"
      gradientTo="colorPalette.300"
    >
      <Flex align="center" gap={2}>
        <Image src={logoSource} alt="Company Logo" boxSize="80px" />
        <Separator orientation="vertical" size="lg" height="20" />
        { companyNameDiv }
        {/*<Image src={companyNameLogo} alt="Company Logo" height={"60px"}/>*/}
        {/*<Text fontSize="5xl" fontWeight="bold">*/}
        {/*  {companyName}*/}
        {/*</Text>*/}
      </Flex>
    </Flex>
  )
}

export default LoginHeader;