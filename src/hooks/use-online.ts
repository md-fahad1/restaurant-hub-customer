import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

/** Net ache kina. Jana na thakle (null) online dhore nei. */
export function useIsOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline =
        state.isConnected === false || state.isInternetReachable === false;
      setOnline(!offline);
    });
    return unsubscribe;
  }, []);

  return online;
}
