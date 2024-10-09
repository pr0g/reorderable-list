import { useState, Fragment } from "react";

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
  const [mouseVerticalPosition, setMouseVerticalPosition] = useState(0);
  const [verticalClickOffset, setVerticalClickOffset] = useState(0);

  return (
    <div className="flex flex-col min-w-[300px]">
      <ul>
        {items.map((item, index) => {
          return (
            <Fragment key={index}>
              {movingIndex === index && (
                <li
                  key={`placeholder-${index}`}
                  className={`select-none bg-slate-400 rounded-lg`}
                >
                  <br />
                </li>
              )}
              <li
                key={item}
                onMouseDown={(e) => {
                  const elementBounds = e.currentTarget.getBoundingClientRect();
                  const initialClickOffset = e.clientY - elementBounds.top;

                  const nextMousePosition = e.clientY + window.scrollY;
                  setMouseVerticalPosition(nextMousePosition);

                  setMovingIndex(index);
                  setVerticalClickOffset(initialClickOffset);
                }}
                onMouseUp={() => {
                  setMovingIndex(-1);
                  setVerticalClickOffset(0);
                }}
                onMouseMove={(e) => {
                  if (movingIndex !== -1) {
                    const nextMousePosition = e.clientY + window.scrollY;
                    setMouseVerticalPosition(nextMousePosition);
                  }
                }}
                className={`select-none bg-slate-500 rounded-lg ${
                  index === movingIndex ? "text-red-500 absolute" : "text-black"
                }`}
                style={
                  index === movingIndex
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
      <p>Moving index: {movingIndex}</p>
      <p>Offset: {verticalClickOffset}</p>
    </div>
  );
}
