import { useState, Fragment, useCallback, useRef } from "react";

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

  const [verticalClickOffset, setVerticalClickOffset] = useState(0);

  const ulRef = useRef<HTMLUListElement | null>(null);
  const liRef = useRef<HTMLLIElement | null>(null);

  const [, redraw] = useState(0);

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
                  console.log(
                    "bounding rect top",
                    liRef.current.getBoundingClientRect().top
                  );
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

                  console.log("pointer move");

                  const height = 24;
                  // const height =
                  //  liBefore?.getBoundingClientRect().bottom -
                  //  liBefore?.getBoundingClientRect().top;

                  setMouseDelta(e.clientY - mouseDownVerticalPosition.current);

                  const indexBefore = availableIndex - 1;
                  console.log("indexBefore", indexBefore);
                  if (indexBefore >= 0) {
                    if (liRef.current) {
                      const top =
                        ulRef.current!.getBoundingClientRect().top +
                        indexBefore * 24;
                      if (
                        liRef.current?.getBoundingClientRect().top <
                        top + height / 2
                      ) {
                        console.log("swap before");
                        setAvailableIndex(
                          (currentAvailableIndex) => currentAvailableIndex - 1
                        );
                        redraw(0);
                        return;
                      }
                    }
                  }

                  console.log("pointer move between");

                  const indexAfter = availableIndex + 1;
                  console.log("indexAfter", indexAfter);
                  if (indexAfter < items.length) {
                    // const liAfter = ulRef.current?.children[indexAfter];
                    if (liRef.current) {
                      const top =
                        ulRef.current!.getBoundingClientRect().top +
                        indexAfter * 24;
                      if (
                        liRef.current?.getBoundingClientRect().bottom >=
                        top + height / 2
                      ) {
                        console.log("swap after");
                        setAvailableIndex(
                          (currentAvailableIndex) => currentAvailableIndex + 1
                        );
                        return;
                      }
                    }
                  }
                }}
                className={`select-none bg-slate-500 rounded-lg ${
                  index === selectedIndex
                    ? "text-red-500 relative"
                    : "text-black"
                }`}
                style={
                  index === selectedIndex
                    ? {
                        transform: `translateY(${mouseDelta}px)`,
                      }
                    : index >= availableIndex && index < selectedIndex
                    ? {
                        transform: `translateY(${index + 1 * 24}px)`,
                      }
                    : index <= availableIndex && index > selectedIndex
                    ? {
                        transform: `translateY(${index - 1 * 24}px)`,
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
      <p>Offset: {verticalClickOffset}</p>
    </div>
  );
}
