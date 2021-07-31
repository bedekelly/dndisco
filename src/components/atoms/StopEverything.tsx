export default function StopEverything({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer text-white bg-red-400 text-uppercase flex 
      font-bold items-center justify-center focus:outline-black rounded-bl-lg px-6 py-3.5"
    >
      Panic!
    </button>
  );
}
