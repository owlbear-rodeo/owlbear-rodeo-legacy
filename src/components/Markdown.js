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

function Markdown({ source }) {
  const renderers = {
    paragraph: Paragraph,
    heading: Heading,
    image: Image,
    link: Link,
    listItem: ListItem,
    inlineCode: Code,
  };
  return <ReactMarkdown source={source} renderers={renderers} />;
}

export default Markdown;
