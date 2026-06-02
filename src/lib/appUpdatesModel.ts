export function shouldRunStartupUpdateCheck({
  autoUpdateChecksEnabled,
  hasCheckedThisLaunch,
  isTauriRuntime,
}: {
  autoUpdateChecksEnabled: boolean;
  hasCheckedThisLaunch: boolean;
  isTauriRuntime: boolean;
}) {
  return isTauriRuntime && autoUpdateChecksEnabled && !hasCheckedThisLaunch;
}

export type AppUpdateAsset = {
  name?: string;
  browser_download_url?: string;
};

export type AppUpdateInstallerAssets = {
  assetName: string;
  downloadUrl: string;
  checksumUrl: string;
};

export function selectInstallerAssets(
  assets: AppUpdateAsset[] | undefined,
  targetTriple: string,
): AppUpdateInstallerAssets | null {
  const installer = assets?.find((asset) => {
    const name = asset.name ?? "";
    return name.endsWith(`-${targetTriple}-setup.exe`) && Boolean(asset.browser_download_url);
  });
  if (!installer?.name || !installer.browser_download_url) {
    return null;
  }

  const checksumName = `${installer.name}.sha256`;
  const checksum = assets?.find(
    (asset) => asset.name === checksumName && Boolean(asset.browser_download_url),
  );
  if (!checksum?.browser_download_url) {
    return null;
  }

  return {
    assetName: installer.name,
    downloadUrl: installer.browser_download_url,
    checksumUrl: checksum.browser_download_url,
  };
}
