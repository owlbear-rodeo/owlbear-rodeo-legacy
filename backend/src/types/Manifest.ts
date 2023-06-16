export type ManifestAsset = {
  id: string;
  owner: string;
};
export type ManifestAssets = Record<string, ManifestAsset>;
export type Manifest = { mapId: string; assets: ManifestAssets };