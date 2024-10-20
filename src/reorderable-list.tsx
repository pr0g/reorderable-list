import { useState, Fragment, useRef } from "react";

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

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [availableIndex, setAvailableIndex] = useState(-1);

  const mouseDownVerticalPosition = useRef(0);
  const [mouseDelta, setMouseDelta] = useState(0);

  const ulRef = useRef<HTMLUListElement | null>(null);
  const liRef = useRef<HTMLLIElement | null>(null);

  const itemHeight = 24; // calculated from liRef client top/bottom bounds

  return (
    <div className="flex flex-col min-w-[300px]">
      <ul ref={ulRef}>
        {items.map((item, index) => {
          return (
            <Fragment key={index}>
              <li
                key={item}
                onPointerDown={(e) => {
                  setSelectedIndex(index);
                  setAvailableIndex(index);
                  liRef.current = e.currentTarget;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  mouseDownVerticalPosition.current = e.clientY;
                  setMouseDelta(0);
                }}
                onPointerUp={(e) => {
                  const [extracted] = items.splice(selectedIndex, 1);
                  items.splice(availableIndex, 0, extracted);
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  setSelectedIndex(-1);
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
                className={`select-none bg-slate-500 rounded-lg ${
                  index === selectedIndex ? "text-red-500" : "text-black"
                }`}
                style={
                  index === selectedIndex
                    ? {
                        transform: `translateY(${mouseDelta}px)`,
                      }
                    : index >= availableIndex && index < selectedIndex
                    ? {
                        transform: `translateY(${itemHeight}px)`,
                      }
                    : index <= availableIndex && index > selectedIndex
                    ? {
                        transform: `translateY(${-itemHeight}px)`,
                      }
                    : {}
                }
              >
                {item}
              </li>
            </Fragment>
          );
        })}
      </ul>
      <p>Moving index: {selectedIndex}</p>
    </div>
  );
}
