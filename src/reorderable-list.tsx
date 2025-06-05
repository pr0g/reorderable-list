import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  memo,
  useReducer,
} from "react";

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

type Action =
  | { type: "JUST_RELEASED" }
  | { type: "TRANSITION_IN_ENDED"; index: number }
  | { type: "TRANSITION_OUT_ENDED"; index: number }
  | { type: "POINTER_DOWN"; index: number }
  | { type: "POINTER_UP_EARLY"; delta: [number, number] }
  | { type: "POINTER_UP"; delta: [number, number] }
  | { type: "POINTER_MOVE"; delta: [number, number] }
  | { type: "CHANGE_INDEX"; indexChange: number; max: number };

type State = {
  movingIndex: number;
  availableIndex: number;
  justReleasedIndex: number;
  justPressedIndex: number;
  nextIndex: number;
  mouseDelta: [number, number];
  mousePressed: boolean;
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "JUST_RELEASED":
      return {
        ...state,
        justReleasedIndex: -1,
        nextIndex: state.movingIndex,
      };
    case "TRANSITION_IN_ENDED":
      return {
        ...state,
        movingIndex: action.index,
        justPressedIndex: -1,
      };
    case "TRANSITION_OUT_ENDED": {
      return {
        ...state,
        availableIndex: -1,
        movingIndex: -1,
        nextIndex: -1,
      };
    }
    case "POINTER_DOWN":
      return {
        ...state,
        availableIndex: action.index,
        justPressedIndex: action.index,
        mouseDelta: [0, 0],
        mousePressed: true,
      };
    case "POINTER_UP_EARLY":
      return {
        ...state,
        justReleasedIndex: state.justPressedIndex,
        mouseDelta: action.delta,
        justPressedIndex: -1,
        mousePressed: false,
      };
    case "POINTER_UP":
      return {
        ...state,
        mousePressed: false,
        justReleasedIndex: state.movingIndex,
      };
    case "POINTER_MOVE":
      return {
        ...state,
        mouseDelta: action.delta,
      };
    case "CHANGE_INDEX": {
      return {
        ...state,
        availableIndex: Math.min(
          state.availableIndex + action.indexChange,
          action.max
        ),
      };
    }
    default:
      return state;
  }
}

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

  const initialState: State = {
    movingIndex: -1, // index of element while moving
    availableIndex: -1, // index of slot to move moving element to
    justReleasedIndex: -1, // index of just released element (will be 'available' index after move)
    justPressedIndex: -1, // index of element pressed before becoming 'active' (moving)
    nextIndex: -1, // moving index after element is released
    mouseDelta: [0, 0],
    mousePressed: false,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  const ulRef = useRef<HTMLUListElement | null>(null);
  const liRef = useRef<HTMLLIElement | null>(null);
  const mouseDownPosition = useRef([0, 0]);
  const itemWidth = useRef(0);
  const itemHeight = useRef(0);

  useEffect(() => {
    if (state.justReleasedIndex !== -1) {
      dispatch({ type: "JUST_RELEASED" });
    }
  }, [state.justReleasedIndex]);

  const getStyle = useCallback(
    (
      index: number,
      movingIndex: number,
      pressedIndex: number,
      releasedIndex: number,
      availableIndex: number,
      nextIndex: number,
      itemWidth: number,
      itemHeight: number
    ) => {
      const style: React.CSSProperties = {};
      if (index === releasedIndex) {
        // record exactly where the element was when it was released (so it can animate back to position)
        style.transform = `translateX(${state.mouseDelta[0]}px) translateY(${state.mouseDelta[1]}px) scale(1.1)`;
      } else if (index === nextIndex) {
        const rowFrom = Math.floor(nextIndex / columns);
        const colFrom = Math.floor(nextIndex % columns);
        const rowTo = Math.floor(availableIndex / columns);
        const colTo = Math.floor(availableIndex % columns);
        const row = rowTo - rowFrom;
        const col = colTo - colFrom;
        style.transform = `translateX(${itemWidth * col}px) translateY(${
          itemHeight * row
        }px) scale(1)`;
      } else if (index === pressedIndex || index === movingIndex) {
        style.transform = `scale(1.1)`;
        style.position = "relative";
        style.left = `${state.mouseDelta[0]}px`;
        style.top = `${state.mouseDelta[1]}px`;
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
      }
      return style;
    },
    [state.mouseDelta]
  );

  const onTransitionEnd = useCallback(
    (index: number) => () => {
      if (index === state.justPressedIndex) {
        dispatch({ type: "TRANSITION_IN_ENDED", index });
      }
      if (index === state.nextIndex) {
        const newItems = [...items];
        const [extracted] = newItems.splice(state.movingIndex, 1);
        newItems.splice(state.availableIndex, 0, extracted);
        setItems(newItems);
        dispatch({ type: "TRANSITION_OUT_ENDED", index });
      }
    },
    [
      items,
      state.availableIndex,
      state.justPressedIndex,
      state.movingIndex,
      state.nextIndex,
    ]
  );

  const onPointerDown = useCallback(
    (index: number) => (e: React.PointerEvent<HTMLLIElement>) => {
      dispatch({ type: "POINTER_DOWN", index });
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
      const deltaX = state.mouseDelta[0];
      const deltaY = state.mouseDelta[1];

      liRef.current = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
      if (state.movingIndex === -1) {
        dispatch({ type: "POINTER_UP_EARLY", delta: [deltaX, deltaY] });
        return;
      }

      const colm = state.movingIndex % columns;
      const rowm = Math.floor(state.movingIndex / columns);
      const cola = state.availableIndex % columns;
      const rowa = Math.floor(state.availableIndex / columns);

      dispatch({
        type: "POINTER_UP",
        delta: [
          deltaX + (colm - cola) * itemWidth.current,
          deltaY + (rowm - rowa) * itemHeight.current,
        ],
      });
    },
    [state.availableIndex, state.mouseDelta, state.movingIndex]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLLIElement>) => {
      if (state.mousePressed) {
        dispatch({
          type: "POINTER_MOVE",
          delta: [
            e.clientX - mouseDownPosition.current[0],
            e.clientY - mouseDownPosition.current[1],
          ],
        });
      }

      if (state.availableIndex === -1) {
        return;
      }

      const rows = Math.ceil(items.length / columns);
      const availableRow = Math.floor(state.availableIndex / columns);

      if (liRef.current) {
        // drag left
        const indexBefore = state.availableIndex - 1;
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
            dispatch({
              type: "CHANGE_INDEX",
              indexChange: -1,
              max: items.length - 1,
            });
          }
        }

        // drag right
        const indexAfter = state.availableIndex + 1;
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
            dispatch({
              type: "CHANGE_INDEX",
              indexChange: 1,
              max: items.length - 1,
            });
          }
        }

        const nextRow = Math.floor((state.availableIndex + columns) / columns);
        if (nextRow < rows) {
          const top =
            ulRef.current!.getBoundingClientRect().top +
            nextRow * itemHeight.current;
          if (
            getUnscaledRect(liRef.current, 1.1).bottom >=
            top + itemHeight.current / 2
          ) {
            dispatch({
              type: "CHANGE_INDEX",
              indexChange: columns,
              max: items.length - 1,
            });
          }
        }

        const prevRow = Math.floor((state.availableIndex - columns) / columns);
        if (prevRow >= 0) {
          const top =
            ulRef.current!.getBoundingClientRect().top +
            prevRow * itemHeight.current;
          if (
            getUnscaledRect(liRef.current, 1.1).top <
            top + itemHeight.current / 2
          ) {
            dispatch({
              type: "CHANGE_INDEX",
              indexChange: -columns,
              max: items.length - 1,
            });
          }
        }
      }
    },
    [state.mousePressed, state.availableIndex, items.length]
  );

  const gridStyle = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    }),
    [columns]
  );

  return (
    <div>
      <ul ref={ulRef} style={gridStyle}>
        {items.map((item, index) => {
          return (
            <li
              key={item}
              onTransitionEnd={onTransitionEnd(index)}
              onPointerDown={onPointerDown(index)}
              onPointerUp={onPointerUp}
              onPointerMove={onPointerMove}
              className={`select-none bg-slate-500 rounded-lg m-1 min-w-24 text-center ${
                index === state.movingIndex && state.nextIndex === -1
                  ? "text-red-500 z-50"
                  : index === state.justReleasedIndex
                  ? "text-black z-50"
                  : state.availableIndex === -1 &&
                    state.movingIndex === -1 &&
                    state.nextIndex === -1
                  ? ""
                  : "transition-transform duration-300"
              }`}
              style={getStyle(
                index,
                state.movingIndex,
                state.justPressedIndex,
                state.justReleasedIndex,
                state.availableIndex,
                state.nextIndex,
                itemWidth.current,
                itemHeight.current
              )}
            >
              {item}
            </li>
          );
        })}
      </ul>
      <p>Moving index: {state.movingIndex}</p>
      <p>Available index: {state.availableIndex}</p>
      <p>Released index: {state.justReleasedIndex}</p>
      <p>Next index: {state.nextIndex}</p>
    </div>
  );
});
