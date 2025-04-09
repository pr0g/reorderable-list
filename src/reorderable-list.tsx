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
  | { type: "TRANSITION_ENDED"; index: number }
  | { type: "POINTER_DOWN"; index: number }
  | { type: "POINTER_UP_EARLY"; delta: [number, number] }
  | { type: "POINTER_UP"; delta: [number, number] }
  | { type: "POINTER_MOVE"; delta: [number, number] }
  | { type: "CHANGE_INDEX"; indexChange: number };

type State = {
  movingIndex: number;
  availableIndex: number;
  justReleasedIndex: number;
  justPressedIndex: number;
  mouseDelta: [number, number];
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "JUST_RELEASED":
      return {
        ...state,
        justReleasedIndex: -1,
      };
    case "TRANSITION_ENDED":
      return {
        ...state,
        movingIndex: action.index,
        justPressedIndex: -1,
      };
    case "POINTER_DOWN":
      return {
        ...state,
        availableIndex: action.index,
        justPressedIndex: action.index,
        mouseDelta: [0, 0],
      };
    case "POINTER_UP_EARLY":
      return {
        ...state,
        justReleasedIndex: state.justPressedIndex,
        mouseDelta: action.delta,
        availableIndex: -1,
        justPressedIndex: -1,
      };
    case "POINTER_UP":
      return {
        ...state,
        mouseDelta: action.delta,
        justReleasedIndex: state.availableIndex,
        movingIndex: -1,
        availableIndex: -1,
      };
    case "POINTER_MOVE":
      return {
        ...state,
        mouseDelta: action.delta,
      };
    case "CHANGE_INDEX": {
      return {
        ...state,
        availableIndex: state.availableIndex + action.indexChange,
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
    movingIndex: -1,
    availableIndex: -1,
    justReleasedIndex: -1,
    justPressedIndex: -1,
    mouseDelta: [0, 0],
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
      itemWidth: number,
      itemHeight: number
    ) => {
      const style: React.CSSProperties = {};
      if (index === pressedIndex || index === movingIndex) {
        style.transform = `scale(1.1)`;
        style.position = "relative";
        style.left = `${state.mouseDelta[0]}px`;
        style.top = `${state.mouseDelta[1]}px`;
      } else if (index === releasedIndex) {
        style.transform = `translateX(${state.mouseDelta[0]}px) translateY(${state.mouseDelta[1]}px) scale(1.1)`;
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
      } else if (
        releasedIndex !== -1 &&
        (index <= releasedIndex || index >= releasedIndex)
      ) {
        style.transition = "none";
      }
      return style;
    },
    [state.mouseDelta]
  );

  const onTransitionEnd = useCallback(
    (index: number) => () => {
      if (index === state.justPressedIndex) {
        dispatch({ type: "TRANSITION_ENDED", index });
      }
    },
    [state.justPressedIndex]
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

      const newItems = [...items];
      const [extracted] = newItems.splice(state.movingIndex, 1);
      newItems.splice(state.availableIndex, 0, extracted);
      setItems(newItems);

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
    [items, state.availableIndex, state.mouseDelta, state.movingIndex]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLLIElement>) => {
      if (state.justPressedIndex !== -1 || state.availableIndex !== -1) {
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
            dispatch({ type: "CHANGE_INDEX", indexChange: -1 });
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
            dispatch({ type: "CHANGE_INDEX", indexChange: 1 });
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
            dispatch({ type: "CHANGE_INDEX", indexChange: columns });
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
            dispatch({ type: "CHANGE_INDEX", indexChange: -columns });
          }
        }
      }
    },
    [state.availableIndex, items.length, state.justPressedIndex]
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
                index === state.movingIndex
                  ? "text-red-500 z-50"
                  : index === state.justReleasedIndex
                  ? "text-black z-50"
                  : "transition-transform duration-300"
              }`}
              style={getStyle(
                index,
                state.movingIndex,
                state.justPressedIndex,
                state.justReleasedIndex,
                state.availableIndex,
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
    </div>
  );
});
