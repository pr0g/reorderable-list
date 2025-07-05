import { ReorderableList } from "./reorderable-list";

export const App = () => {
  return (
    <>
      <h1 className="sm:text-3xl text-2xl font-bold underline bg-gray-300">
        Reorderable list
      </h1>
      <div className="flex flex-row justify-center py-40">
        <ReorderableList />
      </div>
    </>
  );
};
