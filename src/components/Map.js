import React from "react";
import { Image, Flex } from "theme-ui";

function Map({ imageSource }) {
  return (
    <Flex sx={{ justifyContent: "center", flexGrow: 1 }} bg="background">
      <Image src={imageSource} sx={{ objectFit: "contain" }} />
    </Flex>
  );
}

export default Map;
