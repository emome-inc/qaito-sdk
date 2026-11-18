
import type {
  MapGeocodeInput,
  MapGeocodeResult,
  MapPostalAddressInput,
  MapPostalAddressResult,
  MapRouteLegsInput,
  MapRouteLegsResult,
} from "../types.js";
import type { SdkTransport } from "../transport.js";

export function createMapNamespace(tx: SdkTransport) {
  return {
    /** 住所 → 位置の候補（一致度の高い順・最大 5 件）POST /map/geocode */
    geocode: (input: MapGeocodeInput) => tx.request<MapGeocodeResult>("POST", "/map/geocode", input),
    /** 郵便番号 → 住所の欄（座標は返さない）POST /map/postal-address */
    postalAddress: (input: MapPostalAddressInput) =>
      tx.request<MapPostalAddressResult>("POST", "/map/postal-address", input),
    /** 区間ごとの車の移動時間（分。位置も時間も保存しない）POST /map/route-legs */
    routeLegs: (input: MapRouteLegsInput) => tx.request<MapRouteLegsResult>("POST", "/map/route-legs", input),
  };
}
