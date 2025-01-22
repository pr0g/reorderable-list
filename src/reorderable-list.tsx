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
  const [justReleasedMouseDelta, setJustReleasedMouseDelta] = useState([0, 0]);
  // const [becomingUnavailableIndex, setBecomingUnavailableIndex] = useState(-1);
  const [justReleasedIndex, setJustReleasedIndex] = useState(-1);
  // const [becomingAvailableIndex, setBecomingAvailableIndex] = useState(-1);
  const [mouseDelta, setMouseDelta] = useState([0, 0]);
  const mouseDownPosition = useRef([0, 0]);
  const ulRef = useRef<HTMLUListElement | null>(null);
  const liRef = useRef<HTMLLIElement | null>(null);
  // const itemHeight = 24 + 4; // calculated from liRef client top/bottom getBoundingClientRect (+ 4px margin)
  const itemWidth = useRef(0);

  useEffect(() => {
    if (justReleasedIndex !== -1) {
      setJustReleasedIndex(-1);
      setJustReleasedMouseDelta([0, 0]);
    }
  }, [justReleasedIndex]);

  useEffect(() => {
    return () => {
      liRef.current = null;
    };
  }, []);

  const getStyle = useCallback(
    (
      // item: string,
      index: number,
      movingIndex: number,
      // becomingAvailableIndex: number,
      justReleasedIndex: number,
      availableIndex: number,
      // mouseDelta: [number, number],
      itemWidth: number
    ) => {
      const theIndex = movingIndex;
      // movingIndex !== -1
      //   ? movingIndex
      //   : becomingAvailableIndex !== -1
      //   ? becomingAvailableIndex
      //   : -1;
      const style: React.CSSProperties = {};
      if (
        /* index === becomingAvailableIndex || */
        index === movingIndex
      ) {
        style.transform = `scale(1.1)`;
        style.position = "relative";
        style.left = `${mouseDelta[0]}px`;
        style.top = `${mouseDelta[1]}px`;
      } else if (index === justReleasedIndex) {
        // console.log("just released");
        // console.log(JSON.stringify(justReleasedMouseDelta));
        style.transform = `translateX(${justReleasedMouseDelta[0]}px) translateY(${justReleasedMouseDelta[1]}px) scale(1.1)`;
      } else if (
        index >= availableIndex &&
        index < theIndex &&
        theIndex !== -1
      ) {
        // style.transform = `translateX(${itemWidth}px)`;
        style.position = "relative";
        style.left = itemWidth;
      } else if (
        index <= availableIndex &&
        index > theIndex &&
        theIndex !== -1
      ) {
        // style.transform = `translateX(${-itemWidth}px)`;
        style.position = "relative";
        style.left = -itemWidth;
      }
      return style;
    },
    [justReleasedMouseDelta, mouseDelta]
  );

  const onPointerDown = useCallback(
    (index: number) => (e: React.PointerEvent<HTMLLIElement>) => {
      setAvailableIndex(index);
      // setBecomingAvailableIndex(index);
      setMovingIndex(index);
      liRef.current = e.currentTarget;
      // note: space-x-2 is 8px (see +8 below)
      itemWidth.current = liRef.current.clientWidth + 8;
      e.currentTarget.setPointerCapture(e.pointerId);
      mouseDownPosition.current = [e.clientX, e.clientY];
    },
    []
  );

  const onPointerUp = useCallback(
    (index: number) => (e: React.PointerEvent<HTMLLIElement>) => {
      // cancel move before animation ends and sets movingIndex
      liRef.current = null;
      if (movingIndex === -1) {
        console.log("pointer up");
        // setBecomingUnavailableIndex(becomingAvailableIndex);
        // setJustReleasedIndex(becomingAvailableIndex);
        setAvailableIndex(-1);
        // setBecomingAvailableIndex(-1);
        e.currentTarget.releasePointerCapture(e.pointerId);
        setJustReleasedMouseDelta([mouseDelta[0], mouseDelta[1]]);
        setMouseDelta([0, 0]);
        return;
      }
      e.currentTarget.releasePointerCapture(e.pointerId);
      // setBecomingUnavailableIndex(availableIndex);
      setJustReleasedIndex(availableIndex);
      ///
      const newItems = [...items];
      const [extracted] = newItems.splice(movingIndex, 1);
      newItems.splice(availableIndex, 0, extracted);
      setItems(newItems);
      ///
      setJustReleasedMouseDelta([
        mouseDelta[0] + (movingIndex - availableIndex) * itemWidth.current,
        mouseDelta[1],
      ]);
      setMovingIndex(-1);
      setAvailableIndex(-1);
      setMouseDelta([0, 0]);

      // if (index === becomingAvailableIndex) {
      // setMovingIndex(index);
      // setBecomingAvailableIndex(-1);
      // }
    },
    [
      availableIndex,
      /* becomingAvailableIndex, */ items,
      mouseDelta,
      movingIndex,
    ]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLLIElement>) => {
      if (/* becomingAvailableIndex !== -1 || */ availableIndex !== -1) {
        requestAnimationFrame(() => {
          setMouseDelta([
            e.clientX - mouseDownPosition.current[0],
            e.clientY - mouseDownPosition.current[1],
          ]);
        });
      }
      if (availableIndex === -1) {
        return;
      }
      console.log("move");
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
    [availableIndex, items.length /* , becomingAvailableIndex */]
  );

  return (
    // outside list
    // max-w-md
    <div className="flex flex-col">
      <ul ref={ulRef} className="flex flex-wrap gap-x-2">
        {items.map((item, index) => {
          return (
            // <Fragment key={`${item}`}>
            <li
              key={item}
              // onTransitionEnd={() => {
              //   // if (index === becomingAvailableIndex) {
              //   //   setMovingIndex(index);
              //   //   setBecomingAvailableIndex(-1);
              //   // }
              //   // if (index === becomingUnavailableIndex) {
              //   //   setBecomingUnavailableIndex(-1);
              //   // }
              // }}
              onPointerDown={onPointerDown(index)}
              onPointerUp={onPointerUp(index)}
              onPointerMove={onPointerMove}
              className={`select-none bg-slate-500 rounded-lg my-1 min-w-24 text-center ${
                index === movingIndex ? "text-red-500 z-50" : "text-black" // transition-transform duration-300
              }`}
              style={getStyle(
                // item,
                index,
                movingIndex,
                // becomingAvailableIndex,
                justReleasedIndex,
                availableIndex,
                // mouseDelta as [number, number],
                itemWidth.current
              )}
            >
              {item}
            </li>
            // </Fragment>
          );
        })}
      </ul>
      <p>Moving index: {movingIndex}</p>
      <p>Available index: {availableIndex}</p>
      {/* <p>Becoming available index: {becomingAvailableIndex}</p> */}
      {/* <p>Becoming unavailable index: {becomingUnavailableIndex}</p> */}
    </div>
  );
}
