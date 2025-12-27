"use client"

import React, {useCallback, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {Button, Field, Flex} from "@chakra-ui/react";
import {PinInput} from "@/components/ui/pin-input";
import NumPad from "@/components/NumPad";
import {IoIosLogIn} from "react-icons/io";
import LoginHeader from "@/components/LoginHeader";

const LoginComponent = () => {
  const [pin, setPin] = useState<string[]>(Array(6).fill(""))
  const [isInvalid, setIsInvalid] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>("Please enter a valid PIN!")
  const [loading, setLoading] = useState(false)

  const router = useRouter();


  const handleNumberClick = (digit: string) => {
    const firstEmptyIndex = pin.indexOf("");
    if (firstEmptyIndex === -1) return;
    const newPin = [...pin];
    newPin[firstEmptyIndex] = digit;
    setPin(newPin);
  };

  const handleClear = () => {
    setPin(Array(6).fill(""));
  };

  const handleSubmit = useCallback(() => {
    const enteredPin = pin.join("");

    if (enteredPin.length !== 6) {
      setErrorMessage("Please enter all 6 digits.");
      setIsInvalid(true);
      setTimeout(() => setIsInvalid(false), 2000);
      return;
    }

    const formData = new URLSearchParams();
    formData.append("grant_type", "client_credentials");
    formData.append("client_id", enteredPin);
    formData.append("client_secret", enteredPin);

    setLoading(true);

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/v1/oauth/token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error || !data.access_token) {
          setErrorMessage(`Login Failed: ${data.error || "Invalid PIN"}`);
          setIsInvalid(true);
          setPin(Array(6).fill(""));
          setLoading(false);
          setTimeout(() => setIsInvalid(false), 2000);
          return;
        }

        sessionStorage.setItem("swayam_jwt_token", data.access_token);
        sessionStorage.setItem("swayam_user_pin", enteredPin)
        router.push(`/select-reader/`);
      })
      .catch(() => {
        setErrorMessage("Network error. Please try again.");
        setIsInvalid(true);
        setPin(Array(6).fill(""));
        setLoading(false);
        setTimeout(() => setIsInvalid(false), 2000);
      });
  }, [pin, router]);

  useEffect(() => {
    if (pin.every(val => val !== "")) {
      handleSubmit();
    }
  }, [pin, handleSubmit]);

  return (
    <Flex colorPalette="bg" direction="column" minH="100vh">
      <LoginHeader/>
      <Flex flex="1" direction="column" align="center" justify="center" p={4} gap={8}>
        <Field.Root alignItems="center" invalid={isInvalid}>
          <Field.Label>Enter Login PIN</Field.Label>
          <PinInput
            count={6}
            size="2xl"
            attached
            value={pin}
            onValueChange={(details) => {
              setPin(details.value);
            }}
            type="numeric"
            mask
            required={true}
          />
          <Field.ErrorText>{errorMessage}</Field.ErrorText>
        </Field.Root>

        <NumPad
          onNumberClick={handleNumberClick}
          onClear={handleClear}
          onSubmit={handleSubmit}
        />

        <Button loading={loading} type="submit" size="2xl" colorPalette="blue" fontSize="2xl" onClick={handleSubmit}>
          <IoIosLogIn/> Login
        </Button>
      </Flex>
    </Flex>
  );
}

export default LoginComponent;