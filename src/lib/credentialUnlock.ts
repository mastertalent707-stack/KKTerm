export const CREDENTIAL_UNLOCK_REQUIRED_EVENT = "kkterm:credential-unlock-required";

export type CredentialUnlockRequestDetail = {
  complete: (unlocked: boolean) => void;
};

export function isCredentialUnlockRequiredError(error: unknown) {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes("kkterm_secret_store_password is required") ||
    message.includes("encrypted sqlite secret store has not been set up") ||
    message.includes("encrypted sqlite secret store is locked") ||
    message.includes("could not decrypt encrypted sqlite secret")
  );
}

export function createCredentialUnlockRequest(
  dispatch: (detail: CredentialUnlockRequestDetail) => void,
) {
  return new Promise<boolean>((resolve) => dispatch({ complete: resolve }));
}

export function notifyCredentialUnlockRequired() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(CREDENTIAL_UNLOCK_REQUIRED_EVENT));
}

export function requestCredentialUnlock() {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }
  return createCredentialUnlockRequest((detail) => {
    window.dispatchEvent(
      new CustomEvent<CredentialUnlockRequestDetail>(CREDENTIAL_UNLOCK_REQUIRED_EVENT, {
        detail,
      }),
    );
  });
}
