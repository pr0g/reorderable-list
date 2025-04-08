import { useState, useRef, useCallback, useEffect, memo } from "react";

// helper function to get unscaled rect
const getUnscaledRect = (element: HTMLElement, scale: number) => {
  const rect = element.getBoundingClientRect();

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const unscaledWidth = rect.width / scale;
  const unscaledHeight = rect.height / scale;

  const unscaledLeft = centerX - unscaledWidth / 2;
  const unscaledRight = centerX + unscaledWidth / 2;
  const unscaledTop = centerY - unscaledHeight / 2;
  const unscaledBottom = centerY + unscaledHeight / 2;

  return {
    left: unscaledLeft,
    right: unscaledRight,
    top: unscaledTop,
    bottom: unscaledBottom,
    width: unscaledWidth,
    height: unscaledHeight,
  };
};

export const ReorderableList = memo(function ReorderableList() {
  const [items, setItems] = useState<string[]>([
    "Item 1",
    "Item 2",
    "Item 3",
    "Item 4",
    "Item 5",
    "Item 6",
    "Item 7",
    "Item 8",
    "Item 9",
    "Item 10",
    "Item 11",
    "Item 12",
    "Item 13",
    "Item 14",
    "Item 15",
    "Item 16",
  ]);

  const columns = 3;

  const [movingIndex, setMovingIndex] = useState(-1);
  const [availableIndex, setAvailableIndex] = useState(-1);

  const [justReleasedIndex, setJustReleasedIndex] = useState(-1);
  const [justReleasedMouseDelta, setJustReleasedMouseDelta] = useState([0, 0]);
  const [justPressedIndex, setJustPressedIndex] = useState(-1);

  useEffect(() => {
    if (justReleasedIndex !== -1) {
      setJustReleasedIndex(-1);
    }
  }, [justReleasedIndex]);

  const mouseDownPosition = useRef([0, 0]);
  const [mouseDelta, setMouseDelta] = useState([0, 0]);

  const ulRef = useRef<HTMLUListElement | null>(null);
  const liRef = useRef<HTMLLIElement | null>(null);

  const itemWidth = useRef(0);
  const itemHeight = useRef(0);

  const getStyle = useCallback(
    (
      index: number,
      movingIndex: number,
      pressedIndex: number,
      releasedIndex: number,
      availableIndex: number,
      itemWidth: number,
      itemHeight: number
    ) => {
      const style: React.CSSProperties = {};
      if (index === pressedIndex || index === movingIndex) {
        style.transform = `scale(1.1)`;
        style.position = "relative";
        style.left = `${mouseDelta[0]}px`;
        style.top = `${mouseDelta[1]}px`;
      } else if (index === releasedIndex) {
        style.transform = `translateX(${justReleasedMouseDelta[0]}px) translateY(${justReleasedMouseDelta[1]}px) scale(1.1)`;
      } else if (
        index >= availableIndex &&
        index < movingIndex &&
        movingIndex !== -1
      ) {
        if (index % columns === columns - 1) {
          // handle wrapping down to the bottom left
          style.transform = `translateX(${
            -itemWidth * (columns - 1)
          }px) translateY(${itemHeight}px)`;
        } else {
          // push items forward
          style.transform = `translateX(${itemWidth}px)`;
        }
      } else if (
        index <= availableIndex &&
        index > movingIndex &&
        movingIndex !== -1
      ) {
        if (index % columns === 0) {
          // handle wrapping up and to the top right
          style.transform = `translateX(${
            itemWidth * (columns - 1)
          }px) translateY(${-itemHeight}px)`;
        } else {
          // push items back
          style.transform = `translateX(${-itemWidth}px)`;
        }
      } else if (
        releasedIndex !== -1 &&
        (index <= releasedIndex || index >= releasedIndex)
      ) {
        style.transition = "none";
      }
      return style;
    },
    [mouseDelta, justReleasedMouseDelta]
  );

  const onTransitionEnd = useCallback(
    (index: number) => () => {
      if (index === justPressedIndex) {
        setMovingIndex(index);
        setJustPressedIndex(-1);
      }
    },
    [justPressedIndex]
  );

  const onPointerDown = useCallback(
    (index: number) => (e: React.PointerEvent<HTMLLIElement>) => {
      setAvailableIndex(index);
      setJustPressedIndex(index);
      setJustReleasedMouseDelta([0, 0]);
      setMouseDelta([0, 0]);
      liRef.current = e.currentTarget;
      // note: m-1 is 8px (see +8 below)
      itemWidth.current = liRef.current.clientWidth + 8;
      itemHeight.current = liRef.current.clientHeight + 8;
      e.currentTarget.setPointerCapture(e.pointerId);
      mouseDownPosition.current = [e.clientX, e.clientY];
    },
    []
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLLIElement>) => {
      const deltaX = mouseDelta[0];
      const deltaY = mouseDelta[1];

      liRef.current = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
      if (movingIndex === -1) {
        setJustReleasedIndex(availableIndex);
        setJustReleasedMouseDelta([deltaX, deltaY]);
        setAvailableIndex(-1);
        setJustPressedIndex(-1);
        setMouseDelta([0, 0]);
        return;
      }

      const newItems = [...items];
      const [extracted] = newItems.splice(movingIndex, 1);
      newItems.splice(availableIndex, 0, extracted);
      setItems(newItems);

      const colm = movingIndex % columns;
      const rowm = Math.floor(movingIndex / columns);
      const cola = availableIndex % columns;
      const rowa = Math.floor(availableIndex / columns);
      setJustReleasedMouseDelta([
        deltaX + (colm - cola) * itemWidth.current,
        deltaY + (rowm - rowa) * itemHeight.current,
      ]);
      setJustReleasedIndex(availableIndex);
      setMovingIndex(-1);
      setAvailableIndex(-1);
      setMouseDelta([0, 0]);
    },
    [availableIndex, items, mouseDelta, movingIndex]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLLIElement>) => {
      if (justPressedIndex !== -1 || availableIndex !== -1) {
        setMouseDelta([
          e.clientX - mouseDownPosition.current[0],
          e.clientY - mouseDownPosition.current[1],
        ]);
      }

      if (availableIndex === -1) {
        return;
      }

      const rows = Math.ceil(items.length / columns);
      const availableRow = Math.floor(availableIndex / columns);

      if (liRef.current) {
        // drag left
        const indexBefore = availableIndex - 1;
        const indexBeforeRow = Math.floor(indexBefore / columns);
        if (indexBefore >= 0 && indexBeforeRow === availableRow) {
          const left =
            ulRef.current!.getBoundingClientRect().left +
            (indexBefore % columns) * itemWidth.current;
          if (
            // needed to compensate for scale(1.1)
            getUnscaledRect(liRef.current, 1.1).left <
            left + itemWidth.current / 2
          ) {
            setAvailableIndex(
              (currentAvailableIndex) => currentAvailableIndex - 1
            );
          }
        }

        // drag right
        const indexAfter = availableIndex + 1;
        const indexAfterRow = Math.floor(indexAfter / columns);
        if (indexAfter < items.length && indexAfterRow === availableRow) {
          const left =
            ulRef.current!.getBoundingClientRect().left +
            (indexAfter % columns) * itemWidth.current;
          if (
            // needed to compensate for scale(1.1)
            getUnscaledRect(liRef.current, 1.1).right >=
            left + itemWidth.current / 2
          ) {
            setAvailableIndex(
              (currentAvailableIndex) => currentAvailableIndex + 1
            );
          }
        }

        const nextRow = Math.floor((availableIndex + columns) / columns);
        if (nextRow < rows) {
          const top =
            ulRef.current!.getBoundingClientRect().top +
            nextRow * itemHeight.current;
          if (
            getUnscaledRect(liRef.current, 1.1).bottom >=
            top + itemHeight.current / 2
          ) {
            setAvailableIndex(
              (currentAvailableIndex) => currentAvailableIndex + columns
            );
          }
        }

        const prevRow = Math.floor((availableIndex - columns) / columns);
        if (prevRow >= 0) {
          const top =
            ulRef.current!.getBoundingClientRect().top +
            prevRow * itemHeight.current;
          if (
            getUnscaledRect(liRef.current, 1.1).top <
            top + itemHeight.current / 2
          ) {
            setAvailableIndex(
              (currentAvailableIndex) => currentAvailableIndex - columns
            );
          }
        }
      }
    },
    [availableIndex, items.length, justPressedIndex]
  );

  return (
    <div>
      <ul
        ref={ulRef}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item, index) => {
          return (
            <li
              key={item}
              onTransitionEnd={onTransitionEnd(index)}
              onPointerDown={onPointerDown(index)}
              onPointerUp={onPointerUp}
              onPointerMove={onPointerMove}
              className={`select-none bg-slate-500 rounded-lg m-1 min-w-24 text-center ${
                index === movingIndex
                  ? "text-red-500 z-50"
                  : index === justReleasedIndex
                  ? "text-black z-50"
                  : "transition-transform duration-300"
              }`}
              style={getStyle(
                index,
                movingIndex,
                justPressedIndex,
                justReleasedIndex,
                availableIndex,
                itemWidth.current,
                itemHeight.current
              )}
            >
              {item}
            </li>
          );
        })}
      </ul>
      <p>Moving index: {movingIndex}</p>
      <p>Available index: {availableIndex}</p>
    </div>
  );
});
