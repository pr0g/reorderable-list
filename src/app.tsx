import { experimental_useEffectEvent, useState } from "react";
// import {} from "react/experimental";

export const App = () => {
  const [count, setCount] = useState(0);
  
  experimental_useEffectEvent(() => {
  });
  
  return (
    <>
      <div></div>
      <h1>demo app</h1>
      <button onClick={() => setCount(count + 1)}>count is: {count}</button>
    </>
  );
};
