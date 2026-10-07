import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { APP_VERSION, isNewerVersion, LATEST_VERSION_URL } from "../config";

type Banner =
  | { kind: "ota" } // JS-only update (eas update) — app er bhitorei install hoy
  | { kind: "apk"; version: string; downloadUrl: string }; // notun APK lagbe

// Ek session e ekbar-i check kori, jeno screen bodlale bar bar network call na hoy
let checkPromise: Promise<Banner | null> | null = null;
let dismissedThisSession = false;

function checkForUpdate(): Promise<Banner | null> {
  if (!checkPromise) {
    checkPromise = (async () => {
      // 1) OTA update ache kina (shudhu release build e kaj kore)
      if (Updates.isEnabled) {
        try {
          const res = await Updates.checkForUpdateAsync();
          if (res.isAvailable) return { kind: "ota" } as Banner;
        } catch {
          // check fail hole chup chap APK check e jai
        }
      }

      // 2) Notun APK version ache kina (native change hole)
      try {
        const res = await fetch(LATEST_VERSION_URL);
        const data = await res.json();
        if (data.version && isNewerVersion(data.version, APP_VERSION)) {
          return {
            kind: "apk",
            version: data.version,
            downloadUrl: data.downloadUrl,
          } as Banner;
        }
      } catch {
        // ইন্টারনেট না থাকলে চুপচাপ ইগনোর
      }
      return null;
    })();
  }
  return checkPromise;
}

export function UpdateBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(dismissedThisSession);

  useEffect(() => {
    let cancelled = false;
    checkForUpdate().then((b) => {
      if (!cancelled) setBanner(b);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function applyOtaUpdate() {
    setBusy(true);
    try {
      await Updates.fetchUpdateAsync(); // download
      await Updates.reloadAsync(); // app restart hoye notun code load hobe
    } catch {
      setBusy(false);
      Alert.alert(
        "Update failed",
        "Please check your internet connection and try again.",
      );
    }
  }

  if (!banner || dismissed) return null;

  return (
    <View className="flex-row items-center justify-between bg-brand px-4 py-2.5">
      <Text className="flex-1 text-[13px] font-medium text-white">
        {banner.kind === "ota"
          ? "A new update is available"
          : `A new version (${banner.version}) is available`}
      </Text>

      {!busy && (
        <TouchableOpacity
          onPress={() => {
            dismissedThisSession = true;
            setDismissed(true);
          }}
          className="mr-4"
        >
          <Text className="text-[13px] text-white/80">Later</Text>
        </TouchableOpacity>
      )}

      {busy ? (
        <ActivityIndicator color="white" />
      ) : (
        <TouchableOpacity
          onPress={() =>
            banner.kind === "ota"
              ? applyOtaUpdate()
              : Linking.openURL(banner.downloadUrl)
          }
        >
          <Text className="text-[13px] font-bold text-white underline">
            Update
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
