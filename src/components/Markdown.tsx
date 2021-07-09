import React from "react";
import {
  Text,
  TextProps,
  Image as UIImage,
  ImageProps,
  Link as UILink,
  Message,
  Embed,
} from "theme-ui";
import ReactMarkdown from "react-markdown";

function Paragraph(props: TextProps) {
  return <Text as="p" my={2} variant="body2" {...props} />;
}

function Heading({ level, ...props }: { level: number } & TextProps) {
  const fontSize = level === 1 ? 5 : level === 2 ? 3 : 1;
  return (
    <Text
      mt={2}
      mb={1}
      as={`h${level}` as React.ElementType}
      sx={{ fontSize }}
      variant="heading"
      {...props}
    />
  );
}

function Image(props: ImageProps) {
  if (props.alt === "embed:") {
    return <Embed as="span" sx={{ display: "block" }} src={props.src} my={2} />;
  }
  if (props.src?.endsWith(".mp4")) {
    return (
      <video
        style={{ width: "100%", margin: "8px 0" }}
        autoPlay
        muted
        playsInline
        loop
        controls
        src={props.src}
      />
    );
  }

  return <UIImage mt={2} sx={{ borderRadius: "4px" }} {...props} />;
}

function ListItem(props: TextProps) {
  return <Text as="li" variant="body2" my={1} {...props} />;
}

function Code({
  children,
  value,
}: {
  value: string;
  children: React.ReactNode;
}) {
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

function Table({ children }: { children: React.ReactNode }) {
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

function TableHead(props: TextProps) {
  return (
    <Text
      as="thead"
      variant="heading"
      sx={{ textAlign: "left", "& > tr": { borderBottomWidth: "2px" } }}
      {...props}
    />
  );
}

function TableBody(props: TextProps) {
  return (
    <Text
      as="tbody"
      variant="body2"
      sx={{ borderBottomWidth: "1px", "& > tr": { borderBottomWidth: "1px" } }}
      {...props}
    />
  );
}

function TableRow({ children }: { children: React.ReactNode }) {
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

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <Text as="td" p={2}>
      {children}
    </Text>
  );
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return <UILink href={href}>{children}</UILink>;
}

function Markdown({
  source,
  assets,
}: {
  source: string;
  assets: Record<string, string>;
}) {
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
      transformImageUri={(uri) => assets[uri] || uri}
    />
  );
}

Markdown.defaultProps = {
  assets: {},
};

export default Markdown;
