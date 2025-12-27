import React, {useState} from "react";
import "react-nice-dates/build/style.css";
import {Box, Button, GridItem, Input, InputGroup, SimpleGrid} from "@chakra-ui/react";
import {IoMdArrowBack, IoMdArrowForward} from "react-icons/io";
import { MdOutlineSaveAlt } from "react-icons/md";

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {FaDollarSign} from "react-icons/fa6";
import {IoIosBackspace} from "react-icons/io";

interface AmountInputProps {
  defaultValues: number[];
  onAmountChange: (amount: number) => void;
  amount: number;
}

function AmountInput({ defaultValues, onAmountChange, amount }: AmountInputProps) {

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customValue, setCustomValue] = useState<string>('');
  const [typeCustom, setTypeCustom] = useState(false);

  const handleNumberClick = (digit: string) => {
    if (customValue !== null) {
      setCustomValue(customValue + digit)
    } else {
      setCustomValue(digit)
    }
  };

  const handleValueClick = (value: number) => {
    onAmountChange(value);
    setIsDialogOpen(false);
    setCustomValue('');
  };

  const handleClear = () => {
    setCustomValue('');
  };

  const handleCustomValueSave = () => {
    onAmountChange(Number(customValue));
    setIsDialogOpen(false);
    setCustomValue('');
  }

  return (
    <DialogRoot
      open={isDialogOpen}
      onOpenChange={(e) => setIsDialogOpen(e.open)}
      placement="center"
      motionPreset="slide-in-bottom"
    >
      <DialogTrigger asChild>
        <InputGroup startElement={<FaDollarSign />}>
          <Input
            placeholder="Insert Amount"
            value={amount}
            onClick={() => setIsDialogOpen(true)}
            readOnly
            required
          />
        </InputGroup>
      </DialogTrigger>

      { (defaultValues.length !== 1 || defaultValues[0] !== 0) && !typeCustom ?
        (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Donation Amount</DialogTitle>
            </DialogHeader>

            <DialogBody>
              {
                (
                  <SimpleGrid columns={3} gap={2}>
                    {(defaultValues.concat(Array(12).fill(0)).slice(0, 12)).map((num, index) => (
                      <Button
                        size="2xl"
                        key={index}
                        fontSize="2xl"
                        onClick={() => handleValueClick(num)}
                        colorScheme="teal"
                        variant={num!== 0 ? "surface" : "plain"}
                        disabled={num === 0}
                      >
                        {
                          num !== 0 ? (<>$ {num}</>) : ' '
                        }
                      </Button>
                    ))}

                  </SimpleGrid>
                )
              }
              <Button mt={5} w="100%" size="2xl" variant={'outline'} fontSize="2xl" onClick={() => setTypeCustom(true)}>
                Type your amount <IoMdArrowForward />
              </Button>
            </DialogBody>

            <DialogFooter>
              <DialogCloseTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </DialogCloseTrigger>
            </DialogFooter>
          </DialogContent>
        ) : (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert Donation Amount</DialogTitle>
            </DialogHeader>

            <DialogBody>
              <Input
                size={'2xl'}
                mb={5}
                value={customValue}
              />
              {
                (
                  <SimpleGrid columns={3} gap={2}>
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "." , "0"].map((num) => (
                      <Button
                        size="2xl"
                        key={num}
                        fontSize="2xl"
                        onClick={() => handleNumberClick(num)}
                        colorScheme="teal"
                        variant="surface"
                      >
                        {num}
                      </Button>
                    ))}

                    <GridItem colSpan={1}>
                      <Button w="100%" size="2xl" colorPalette="red" fontSize="2xl" onClick={handleClear}>
                        <IoIosBackspace />Clear
                      </Button>
                    </GridItem>

                  </SimpleGrid>
                )
              }
              { (defaultValues.length !== 1 || defaultValues[0] !== 0) ?
                (
                  <Box mt={5}>
                    <Button w="45%" mr={5} size="2xl" variant={'outline'} fontSize="2xl" onClick={() => setTypeCustom(false)}>
                      <IoMdArrowBack /> Back
                    </Button>
                    <Button w="45%" ml={5} size="2xl" variant={'outline'} fontSize="2xl" onClick={handleCustomValueSave}>
                      Save <MdOutlineSaveAlt />
                    </Button>
                  </Box>
                )
                :
                (
                  <Button mt={5} w="100%" size="2xl" variant={'outline'} fontSize="2xl" onClick={handleCustomValueSave}>
                    Save <MdOutlineSaveAlt />
                  </Button>
                )
              }
            </DialogBody>

            <DialogFooter>
              <DialogCloseTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </DialogCloseTrigger>

            </DialogFooter>
          </DialogContent>
        )
      }
    </DialogRoot>
  );
}

export default AmountInput;