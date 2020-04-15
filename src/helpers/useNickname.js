import { useEffect, useState } from "react";
import { getRandomMonster } from "./monsters";

function useNickname() {
  const [nickname, setNickname] = useState(
    localStorage.getItem("nickname") || getRandomMonster()
  );

  useEffect(() => {
    localStorage.setItem("nickname", nickname);
  }, [nickname]);

  return { nickname, setNickname };
}

export default useNickname;
