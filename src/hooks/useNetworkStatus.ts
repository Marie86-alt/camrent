import NetInfo from '@react-native-community/netinfo';
import { useEffect, useMemo, useState } from 'react';

type NetworkSnapshot = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

export function useNetworkStatus() {
  const [network, setNetwork] = useState<NetworkSnapshot>({
    isConnected: true,
    isInternetReachable: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetwork({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      });
    });

    void NetInfo.fetch().then((state) => {
      setNetwork({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      });
    });

    return unsubscribe;
  }, []);

  const isOnline = useMemo(() => {
    if (network.isConnected === false) return false;
    if (network.isInternetReachable === false) return false;
    return true;
  }, [network.isConnected, network.isInternetReachable]);

  return {
    isInternetReachable: network.isInternetReachable,
    isOnline,
  };
}
