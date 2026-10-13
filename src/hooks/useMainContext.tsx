import { makeAutoObservable } from "mobx";
import { createContext, useContext } from "react";

class CameraManager {
  cameraRef: any = null;
  constructor() {
    makeAutoObservable(this);
  }
  setCameraRef(ref: any) {
    this.cameraRef = ref;
  }
}

class EnvManager {
  envVisibility: boolean = false;
  envRotation = { x: 0, y: -Math.PI / 6, z: 1.5 };
  envIntensity: number = 1.0;
  environmentTexture: any = null;
  constructor() {
    makeAutoObservable(this);
  }
}

class HosePipe3DManager {
  minX: number = 0;
  maxX: number = 0;
  shadowProps: { position: [number, number, number]; scale: number; far: number } | null = null;
  groupRef: any = null;
  currentModelUrl: string | null = null;
  constructor() {
    makeAutoObservable(this);
  }
  setBounds(minX: number, maxX: number) {
    this.minX = minX;
    this.maxX = maxX;
  }
  setShadowProps(props: { position: [number, number, number]; scale: number; far: number } | null) {
    this.shadowProps = props;
  }
  setGroupRef(ref: any) {
    this.groupRef = ref;
  }
  setCurrentModelUrl(url: string | null) {
    this.currentModelUrl = url;
  }
}

class Design3DManager {
  cameraManager = new CameraManager();
  envManager = new EnvManager();
  hosePipe3DManager = new HosePipe3DManager();
  constructor() {
    makeAutoObservable(this);
  }
}

class ViewManager {
  viewerReady: boolean = false;
  constructor() {
    makeAutoObservable(this);
  }
  setViewerReady() {
    this.viewerReady = true;
  }
}

class StepManager {
  currentStep: number = 1;
  constructor() {
    makeAutoObservable(this);
  }
}

class DesignManager {
  viewManager = new ViewManager();
  stepManager = new StepManager();
  constructor() {
    makeAutoObservable(this);
  }
}

class ConfiguratorStore {
  hoseData: any = null;

  selectedSeriesId: number | null = null;
  selectedBraidId: number | null = null;
  selectedSizeId: number | null = null;

  constructor() {
    makeAutoObservable(this);
    this.fetchHoseData();
  }

  async fetchHoseData() {
    try {
      const res = await fetch("/data/hose.json");
      const data = await res.json();
      this.setHoseData(data);
    } catch (e) {
      console.error("Failed to load hose.json", e);
    }
  }

  setHoseData(data: any) {
    this.hoseData = data;
    // Auto-select first available options on initial load
    if (data && data.hoseSeries?.length > 0) {
      const initialSeries =
        data.hoseSeries.find((s: any) => this.isSeriesAvailable(s)) ||
        data.hoseSeries[0];
      if (initialSeries) {
        this.setSeriesId(initialSeries.id);
      }
    }
  }

  // Model availability helpers
  isSizeAvailable = (size: any): boolean => {
    return Boolean(size?.modelURL && size.modelURL.trim().length > 0);
  };

  isBraidAvailable = (braid: any): boolean => {
    return braid?.sizes?.some((s: any) => this.isSizeAvailable(s)) ?? false;
  };

  isSeriesAvailable = (series: any): boolean => {
    return series?.braids?.some((b: any) => this.isBraidAvailable(b)) ?? false;
  };

  // Cascading setters: auto-load default first available size
  setSeriesId(id: number | null) {
    this.selectedSeriesId = id;
    if (!id) {
      this.selectedBraidId = null;
      this.selectedSizeId = null;
      return;
    }

    const series = this.hoseData?.hoseSeries.find((s: any) => s.id === id);
    const validBraids = series?.braids || [];
    const firstBraid =
      validBraids.find((b: any) => this.isBraidAvailable(b)) || validBraids[0];

    if (firstBraid) {
      this.setBraidId(firstBraid.id);
    } else {
      this.selectedBraidId = null;
      this.selectedSizeId = null;
    }
  }

  setBraidId(id: number | null) {
    this.selectedBraidId = id;
    if (!id) {
      this.selectedSizeId = null;
      return;
    }

    const series = this.currentSeries;
    const braid = series?.braids?.find((b: any) => b.id === id);
    const validSizes = braid?.sizes || [];
    const firstSize =
      validSizes.find((s: any) => this.isSizeAvailable(s)) || validSizes[0];

    if (firstSize) {
      this.setSizeId(firstSize.id);
    } else {
      this.selectedSizeId = null;
    }
  }

  setSizeId(id: number | null) {
    this.selectedSizeId = id;
  }

  resetSelection() {
    this.selectedSeriesId = null;
    this.selectedBraidId = null;
    this.selectedSizeId = null;
  }

  get currentSeries() {
    if (!this.hoseData || !this.selectedSeriesId) return null;
    return (
      this.hoseData.hoseSeries.find((s: any) => s.id === this.selectedSeriesId) ||
      null
    );
  }

  get currentBraid() {
    const series = this.currentSeries;
    if (!series || !this.selectedBraidId) return null;
    return (
      series.braids?.find((b: any) => b.id === this.selectedBraidId) || null
    );
  }

  get currentSize() {
    const braid = this.currentBraid;
    if (!braid || !this.selectedSizeId) return null;
    return (
      braid.sizes?.find((s: any) => s.id === this.selectedSizeId) || null
    );
  }

  get availableSeries() {
    return this.hoseData?.hoseSeries || [];
  }

  get availableBraids() {
    return this.currentSeries?.braids || [];
  }

  get availableSizes() {
    return this.currentBraid?.sizes || [];
  }

  get isConfigurationComplete(): boolean {
    return Boolean(
      this.selectedSeriesId && this.selectedBraidId && this.selectedSizeId,
    );
  }

  get activeModelName() {
    const series = this.currentSeries;
    const braid = this.currentBraid;
    const size = this.currentSize;

    if (series && braid && size) {
      return `${series.name} • ${braid.name} (${size.value})`;
    }
    return "";
  }
}

class FeedbackManager {
  approvedModels: Set<string> = new Set();
  rejectedModels: Set<string> = new Set();

  constructor() {
    makeAutoObservable(this);
  }

  setInitialFeedbackState(approved: string[], rejected: string[]) {
    this.approvedModels = new Set(approved);
    this.rejectedModels = new Set(rejected);
  }

  approveModel(modelName: string) {
    this.approvedModels.add(modelName);
    this.rejectedModels.delete(modelName);
  }

  rejectModel(modelName: string) {
    this.rejectedModels.add(modelName);
    this.approvedModels.delete(modelName);
  }
}

class RootStore {
  design3DManager = new Design3DManager();
  designManager = new DesignManager();
  configuratorStore = new ConfiguratorStore();
  feedbackManager = new FeedbackManager();
  constructor() {
    makeAutoObservable(this);
  }
}

const store = new RootStore();
const MainContext = createContext(store);

// Auto-sync model URL to HosePipe3DManager
import { autorun } from "mobx";
autorun(() => {
  const { configuratorStore, design3DManager } = store;
  if (
    configuratorStore.selectedSeriesId &&
    configuratorStore.selectedBraidId &&
    configuratorStore.selectedSizeId
  ) {
    const size = configuratorStore.currentSize;
    if (size?.modelURL && size.modelURL.trim() !== "") {
      design3DManager.hosePipe3DManager.setCurrentModelUrl(size.modelURL);
      return;
    }
  }
  design3DManager.hosePipe3DManager.setCurrentModelUrl(null);
});

export const useMainContext = () => {
  return useContext(MainContext);
};

export const MainContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <MainContext.Provider value={store}>{children}</MainContext.Provider>;
};
