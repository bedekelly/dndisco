export default function SyncIndicator({ synced, numberClients } : { synced: boolean, numberClients: number }) {
  const syncStyle = synced ? "bg-green-300" : "bg-yellow-300 animate-pulse";
  return <>
    <p>{ numberClients } connected</p>
    <div className={`${syncStyle} w-5 h-5 rounded-full m-2 absolute right-0 top-0 shadow-xl shadow-inner`} />
  </>
}
