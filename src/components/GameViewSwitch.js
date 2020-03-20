import React from "react";
import { Flex, IconButton, Box } from "theme-ui";

import AddPartyMemberButton from "./AddPartyMemberButton";

function SocialIcon() {
  return (
    <IconButton aria-label="Social View">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        enableBackground="new 0 0 24 24"
        height="24"
        viewBox="0 0 24 24"
        width="24"
        fill="currentcolor"
      >
        <g>
          <rect fill="none" height="24" width="24" />
          <rect fill="none" height="24" width="24" />
        </g>
        <g>
          <g />
          <g>
            <g>
              <path
                d="M16.67,13.13C18.04,14.06,19,15.32,19,17v3h3c0.55,0,1-0.45,1-1v-2 C23,14.82,19.43,13.53,16.67,13.13z"
                fillRule="evenodd"
              />
            </g>
            <g>
              <circle cx="9" cy="8" fillRule="evenodd" r="4" />
            </g>
            <g>
              <path
                d="M15,12c2.21,0,4-1.79,4-4c0-2.21-1.79-4-4-4c-0.47,0-0.91,0.1-1.33,0.24 C14.5,5.27,15,6.58,15,8s-0.5,2.73-1.33,3.76C14.09,11.9,14.53,12,15,12z"
                fillRule="evenodd"
              />
            </g>
            <g>
              <path
                d="M9,13c-2.67,0-8,1.34-8,4v2c0,0.55,0.45,1,1,1h14c0.55,0,1-0.45,1-1v-2 C17,14.34,11.67,13,9,13z"
                fillRule="evenodd"
              />
            </g>
          </g>
        </g>
      </svg>
    </IconButton>
  );
}

function EncounterIcon() {
  return (
    <IconButton aria-label="Encounter View">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24"
        viewBox="0 0 24 24"
        width="24"
        fill="currentcolor"
      >
        <path d="M0 0h24v24H0V0z" fill="none" />
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.9 13.98l2.1 2.53 3.1-3.99c.2-.26.6-.26.8.01l3.51 4.68c.25.33.01.8-.4.8H6.02c-.42 0-.65-.48-.39-.81L8.12 14c.19-.26.57-.27.78-.02z" />
      </svg>
    </IconButton>
  );
}

function GameViewSwitch({ view, onViewChange }) {
  return (
    <Flex sx={{ width: "128px", height: "32px" }} m={2}>
      <Flex
        bg={view === "social" ? "primary" : "highlight"}
        sx={{
          flexGrow: 1,
          borderRadius: "32px 0 0 32px",
          justifyContent: "center"
        }}
        onClick={() => onViewChange("social")}
      >
        <SocialIcon />
      </Flex>
      <Flex
        bg={view === "encounter" ? "primary" : "highlight"}
        sx={{
          flexGrow: 1,
          borderRadius: "0 32px 32px 0",
          justifyContent: "center"
        }}
        onClick={() => onViewChange("encounter")}
      >
        <EncounterIcon />
      </Flex>
    </Flex>
  );
}

export default GameViewSwitch;
