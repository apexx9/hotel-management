"use client";

import { useEffect } from "react";
import SettingsService from "@/services/settings.service";
import { setCurrencyCache } from "@/utils/currency";

export default function CurrencyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    let isActive = true;

    SettingsService()
      .getSettings()
      .then((settings) => {
        if (isActive && settings.currency) {
          setCurrencyCache(settings.currency);
        }
      })
      .catch(() => {
        return;
      });

    return () => {
      isActive = false;
    };
  }, []);

  return <>{children}</>;
}