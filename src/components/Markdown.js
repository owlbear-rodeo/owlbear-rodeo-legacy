import React from "react";
import { Text, Image as UIImage, Link, Message } from "theme-ui";
import ReactMarkdown from "react-markdown";

function Paragraph(props) {
  return <Text as="p" variant="body2" {...props} />;
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
  return <UIImage mt={2} sx={{ borderRadius: "4px" }} {...props} />;
}

function ListItem(props) {
  return <Text as="li" variant="body2" {...props} />;
}

function Code({ children, value }) {
  const variant = value.startsWith("Warning:") ? "warning" : "";
  return (
    <Message variant={variant} my={1} as="span" sx={{ display: "block" }}>
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

function Markdown({ source }) {
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
  return <ReactMarkdown source={source} renderers={renderers} />;
}

export default Markdown;
