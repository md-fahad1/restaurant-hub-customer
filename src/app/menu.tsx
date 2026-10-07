import { ErrorState } from "@/components/ErrorState";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ServerWakingNotice } from "@/components/ServerWakingNotice";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FoodCard } from "../components/FoodCard";
import { ItemDetailModal } from "../components/ItemDetailModal";
import { MenuItemRow } from "../components/MenuItemRow";
import { MenuSkeleton } from "../components/MenuSkeleton";
import { cardShadow, ORDER_TYPES } from "../constants/ui";
import { useCart } from "../context/CartContext";
import { useIsOnline } from "../hooks/use-online";
import { usePublicMenu } from "../hooks/use-public-menu";
import { useSlowLoading } from "../hooks/use-slow-loading";
import { PublicCategory, PublicMenuItem } from "../lib/graphql";

export default function Menu() {
  const router = useRouter();
  const { leaveRestaurant } = useCart();
  const {
    restaurantSlug,
    tableId,
    orderType,
    items,
    addItem,
    itemCount,
    total,
    hydrated,
  } = useCart();
  const [selectedItem, setSelectedItem] = useState<PublicMenuItem | null>(null);
  const [searchText, setSearchText] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  const online = useIsOnline();
  const { data, loading, error, refetch, isStale, savedAt } = usePublicMenu(
    restaurantSlug,
    tableId,
  );
  const slowLoading = useSlowLoading(loading);

  const qtyById = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((l) => (map[l.menuItemId] = l.quantity));
    return map;
  }, [items]);

  const filteredCategories: PublicCategory[] = useMemo(() => {
    const categories = data?.publicMenu.categories ?? [];
    const query = searchText.trim().toLowerCase();
    if (!query) return categories;
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((it: PublicMenuItem) =>
          it.name.toLowerCase().includes(query),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [data, searchText]);

  // Image + in-stock item gula theke featured list
  const featured: PublicMenuItem[] = useMemo(
    () =>
      (data?.publicMenu.categories ?? [])
        .flatMap((c) => c.items)
        .filter((i) => i.image && i.availability !== "OUT_OF_STOCK")
        .slice(0, 8),
    [data],
  );
  // Storage theke cart load hocche — "No restaurant" flash na korar jonno
  if (!hydrated) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <MenuSkeleton />
      </SafeAreaView>
    );
  }

  if (!restaurantSlug) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-white p-6">
        <Ionicons name="qr-code-outline" size={40} color="#9ca3af" />
        <Text className="text-center text-gray-600">
          No restaurant selected yet.
        </Text>
        <TouchableOpacity
          className="rounded-2xl bg-brand px-6 py-3"
          onPress={() => router.replace("/")}
        >
          <Text className="font-semibold text-white">Scan a QR code</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        {slowLoading && <ServerWakingNotice />}
        <MenuSkeleton />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ErrorState
          title="Couldn't load the menu"
          message="Please check your internet connection and try again."
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  const menu = data.publicMenu;
  const currency = menu.restaurant.currency;
  const typeInfo = ORDER_TYPES.find((o) => o.type === orderType)!;
  const spotlight = featured[0];

  function handleChangeRestaurant() {
    const go = () => {
      leaveRestaurant();
      router.replace("/");
    };
    if (itemCount > 0) {
      Alert.alert("Change restaurant?", "Your current cart will be cleared.", [
        { text: "Cancel", style: "cancel" },
        { text: "Change", style: "destructive", onPress: go },
      ]);
    } else {
      go();
    }
  }

  function quickAdd(it: PublicMenuItem) {
    addItem({
      menuItemId: it.id,
      name: it.name,
      price: it.price,
      image: it.image,
    });
  }

  function handleAdd(
    menuItem: PublicMenuItem,
    quantity: number,
    note?: string,
  ) {
    addItem(
      {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        image: menuItem.image,
        note,
      },
      quantity,
    );
  }

  function scrollToCategory(categoryId: string) {
    setActiveCategoryId(categoryId);
    const index = filteredCategories.findIndex((c) => c.id === categoryId);
    if (index >= 0) {
      listRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0,
      });
    }
  }

  const listHeader =
    !searchText && spotlight ? (
      <View>
        {/* Banner */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => setSelectedItem(spotlight)}
          className="mx-4 mt-4 h-44 overflow-hidden rounded-3xl bg-ink"
        >
          <Image
            source={{ uri: spotlight.image! }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View className="absolute inset-0 bg-black/45" />
          <View className="flex-1 justify-between p-4">
            <View className="self-start rounded-full bg-brand px-3 py-1">
              <Text className="text-[11px] font-bold tracking-wide text-white">
                FEATURED
              </Text>
            </View>
            <View>
              <Text
                numberOfLines={2}
                className="text-2xl font-extrabold text-white"
              >
                {spotlight.name}
              </Text>
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-base font-bold text-white">
                  {currency} {spotlight.price}
                </Text>
                <View className="rounded-full bg-white px-4 py-2">
                  <Text className="text-[13px] font-bold text-brand">
                    Order now
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Popular picks */}
        {featured.length > 1 && (
          <View className="mt-6">
            <Text className="mb-3 px-4 text-lg font-extrabold text-ink">
              Popular Picks
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 12,
                gap: 12,
              }}
            >
              {featured.slice(1).map((it) => (
                <FoodCard
                  key={it.id}
                  item={it}
                  currency={currency}
                  onPress={() => setSelectedItem(it)}
                  onAdd={() => quickAdd(it)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    ) : null;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <OfflineBanner
          online={online}
          stale={isStale}
          savedAt={savedAt}
          onRetry={() => refetch()}
        />

        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
          <View className="flex-1 flex-row items-center gap-3">
            {menu.restaurant.logo ? (
              <Image
                source={{ uri: menu.restaurant.logo }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
                contentFit="cover"
              />
            ) : (
              <View className="h-11 w-11 items-center justify-center rounded-full bg-brand">
                <Ionicons name="restaurant" size={20} color="white" />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-[12px] text-gray-400">Welcome to</Text>
              <Text
                numberOfLines={1}
                className="text-lg font-extrabold text-ink"
              >
                {menu.restaurant.name}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            {/* Ei restaurant er age kora order gula */}
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/orders",
                  params: { restaurantSlug: restaurantSlug! },
                })
              }
              className="h-11 w-11 items-center justify-center rounded-full bg-surface"
            >
              <Ionicons name="receipt-outline" size={21} color="#1a1a1a" />
            </TouchableOpacity>

            {/* Cart */}
            <TouchableOpacity
              onPress={() => router.push("/cart")}
              className="h-11 w-11 items-center justify-center rounded-full bg-surface"
            >
              <Ionicons name="bag-handle-outline" size={22} color="#1a1a1a" />
              {itemCount > 0 && (
                <View className="absolute -right-0.5 -top-0.5 h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1">
                  <Text className="text-[10px] font-bold text-white">
                    {itemCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Change restaurant */}
        <TouchableOpacity
          onPress={handleChangeRestaurant}
          className="flex-row items-center gap-1.5 px-4 pb-2"
        >
          <Ionicons name="swap-horizontal" size={14} color="#6b7280" />
          <Text className="text-[12px] font-semibold text-gray-500">
            Not here? Change restaurant
          </Text>
        </TouchableOpacity>

        {/* Order type chip */}
        <View className="flex-row px-4 pb-3">
          <TouchableOpacity
            disabled={!!tableId}
            activeOpacity={0.8}
            onPress={() =>
              router.push({ pathname: "/order-type", params: { change: "1" } })
            }
            className="flex-row items-center gap-1.5 rounded-full bg-cream px-3.5 py-2"
          >
            <Ionicons name={typeInfo.icon} size={15} color="#ea580c" />
            <Text className="text-[13px] font-semibold text-brand">
              {typeInfo.title}
              {menu.table ? ` · Table ${menu.table.tableNumber}` : ""}
            </Text>
            {!tableId && (
              <Ionicons name="chevron-down" size={14} color="#ea580c" />
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="px-4 pb-3">
          <View
            className="flex-row items-center gap-2 rounded-2xl bg-white px-4 py-3"
            style={cardShadow}
          >
            <Ionicons name="search-outline" size={18} color="#9ca3af" />
            <TextInput
              className="flex-1 text-[14px] text-ink"
              placeholder="Search for dishes…"
              placeholderTextColor="#9ca3af"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category chips */}
        {!searchText && (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
              {menu.categories.map((cat) => {
                const active = activeCategoryId
                  ? activeCategoryId === cat.id
                  : cat.id === menu.categories[0]?.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    className={`rounded-full px-5 py-2.5 ${active ? "bg-brand" : "bg-surface"}`}
                    onPress={() => scrollToCategory(cat.id)}
                  >
                    <Text
                      className={`text-[13px] font-semibold ${active ? "text-white" : "text-gray-600"}`}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {filteredCategories.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-2 p-6">
            <Ionicons name="search-outline" size={36} color="#d1d5db" />
            <Text className="text-gray-500">No items match "{searchText}"</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={filteredCategories}
            keyExtractor={(c) => c.id}
            ListHeaderComponent={listHeader}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: itemCount > 0 ? 110 : 24 }}
            onScrollToIndexFailed={() => {}}
            onViewableItemsChanged={({ viewableItems }) => {
              if (viewableItems[0]?.item?.id)
                setActiveCategoryId(viewableItems[0].item.id);
            }}
            viewabilityConfig={{ itemVisiblePercentThreshold: 30 }}
            renderItem={({ item: category }) => (
              <View className="px-4 pt-5">
                <View className="mb-3 flex-row items-baseline justify-between">
                  <Text className="text-lg font-extrabold text-ink">
                    {category.name}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {category.items.length} items
                  </Text>
                </View>
                {category.items.map((menuItem: PublicMenuItem) => (
                  <MenuItemRow
                    key={menuItem.id}
                    item={menuItem}
                    currency={currency}
                    qty={qtyById[menuItem.id] ?? 0}
                    onPress={() => setSelectedItem(menuItem)}
                    onAdd={() => quickAdd(menuItem)}
                  />
                ))}
              </View>
            )}
          />
        )}

        {/* Floating cart bar */}
        {itemCount > 0 && (
          <TouchableOpacity
            className="absolute bottom-5 left-4 right-4 flex-row items-center justify-between rounded-2xl bg-brand px-5 py-4 active:opacity-90"
            style={{
              shadowColor: "#ea580c",
              shadowOpacity: 0.35,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 6,
            }}
            onPress={() => router.push("/cart")}
          >
            <View className="flex-row items-center gap-3">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-white/25">
                <Text className="text-xs font-bold text-white">
                  {itemCount}
                </Text>
              </View>
              <Text className="text-[15px] font-bold text-white">
                View cart
              </Text>
            </View>
            <Text className="text-[15px] font-bold text-white">
              {currency} {total}
            </Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>

      <ItemDetailModal
        item={selectedItem}
        currency={currency}
        onClose={() => setSelectedItem(null)}
        onAdd={handleAdd}
      />
    </SafeAreaView>
  );
}
