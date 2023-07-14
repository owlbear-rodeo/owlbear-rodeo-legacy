import { ThemeProvider } from "theme-ui";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import theme from "./theme";
import Home from "./routes/Home";
import Game from "./routes/Game";
import About from "./routes/About";
import FAQ from "./routes/FAQ";
import ReleaseNotes from "./routes/ReleaseNotes";
import HowTo from "./routes/HowTo";

import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { KeyboardProvider } from "./contexts/KeyboardContext";
import { DatabaseProvider } from "./contexts/DatabaseContext";
import { UserIdProvider } from "./contexts/UserIdContext";

import { ToastProvider } from "./components/Toast";
import MigrationModal from "./modals/MigrationModal";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <SettingsProvider>
        <AuthProvider>
          <KeyboardProvider>
            <ToastProvider>
              <MigrationModal />
              <Router>
                <Switch>
                  {/* Legacy support camel case routes */}
                  <Route path={["/howTo", "/how-to"]}>
                    <HowTo />
                  </Route>
                  <Route path={["/releaseNotes", "/release-notes"]}>
                    <ReleaseNotes />
                  </Route>
                  <Route path="/about">
                    <About />
                  </Route>
                  <Route path="/faq">
                    <FAQ />
                  </Route>
                  <Route path="/game/:id">
                    <DatabaseProvider>
                      <UserIdProvider>
                        <Game />
                      </UserIdProvider>
                    </DatabaseProvider>
                  </Route>
                  <Route path="/">
                    <Home />
                  </Route>
                </Switch>
              </Router>
            </ToastProvider>
          </KeyboardProvider>
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
