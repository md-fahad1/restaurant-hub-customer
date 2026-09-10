import { gql } from '@apollo/client';

// ============ Types ============

export interface PublicMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  availability: string;
}

export interface PublicCategory {
  id: string;
  name: string;
  items: PublicMenuItem[];
}

export interface PublicMenuData {
  publicMenu: {
    restaurant: { id: string; name: string; logo: string | null; brandColor: string; currency: string };
    table: { id: string; tableNumber: string; name: string | null } | null;
    categories: PublicCategory[];
  };
}

export interface CreateGuestOrderData {
  createGuestOrder: { orderId: string; orderNumber: string; total: number };
}

export interface TrackGuestOrderData {
  trackGuestOrder: {
    orderNumber: string;
    status: string;
    type: string;
    total: number;
    tableNumber: string | null;
    createdAt: string;
    items: { name: string; quantity: number }[];
    history: { status: string; changedAt: string }[];
    delivery: {
      status: string;
      deliveryAddress: string;
      partnerName: string | null;
      partnerPhone: string | null;
    } | null;
  };
}

// ============ Queries & Mutations ============

export const PUBLIC_MENU_QUERY = gql`
  query PublicMenu($restaurantSlug: String!, $tableId: String) {
    publicMenu(restaurantSlug: $restaurantSlug, tableId: $tableId) {
      restaurant {
        id
        name
        logo
        brandColor
        currency
      }
      table {
        id
        tableNumber
        name
      }
      categories {
        id
        name
        items {
          id
          name
          description
          price
          image
          availability
        }
      }
    }
  }
`;

export const CREATE_GUEST_ORDER_MUTATION = gql`
  mutation CreateGuestOrder($input: CreateGuestOrderInput!) {
    createGuestOrder(input: $input) {
      orderId
      orderNumber
      total
    }
  }
`;

export const TRACK_ORDER_QUERY = gql`
  query TrackGuestOrder($restaurantSlug: String!, $orderNumber: String!, $guestPhone: String!) {
    trackGuestOrder(restaurantSlug: $restaurantSlug, orderNumber: $orderNumber, guestPhone: $guestPhone) {
      orderNumber
      status
      type
      total
      tableNumber
      createdAt
      items {
        name
        quantity
      }
      history {
        status
        changedAt
      }
      delivery {
        status
        deliveryAddress
        partnerName
        partnerPhone
      }
    }
  }
`;