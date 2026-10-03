import { useSub2Keys } from '../hooks/useSub2Keys'
import { useStore } from '../store'
import { useFavoriteCollectionTitle } from './FavoriteCollections'
import { ChevronDownIcon } from './icons'

export default function Header() {

  const activeFavoriteCollectionId = useStore((s) => s.activeFavoriteCollectionId)

  const favoriteCollectionTitle = useFavoriteCollectionTitle()
  const showFavoriteCollectionTitle = Boolean(activeFavoriteCollectionId)
  const connection = useSub2Keys()

  return (
    <>
      <header data-no-drag-select className="safe-area-top fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-200 dark:border-white/[0.08]">
        <div className="safe-area-x safe-header-inner max-w-7xl mx-auto flex items-center justify-between relative">
          <div className="flex-1 min-w-0 pr-2 flex items-center gap-2">
            <div className="relative min-w-0 w-36 sm:w-56">
              <select
                aria-label="选择 Key"
                value={connection.keyId}
                onChange={(event) => connection.selectKey(event.target.value)}
                disabled={!connection.keys.length || connection.loading === 'keys'}
                className="w-full appearance-none rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-100/70 dark:bg-white/[0.04] py-2 pl-3 pr-8 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
              >
                <option value="" disabled>{connection.loading === 'keys' ? '加载 Key…' : '选择 Key'}</option>
                {connection.keys.map((key) => <option key={key.id} value={key.id}>{key.name} · {key.group?.platform === 'grok' ? 'Grok' : 'OpenAI'}</option>)}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="relative min-w-0 w-36 sm:w-56">
              <select
                aria-label="选择模型"
                value={connection.model}
                onChange={(event) => connection.selectModel(event.target.value)}
                disabled={!connection.models.length || Boolean(connection.loading)}
                className="w-full appearance-none rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-100/70 dark:bg-white/[0.04] py-2 pl-3 pr-8 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
              >
                <option value="" disabled>{connection.loading === 'models' ? '加载模型…' : '选择模型'}</option>
                {connection.models.map((model) => <option key={model} value={model}>{model}</option>)}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          {showFavoriteCollectionTitle && (
            <div className="hidden min-w-0 max-w-[30%] px-3 sm:flex">
              <div className="truncate rounded px-2 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300" title={favoriteCollectionTitle}>
                {favoriteCollectionTitle}
              </div>
            </div>
          )}
        </div>
      </header>
      <div className="safe-area-top invisible pointer-events-none" aria-hidden="true">
        <div className="safe-header-inner" />
      </div>
      {connection.error && (
        <div role="status" className="safe-area-x max-w-7xl mx-auto py-2 text-sm text-gray-600 dark:text-gray-400">
          <span>{connection.error}。<button onClick={connection.retry} className="ml-2 text-blue-500 underline">重试</button><a href="/keys" target="_top" className="ml-3 text-blue-500 underline">管理 Key</a></span>
        </div>
      )}
    </>
  )
}
