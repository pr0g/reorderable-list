import { useState, Fragment, useRef, useEffect } from "react";

export function ReorderableList() {
  const [items] = useState<string[]>([
    "Item 1",
    "Item 2",
    "Item 3",
    "Item 4",
    "Item 5",
    "Item 6",
    "Item 7",
    "Item 8",
  ]);

  const [movingIndex, setMovingIndex] = useState(-1);
  const [availableIndex, setAvailableIndex] = useState(-1);

  const [justChangedIndex, setJustChangedIndex] = useState(-1);
  const [justChangedMouseDelta, setJustChangedMouseDelta] = useState(0);
  const [justChangedHoverIndex, setJustChangedHoverIndex] = useState(-1);

  useEffect(() => {
    if (justChangedIndex !== -1) {
      setJustChangedIndex(-1);
      setJustChangedMouseDelta(0);
    }
  }, [justChangedIndex]);

  const mouseDownVerticalPosition = useRef(0);
  const [mouseDelta, setMouseDelta] = useState(0);

  const ulRef = useRef<HTMLUListElement | null>(null);
  const liRef = useRef<HTMLLIElement | null>(null);

  // const itemHeight = 24 + 4; // calculated from liRef client top/bottom getBoundingClientRect (+ 4px margin)
  const itemWidth = 69.2;

  if (liRef.current !== null) {
    console.log(
      `width ${
        liRef.current?.getBoundingClientRect().right -
        liRef.current?.getBoundingClientRect().left
      }`
    );
  }

  const getStyle = (
    index: number,
    movingIndex: number,
    hoveredIndex: number,
    justChangedIndex: number,
    availableIndex: number,
    mouseDelta: number,
    itemWidth: number
  ) => {
    const theIndex =
      movingIndex !== -1
        ? movingIndex
        : justChangedHoverIndex !== -1
        ? justChangedHoverIndex
        : -1;
    const style: React.CSSProperties = {};
    if (index === hoveredIndex) {
      style.transform = `scale(1.1)`;
      style.position = "relative";
      style.left = `${mouseDelta}px`;
    } else if (index === justChangedIndex) {
      style.transform = `translateX(${justChangedMouseDelta}px) scale(1.1)`;
    } else if (index === movingIndex) {
      style.transform = `scale(1.1)`;
      style.position = "relative";
      style.left = `${mouseDelta}px`;
    } else if (index >= availableIndex && index < theIndex) {
      style.transform = `translateX(${itemWidth}px)`;
    } else if (index <= availableIndex && index > theIndex) {
      style.transform = `translateX(${-itemWidth}px)`;
    }
    return style;
  };

  return (
    <div className="flex flex-col min-w-[300px]">
      <ul ref={ulRef} className="flex flex-wrap space-x-2">
        {items.map((item, index) => {
          return (
            <Fragment key={index}>
              <li
                key={item}
                onTransitionEnd={() => {
                  if (index === justChangedHoverIndex) {
                    setMovingIndex(index);
                    setJustChangedHoverIndex(-1);
                  }
                }}
                onPointerDown={(e) => {
                  setAvailableIndex(index);
                  setJustChangedHoverIndex(index);
                  liRef.current = e.currentTarget;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  mouseDownVerticalPosition.current = e.clientX;
                }}
                onPointerUp={(e) => {
                  // cancel move before animation ends and sets movingIndex
                  if (movingIndex === -1) {
                    setAvailableIndex(-1);
                    setJustChangedHoverIndex(-1);
                    e.currentTarget.releasePointerCapture(e.pointerId);
                    setMouseDelta(0);
                    return;
                  }
                  const [extracted] = items.splice(movingIndex, 1);
                  items.splice(availableIndex, 0, extracted);
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  setJustChangedIndex(availableIndex);
                  setJustChangedMouseDelta(
                    mouseDelta + (movingIndex - availableIndex) * itemWidth
                  );
                  setMovingIndex(-1);
                  setAvailableIndex(-1);
                  setMouseDelta(0);
                }}
                onPointerMove={(e) => {
                  if (justChangedHoverIndex !== -1 || availableIndex !== -1) {
                    setMouseDelta(
                      e.clientX - mouseDownVerticalPosition.current
                    );
                  }
                  if (availableIndex === -1) {
                    return;
                  }

                  const indexBefore = availableIndex - 1;
                  if (indexBefore >= 0) {
                    if (liRef.current) {
                      const left =
                        ulRef.current!.getBoundingClientRect().left +
                        indexBefore * itemWidth;
                      if (
                        liRef.current?.getBoundingClientRect().left <
                        left + itemWidth / 2
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
                        indexAfter * itemWidth;
                      if (
                        liRef.current?.getBoundingClientRect().right >=
                        left + itemWidth / 2
                      ) {
                        setAvailableIndex(
                          (currentAvailableIndex) => currentAvailableIndex + 1
                        );
                      }
                    }
                  }
                }}
                className={`select-none bg-slate-500 rounded-lg my-1 ${
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
                  mouseDelta,
                  itemWidth
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
