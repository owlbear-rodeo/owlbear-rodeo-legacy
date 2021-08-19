export type Asset = {
  file: Uint8Array;
  width: number;
  height: number;
  id: string;
  owner: string;
  mime: string;
};

export type AssetManifestAsset = Pick<Asset, "id" | "owner">;
export type AssetManifestAssets = Record<string, AssetManifestAsset>;
export type AssetManifest = { mapId: string; assets: AssetManifestAssets };
