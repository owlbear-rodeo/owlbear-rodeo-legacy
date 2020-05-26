import React from "react";

function ExpandMoreDiceIcon({ isExpanded }) {
  return (
    <svg
      width="24"
      height="24"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentcolor"
    >
      <path d="M0 0h24v24H0z" fill="none" />
      {isExpanded ? (
        <path d="M17.727 6c.7 0 1.273.6 1.273 1.333v9.334C19 17.4 18.427 18 17.727 18H6.273C5.573 18 5 17.4 5 16.667V7.333C5 6.6 5.573 6 6.273 6zM17 8H7v8h10V8zm-5.444 1c.244 0 .444.193.444.429v5.182c0 .236-.2.429-.444.429H8.444A.438.438 0 018 14.611V9.43C8 9.193 8.2 9 8.444 9h3.112z" />
      ) : (
        <path d="M17.727 6c.7 0 1.273.6 1.273 1.333v9.334C19 17.4 18.427 18 17.727 18H6.273C5.573 18 5 17.4 5 16.667V7.333C5 6.6 5.573 6 6.273 6zM17 8H7v8h10V8zm-5.444 1c.244 0 .444.193.444.429v2.142c0 .236-.2.429-.444.429H8.444A.438.438 0 018 11.571V9.43C8 9.193 8.2 9 8.444 9h3.112z" />
      )}
    </svg>
  );
}

export default ExpandMoreDiceIcon;
