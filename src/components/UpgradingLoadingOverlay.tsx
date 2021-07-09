import { useState, useEffect } from "react";
import { Text } from "theme-ui";

import LoadingOverlay from "./LoadingOverlay";

import { shuffle } from "../helpers/shared";

const facts = [
  "Owls can rotate their necks 270 degrees",
  "Not all owls hoot",
  "Owl flight is almost completely silent",
  "Owls are used to represent the Goddess Athena in Greek mythology",
  "Owls have the best night vision of any animal",
  "Bears can run up to 40 mi (~64 km) per hour ",
  "A hibernating bear’s heart beats at 8 bpm",
  "Bears can see in colour",
  "Koala bears are not bears",
  "A polar bear can swim up to 100 mi (~161 km) without resting",
  "A group of bears is called a sleuth or sloth",
  "Not all bears hibernate",
];

function UpgradingLoadingOverlay() {
  const [subText, setSubText] = useState<string>();

  useEffect(() => {
    let index = 0;
    let randomFacts = shuffle(facts);

    function updateFact() {
      setSubText(randomFacts[index % (randomFacts.length - 1)]);
      index += 1;
    }

    // Show first fact after 10 seconds then every 20 seconds after that
    let interval: NodeJS.Timeout;
    let timeout = setTimeout(() => {
      updateFact();
      interval = setInterval(() => {
        updateFact();
      }, 20 * 1000);
    }, 10 * 1000);

    return () => {
      clearTimeout(timeout);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  return (
    <LoadingOverlay>
      <Text as="p" variant="body2" m={1}>
        Database upgrading, please wait...
      </Text>
      {subText && (
        <>
          <Text
            sx={{ maxWidth: "200px", textAlign: "center" }}
            as="p"
            variant="caption"
            m={1}
          >
            We're still working on the upgrade. In the meantime, did you know?
          </Text>
          <Text
            sx={{ maxWidth: "200px", textAlign: "center" }}
            as="p"
            variant="body2"
          >
            {subText}
          </Text>
        </>
      )}
    </LoadingOverlay>
  );
}

export default UpgradingLoadingOverlay;
