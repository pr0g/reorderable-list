import { useState } from "react";

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
  ]);

  const [movingIndex, setMovingIndex] = useState(-1);

  return (
    <div>
      <ul>
        {items.map((item, index) => {
          return (
            <li
              onMouseDown={() => setMovingIndex(index)}
              onMouseUp={() => setMovingIndex(-1)}
            >
              {item}
            </li>
          );
        })}
      </ul>
      <p>Moving index: {movingIndex}</p>
    </div>
  );
}
