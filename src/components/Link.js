import React from "react";
import { Link as ThemeLink } from "theme-ui";
import { Link as RouterLink } from "react-router-dom";

function Link({ to, ...rest }) {
  return (
    <RouterLink to={to}>
      <ThemeLink as="span" {...rest} />
    </RouterLink>
  );
}

export default Link;
