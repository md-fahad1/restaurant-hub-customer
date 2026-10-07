import { useQuery } from "@apollo/client/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { PUBLIC_MENU_QUERY, PublicMenuData } from "../lib/graphql";

interface SavedMenu {
  savedAt: number;
  data: PublicMenuData;
}

export function usePublicMenu(
  restaurantSlug: string | null,
  tableId: string | null,
) {
  const query = useQuery<PublicMenuData>(PUBLIC_MENU_QUERY, {
    variables: {
      restaurantSlug: restaurantSlug ?? "",
      tableId: tableId ?? undefined,
    },
    skip: !restaurantSlug,
    // refetch cholar somoyo loading = true hobe
    notifyOnNetworkStatusChange: true,
  });

  const storageKey = restaurantSlug
    ? `restaurant-hub-menu:${restaurantSlug}:${tableId ?? "-"}`
    : null;

  const [saved, setSaved] = useState<SavedMenu | null>(null);
  const [savedLoaded, setSavedLoaded] = useState(false);

  // Phone e age save kora menu ana
  useEffect(() => {
    let cancelled = false;
    setSaved(null);
    setSavedLoaded(false);

    if (!storageKey) {
      setSavedLoaded(true);
      return;
    }

    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          setSaved(JSON.parse(raw));
        } catch {
          // kharap cache, ignore
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSavedLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  // Server theke notun menu ashle phone e save kore rakhi
  useEffect(() => {
    if (!storageKey || !query.data) return;
    AsyncStorage.setItem(
      storageKey,
      JSON.stringify({ savedAt: Date.now(), data: query.data }),
    ).catch(() => {});
  }, [storageKey, query.data]);

  // Server er data age, na thakle save kora data
  const data = query.data ?? saved?.data;

  return {
    data,
    // Dekhanor moto kichui nei, ar ekhono khujchi
    loading: !data && (query.loading || !savedLoaded),
    // Save kora menu thakle error dekhabo na, banner dekhabo
    error: data ? undefined : query.error,
    // Server theke ana jay nai, purono save kora menu dekhacchi
    isStale: !query.data && !!saved?.data && !query.loading,
    savedAt: saved?.savedAt ?? null,
    refetch: query.refetch,
  };
}
