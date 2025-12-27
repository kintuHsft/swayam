"use client";

import React, {Suspense, useEffect, useState} from "react";
import {
  Box,
  Button,
  Center,
  Field,
  Fieldset,
  Flex,
  Heading,
  HStack,
  Input,
  SegmentGroup,
  Stack,
  Text
} from "@chakra-ui/react";
import {useCartStore} from "@/lib/cartStore";
import {FaFemale, FaMale} from "react-icons/fa";
import { LoadScript, Autocomplete } from "@react-google-maps/api";

import Header from "@/components/Header";
import {useRouter, useSearchParams} from "next/navigation";
import {moveDonations} from "@/lib/moveDonation";
import {DialogBody, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle} from "@/components/ui/dialog";
import { withMask } from "use-mask-input"
import refreshToken from "@/lib/refreshToken";

function AddMemberPage() {
  const searchParams = useSearchParams();
  const paymentIDs = searchParams.getAll("paymentId");
  const cardFingerPrint = searchParams.get("cardFingerprint");

  const router = useRouter();

  const {totalAmount} = useCartStore();

  const emailTypes = ["@gmail.com", "@icloud.com", "@outlook.com", "@yahoo.com", "@hotmail.com"];

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Male");
  const [isProcessing, setIsProcessing] = useState(false);
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [country, setCountry] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [aptOrSuite, setAptOrSuite] = useState("")

  const [autocompleteRef, setAutocompleteRef] = useState<google.maps.places.Autocomplete | null>(null);

  const capitalizeFirst = (value: string) => {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  const handlePlaceChanged = () => {
    if (!autocompleteRef) return;

    const place = autocompleteRef.getPlace();

    let streetNumber = "";
    let route = "";
    let city = "";
    let state = "";
    let country = "";
    let postalCode = "";

    if (place.address_components) {
      for (const component of place.address_components) {
        const types = component.types;

        if (types.includes("street_number")) {
          streetNumber = component.long_name;
        } else if (types.includes("route")) {
          route = component.long_name;
        } else if (types.includes("locality")) {
          city = component.long_name;
        } else if (types.includes("administrative_area_level_1")) {
          state = component.long_name;
        } else if (types.includes("country")) {
          country = component.long_name;
        } else if (types.includes("postal_code")) {
          postalCode = component.long_name;
        }
      }
    }

    const fullAddress = `${streetNumber} ${route}`.trim();
    setAddress(fullAddress);
    setCity(city);
    setStateRegion(state);
    setCountry(country);
    setZipCode(postalCode);
  };

  const handleSubmit = async () => {

    let valid = true;

    if (!firstName.trim()) {
      setFirstNameError("First name is required.");
      valid = false;
      setTimeout(() => setFirstNameError(""), 2000);
    }
    if (!lastName.trim()) {
      setLastNameError("Last name is required.");
      valid = false;
      setTimeout(() => setLastNameError(""), 2000);
    }
    if (!email.trim() || !email.includes("@")) {
      setEmailError("Valid email is required.");
      valid = false;
      setTimeout(() => setEmailError(""), 2000);
    }
    if (!phone.trim() || phone.length < 8) {
      setPhoneError("Valid phone number is required.");
      valid = false;
      setTimeout(() => setPhoneError(""), 2000);
    }

    if (!valid) return;

    setIsProcessing(true);

    const payload = {
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      gender: gender.toLowerCase(),
      contact_details: {
        home_phone: [phone.replace(/\D/g, '')],
        personal_email: [email],
      },
      addresses: {
        home_address: [
          {
            address_line: aptOrSuite
              ? `${aptOrSuite}, ${address}`
              : address,
            city: city,
            state: stateRegion,
            country: country,
            zipcode: zipCode
          }
        ]
      }
    };

    try {
      let token: string | null = "";
      if (typeof window !== "undefined") {
        token = window.sessionStorage.getItem("swayam_jwt_token");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/v1/members/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let refreshTokenResponse = false;
      if(response.status === 403) {
        refreshTokenResponse = refreshToken();

        if (refreshTokenResponse){
          await handleSubmit()
          return
        } else {
          router.push("/login")
        }
      }

      const data = await response.json();

      const memberId = data.data.sys_id;

      moveDonations(paymentIDs.map(Number), Number(memberId), (cardFingerPrint!=null ? cardFingerPrint : '')).then(r => console.log(r))

      setIsDialogOpen(true);
      if (!response.ok) {
        console.error(data.detail || "Something went wrong")
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleEmailDomainClick = (domain: string) => {
    const [localPart] = email.split("@");
    setEmail(`${localPart}${domain}`);
  };

  useEffect(() => {
    setDisplayName(`${lastName} ${firstName}`);
  }, [firstName, lastName]);

  return (
    <Suspense>
      <Header/>
      <Center height={"90vh"} m={5} overflowY={"auto"}>
        <Fieldset.Root size={"lg"} maxW={"3xl"}>
          <Stack>
            <Fieldset.Legend>
              <Heading>Register yourself as member</Heading>
            </Fieldset.Legend>
            <Fieldset.HelperText>
              Please enter your details below.
            </Fieldset.HelperText>
          </Stack>
          <Fieldset.Content>
            <Flex gap={4}>
              <Field.Root required invalid={!!firstNameError}>
                <Field.Label>
                  First name <Field.RequiredIndicator/>
                </Field.Label>
                <Input
                  size={"2xl"}
                  variant={"subtle"}
                  name="first_name"
                  value={firstName}
                  onChange={(e) => setFirstName(capitalizeFirst(e.target.value))}
                />
                {firstNameError && <Field.ErrorText>{firstNameError}</Field.ErrorText>}
              </Field.Root>
              <Field.Root required invalid={!!lastNameError}>
                <Field.Label>
                  Last name <Field.RequiredIndicator/>
                </Field.Label>
                <Input
                  size={"2xl"}
                  variant={"subtle"}
                  name="last_name"
                  value={lastName}
                  onChange={(e) => setLastName(capitalizeFirst(e.target.value))}
                />
                {lastNameError && <Field.ErrorText>{lastNameError}</Field.ErrorText>}
              </Field.Root>
            </Flex>

            {/*<Field.Root required invalid={!!displayNameError}>*/}
            {/*  <Field.Label>*/}
            {/*    Display name <Field.RequiredIndicator/>*/}
            {/*  </Field.Label>*/}
            {/*  <Input*/}
            {/*    size={"2xl"}*/}
            {/*    variant={"subtle"}*/}
            {/*    name="display_name"*/}
            {/*    value={displayName}*/}
            {/*    onChange={(e) => {*/}
            {/*      setDisplayName(e.target.value);*/}
            {/*      setIsDisplayNameEdited(true);*/}
            {/*    }}*/}
            {/*  />*/}
            {/*  {displayNameError && <Field.ErrorText>{displayNameError}</Field.ErrorText>}*/}
            {/*</Field.Root>*/}
            <Flex gap={4}>

              <Field.Root required invalid={!!phoneError}>
                <Field.Label>
                  Phone number <Field.RequiredIndicator/>
                </Field.Label>
                <Input
                  size={"2xl"}
                  variant={"subtle"}
                  name="phone_number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  ref={withMask("(999)-999-9999")}
                />
                {phoneError && <Field.ErrorText>{phoneError}</Field.ErrorText>}
              </Field.Root>

              <Field.Root>
                <Field.Label>Gender</Field.Label>
                <SegmentGroup.Root
                  width={"100%"}
                  height={"100%"}
                  size={"lg"}
                  value={gender}
                  onValueChange={(val) => setGender(val.value ?? 'Male')}
                >
                  <SegmentGroup.Indicator/>
                  <SegmentGroup.Items width={'100%'} items={[
                    {
                      value: "Male",
                      label: (
                        <HStack>
                          <FaMale/>
                          Male
                        </HStack>
                      ),
                    },
                    {
                      value: "Female",
                      label: (
                        <HStack>
                          <FaFemale/>
                          Female
                        </HStack>
                      ),
                    },
                  ]}/>
                </SegmentGroup.Root>
              </Field.Root>
            </Flex>

            <Field.Root required invalid={!!emailError}>
              <Field.Label>
                Email <Field.RequiredIndicator/>
              </Field.Label>
              <Input
                size={"2xl"}
                variant={"subtle"}
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {emailError && <Field.ErrorText>{emailError}</Field.ErrorText>}
              <Flex gap={2} flexWrap={"wrap"}>
                {emailTypes.map((item, index) => (
                  <Button variant={'subtle'} key={index} onClick={() => handleEmailDomainClick(item)}>
                    {item}
                  </Button>
                ))}
              </Flex>
            </Field.Root>

            <Flex gap={4}>
              <Box width={"66%"}>
                <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={['places']}>
                  <Field.Root width={"100%"}>
                    <Field.Label>Address</Field.Label>
                    <Box w="100%">
                      <Autocomplete
                        onLoad={(autocomplete) => setAutocompleteRef(autocomplete)}
                        onPlaceChanged={handlePlaceChanged}
                      >
                        <Box w="100%">
                          <Input
                            size="2xl"
                            variant="subtle"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            w="100%"
                          />
                        </Box>
                      </Autocomplete>
                    </Box>
                  </Field.Root>
                </LoadScript>
              </Box>
              <Field.Root width={"32%"}>
                <Field.Label>Apt / Suite</Field.Label>
                <Input size="2xl" variant="subtle" value={aptOrSuite} onChange={(e) => setAptOrSuite(e.target.value)} />
              </Field.Root>
            </Flex>

            <Flex gap={4}>
              <Field.Root readOnly={true}>
                <Field.Label>City</Field.Label>
                <Input size="2xl" variant="subtle" value={city} onChange={(e) => setCity(e.target.value)} />
              </Field.Root>

              <Field.Root readOnly={true}>
                <Field.Label>State</Field.Label>
                <Input size="2xl" variant="subtle" value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} />
              </Field.Root>

              <Field.Root readOnly={true}>
                <Field.Label>Zip Code</Field.Label>
                <Input size="2xl" variant="subtle" value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
              </Field.Root>
            </Flex>

            <Flex gap={7} justifyContent={'center'}>
              <Button width={'48%'} onClick={() => {
                if (paymentIDs.length>0) {
                  const params = new URLSearchParams();
                  paymentIDs.forEach(id => {
                    params.append('paymentId', id);
                  });
                  router.push(`/select-member?${params.toString()}`);
                } else {
                  router.push('/start');
                }
              }} colorPalette={'red'} type="button" size="2xl">
                Go Back
              </Button>

              <Button width={'48%'} loading={isProcessing} type="button" size="2xl" onClick={handleSubmit}>
                { paymentIDs.length>0 ? 'Register & Complete Donation' : 'Register' }
              </Button>

            </Flex>

          </Fieldset.Content>
        </Fieldset.Root>
      </Center>

      <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)} placement="center">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{paymentIDs.length>0 ? 'Payment Confirmation' : 'Registration Confirmation'}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {paymentIDs.length>0 ?
              (
                <>
                  <Text fontWeight="bold" mt={3}>We sincerely thank you, {displayName}, for your generous donation of ${totalAmount()}. </Text>
                  <Text mt={3}>
                    A confirmation receipt has been sent to your registered email address for your records.
                  </Text>
                  <Text mt={3}>
                    Your support is deeply appreciated and plays a vital role in helping us continue our mission. We warmly invite you to stay connected and consider supporting us again in the future.❤️
                  </Text>
                </>
              ) : (
                <>
                  <Text fontWeight="bold" mt={3}> We sincerely thank you, {displayName}, for joining us.</Text>
                  <Text mt={3}>
                    Your support is deeply appreciated and plays a vital role in helping us continue our mission. We warmly invite you to stay connected and consider supporting us again in the future.❤️
                  </Text>
                </>
              )
            }

          </DialogBody>
          <DialogFooter>
            <Button onClick={() => {
              router.push('/start')
            }} colorScheme="blue">OK</Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Suspense>
  );
}

export default function AddMemberPageWrapped() {
  return (
    <Suspense>
      <AddMemberPage/>
    </Suspense>
  )
}