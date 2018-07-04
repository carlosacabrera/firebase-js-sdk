import { database } from 'firebase';
import { Observable } from 'rxjs';
import { map, delay, share } from 'rxjs/operators';
import { ListenEvent, SnapshotPrevKey } from './interfaces';

/**
 * Create an observable from a Database Reference or Database Query.
 * @param ref Database Reference
 * @param event Listen event type ('value', 'added', 'changed', 'removed', 'moved')
 */
export function fromRef(
  ref: database.Query,
  event: ListenEvent,
  listenType = 'on'
): Observable<SnapshotPrevKey> {
  return new Observable<SnapshotPrevKey>(subscriber => {
    const fn = ref[listenType](
      event,
      (snapshot, prevKey) => {
        subscriber.next({ snapshot, prevKey, event });
        if (listenType == 'once') {
          subscriber.complete();
        }
      },
      subscriber.error.bind(subscriber)
    );
    if (listenType == 'on') {
      return {
        unsubscribe() {
          ref.off(event, fn);
        }
      };
    } else {
      return { unsubscribe() {} };
    }
  }).pipe(
    // Ensures subscribe on observable is async. This handles
    // a quirk in the SDK where on/once callbacks can happen
    // synchronously.
    delay(0),
    share()
  );
}

export const unwrap = () =>
  map((payload: SnapshotPrevKey) => {
    const { snapshot, prevKey } = payload;
    let key: string | null = null;
    if (snapshot.exists()) {
      key = snapshot.key;
    }
    return { type: event, payload: snapshot, prevKey, key };
  });
