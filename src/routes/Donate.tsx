import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Message,
  Button,
  Input,
  Label,
  Radio,
} from "theme-ui";
import { useLocation } from "react-router-dom";

import Footer from "../components/Footer";
import ErrorBanner from "../components/banner/ErrorBanner";
import LoadingOverlay from "../components/LoadingOverlay";

import { logError } from "../helpers/logging";
import { Stripe } from "@stripe/stripe-js";

type Price = { price?: string, name: string, value: number }

const prices: Price[] = [
  { price: "$5.00", name: "Small", value: 5 },
  { price: "$15.00", name: "Medium", value: 15 },
  { price: "$30.00", name: "Large", value: 30 },
];

function Donate() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const hasDonated = query.has("success");

  const [loading, setLoading] = useState(true);
  // TODO: check with Mitch about changes here from useState(null)
  // TODO: typing with error a little messy
  const [error, setError]= useState<any>();

  const [stripe, setStripe]: [ stripe: Stripe | undefined, setStripe: React.Dispatch<Stripe | undefined >] = useState();
  useEffect(() => {
    import("@stripe/stripe-js").then(({ loadStripe }) => {
      loadStripe(process.env.REACT_APP_STRIPE_API_KEY as string)
        .then((stripe) => {
          if (stripe) {
            setStripe(stripe);
            setLoading(false);
          }
        })
        .catch((error) => {
          logError(error);
          // TODO: check setError -> cannot work with value as a string
          setError(error.message);
          setLoading(false);
        });
    });
  }, []);

  async function handleSubmit(event: any) {
    event.preventDefault();
    if (loading) {
      return;
    }

    const response = await fetch(
      process.env.REACT_APP_STRIPE_URL + "/create-checkout-session",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currency: "usd", amount: value * 100 }),
      }
    );
    const session = await response.json();
    const result = await stripe?.redirectToCheckout({ sessionId: session.id });

    if (result?.error) {
      setError(result.error.message);
    }
  }

  const [selectedPrice, setSelectedPrice] = useState("Medium");
  const [value, setValue] = useState(15);

  function handlePriceChange(price: Price) {
    setValue(price.value);
    setSelectedPrice(price.name);
  }
  
  return (
    <Flex
      sx={{
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "100%",
        alignItems: "center",
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          maxWidth: "350px",
          width: "100%",
          flexGrow: 1,
        }}
        m={4}
        as="form"
        onSubmit={handleSubmit}
      >
        <Text my={2} variant="heading" as="h1" sx={{ fontSize: 5 }}>
          Donate
        </Text>
        {hasDonated ? (
          <Message my={2}>Thanks for donating!</Message>
        ) : (
          <Text variant="body2" as="p">
            In order to keep Owlbear Rodeo running any donation is greatly
            appreciated.
          </Text>
        )}
        <Text
          my={4}
          variant="heading"
          as="h1"
          sx={{ fontSize: 5, alignSelf: "center" }}
          aria-hidden="true"
        >
          (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
        </Text>
        <Text as="p" mb={2} variant="caption">
          One time donation (USD)
        </Text>
        <Box sx={{ display: "flex", flexWrap: "wrap" }}>
          {prices.map((price) => (
            <Label mx={1} key={price.name} sx={{ width: "initial" }}>
              <Radio
                name="donation"
                checked={selectedPrice === price.name}
                onChange={() => handlePriceChange(price)}
              />
              {price.price}
            </Label>
          ))}
          <Label mx={1} sx={{ width: "initial" }}>
            <Radio
              name="donation"
              checked={selectedPrice === "Custom"}
              onChange={() => handlePriceChange({ value, name: "Custom" })}
            />
            Custom
          </Label>
        </Box>
        {selectedPrice === "Custom" && (
          <Box>
            <Label htmlFor="donation">Amount ($)</Label>
            <Input
              type="number"
              name="donation"
              min={1}
              value={value}
              onChange={(e: any) => setValue(e.target.value)}
            />
          </Box>
        )}
        <Button my={3} disabled={loading || !value}>
          Go to Payment
        </Button>
      </Flex>
      <Footer />
      {loading && <LoadingOverlay />}
      <ErrorBanner error={error as Error} onRequestClose={() => setError(undefined)} />
    </Flex>
  );
}

export default Donate;