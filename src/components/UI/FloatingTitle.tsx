import React from 'react';
import { observer } from 'mobx-react-lite';
import { useMainContext } from '../../hooks/useMainContext';

export const FloatingTitle: React.FC = observer(() => {
  const { configuratorStore } = useMainContext();

  if (!configuratorStore.activeModelName) {
    return null;
  }

  return (
    <div className="floating-title-container">
      <h2 className="floating-title">{configuratorStore.activeModelName}</h2>
    </div>
  );
});
