import React from "react";
import { Link as ThemeLink } from "theme-ui";
import { HashLink as RouterLink } from "react-router-hash-link";

function Link({ to, ...rest }) {
  return (
    <RouterLink to={to}>
      <ThemeLink as="span" {...rest} />
    </RouterLink>
  );
}

export default Link;
