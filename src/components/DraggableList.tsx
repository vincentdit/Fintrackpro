import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, GestureResponderHandlers, PanResponder, View } from 'react-native';

interface DraggableListProps<T extends { id: string }> {
  items: T[];
  itemHeight: number;
  /** Renders a row. Spread `dragHandle` onto the element that should start a drag. */
  renderItem: (item: T, dragHandle: GestureResponderHandlers, dragging: boolean) => React.ReactNode;
  onReorder: (orderedIds: string[]) => void;
}

/**
 * A dependency-free drag-to-reorder list built on PanResponder + Animated.
 *
 * Rows are absolutely positioned by their index (fixed `itemHeight`), and the
 * dragged row is lifted into an overlay that follows the finger. Because the
 * overlay's position is absolute (startIndex*height + dy), reordering the list
 * mid-drag never fights the gesture — the overlay stays under the finger.
 */
export function DraggableList<T extends { id: string }>({
  items,
  itemHeight,
  renderItem,
  onReorder,
}: DraggableListProps<T>) {
  const idsKey = items.map((i) => i.id).join(',');
  const [order, setOrder] = useState<string[]>(items.map((i) => i.id));
  const orderRef = useRef(order);
  orderRef.current = order;

  // Resync when the underlying item set changes (add/remove/merge).
  useEffect(() => {
    const ids = items.map((i) => i.id);
    orderRef.current = ids;
    setOrder(ids);
  }, [idsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [idsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const [dragId, setDragId] = useState<string | null>(null);
  const startIndexRef = useRef(0);
  const dragY = useRef(new Animated.Value(0)).current;

  // One stable PanResponder per id (callbacks read refs, so no stale closures).
  const respondersRef = useRef<Record<string, ReturnType<typeof PanResponder.create>>>({});
  const responderFor = (id: string) => {
    if (!respondersRef.current[id]) {
      respondersRef.current[id] = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
        onPanResponderGrant: () => {
          const idx = orderRef.current.indexOf(id);
          startIndexRef.current = idx;
          dragY.setValue(idx * itemHeight);
          setDragId(id);
        },
        onPanResponderMove: (_e, g) => {
          const y = startIndexRef.current * itemHeight + g.dy;
          dragY.setValue(y);
          const target = Math.max(0, Math.min(orderRef.current.length - 1, Math.round(y / itemHeight)));
          const cur = orderRef.current.indexOf(id);
          if (target !== cur) {
            const next = [...orderRef.current];
            next.splice(cur, 1);
            next.splice(target, 0, id);
            orderRef.current = next;
            setOrder(next);
          }
        },
        onPanResponderRelease: () => {
          setDragId(null);
          onReorder(orderRef.current);
        },
        onPanResponderTerminate: () => setDragId(null),
      });
    }
    return respondersRef.current[id]!;
  };

  return (
    <View style={{ height: itemHeight * order.length }}>
      {order.map((id, index) => {
        const item = byId.get(id);
        if (!item) return null;
        const handlers = responderFor(id).panHandlers;
        if (id === dragId) {
          return (
            <Animated.View
              key={id}
              style={{ position: 'absolute', left: 0, right: 0, height: itemHeight, top: dragY, zIndex: 20, elevation: 6 }}
            >
              {renderItem(item, handlers, true)}
            </Animated.View>
          );
        }
        return (
          <View key={id} style={{ position: 'absolute', left: 0, right: 0, height: itemHeight, top: index * itemHeight }}>
            {renderItem(item, handlers, false)}
          </View>
        );
      })}
    </View>
  );
}
