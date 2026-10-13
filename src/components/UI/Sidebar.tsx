import React from "react";
import { observer } from "mobx-react-lite";
import { useMainContext } from "../../hooks/useMainContext";

export const Sidebar: React.FC = observer(() => {
  const { configuratorStore } = useMainContext();
  const data = configuratorStore.hoseData;

  if (!data) {
    return (
      <aside className="sidebar">
        <h3 className="sidebar-title">Hose Configurator</h3>
        <p className="sidebar-loading">Loading catalog data...</p>
      </aside>
    );
  }

  const {
    availableSeries,
    availableBraids,
    availableSizes,
    selectedSeriesId,
    selectedBraidId,
    selectedSizeId,
    isSeriesAvailable,
    isBraidAvailable,
    isSizeAvailable,
  } = configuratorStore;

  const handleSeriesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    configuratorStore.setSeriesId(val ? Number(val) : null);
  };

  const handleBraidChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    configuratorStore.setBraidId(val ? Number(val) : null);
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    configuratorStore.setSizeId(val ? Number(val) : null);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3 className="sidebar-title">Hose Configurator</h3>
        <p className="sidebar-subtitle">
          Configure category, braid, and size to view 3D pipe.
        </p>
      </div>

      <div className="config-form">
        {/* DROPDOWN 1: CATEGORY */}
        <div className="form-group">
          <label htmlFor="series-select" className="form-label">
            1. Category
          </label>
          <div className="select-wrapper">
            <select
              id="series-select"
              className="config-select"
              value={selectedSeriesId ?? ""}
              onChange={handleSeriesChange}
            >
              <option value="">Select Category...</option>
              {availableSeries.map((series: any) => {
                const available = isSeriesAvailable(series);
                return (
                  <option
                    key={series.id}
                    value={series.id}
                    disabled={!available}
                  >
                    {series.name} {!available ? "(Unavailable)" : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* DROPDOWN 2: BRAID */}
        <div className="form-group">
          <label htmlFor="braid-select" className="form-label">
            2. Braid Type
          </label>
          <div className="select-wrapper">
            <select
              id="braid-select"
              className="config-select"
              value={selectedBraidId ?? ""}
              onChange={handleBraidChange}
              disabled={!selectedSeriesId}
            >
              <option value="">
                {!selectedSeriesId ? "Select Category first" : "Select Braid..."}
              </option>
              {availableBraids.map((braid: any) => {
                const available = isBraidAvailable(braid);
                return (
                  <option
                    key={braid.id}
                    value={braid.id}
                    disabled={!available}
                  >
                    {braid.name} {!available ? "(Unavailable)" : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* DROPDOWN 3: SIZE */}
        <div className="form-group">
          <label htmlFor="size-select" className="form-label">
            3. Braid Size
          </label>
          <div className="select-wrapper">
            <select
              id="size-select"
              className="config-select"
              value={selectedSizeId ?? ""}
              onChange={handleSizeChange}
              disabled={!selectedBraidId}
            >
              <option value="">
                {!selectedBraidId ? "Select Braid first" : "Select Size..."}
              </option>
              {availableSizes.map((size: any) => {
                const available = isSizeAvailable(size);
                return (
                  <option
                    key={size.id}
                    value={size.id}
                    disabled={!available}
                  >
                    Dash {size.value} {!available ? "(No Model)" : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
});
