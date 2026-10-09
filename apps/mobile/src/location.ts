import * as Location from "expo-location";

// One foreground fix, bounded in time. Remove the watch after success, failure or timeout.
export function foregroundFix() {
  return new Promise<Location.LocationObject>((resolve, reject) => {
    let subscription: Location.LocationSubscription | undefined;
    let settled = false;
    const finish = (position?: Location.LocationObject) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription?.remove();
      if (position) resolve(position);
      else
        reject(
          new Error(
            "Could not obtain a current location. Choose a pin on the map instead.",
          ),
        );
    };
    const timer = setTimeout(() => finish(), 15_000);
    void Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 0,
        mayShowUserSettingsDialog: false,
      },
      (position) => finish(position),
      () => finish(),
    ).then(
      (watch) => {
        subscription = watch;
        if (settled) watch.remove();
      },
      () => finish(),
    );
  });
}
