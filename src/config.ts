import Constants from "expo-constants";

// App version ekhon app.json ("version") theke ashe, tai ar manually bodlate hobe na.
// Notun APK banale shudhu app.json ar latest-version.json e version barale hobe.
export const APP_VERSION: string = Constants.expoConfig?.version ?? "1.1.0";

export const LATEST_VERSION_URL =
  "https://raw.githubusercontent.com/md-fahad1/restaurant-hub-customer/main/latest-version.json";

// "1.10.0" > "1.9.0" thikmoto compare korar jonno number diye compare kori
export function isNewerVersion(latest: string, current: string): boolean {
  const a = latest.split(".").map((n) => parseInt(n, 10) || 0);
  const b = current.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}
