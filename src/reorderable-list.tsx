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

  useEffect(() => {
    if (justChangedIndex !== -1) {
      setJustChangedIndex(-1);
    }
  }, [justChangedIndex]);

  const mouseDownVerticalPosition = useRef(0);
  const [mouseDelta, setMouseDelta] = useState(0);

  const ulRef = useRef<HTMLUListElement | null>(null);
  const liRef = useRef<HTMLLIElement | null>(null);

  const itemHeight = 24 + 4; // calculated from liRef client top/bottom bounds (4px margin)

  const getStyle = (
    index: number,
    movingIndex: number,
    justChangedIndex: number,
    availableIndex: number,
    mouseDelta: number,
    itemHeight: number
  ) => {
    const style: React.CSSProperties = {};
    if (index === justChangedIndex) {
      style.transform = `scale(1.1)`;
    } else if (index === movingIndex) {
      style.transform = `translateY(${mouseDelta}px) scale(1.1)`;
    } else if (index >= availableIndex && index < movingIndex) {
      style.transform = `translateY(${itemHeight}px)`;
    } else if (index <= availableIndex && index > movingIndex) {
      style.transform = `translateY(${-itemHeight}px)`;
    }
    return style;
  };

  return (
    <div className="flex flex-col min-w-[300px]">
      <ul ref={ulRef}>
        {items.map((item, index) => {
          return (
            <Fragment key={index}>
              <li
                key={item}
                onPointerDown={(e) => {
                  setMovingIndex(index);
                  setAvailableIndex(index);
                  liRef.current = e.currentTarget;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  mouseDownVerticalPosition.current = e.clientY;
                  setMouseDelta(0);
                }}
                onPointerUp={(e) => {
                  const [extracted] = items.splice(movingIndex, 1);
                  items.splice(availableIndex, 0, extracted);
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  setJustChangedIndex(availableIndex);
                  setMovingIndex(-1);
                  setAvailableIndex(-1);
                  setMouseDelta(0);
                }}
                onPointerMove={(e) => {
                  if (availableIndex === -1) {
                    return;
                  }

                  // liBefore?.getBoundingClientRect().bottom - liBefore?.getBoundingClientRect().top;

                  setMouseDelta(e.clientY - mouseDownVerticalPosition.current);

                  const indexBefore = availableIndex - 1;
                  if (indexBefore >= 0) {
                    if (liRef.current) {
                      const top =
                        ulRef.current!.getBoundingClientRect().top +
                        indexBefore * itemHeight;
                      if (
                        liRef.current?.getBoundingClientRect().top <
                        top + itemHeight / 2
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
                      const top =
                        ulRef.current!.getBoundingClientRect().top +
                        indexAfter * itemHeight;
                      if (
                        liRef.current?.getBoundingClientRect().bottom >=
                        top + itemHeight / 2
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
                    ? "text-red-500"
                    : "text-black transition-transform duration-300"
                }`}
                style={getStyle(
                  index,
                  movingIndex,
                  justChangedIndex,
                  availableIndex,
                  mouseDelta,
                  itemHeight
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
