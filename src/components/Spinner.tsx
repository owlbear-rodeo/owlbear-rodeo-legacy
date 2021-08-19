import { Box } from "theme-ui";

import "./Spinner.css";
import spinnerImage from "../images/Loading.png";

function Spinner() {
  return (
    <Box className="spinner">
      <Box
        sx={{
          backgroundImage: `url(${spinnerImage})`,
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          backgroundSize: "contain",
        }}
      ></Box>
    </Box>
  );
}

export default Spinner;
