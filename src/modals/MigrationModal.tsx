import { Box, Button, Container, Text } from "theme-ui";

function MigrationModal() {
  return (
    <Container>
      <Box>
        <Text py={2} sx={{ textAlign: "center", mc: "auto" }}>
          <h1>Owlbear Rodeo 2.0 is coming!</h1>
        </Text>
        <img
          src="/nestling.png"
          alt="nestling"
          style={{ width: 200, margin: "0 auto", display: "block" }}
        />
        <Text
          as="p"
          variant="body"
          sx={{ flexGrow: 1, textAlign: "center", mt: 3 }}
        >
          Migration is now taking place
        </Text>
        <Button
          //@ts-ignore
          href="https://blog.owlbear.rodeo/owlbear-rodeo-2-0-release-date-announcement/"
          target="_blank"
          rel="noopener noreferrer"
          as="a"
          variant="primary"
          sx={{
            backgroundColor: "hsl(260, 100%, 80%)",
            color: "black",
            border: "none",
            alignContent: "center",
            width: "50%",
            mx: "auto",
            display: "block",
            mt: 4,
          }}
        >
          Read more
        </Button>
      </Box>
    </Container>
  );
}

export default MigrationModal;
