"use client"

import React, {useState} from "react";

import {
  Center,
  Box,
  Button,
  Card,
  Field,
  FormatNumber,
  Text,
  VisuallyHidden
} from "@chakra-ui/react";
import {IoIosAdd} from "react-icons/io";
import DatePickerInput from "@/components/DatePicker";
import { useCartStore } from '@/lib/cartStore';
import { CartItem } from '@/types';
import AmountInput from "@/components/AmountInput";

interface AccountCardProps {
  id: number;
  name: string;
  amount: number | null;
  isAlert: boolean;
  advanceNoticeDays: number;
  cutOffTime: string;
  weekSchedule: string;
  defaultValues: number[];
}

const AccountCard: React.FC<AccountCardProps> = ({id, name, amount, isAlert, advanceNoticeDays,  cutOffTime, weekSchedule, defaultValues}) => {


  const { addItem } = useCartStore();

  const onAddClick = () => {
    if (!isAlert && (inputAmount === null || isNaN(inputAmount) || inputAmount <= 0)) {
      setIsAmountInvalid(true)
      setTimeout(() => setIsAmountInvalid(false), 3000);
      return;
    }
    if (isAlert && (alertDate === null)) {
      setIsAmountInvalid(true)
      setTimeout(() => setIsAmountInvalid(false), 3000);
      return;
    }
    setIsAddClicked(true);

    const cartItem: Omit<CartItem, "entryId"> = {
      id,
      name,
      amount: isAlert ? (amount ?? 0) : inputAmount,
      isAlert,
      alertDate: isAlert ? alertDate : null,
      advanceNoticeDays,
      cutOffTime,
      weekSchedule,
      defaultValues
    };

    addItem(cartItem);

    setIsAddClicked(false);
    setIsAdded(true);
    setInputAmount(0)
    setIsAmountInvalid(false)
    setAlertDate(null)
    setTimeout(() => setIsAdded(false), 3000);
  };

  const [isAdded, setIsAdded] = React.useState(false);
  const [isAddClicked, setIsAddClicked] = useState(false);
  const [inputAmount, setInputAmount] = useState<number>(amount ?? 0);
  const [alertDate, setAlertDate] = useState<Date | null>(null);

  const [isAmountInvalid, setIsAmountInvalid] = React.useState(false);

  const onAddItemAlert = (alert: Date | null) => {
    setAlertDate(alert);
    if (!isAlert && (inputAmount === null || isNaN(inputAmount) || inputAmount <= 0)) {
      setIsAmountInvalid(true)
      setTimeout(() => setIsAmountInvalid(false), 3000);
      return;
    }
    if (isAlert && (alert === null)) {
      setIsAmountInvalid(true)
      setTimeout(() => setIsAmountInvalid(false), 3000);
      return;
    }
    setIsAddClicked(true);

    const cartItem: Omit<CartItem, "entryId"> = {
      id,
      name,
      amount: isAlert ? (amount ?? 0) : inputAmount,
      isAlert,
      alertDate: isAlert ? alert : null,
      advanceNoticeDays,
      cutOffTime,
      weekSchedule,
      defaultValues
    };

    addItem(cartItem);

    setIsAddClicked(false);
    setIsAdded(true);
    setInputAmount(0)
    setIsAmountInvalid(false)
    setAlertDate(null)
    setTimeout(() => setIsAdded(false), 3000);
  }

  const onAddItemAmount = (amount: number) => {
    setInputAmount(amount);
    if (!isAlert && (amount === null || isNaN(amount) || amount <= 0)) {
      setIsAmountInvalid(true)
      setTimeout(() => setIsAmountInvalid(false), 3000);
      return;
    }
    if (isAlert && (alertDate === null)) {
      setIsAmountInvalid(true)
      setTimeout(() => setIsAmountInvalid(false), 3000);
      return;
    }
    setIsAddClicked(true);

    const cartItem: Omit<CartItem, "entryId"> = {
      id,
      name,
      amount: isAlert ? (amount ?? 0) : amount,
      isAlert,
      alertDate: isAlert ? alertDate : null,
      advanceNoticeDays,
      cutOffTime,
      weekSchedule,
      defaultValues
    };

    addItem(cartItem);

    setIsAddClicked(false);
    setIsAdded(true);
    setInputAmount(0)
    setIsAmountInvalid(false)
    setAlertDate(null)
    setTimeout(() => setIsAdded(false), 3000);
  }

  return (
    <Card.Root maxW="sm" variant="outline" overflow="hidden">
      {isAdded ? (
        <>
          <Card.Header> </Card.Header>
          <Card.Description>
            <Center>
              <Card.Title>Added</Card.Title>
            </Center>
          </Card.Description>
          <Card.Footer justifyContent="flex-end"> </Card.Footer>
        </>
      ) : (
        <>
          <VisuallyHidden>{id}</VisuallyHidden>
          <Card.Header height={'100%'}>
            <Card.Title fontSize={['lg', 'xl', '2xl', '3xl', '4xl']}>
              {name}
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <Card.Description>
              {isAlert ? (
                <Box>
                  <Text textStyle="lg">
                    {  !isNaN(Number(amount)) ? (
                      <FormatNumber value={amount ?? 0} style="currency" currency="USD"/>
                      ): (
                      <Text>Fees is not a valid number</Text>
                    )}

                  </Text>
                  <Field.Root invalid={isAmountInvalid}>
                    <Field.Label>{name} Date</Field.Label>
                        <DatePickerInput onDateChange={onAddItemAlert} selectedDate={alertDate} advanceNoticeDays={advanceNoticeDays} cutOffTime={cutOffTime} weekSchedule={weekSchedule} account_id={id}></DatePickerInput>
                    <Field.ErrorText>Invalid Date</Field.ErrorText>
                    <Field.HelperText>Please select the date.</Field.HelperText>
                  </Field.Root>
                </Box>
              ) : (
                <Box>
                  {  (!isNaN(Number(amount)) && amount != null && amount !== 0 && amount !== 0.00) ? (
                    <>
                      <Text textStyle="md">Default:&nbsp;
                        <FormatNumber value={amount} style="currency" currency="USD"/>
                      </Text>
                    </>
                  ): (
                    <Text></Text>
                  )}

                  <Field.Root invalid={isAmountInvalid}>
                    <Field.Label>Donation Amount</Field.Label>
                      {/*<InputGroup width={'100%'} flex="1" startElement={<FaDollarSign/>}>*/}
                      {/*  <Input type="decimal" inputMode="decimal" variant="outline" required onChange={(e) => {*/}
                      {/*    const value = parseFloat(e.target.value);*/}
                      {/*     setInputAmount(value);*/}
                      {/*  }} >*/}
                      {/*  </Input>*/}
                      {/*</InputGroup>*/}
                      <AmountInput defaultValues={defaultValues} onAmountChange={onAddItemAmount} amount={inputAmount} />
                    <Field.ErrorText>Invalid Amount</Field.ErrorText>
                    <Field.HelperText>Please Enter the amount</Field.HelperText>
                  </Field.Root>
                </Box>
              )}
            </Card.Description>
          </Card.Body>
          <Card.Footer justifyContent="flex-end">
            <Button width={'100%'} loading={isAddClicked} loadingText="Adding" onClick={onAddClick}>
              <IoIosAdd/>Add
            </Button>
          </Card.Footer>
        </>
      )}
    </Card.Root>
  )
}

export default AccountCard;