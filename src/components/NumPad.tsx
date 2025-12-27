import React from "react"
import { SimpleGrid, Button, GridItem } from "@chakra-ui/react"
import { IoIosBackspace } from "react-icons/io";

interface NumPadProps {
  onNumberClick: (digit: string) => void
  onClear: () => void
  onSubmit: () => void
}

const NumPad = ({ onNumberClick, onClear }: NumPadProps) => {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]

  return (
    <SimpleGrid columns={3} gap={2}>
      {digits.map((num) => (
        <Button
          size="2xl"
          key={num}
          fontSize="2xl"
          onClick={() => onNumberClick(num)}
          colorScheme="teal"
          variant="surface"
        >
          {num}
        </Button>
      ))}

      <GridItem colSpan={2}>
        <Button w="100%" size="2xl" colorPalette="red" fontSize="2xl" onClick={onClear}>
          <IoIosBackspace />Clear
        </Button>
      </GridItem>

    </SimpleGrid>
  )
}

export default NumPad;