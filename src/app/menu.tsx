import { useQuery } from "@apollo/client/react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedAddButton } from "../components/AnimatedAddButton";
import { ItemDetailModal } from "../components/ItemDetailModal";
import { MenuSkeleton } from "../components/MenuSkeleton";
import { useCart } from "../context/CartContext";
import {
  PUBLIC_MENU_QUERY,
  PublicCategory,
  PublicMenuData,
  PublicMenuItem,
} from "../lib/graphql";

export default function Menu() {
  const router = useRouter();
  const { restaurantSlug, tableId, addItem, itemCount, total } = useCart();
  const [selectedItem, setSelectedItem] = useState<PublicMenuItem | null>(null);
  const [searchText, setSearchText] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const listRef = useRef<FlatList>(null);

  const { data, loading, error } = useQuery<PublicMenuData>(PUBLIC_MENU_QUERY, {
    variables: {
      restaurantSlug: restaurantSlug ?? "",
      tableId: tableId ?? undefined,
    },
    skip: !restaurantSlug,
  });

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

  if (!restaurantSlug) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-white p-6">
        <Ionicons name="qr-code-outline" size={40} color="#9ca3af" />
        <Text className="text-center text-gray-600">
          No restaurant selected yet.
        </Text>
        <TouchableOpacity
          className="rounded-xl bg-brand px-5 py-3"
          onPress={() => router.replace("/")}
        >
          <Text className="font-semibold text-white">Scan a QR code</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
        <MenuSkeleton />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-white p-6">
        <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
        <Text className="text-center text-gray-600">
          Could not load the menu. Please try again.
        </Text>
      </View>
    );
  }

  const menu = data.publicMenu;

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

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <View className="border-b border-gray-100 px-4 py-3">
        <Text className="text-xl font-extrabold text-ink">
          {menu.restaurant.name}
        </Text>
        {menu.table && (
          <View className="mt-1.5 flex-row items-center gap-1 self-start rounded-full bg-amber-100 px-2.5 py-1">
            <Ionicons name="location-outline" size={13} color="#92400e" />
            <Text className="text-xs font-semibold text-amber-800">
              Table {menu.table.tableNumber}
            </Text>
          </View>
        )}
      </View>

      {/* Search bar */}
      <View className="flex-row items-center gap-2 border-b border-gray-100 px-4 py-2.5">
        <View className="flex-1 flex-row items-center gap-2 rounded-xl bg-gray-100 px-3 py-2.5">
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            className="flex-1 text-[14px] text-ink"
            placeholder="Search menu…"
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

      {/* Sticky category tabs — সার্চ করার সময় হাইড, কারণ তখন ফিল্টার হওয়া লিস্ট দেখানো হয় */}
      {!searchText && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-b border-gray-100 px-4 py-2.5"
          contentContainerStyle={{ gap: 8 }}
        >
          {menu.categories.map((cat) => {
            const active = activeCategoryId
              ? activeCategoryId === cat.id
              : cat.id === menu.categories[0]?.id;
            return (
              <TouchableOpacity
                key={cat.id}
                className={`rounded-full px-4 py-2 ${active ? "bg-ink" : "bg-gray-100"}`}
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
          contentContainerStyle={{ paddingBottom: itemCount > 0 ? 110 : 24 }}
          onScrollToIndexFailed={() => {}}
          onViewableItemsChanged={({ viewableItems }) => {
            if (viewableItems[0]?.item?.id)
              setActiveCategoryId(viewableItems[0].item.id);
          }}
          viewabilityConfig={{ itemVisiblePercentThreshold: 30 }}
          renderItem={({ item: category }) => (
            <View className="px-4 pt-5">
              <Text className="mb-3 text-lg font-bold text-ink">
                {category.name}
              </Text>
              {category.items.map((menuItem: PublicMenuItem) => {
                const outOfStock = menuItem.availability === "OUT_OF_STOCK";
                return (
                  <TouchableOpacity
                    key={menuItem.id}
                    activeOpacity={0.7}
                    className="mb-3 flex-row items-center gap-3 rounded-2xl border border-gray-100 p-3"
                    onPress={() => setSelectedItem(menuItem)}
                  >
                    {menuItem.image ? (
                      <Image
                        source={{ uri: menuItem.image }}
                        style={{ width: 64, height: 64, borderRadius: 12 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="h-16 w-16 items-center justify-center rounded-xl bg-gray-100">
                        <Ionicons
                          name="fast-food-outline"
                          size={24}
                          color="#9ca3af"
                        />
                      </View>
                    )}

                    <View className="flex-1">
                      <Text
                        className="text-[15px] font-semibold text-ink"
                        numberOfLines={1}
                      >
                        {menuItem.name}
                      </Text>
                      {menuItem.description ? (
                        <Text
                          className="mt-0.5 text-xs text-gray-500"
                          numberOfLines={2}
                        >
                          {menuItem.description}
                        </Text>
                      ) : null}
                      <Text className="mt-1 text-sm font-bold text-brand">
                        {menu.restaurant.currency} {menuItem.price}
                      </Text>
                    </View>

                    <AnimatedAddButton
                      disabled={outOfStock}
                      onPress={() =>
                        addItem({
                          menuItemId: menuItem.id,
                          name: menuItem.name,
                          price: menuItem.price,
                          image: menuItem.image,
                        })
                      }
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
      )}

      {itemCount > 0 && (
        <TouchableOpacity
          className="absolute bottom-5 left-4 right-4 flex-row items-center justify-between rounded-2xl bg-brand px-5 py-4 shadow-lg active:opacity-90"
          onPress={() => router.push("/cart")}
        >
          <View className="flex-row items-center gap-2">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-white/25">
              <Text className="text-xs font-bold text-white">{itemCount}</Text>
            </View>
            <Text className="text-[15px] font-bold text-white">View cart</Text>
          </View>
          <Text className="text-[15px] font-bold text-white">
            {menu.restaurant.currency} {total}
          </Text>
        </TouchableOpacity>
      )}

      <ItemDetailModal
        item={selectedItem}
        currency={menu.restaurant.currency}
        onClose={() => setSelectedItem(null)}
        onAdd={handleAdd}
      />
    </SafeAreaView>
  );
}
