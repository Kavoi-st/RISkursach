import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useCartStore } from '../store/cartStore';
import { createOrder } from '../api/ordersApi';
import { loadGoogleMapsPlaces } from '../utils/loadGoogleMaps';

export const CheckoutPage: React.FC = () => {
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const total = useCartStore((s) => s.total());
  const navigate = useNavigate();

  const [country, setCountry] = useState('Беларусь');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [zip, setZip] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const cityRef = useRef<HTMLInputElement | null>(null);
  const streetRef = useRef<HTMLInputElement | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const mapsKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? '';

  const isEmpty = items.length === 0;

  useEffect(() => {
    if (!mapsKey) return;
    let cityAuto: any;
    let streetAuto: any;

    void (async () => {
      try {
        await loadGoogleMapsPlaces({ apiKey: mapsKey });
        const google = (window as any).google;
        if (!google?.maps?.places) return;

        if (cityRef.current) {
          cityAuto = new google.maps.places.Autocomplete(cityRef.current, {
            types: ['(cities)'],
            componentRestrictions: { country: 'by' }
          });
          cityAuto.addListener('place_changed', () => {
            const place = cityAuto.getPlace();
            const name = place?.name;
            if (typeof name === 'string') setCity(name);
          });
        }

        if (streetRef.current) {
          streetAuto = new google.maps.places.Autocomplete(streetRef.current, {
            types: ['address'],
            componentRestrictions: { country: 'by' }
          });
          streetAuto.addListener('place_changed', () => {
            const place = streetAuto.getPlace();
            const comps: any[] = place?.address_components ?? [];
            const byType = (t: string) =>
              comps.find((c) => Array.isArray(c.types) && c.types.includes(t));

            const route = byType('route')?.long_name;
            const number = byType('street_number')?.long_name;
            const locality =
              byType('locality')?.long_name ||
              byType('administrative_area_level_2')?.long_name;

            if (locality) setCity(locality);
            const line = [route, number].filter(Boolean).join(' ');
            if (line) setStreet(line);

            const loc = place?.geometry?.location;
            const lat = typeof loc?.lat === 'function' ? loc.lat() : null;
            const lng = typeof loc?.lng === 'function' ? loc.lng() : null;
            if (typeof lat === 'number' && typeof lng === 'number') {
              setCoords({ lat, lng });
            }
          });
        }
      } catch {
        setMapsError('Не удалось загрузить Google Maps');
      }
    })();

    return () => {
      cityAuto = null;
      streetAuto = null;
    };
  }, [mapsKey]);

  useEffect(() => {
    if (!mapsKey) return;
    const google = (window as any).google;
    if (!google?.maps) return;
    if (!mapDivRef.current) return;

    if (!mapRef.current) {
      mapRef.current = new google.maps.Map(mapDivRef.current, {
        center: { lat: 53.9, lng: 27.5667 },
        zoom: 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });
      markerRef.current = new google.maps.Marker({
        map: mapRef.current
      });
    }

    if (coords) {
      mapRef.current.setCenter(coords);
      mapRef.current.setZoom(15);
      markerRef.current.setPosition(coords);
      markerRef.current.setVisible(true);
    } else {
      markerRef.current?.setVisible(false);
    }
  }, [coords, mapsKey]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmpty) return;
    setError(null);
    setPending(true);
    const productIds = items.flatMap((i) =>
      Array.from({ length: i.quantity }, () => i.productId)
    );
    try {
      await createOrder({
        productIds,
        shippingCountry: country.trim() || 'Беларусь',
        shippingCity: city.trim() || '—',
        shippingStreet: street.trim() || '—',
        shippingZip: zip.trim() || '000000'
      });
      clear();
      navigate('/orders');
    } catch (err) {
      if (isAxiosError(err)) {
        const d = err.response?.data as { message?: string } | undefined;
        setError(d?.message ?? 'Не удалось оформить заказ');
      } else {
        setError('Ошибка сети');
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900">Оформление заказа</h1>

      {isEmpty ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-600">
          Корзина пуста.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[2fr,1.3fr]">
          <form
            onSubmit={onSubmit}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4"
          >
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            {mapsKey && mapsError && (
              <div className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                {mapsError}
              </div>
            )}
            {!mapsKey && (
              <div className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                Google Maps отключен: не задана `VITE_GOOGLE_MAPS_API_KEY`
              </div>
            )}
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Адрес доставки</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="Страна"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
              <input
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="Город"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                ref={cityRef}
                required
              />
            </div>
            <input
              className="border rounded-md px-3 py-2 text-sm w-full"
              placeholder="Улица, дом, квартира"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              ref={streetRef}
              required
            />
            <input
              className="border rounded-md px-3 py-2 text-sm w-full max-w-xs"
              placeholder="Индекс"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
            />

            <button
              type="submit"
              disabled={pending}
              className="mt-4 w-full px-4 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {pending ? 'Оформление…' : 'Подтвердить заказ'}
            </button>
          </form>

          <aside className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Итого</h2>
            {items.map((i) => (
              <div key={i.productId} className="text-sm text-gray-600 flex justify-between">
                <span>
                  {i.name} × {i.quantity}
                </span>
                <span>
                  {(i.price * i.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="border-t pt-3 mt-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">К оплате</span>
              <span className="text-xl font-semibold text-blue-600">
                {total.toFixed(2)}
              </span>
            </div>

            {mapsKey && !mapsError && (
              <div className="pt-3 mt-2 border-t">
                <div className="text-sm font-medium text-gray-700 mb-2">Карта</div>
                <div
                  ref={mapDivRef}
                  className="w-full h-[220px] rounded-lg border border-gray-100"
                />
                <div className="mt-2 text-xs text-gray-500">
                  Маркер появится после выбора адреса из подсказки.
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};
