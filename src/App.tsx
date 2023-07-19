import { ThemeProvider } from "theme-ui";

import theme from "./theme";
import MigrationModal from "./modals/MigrationModal";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <MigrationModal />
    </ThemeProvider>
  );
}

export default App;
