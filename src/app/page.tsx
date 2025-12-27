"use client"

import {Box, Progress} from "@chakra-ui/react"
import { AbsoluteCenter } from "@chakra-ui/react"
import {useRouter} from "next/navigation"
import {useEffect} from "react";

export default function App() {

  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login")
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <AbsoluteCenter p="4" color="white" axis="both">
      <Box position="relative" w={240}>
        <Progress.Root maxW={240} value={null} size="xl">
          <Progress.Label mb="2" fontSize="l">
            Loading Swayam ...
          </Progress.Label>
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </Box>
    </AbsoluteCenter>
  )
}