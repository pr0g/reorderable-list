import { experimental_useEffectEvent, useState } from "react";

export const App = () => {
  const [count, setCount] = useState(0);
  
  experimental_useEffectEvent(() => {
  });
  
  return (
    <>
      <div></div>
      <h1 className="text-3xl font-bold underline bg-gray-300">DEMO APP</h1>
      <button onClick={() => setCount(count + 1)}>The count is: {count}</button>
    </>
  );
};
