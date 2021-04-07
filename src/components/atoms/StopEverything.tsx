export default function StopEverything({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer absolute bottom-0 w-screen h-10 text-white bg-red-400 text-uppercase flex font-bold items-center justify-center focus:outline-black"
    >
      Stop All
    </button>
  );
}