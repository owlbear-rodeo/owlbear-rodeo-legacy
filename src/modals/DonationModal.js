import React, { useState, useEffect } from "react";
import { Box, Label, Button, Flex, Radio, Text } from "theme-ui";
import { useLocation, useHistory } from "react-router-dom";

import Modal from "../components/Modal";
import LoadingOverlay from "../components/LoadingOverlay";
import Banner from "../components/Banner";

const skus = [
  { sku: "sku_H6DhHS1MimRPR9", price: "$5.00 AUD", name: "Small" },
  { sku: "sku_H6DhiQfHUkYUKd", price: "$15.00 AUD", name: "Medium" },
  { sku: "sku_H6DhbO2oUn9Sda", price: "$30.00 AUD", name: "Large" },
];

function DonationModal({ isOpen, onRequestClose }) {
  // Handle callback from stripe
  const location = useLocation();
  const history = useHistory();
  const query = new URLSearchParams(location.search);
  const hasDonated = query.has("donated");
  const showDonationForm = isOpen || query.get("donated") === "false";

  const [loading, setLoading] = useState(showDonationForm);
  const [error, setError] = useState(null);

  const [stripe, setStripe] = useState();
  useEffect(() => {
    if (showDonationForm) {
      import("@stripe/stripe-js").then(({ loadStripe }) => {
        loadStripe("pk_live_MJjzi5djj524Y7h3fL5PNh4e00a852XD51")
          .then((stripe) => {
            setStripe(stripe);
            setLoading(false);
          })
          .catch((err) => {
            setError(err.message);
            setLoading(false);
          });
      });
    }
  }, [showDonationForm]);

  function handleClose() {
    if (hasDonated) {
      history.push(location.pathname);
    }
    onRequestClose();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!stripe) {
      return;
    }
    setLoading(true);
    stripe
      .redirectToCheckout({
        items: [{ sku: selectedSku, quantity: 1 }],
        successUrl: `${window.location.href}?donated=true`,
        cancelUrl: `${window.location.href}?donated=false`,
        submitType: "donate",
      })
      .then((response) => {
        setLoading(false);
        if (response.error) {
          setError(response.error.message);
        }
      });
  }

  const [selectedSku, setSelectedSku] = useState("sku_H6DhiQfHUkYUKd");
  function handleSkuChange(event) {
    setSelectedSku(event.target.value);
  }

  const donationSuccessful = (
    <Box>
      <Text my={2} variant="heading" as="h1" sx={{ fontSize: 3 }}>
        Thanks for donating! ʕ•ᴥ•ʔ
      </Text>
    </Box>
  );

  const donationForm = (
    <Box as="form" onSubmit={handleSubmit}>
      <Label py={2}>Support us with a donation</Label>
      <Text as="p" mb={2} variant="caption">
        One time donation
      </Text>
      {skus.map((sku) => (
        <Label key={sku.sku}>
          <Radio
            name="donation"
            checked={selectedSku === sku.sku}
            value={sku.sku}
            onChange={handleSkuChange}
          />
          {sku.name} - {sku.price}
        </Label>
      ))}
      <Flex mt={3}>
        <Button sx={{ flexGrow: 1 }} disabled={!stripe || loading}>
          Donate
        </Button>
      </Flex>
    </Box>
  );

  return (
    <Modal isOpen={isOpen || hasDonated} onRequestClose={handleClose}>
      <Flex
        sx={{
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: "300px",
          flexGrow: 1,
        }}
        m={2}
      >
        {query.get("donated") === "true" ? donationSuccessful : donationForm}
        {loading && <LoadingOverlay />}
        <Banner isOpen={!!error} onRequestClose={() => setError(null)}>
          <Box p={1}>
            <Text as="p" variant="body2">
              {error}
            </Text>
          </Box>
        </Banner>
      </Flex>
    </Modal>
  );
}

export default DonationModal;
