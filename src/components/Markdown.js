import React from "react";
import {
  Text,
  Image as UIImage,
  Link as UILink,
  Message,
  Embed,
} from "theme-ui";
import ReactMarkdown from "react-markdown";

function Paragraph(props) {
  return <Text variant="body2" {...props} />;
}

function Heading({ level, ...props }) {
  const fontSize = level === 1 ? 5 : level === 2 ? 3 : 1;
  return (
    <Text
      mt={2}
      mb={1}
      as={`h${level}`}
      sx={{ fontSize }}
      variant="heading"
      {...props}
    />
  );
}

function Image(props) {
  if (props.src.endsWith(".mp4")) {
    return (
      <video
        style={{ width: "100%", margin: "8px 0" }}
        autoPlay
        muted
        playsInline
        loop
        controls
        {...props}
      />
    );
  }

  return <UIImage mt={2} sx={{ borderRadius: "4px" }} {...props} />;
}

function ListItem(props) {
  return <Text as="li" variant="body2" my={1} {...props} />;
}

function Code({ children, value }) {
  let variant = "";
  if (value.startsWith("Warning:")) {
    variant = "warning";
  } else if (value.startsWith("Note:")) {
    variant = "note";
  }
  return (
    <Message
      variant={variant}
      color="hsl(210, 50%, 96%)"
      my={2}
      as="span"
      sx={{ display: "block" }}
    >
      {children}
    </Message>
  );
}

function Table({ children }) {
  return (
    <Text
      as="table"
      my={4}
      style={{ borderCollapse: "collapse", width: "100%" }}
    >
      {children}
    </Text>
  );
}

function TableHead(props) {
  return (
    <Text
      as="thead"
      variant="heading"
      sx={{ textAlign: "left", "& > tr": { borderBottomWidth: "2px" } }}
      {...props}
    />
  );
}

function TableBody(props) {
  return (
    <Text
      as="tbody"
      variant="body2"
      sx={{ borderBottomWidth: "1px", "& > tr": { borderBottomWidth: "1px" } }}
      {...props}
    />
  );
}

function TableRow({ children }) {
  return (
    <Text
      as="tr"
      sx={{
        borderBottomStyle: "solid",
        borderBottomColor: "border",
      }}
    >
      {children}
    </Text>
  );
}

function TableCell({ children }) {
  return (
    <Text as="td" p={2}>
      {children}
    </Text>
  );
}

function Link({ href, children }) {
  const linkText = children[0].props.value;
  if (linkText === "embed:") {
    return <Embed src={href} my={2} />;
  } else {
    return <UILink href={href}>{children}</UILink>;
  }
}

function Markdown({ source, assets }) {
  const renderers = {
    paragraph: Paragraph,
    heading: Heading,
    image: Image,
    link: Link,
    listItem: ListItem,
    inlineCode: Code,
    table: Table,
    tableHead: TableHead,
    tableBody: TableBody,
    tableRow: TableRow,
    tableCell: TableCell,
  };
  return (
    <ReactMarkdown
      source={source}
      renderers={renderers}
      transformImageUri={(uri) => assets[uri]}
    />
  );
}

Markdown.defaultProps = {
  assets: {},
};

export default Markdown;
