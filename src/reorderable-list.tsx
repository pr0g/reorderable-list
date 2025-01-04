import { useState, Fragment, useRef, useEffect, useCallback } from "react";

export function ReorderableList() {
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
  ]);
  const [movingIndex, setMovingIndex] = useState(-1);
  const [availableIndex, setAvailableIndex] = useState(-1);
  const [justChangedIndex, setJustChangedIndex] = useState(-1);
  const [justChangedMouseDelta, setJustChangedMouseDelta] = useState([0, 0]);
  const [justChangedHoverIndex, setJustChangedHoverIndex] = useState(-1);
  const [mouseDelta, setMouseDelta] = useState([0, 0]);
  const mouseDownPosition = useRef([0, 0]);
  const ulRef = useRef<HTMLUListElement | null>(null);
  const liRef = useRef<HTMLLIElement | null>(null);
  // const itemHeight = 24 + 4; // calculated from liRef client top/bottom getBoundingClientRect (+ 4px margin)
  const itemWidth = useRef(0);

  useEffect(() => {
    if (justChangedIndex !== -1) {
      setJustChangedIndex(-1);
      setJustChangedMouseDelta([0, 0]);
    }
  }, [justChangedIndex]);

  useEffect(() => {
    return () => {
      liRef.current = null;
    };
  }, []);

  const getStyle = useCallback(
    (
      index: number,
      movingIndex: number,
      hoveredIndex: number,
      justChangedIndex: number,
      availableIndex: number,
      mouseDelta: [number, number],
      itemWidth: number
    ) => {
      const theIndex =
        movingIndex !== -1
          ? movingIndex
          : justChangedHoverIndex !== -1
          ? justChangedHoverIndex
          : -1;
      const style: React.CSSProperties = {};
      if (index === hoveredIndex || index === movingIndex) {
        style.transform = `scale(1.1)`;
        style.position = "relative";
        style.left = `${mouseDelta[0]}px`;
        style.top = `${mouseDelta[1]}px`;
      } else if (index === justChangedIndex) {
        style.transform = `translateX(${justChangedMouseDelta[0]}px) translateY(${justChangedMouseDelta[1]}px) scale(1.1)`;
      } else if (index >= availableIndex && index < theIndex) {
        style.transform = `translateX(${itemWidth}px)`;
      } else if (index <= availableIndex && index > theIndex) {
        style.transform = `translateX(${-itemWidth}px)`;
      }
      return style;
    },
    [justChangedHoverIndex, justChangedMouseDelta]
  );

  const onPointerDown = useCallback(
    (index: number, e: React.PointerEvent<HTMLLIElement>) => {
      setAvailableIndex(index);
      setJustChangedHoverIndex(index);
      liRef.current = e.currentTarget;
      // note: space-x-2 is 8px (see +8 below)
      itemWidth.current = liRef.current.clientWidth + 8;
      e.currentTarget.setPointerCapture(e.pointerId);
      mouseDownPosition.current = [e.clientX, e.clientY];
    },
    []
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLLIElement>) => {
      // cancel move before animation ends and sets movingIndex
      if (movingIndex === -1) {
        setAvailableIndex(-1);
        setJustChangedHoverIndex(-1);
        e.currentTarget.releasePointerCapture(e.pointerId);
        setMouseDelta([0, 0]);
        return;
      }
      e.currentTarget.releasePointerCapture(e.pointerId);
      const newItems = [...items];
      const [extracted] = newItems.splice(movingIndex, 1);
      newItems.splice(availableIndex, 0, extracted);
      setItems(newItems);
      setJustChangedIndex(availableIndex);
      setJustChangedMouseDelta([
        mouseDelta[0] + (movingIndex - availableIndex) * itemWidth.current,
        mouseDelta[1],
      ]);
      setMovingIndex(-1);
      setAvailableIndex(-1);
      setMouseDelta([0, 0]);
      liRef.current = null;
    },
    [availableIndex, items, mouseDelta, movingIndex]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLLIElement>) => {
      if (justChangedHoverIndex !== -1 || availableIndex !== -1) {
        setMouseDelta([
          e.clientX - mouseDownPosition.current[0],
          e.clientY - mouseDownPosition.current[1],
        ]);
      }
      if (availableIndex === -1) {
        return;
      }
      const indexBefore = availableIndex - 1;
      if (indexBefore >= 0) {
        if (liRef.current) {
          const left =
            ulRef.current!.getBoundingClientRect().left +
            indexBefore * itemWidth.current;
          if (
            liRef.current.getBoundingClientRect().left <
            left + itemWidth.current / 2
          ) {
            setAvailableIndex(
              (currentAvailableIndex) => currentAvailableIndex - 1
            );
          }
        }
      }

      const indexAfter = availableIndex + 1;
      if (indexAfter < items.length) {
        if (liRef.current) {
          const left =
            ulRef.current!.getBoundingClientRect().left +
            indexAfter * itemWidth.current;
          if (
            liRef.current.getBoundingClientRect().right >=
            left + itemWidth.current / 2
          ) {
            setAvailableIndex(
              (currentAvailableIndex) => currentAvailableIndex + 1
            );
          }
        }
      }
    },
    [availableIndex, items.length, justChangedHoverIndex]
  );

  return (
    // outside list
    // max-w-md
    <div className="flex flex-col">
      <ul ref={ulRef} className="flex flex-wrap gap-x-2">
        {items.map((item, index) => {
          return (
            <Fragment key={`${index}-${item}`}>
              <li
                key={`${index}-${item}`}
                onTransitionEnd={() => {
                  if (index === justChangedHoverIndex) {
                    setMovingIndex(index);
                    setJustChangedHoverIndex(-1);
                  }
                }}
                onPointerDown={(e) => {
                  onPointerDown(index, e);
                }}
                onPointerUp={onPointerUp}
                onPointerMove={onPointerMove}
                className={`select-none bg-slate-500 rounded-lg my-1 min-w-24 text-center ${
                  index === movingIndex || index === justChangedIndex
                    ? "text-red-500 z-50"
                    : "text-black transition-transform duration-300"
                }`}
                style={getStyle(
                  index,
                  movingIndex,
                  justChangedHoverIndex,
                  justChangedIndex,
                  availableIndex,
                  mouseDelta as [number, number],
                  itemWidth.current
                )}
              >
                {item}
              </li>
            </Fragment>
          );
        })}
      </ul>
      <p>Moving index: {movingIndex}</p>
    </div>
  );
}
