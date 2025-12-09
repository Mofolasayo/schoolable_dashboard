'use client';

import { useEffect, useState } from 'react';

import { config, type FeatureFlag } from '@/config';

const rawFlags = config.features;

export const getFeatureFlag = (flag: FeatureFlag): boolean => rawFlags[flag];

export const useFeatureFlag = (flag: FeatureFlag) => {
  const [enabled, setEnabled] = useState(() => getFeatureFlag(flag));

  useEffect(() => {
    setEnabled(getFeatureFlag(flag));
  }, [flag]);

  return enabled;
};

export const getEnabledFlags = () => rawFlags;
