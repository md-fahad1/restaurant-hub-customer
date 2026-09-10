import { ApolloProvider } from "@apollo/client/react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { APP_VERSION, LATEST_VERSION_URL } from "../config";
import { CartProvider } from "../context/CartContext";
import "../global.css";
import { client } from "../lib/apollo";

function UpdateBanner() {
  const [updateInfo, setUpdateInfo] = useState<{
    version: string;
    downloadUrl: string;
  } | null>(null);

  useEffect(() => {
    fetch(LATEST_VERSION_URL)
      .then((res) => res.json())
      .then((data) => {
        if (data.version && data.version !== APP_VERSION) {
          setUpdateInfo(data);
        }
      })
      .catch(() => {
        // ইন্টারনেট না থাকলে বা চেক ফেইল করলে চুপচাপ ইগনোর করি
      });
  }, []);

  if (!updateInfo) return null;

  return (
    <View className="flex-row items-center justify-between bg-brand px-4 py-2.5">
      <Text className="flex-1 text-[13px] font-medium text-white">
        A new version ({updateInfo.version}) is available
      </Text>
      <TouchableOpacity onPress={() => Linking.openURL(updateInfo.downloadUrl)}>
        <Text className="text-[13px] font-bold text-white underline">
          Update
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ApolloProvider client={client}>
        <CartProvider>
          <StatusBar style="dark" />
          <UpdateBanner />
          <Stack
            screenOptions={{
              headerShown: true,
              headerShadowVisible: false,
              headerTintColor: "#1a1a1a",
            }}
          />
        </CartProvider>
      </ApolloProvider>
    </SafeAreaProvider>
  );
}
