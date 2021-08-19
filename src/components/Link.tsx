import { Link as ThemeLink, LinkProps } from "theme-ui";
import { HashLink as RouterLink } from "react-router-hash-link";

function Link({ to, ...rest }: { to: string } & LinkProps) {
  return (
    <RouterLink to={to}>
      <ThemeLink as="span" {...rest} />
    </RouterLink>
  );
}

export default Link;
