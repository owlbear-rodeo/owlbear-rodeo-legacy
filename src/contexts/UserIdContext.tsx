import React, { useEffect, useState, useContext } from "react";

import { useDatabase } from "./DatabaseContext";

const UserIdContext = React.createContext<string | undefined>(undefined);

export function UserIdProvider({ children }: { children: React.ReactNode }) {
  const { database, databaseStatus } = useDatabase();

  const [userId, setUserId] = useState();
  useEffect(() => {
    if (!database || databaseStatus === "loading") {
      return;
    }
    async function loadUserId() {
      if (database) {
        const storedUserId = await database.table("user").get("userId");
        if (storedUserId) {
          setUserId(storedUserId.value);
        }
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
