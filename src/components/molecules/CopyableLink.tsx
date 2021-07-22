import copy from "copy-to-clipboard";

export default function CopyableLink({ sessionID }: { sessionID: string }) {
  const linkURL = `${window.location.origin}/guest/${sessionID}`;
  return (
    <div className="absolute top-0 p-2 w-full text-center text-sm transform transition">
      <button
        onClick={() => copy(linkURL)}
        className="inline-flex items-center"
      >
        Copy link
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 inline ml-1.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
          />
        </svg>
      </button>
    </div>
  );
}