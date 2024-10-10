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

  const movingIndex = useRef(-1);
  const availableIndex = useRef(-1);
  const [mouseVerticalPosition, setMouseVerticalPosition] = useState(0);
  const [verticalClickOffset, setVerticalClickOffset] = useState(0);

  const ulRef = useRef<HTMLUListElement | null>(null);
  const liRef = useRef<HTMLLIElement | null>(null);

  // const onMouseMove = useCallback((e: MouseEvent) => {
  //   console.log("mouse moving");
  //   console.log("moving index: ", movingIndex);
  //   // if (movingIndex !== -1) {
  //     console.log("mouse moving index", movingIndex);
  //     const nextMousePosition = e.clientY + window.scrollY;
  //     setMouseVerticalPosition(nextMousePosition);
  //   // }
  // }, [movingIndex]);

  // const onMouseUp = () => {
  //   setMovingIndex(-1);
  //   setVerticalClickOffset(0);

  //   console.log("removing mouse move event listener");
  //   document.removeEventListener("mousemove", onMouseMove);
  //   document.removeEventListener("mouseup", onMouseUp)
  // };

  // const onMouseDown = () => {
  //   console.log("adding mouse move event listener");
  //   document.addEventListener("mousemove", onMouseMove);
  //   document.addEventListener("mouseup", onMouseUp)
  // };

  return (
    <div className="flex flex-col min-w-[300px]">
      <ul ref={ulRef}>
        {items.map((item, index) => {
          return (
            <Fragment key={index}>
              {availableIndex.current === index && (
                <li
                  key={`placeholder-${index}`}
                  className={`select-none bg-slate-400 rounded-lg`}
                >
                  <br />
                </li>
              )}
              <li
                key={item}
                onPointerDown={(e) => {
                  if (ulRef.current !== null) {
                    for (const element of ulRef.current.children) {
                      if (element instanceof HTMLLIElement) {
                        const li = element as HTMLLIElement;
                        const liBoundingRect = li.getBoundingClientRect();
                        if (
                          e.clientY + window.scrollY >=
                            liBoundingRect.top + window.scrollY &&
                          e.clientY + window.scrollY <
                            liBoundingRect.bottom + window.scrollY
                        ) {
                          liRef.current = li;
                          li.setPointerCapture(e.pointerId);
                        }
                      }
                    }
                  }

                  const elementBounds = e.currentTarget.getBoundingClientRect();
                  const initialClickOffset = e.clientY - elementBounds.top;

                  const nextMousePosition = e.clientY + window.scrollY;
                  setMouseVerticalPosition(nextMousePosition);

                  console.log("setting mouse move index", index);
                  movingIndex.current = index;
                  availableIndex.current = index;
                  setVerticalClickOffset(initialClickOffset);
                }}
                onPointerUp={(e) => {
                  movingIndex.current = -1;
                  availableIndex.current = -1;
                  setVerticalClickOffset(0);
                  liRef.current?.releasePointerCapture(e.pointerId);
                  liRef.current = null;
                }}
                onPointerMove={(e) => {
                  if (movingIndex.current !== -1) {
                    const nextMousePosition = e.clientY + window.scrollY;
                    setMouseVerticalPosition(nextMousePosition);
                    if (ulRef.current !== null) {
                      for (
                        let childIndex = 0, listIndex = 0;
                        childIndex < ulRef.current.children.length;
                        childIndex++
                      ) {
                        const element = ulRef.current.children[childIndex];
                        if (element instanceof HTMLLIElement) {
                          const li = element as HTMLLIElement;
                          // skip element we're dragging
                          if (li === liRef.current) {
                            continue;
                          }
                          const liBoundingRect = li.getBoundingClientRect();
                          if (
                            nextMousePosition >=
                              liBoundingRect.top + window.scrollY &&
                            nextMousePosition <
                              liBoundingRect.bottom + window.scrollY
                          ) {
                            if (childIndex !== availableIndex.current) {
                              availableIndex.current = listIndex;
                              console.log("available index", listIndex);
                            }
                          }
                        }
                        // keep separate list index to skip 'phantom' list element
                        // inserted when dragging
                        listIndex++;
                      }
                    }
                  }
                }}
                className={`select-none bg-slate-500 rounded-lg ${
                  index === movingIndex.current
                    ? "text-red-500 absolute"
                    : "text-black"
                }`}
                style={
                  index === movingIndex.current
                    ? {
                        top: `${mouseVerticalPosition - verticalClickOffset}px`,
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
      <p>Moving index: {movingIndex.current}</p>
      <p>Offset: {verticalClickOffset}</p>
    </div>
  );
}
