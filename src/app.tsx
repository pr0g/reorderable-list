import { useEffect, useState } from "react";

export const App = () => {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("John");
  const [combined, setCombined] = useState("");
  
  useEffect(() => {
    setCombined(name + ' ' + count);
  }, [name, count]);

  return (
    <>
      <h1 className="sm:text-3xl text-2xl font-bold underline bg-gray-300">DEMO APP</h1>
      <button className="block" onClick={() => setCount((count) => count + 1)}>The count is: {count}</button>
      <button className="block" onClick={() => setName((name) => name + 'a')}>Change name - {combined}</button>
    </>
  );
};
