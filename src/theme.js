export default {
  colors: {
    text: "hsl(210, 50%, 96%)",
    background: "hsl(230, 25%, 18%)",
    primary: "hsl(260, 100%, 80%)",
    secondary: "hsl(290, 100%, 80%)",
    highlight: "hsl(260, 20%, 40%)",
    purple: "hsl(290, 100%, 80%)",
    muted: "hsla(230, 20%, 0%, 20%)",
    gray: "hsl(0, 0%, 70%)",
    overlay: "hsla(230, 25%, 18%, 0.8)",
    border: "hsla(210, 50%, 96%, 0.5)",
    modes: {
      light: {
        text: "hsl(10, 20%, 20%)",
        background: "hsl(10, 10%, 98%)",
        primary: "hsl(260, 100%, 80%)",
        secondary: "hsl(290, 100%, 80%)",
        highlight: "hsl(260, 20%, 40%)",
        muted: "hsla(230, 20%, 60%, 20%)",
        overlay: "hsla(230, 100%, 97%, 0.8)",
        border: "hsla(10, 20%, 20%, 0.5)",
      },
    },
  },
  fonts: {
    body: "'Bree Serif', serif",
    body2:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
    heading: "'Bree Serif', serif",
    monospace: "Menlo, monospace",
    display: "'Pacifico', cursive",
  },
  fontSizes: [12, 14, 16, 20, 24, 32, 48, 64, 72],
  fontWeights: {
    caption: 200,
    body: 400,
    heading: 400,
    display: 400,
  },
  lineHeights: {
    body: 1.3,
    display: 1.1,
    heading: 1.25,
  },
  breakpoints: ["12em", "24em", "40em", "56em", "64em"],
  text: {
    heading: {
      fontFamily: "heading",
      fontWeight: "heading",
      lineHeight: "heading",
      fontSize: 1,
    },
    display: {
      variant: "text.heading",
      fontFamily: "display",
      fontSize: [5, 6],
      fontWeight: "display",
      mt: 3,
    },
    caption: {
      fontFamily: "body2",
      fontWeight: "caption",
      fontSize: 0,
      color: "gray",
    },
    body2: {
      fontFamily: "body2",
      fontSize: 0,
      fontWeight: "body",
    },
  },
  styles: {
    Container: {
      p: 3,
      maxWidth: 1024,
    },
    root: {
      fontFamily: "body",
      lineHeight: "body",
      fontWeight: "body",
    },
    h1: {
      variant: "text.display",
    },
    h2: {
      variant: "text.heading",
      fontSize: 5,
    },
    h3: {
      variant: "text.heading",
      fontSize: 4,
    },
    h4: {
      variant: "text.heading",
      fontSize: 3,
    },
    h5: {
      variant: "text.heading",
      fontSize: 2,
    },
    h6: {
      variant: "text.heading",
      fontSize: 1,
    },
    a: {
      variant: "text.body2",
      color: "text",
      "&:hover": {
        color: "primary",
      },
      "&:active": {
        color: "secondary",
      },
    },
    pre: {
      variant: "prism",
      fontFamily: "monospace",
      fontSize: 1,
      p: 3,
      color: "text",
      bg: "muted",
      overflow: "auto",
      code: {
        color: "inherit",
      },
    },
    code: {
      fontFamily: "monospace",
      color: "secondary",
      fontSize: 1,
    },
    inlineCode: {
      fontFamily: "monospace",
      color: "secondary",
      bg: "muted",
    },
    hr: {
      border: 0,
      borderBottom: "1px solid",
      borderColor: "muted",
    },
    img: {
      maxWidth: "100%",
    },
    progress: {
      color: "text",
      backgroundColor: "overlay",
    },
  },
  prism: {
    ".comment,.prolog,.doctype,.cdata,.punctuation,.operator,.entity,.url": {
      color: "gray",
    },
    ".comment": {
      fontStyle: "italic",
    },
    ".property,.tag,.boolean,.number,.constant,.symbol,.deleted,.function,.class-name,.regex,.important,.variable": {
      color: "purple",
    },
    ".atrule,.attr-value,.keyword": {
      color: "primary",
    },
    ".selector,.attr-name,.string,.char,.bultin,.inserted": {
      color: "secondary",
    },
  },
  forms: {
    label: {
      fontWeight: 400,
    },
    input: {
      "&:focus": {
        outlineColor: "primary",
      },
      "&:disabled": {
        backgroundColor: "muted",
        color: "gray",
        borderColor: "text",
      },
    },
  },
  buttons: {
    primary: {
      color: "text",
      bg: "transparent",
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "text",
      "&:hover": {
        borderColor: "highlight",
        cursor: "pointer",
      },
      fontFamily: "body",
      "&:focus": {
        outline: "none",
      },
      "&:active": {
        borderColor: "primary",
      },
      "&:disabled": {
        borderColor: "text",
        opacity: 0.5,
      },
    },
    secondary: {
      color: "text",
      bg: "transparent",
      border: "none",
      fontFamily: "body",
      "&:focus": {
        outline: "none",
      },
      "&:disabled": {
        opacity: 0.5,
      },
      "&:hover": {
        color: "primary",
        cursor: "pointer",
      },
      "&:active": {
        color: "secondary",
      },
    },
    icon: {
      "&:hover": {
        cursor: "pointer",
        color: "primary",
      },
      "&:focus": {
        outline: "none",
      },
      "&:active": {
        color: "secondary",
      },
      "&:disabled": {
        opacity: 0.5,
        color: "text",
      },
    },
    close: {
      "&:hover": {
        cursor: "pointer",
        color: "primary",
      },
      "&:focus": {
        outline: "none",
      },
      "&:active": {
        color: "secondary",
      },
    },
  },
  links: {
    footer: {
      variant: "text.caption",
      textDecoration: "underline",
      "&:hover": {
        textDecorationColor: "hsl(260, 100%, 80%)",
        cursor: "pointer",
      },
      "&:active": {
        textDecorationColor: "hsl(290, 100%, 80%)",
      },
    },
  },
  messages: {
    warning: {
      backgroundColor: "#d65c64",
      borderLeftColor: "#ff939b",
    },
  },
};
