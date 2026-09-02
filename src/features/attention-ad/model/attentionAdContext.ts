import { createContext, useContext } from 'react';

export type ShowAdvertisement = () => void;

export const AttentionAdContext = createContext<ShowAdvertisement | null>(null);

export function useAttentionAd() {
  const showAdvertisement = useContext(AttentionAdContext);

  if (!showAdvertisement) {
    throw new Error('useAttentionAd must be used within AttentionAdExperience');
  }

  return showAdvertisement;
}
