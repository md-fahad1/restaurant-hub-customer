import { Ionicons } from "@expo/vector-icons";
import * as Updates from "expo-updates";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, Linking, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_VERSION, isNewerVersion, LATEST_VERSION_URL } from "../config";

const CHECK_EVERY_MS = 30 * 60 * 1000; // app khola thakle
const MIN_GAP_MS = 60 * 1000; // minute e ekbar er beshi check korbe na

/**
 * Duto update:
 * 1. OTA (JS code): nijei khuje pay, "Update" chaple download kore app restart hoy. Cart phone e save thake, hariye jay na.
 * 2. Notun APK (native code bodlale): latest-version.json theke jane, "Download" e APK link khole.
 * Dev / Expo Go te kichu kore na (Updates.isEnabled false).
 */
export function UpdateBanner() {
  const insets = useSafeAreaInsets();
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [apk, setApk] = useState<{
    version: string;
    downloadUrl: string;
  } | null>(null);
  const lastCheck = useRef(0);

  const check = useCallback(async () => {
    if (Date.now() - lastCheck.current < MIN_GAP_MS) return;
    lastCheck.current = Date.now();
    if (Updates.isEnabled) {
      try {
        await Updates.checkForUpdateAsync();
      } catch {
        /* offline: pore abar dekhbe */
      }
    }
    if (LATEST_VERSION_URL) {
      try {
        const res = await fetch(`${LATEST_VERSION_URL}?t=${Date.now()}`);
        const j = (await res.json()) as {
          version?: string;
          downloadUrl?: string;
        };
        if (
          j.version &&
          j.downloadUrl &&
          isNewerVersion(j.version, APP_VERSION)
        ) {
          setApk({ version: j.version, downloadUrl: j.downloadUrl });
        }
      } catch {
        /* offline ba file nai: ignore */
      }
    }
  }, []);

  useEffect(() => {
    void check();
    const id = setInterval(() => void check(), CHECK_EVERY_MS);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void check();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [check]);

  async function applyOta() {
    setBusy(true);
    try {
      if (!isUpdatePending) await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (e) {
      setBusy(false);
      Alert.alert(
        "Update failed",
        `${e instanceof Error ? e.message : String(e)}\nCheck the internet and try again.`,
      );
    }
  }

  if (dismissed) return null;
  const showApk = !!apk;
  const showOta = !showApk && (isUpdateAvailable || isUpdatePending);
  if (!showApk && !showOta) return null;

  return (
    <View
      style={{ top: insets.top + 6 }}
      className="absolute left-3 right-3 z-50 flex-row items-center rounded-2xl border border-blue-200 bg-white p-3 shadow-xl"
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
        <Ionicons
          name={showApk ? "cloud-download" : "sparkles"}
          size={20}
          color="#2563eb"
        />
      </View>
      <View className="flex-1 pr-2">
        <Text className="font-bold text-ink">
          {showApk
            ? `New version ${apk!.version} available`
            : "Update available"}
        </Text>
        <Text className="text-xs text-gray-500">
          {showApk
            ? "Download and install the new app"
            : "Tap Update to get the latest improvements"}
        </Text>
      </View>
      <Pressable
        disabled={busy}
        onPress={() =>
          showApk ? void Linking.openURL(apk!.downloadUrl) : void applyOta()
        }
        className={`rounded-xl bg-blue-600 px-4 py-2.5 ${busy ? "opacity-50" : ""}`}
      >
        <Text className="font-bold text-white">
          {busy ? "Updating..." : showApk ? "Download" : "Update"}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setDismissed(true)}
        hitSlop={10}
        className="ml-2 p-1"
      >
        <Ionicons name="close" size={20} color="#9ca3af" />
      </Pressable>
    </View>
  );
}
