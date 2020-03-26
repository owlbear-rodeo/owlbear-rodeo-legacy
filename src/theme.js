export default {
  colors: {
    text: "hsl(210, 50%, 96%)",
    background: "hsl(230, 25%, 18%)",
    primary: "hsl(260, 100%, 80%)",
    secondary: "hsl(290, 100%, 80%)",
    highlight: "hsl(260, 20%, 40%)",
    purple: "hsl(290, 100%, 80%)",
    muted: "hsla(230, 20%, 0%, 20%)",
    gray: "hsl(0, 0%, 70%)"
  },
  fonts: {
    body: "'Bree Serif', serif",
    body2:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
    heading: "'Bree Serif', serif",
    monospace: "Menlo, monospace",
    display: "'Pacifico', cursive"
  },
  fontSizes: [12, 14, 16, 20, 24, 32, 48, 64, 72],
  fontWeights: {
    caption: 200,
    body: 300,
    heading: 400,
    display: 400
  },
  lineHeights: {
    body: 1.1,
    heading: 1.25
  },
  text: {
    heading: {
      fontFamily: "heading",
      fontWeight: "heading",
      lineHeight: "heading",
      fontSize: 1
    },
    display: {
      variant: "textStyles.heading",
      fontFamily: "display",
      fontSize: [5, 6],
      fontWeight: "display",
      mt: 3
    },
    caption: {
      fontFamily: "body2",
      fontWeight: "caption",
      fontSize: 10,
      color: "gray"
    },
    body2: {
      fontFamily: "body2",
      fontSize: 1,
      fontWeight: "body"
    }
  },
  styles: {
    Container: {
      p: 3,
      maxWidth: 1024
    },
    root: {
      fontFamily: "body",
      lineHeight: "body",
      fontWeight: "body"
    },
    h1: {
      variant: "textStyles.display"
    },
    h2: {
      variant: "textStyles.heading",
      fontSize: 5
    },
    h3: {
      variant: "textStyles.heading",
      fontSize: 4
    },
    h4: {
      variant: "textStyles.heading",
      fontSize: 3
    },
    h5: {
      variant: "textStyles.heading",
      fontSize: 2
    },
    h6: {
      variant: "textStyles.heading",
      fontSize: 1
    },
    a: {
      color: "primary",
      "&:hover": {
        color: "secondary"
      }
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
        color: "inherit"
      }
    },
    code: {
      fontFamily: "monospace",
      color: "secondary",
      fontSize: 1
    },
    inlineCode: {
      fontFamily: "monospace",
      color: "secondary",
      bg: "muted"
    },
    table: {
      width: "100%",
      my: 4,
      borderCollapse: "separate",
      borderSpacing: 0,
      "th,td": {
        textAlign: "left",
        py: "4px",
        pr: "4px",
        pl: 0,
        borderColor: "muted",
        borderBottomStyle: "solid"
      }
    },
    th: {
      verticalAlign: "bottom",
      borderBottomWidth: "2px"
    },
    td: {
      verticalAlign: "top",
      borderBottomWidth: "1px"
    },
    hr: {
      border: 0,
      borderBottom: "1px solid",
      borderColor: "muted"
    },
    img: {
      maxWidth: "100%"
    }
  },
  prism: {
    ".comment,.prolog,.doctype,.cdata,.punctuation,.operator,.entity,.url": {
      color: "gray"
    },
    ".comment": {
      fontStyle: "italic"
    },
    ".property,.tag,.boolean,.number,.constant,.symbol,.deleted,.function,.class-name,.regex,.important,.variable": {
      color: "purple"
    },
    ".atrule,.attr-value,.keyword": {
      color: "primary"
    },
    ".selector,.attr-name,.string,.char,.bultin,.inserted": {
      color: "secondary"
    }
  },
  forms: {
    label: {
      fontWeight: 400
    },
    input: {
      "&:focus": {
        outlineColor: "primary"
      }
    }
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
        cursor: "pointer"
      },
      fontFamily: "body",
      "&:focus": {
        outline: "none"
      },
      "&:active": {
        borderColor: "primary"
      }
    },
    secondary: {
      color: "secondary",
      bg: "transparent",
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "text",
      fontFamily: "body"
    },
    icon: {
      "&:hover": {
        cursor: "pointer"
      },
      "&:focus": {
        outline: "none"
      },
      "&:active": {
        color: "primary"
      }
    },
    close: {
      "&:hover": {
        cursor: "pointer"
      },
      "&:focus": {
        outline: "none"
      },
      "&:active": {
        color: "primary"
      }
    }
  }
};
