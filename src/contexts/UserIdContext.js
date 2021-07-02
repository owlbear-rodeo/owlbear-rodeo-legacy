import React, { useEffect, useState, useContext } from "react";

import { useDatabase } from "./DatabaseContext";
/**
 * @type {React.Context<string|undefined>}
 */
const UserIdContext = React.createContext();

export function UserIdProvider({ children }) {
  const { database, databaseStatus } = useDatabase();

  const [userId, setUserId] = useState();
  useEffect(() => {
    if (!database || databaseStatus === "loading") {
      return;
    }
    async function loadUserId() {
      const storedUserId = await database.table("user").get("userId");
      if (storedUserId) {
        setUserId(storedUserId.value);
      }
    }

    loadUserId();
  }, [database, databaseStatus]);

  return (
    <UserIdContext.Provider value={userId}>{children}</UserIdContext.Provider>
  );
}

export function useUserId() {
  return useContext(UserIdContext);
}

export default UserIdContext;
