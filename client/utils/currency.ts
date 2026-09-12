"use client";

import { useSyncExternalStore } from "react";

let currencyCode = "GHS";

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function getCurrency() {
  return currencyCode;
}

export function setCurrencyCache(currency: string) {
  if (currency && currency !== currencyCode) {
    currencyCode = currency;
    emitChange();
  }
}

export function useCurrency() {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
      };
    },
    getCurrency,
    getCurrency,
  );
}