"use client";

import React, {ReactNode, useRef, useState} from "react";
import {Box, Button, Center, Flex, Heading, Icon, Spinner, Table, Text} from "@chakra-ui/react";
import {RiDeleteBin5Line} from "react-icons/ri";
import {FaEdit, FaHeart} from "react-icons/fa";
import {MdDeleteForever} from "react-icons/md";
import {SiContactlesspayment} from "react-icons/si";
import {format} from 'date-fns';
import DatePickerInput from "@/components/DatePicker";
import { MdErrorOutline } from "react-icons/md";
import { CiCircleCheck } from "react-icons/ci";
import {useRouter} from 'next/navigation'

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import {useCartStore} from "@/lib/cartStore";


import {Field} from "@/components/ui/field";
import {toaster} from "@/components/ui/toaster";
import {CartItem} from "@/types";
import refreshToken from "@/lib/refreshToken";
import AmountInput from "@/components/AmountInput";


export default function CartPage() {
  const {cart, updateItem, removeItem, totalAmount, clearCart} = useCartStore();

  const [editItem, setEditItem] = useState<CartItem | null>(null);
  const [editAlertDate, setEditAlertDate] = useState<Date | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

  const [deleteDialogItem, setDeleteDialogItem] = useState<CartItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isClearCartOpen, setIsClearCartOpen] = useState(false);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCancelClicked, setIsCancelClicked] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<ReactNode>(<></>);

  const paymentIntentRef = useRef<string | null>(null);

  let defaultMemberId : number | null = null;
  let stripeChargeId : string | null = null;
  let cardDetails: string | null = null;

  const router = useRouter()

  const handleDonateMoreClick = () => {
    router.push("/select-accounts");
  }

  const handleEditClick = (item: CartItem) => {
    setEditItem(item);
    if (item.alertDate !== null) {
      setEditAlertDate(item.alertDate);
    }
    setEditAmount(item.amount);
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editItem) return;
    updateItem(
      editItem.entryId,
      {
        ...editItem,
        alertDate: editAlertDate,
        amount: editAmount,
      }
    );

    toaster.create({
      description: `Updated ${editItem.name} successfully`,
      type: "success",
    });
    setIsEditOpen(false);
  };

  const handleDeleteClick = (item: CartItem) => {
    setDeleteDialogItem(item);
    setIsDeleteOpen(true);
  };


  const handleConfirmDelete = () => {
    if (!deleteDialogItem) return;
    removeItem(deleteDialogItem.entryId);
    toaster.create({
      description: `Deleted ${deleteDialogItem.name}`,
      type: "info",
    });
    setIsDeleteOpen(false);
  };

  const handleClearCartClick = () => {
    setIsClearCartOpen(true)
  }
  const handleConfirmClearCart = () => {
    clearCart();
    setIsClearCartOpen(false);
  }

  let token: string | null = '';
  let readerName: string | null = '';
  if (typeof window !== "undefined") {
    token = window.sessionStorage.getItem("swayam_jwt_token");
    readerName = window.sessionStorage.getItem("SwayamReaderName");
    defaultMemberId = Number(window.sessionStorage.getItem("svayam_default_member"));
  }

  const handlePaymentClick = () => {
    if(cart.length <= 0 || totalAmount() <= 0) {
      return
    }
    setPaymentDialog(
      <Box>
        <Center>
          <Spinner size="xl" />
        </Center>
        <br />
        <Center>
          <Text fontSize={"2xl"}>Payment is pending. Please pay and hold.</Text>
        </Center>
      </Box>
    )
    setIsPaymentOpen(true);
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/swayam/pay/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        "reader_name": readerName,
        "amount": totalAmount(),
        "custom_metadata": JSON.stringify(cart.map((item) => ({
          name: item.name,
          alertDate: item.alertDate?.toISOString() ?? null,
          amount: item.amount,
        })))
      }),
    })
      .then(response => {
        let refreshTokenResponse = false;
        if(response.status === 403) {
          refreshTokenResponse = refreshToken();

          if (refreshTokenResponse){
            handlePaymentClick()
            return
          } else {
            router.push("/login")
          }
        }

        return response.json()
      })
      .then(data => data.data)
      .then(data => {
        if (data.payment_intent_created){
          paymentIntentRef.current = data.payment_intent_id
        }
        checkPaymentStatus()
      })
      .catch(err => console.error(err))
      .finally(() => {
        setIsCancelClicked(false)
      });
  }

  const checkPaymentStatus = () => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/swayam/check_payment_status/${paymentIntentRef.current}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    })
      .then(response => {
        let refreshTokenResponse = false;
        if(response.status === 403) {
          refreshTokenResponse = refreshToken();

          if (refreshTokenResponse){
            checkPaymentStatus()
            return
          } else {
            router.push("/login")
          }
        }
        return response.json()
      })
      .then(data => {
        if (data.data) {
          return data.data
        } else {
          return data.error
        }
      })
      .then(data => {
        if (data.payment_status == 'failed') {
          setPaymentDialog(
            <Box>
              <Center>
                <Icon size={"2xl"} color={"red"}>
                  <MdErrorOutline />
                </Icon>
              </Center>
              <Center>
                <Text fontSize={"2xl"}>{data.error}</Text>
              </Center>
            </Box>
          )
          setTimeout(() => setIsPaymentOpen(false), 1000);
        }
        else if(data.payment_status == 'succeeded') {

          setPaymentDialog(
            <Box>
              <Center>
                <Icon size={"2xl"} color={"green"}>
                  <CiCircleCheck/>
                </Icon>
              </Center>
              <Center>
                <Text fontSize={"2xl"}>Thanks for your donation. ❤️</Text>
              </Center>
            </Box>
          )
          stripeChargeId = data.payment_charge_id
          cardDetails = "[" + data.payment_method?.card_present?.brand  + " ****" + data.payment_method?.card_present?.last4 + "]"
          const cardFingerprint = data.payment_method?.card_present?.fingerprint;

          registerPayments(cardFingerprint, (payment_ids) => {
            const searchParams = new URLSearchParams();
            payment_ids.forEach(id => searchParams.append("paymentId", id.toString()));
            if (cardFingerprint) searchParams.append("cardFingerprint", cardFingerprint);

            router.push(`/select-member?${searchParams.toString()}`);
          });

        }
      }
    )
  }

  const registerPayments = (cardFingerprint: string, callback: (payment_ids: number[]) => void) => {
    const payment_ids: number[] = [];

    const processCartItem = (item: CartItem) => {
      const body: any = {
        member_id: defaultMemberId,
        account_id: item.id,
        type: "credit_card",
        amount: item.amount,
        details: cardDetails,
        stripe_charge_id: stripeChargeId,
        isdonationflow: true,
      };

      if (item.alertDate) {
        body.alert = format(item.alertDate, 'yyyy-MM-dd');
      }

      return fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/v1/payments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 1 && data.data?.id) {
            payment_ids.push(data.data.id);
          } else {
            console.error("Payment failed for:", item, "Response:", data);
          }
        })
        .catch(err => {
          console.error("Error processing payment for:", item, err);
        });
    };

    let chain = Promise.resolve();
    cart.forEach(item => {
      chain = chain.then(() => processCartItem(item));
    });

    chain.then(() => {
      callback(payment_ids); // pass to callback
    });
  };

  const handleCancelPaymentClick = () => {
    setIsCancelClicked(true)
    setPaymentDialog(
      <Box>
        <Center>
          <Spinner size="xl" colorPalette={'red'} />
        </Center>
        <br/>
        <Center>
          <Text fontSize={"2xl"}>Trying to cancel the payment. Please hold.</Text>
        </Center>
      </Box>
    )

    const body = {
      reader_name: readerName,
      payment_intent_id: paymentIntentRef.current,
    }

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/swayam/cancel-payment/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
      .then(response => {
        let refreshTokenResponse = false;
        if(response.status === 403) {
          refreshTokenResponse = refreshToken();

          if (refreshTokenResponse){
            handleCancelPaymentClick()
            return
          } else {
            router.push("/login")
          }
        }

        return response.json()
      })
      .then(data => data.data)
      .then(data => {
        if ( !data.is_payment_canceled) {
          setPaymentDialog(
            <Box>
              <Center>
                <Icon size={"xl"} color={"green"}>
                  <MdErrorOutline/>
                </Icon>
              </Center>
              <Center>
                <Text fontSize={"2xl"}>Error occurred while cancelling the payment.</Text>
              </Center>
            </Box>
          )
          checkPaymentStatus()
        } else {
          setPaymentDialog(
            <Box>
              <Center>
                <Icon size={"xl"} color={"green"}>
                  <CiCircleCheck/>
                </Icon>
              </Center>
              <Center>
                <Text fontSize={"2xl"}>Payment Cancelled Successfully.</Text>
              </Center>
            </Box>
          )
          setTimeout(() => setIsPaymentOpen(false), 2000)
          setIsCancelClicked(false)
        }
      })
  }

  return (
    <Box minH="100vh">
      <Header/>
      <Box ml={4} mr={4}>
        <Heading size={"2xl"} mb={2} mt={2}>Your Donations</Heading>
        <Box width={"100%"} height={"60vh"} borderRadius="md" borderWidth="1px" overflowY={"auto"}>
          {cart.length === 0 ? (
            <Center>
              <Text fontSize="2xl">No items found</Text>
            </Center>
          ) : (
            <Table.Root size="md" borderRadius="md" bg="white" boxShadow="md">
              <Table.Header bg="gray.100">
                <Table.Row>
                  <Table.ColumnHeader>Name</Table.ColumnHeader>
                  <Table.ColumnHeader>Alert Date</Table.ColumnHeader>
                  <Table.ColumnHeader>Amount</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center"></Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {cart.map((item) => (
                  <Table.Row key={item.entryId}>
                    <Table.Cell>{item.name}</Table.Cell>
                    <Table.Cell>{item.alertDate != null ? format(item.alertDate, 'MM-dd-yyyy') : '-'}</Table.Cell>
                    <Table.Cell>${item.amount}</Table.Cell>
                    <Table.Cell width={"30%"} textAlign="end">
                      <Flex gap={2} justify="flex-end">
                        <Button
                          aria-label="Edit"
                          colorScheme="blue"
                          size="lg"
                          width={"50%"}
                          onClick={() => handleEditClick(item)}
                        >
                          <FaEdit/> Edit {item.isAlert ? "Alert Date" : "Amount"}
                        </Button>
                        <Button
                          aria-label="Delete"
                          colorScheme="red"
                          size="lg"
                          width={"50%"}
                          onClick={() => handleDeleteClick(item)}
                        >
                          <MdDeleteForever/> Remove Donation
                        </Button>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
        <Flex mt={2} borderWidth={1}>
          <Text fontSize={["xl", "2xl", "3xl", "4xl", "5xl"]} ml={"auto"}>Total:</Text>
          <Text fontSize={["xl", "2xl", "3xl", "4xl", "5xl"]} mr={10} w={"15%"}>&nbsp;${totalAmount()}</Text>
        </Flex>
        <Flex mt={4} gap={4} justify={"space-evenly"} align={"center"}>
          <Button size={"2xl"} onClick={handleClearCartClick} fontSize={['lg', 'xl', '2xl', '3xl', '4xl']} order="1" width={"30%"} colorPalette={"red"}>
            <RiDeleteBin5Line/> Clear Donations
          </Button>
          <Button size={"2xl"} onClick={handleDonateMoreClick} fontSize={['lg', 'xl', '2xl', '3xl', '4xl']} order="2" width={"30%"} variant={"surface"}>
            <FaHeart/> Donate more
          </Button>
          <Button size={"2xl"} onClick={handlePaymentClick} fontSize={['lg', 'xl', '2xl', '3xl', '4xl']} order="3" width={"30%"} colorPalette={"blue"}>
            <SiContactlesspayment/> Checkout
          </Button>
        </Flex>
      </Box>

      {/* ================== EDIT DIALOG ================== */}
      <DialogRoot open={isEditOpen} onOpenChange={(e) => setIsEditOpen(e.open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editItem !== null ? editItem.name : "Item"}</DialogTitle>
            <DialogCloseTrigger/>
          </DialogHeader>
          <DialogBody>
            {editItem !== null && editItem.isAlert ?
              (
                <Field label="Alert Date" required>
                  <DatePickerInput onDateChange={setEditAlertDate} selectedDate={editAlertDate} advanceNoticeDays={editItem.advanceNoticeDays} cutOffTime={editItem.cutOffTime} weekSchedule={editItem.weekSchedule} account_id={editItem.id}></DatePickerInput>
                </Field>
              ) : (
                <Field label="Amount" required>
                  {/*<Input*/}
                  {/*  type="number"*/}
                  {/*  variant="outline"*/}
                  {/*  value={editAmount}*/}
                  {/*  onChange={(e) => setEditAmount(Number(e.target.value))}*/}
                  {/*/>*/}
                  <AmountInput defaultValues={(editItem?.defaultValues) ?? [0]} onAmountChange={setEditAmount} amount={editAmount} />
                </Field>
              )
            }
          </DialogBody>
          <DialogFooter>
            <Button mr={3} onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveEdit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* ================== DELETE DIALOG ================== */}
      <DialogRoot open={isDeleteOpen} onOpenChange={(e) => setIsDeleteOpen(e.open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogCloseTrigger/>
          </DialogHeader>
          <DialogBody>
            Are you sure you want to delete{" "}
            <strong>{deleteDialogItem?.name}</strong>? This action cannot be
            undone.
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button colorScheme="red" ml={3} onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* ================== CLEAR CART DIALOG ================== */}
      <DialogRoot open={isClearCartOpen} onOpenChange={(e) => setIsClearCartOpen(e.open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Donations Confirmation</DialogTitle>
            <DialogCloseTrigger/>
          </DialogHeader>
          <DialogBody>
            Are you sure you want to clear all the donations? This action cannot be undone.
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setIsClearCartOpen(false)}>Cancel</Button>
            <Button colorPalette={"red"} ml={3} onClick={handleConfirmClearCart}>
              Confirm Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* ================== CLEAR CART DIALOG ================== */}
      <DialogRoot open={isClearCartOpen} onOpenChange={(e) => setIsClearCartOpen(e.open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Donations Confirmation</DialogTitle>
            <DialogCloseTrigger/>
          </DialogHeader>
          <DialogBody>
            Are you sure you want to clear all the donations? This action cannot be undone.
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setIsClearCartOpen(false)}>Cancel</Button>
            <Button colorPalette={"red"} ml={3} onClick={handleConfirmClearCart}>
              Confirm Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>


      {/* ================== CLEAR CART DIALOG ================== */}
      <DialogRoot closeOnInteractOutside={false} open={isPaymentOpen} onOpenChange={(e) => setIsPaymentOpen(e.open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Please Pay on the credit card machine</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {paymentDialog}
          </DialogBody>
          <DialogFooter>
            <Button disabled={isCancelClicked} onClick={() => handleCancelPaymentClick()}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
}