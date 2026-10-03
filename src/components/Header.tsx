import { useSub2Keys } from '../hooks/useSub2Keys'
import { useStore } from '../store'
import { useFavoriteCollectionTitle } from './FavoriteCollections'
import ConnectionSelect from './ConnectionSelect'

export default function Header() {

  const activeFavoriteCollectionId = useStore((s) => s.activeFavoriteCollectionId)

  const favoriteCollectionTitle = useFavoriteCollectionTitle()
  const showFavoriteCollectionTitle = Boolean(activeFavoriteCollectionId)
  const connection = useSub2Keys()

  return (
    <>
      <header data-no-drag-select className="safe-area-top fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="safe-area-x safe-header-inner max-w-7xl mx-auto flex items-center justify-between relative">
          <div className="flex min-w-0 flex-1 items-center gap-3 py-2">
            <div className="min-w-0 flex-1 sm:max-w-sm">
              <ConnectionSelect label="选择密钥" value={connection.keyId} onChange={connection.selectKey}
                disabled={!connection.keys.length || connection.loading === 'keys'}
                placeholder={connection.loading === 'keys' ? '加载密钥…' : '选择密钥'}
                options={connection.keys.map((key) => ({ value: String(key.id), label: key.name,
                  platform: key.group?.platform, group: key.group?.name, description: key.group?.description,
                  rate: key.group?.rate_multiplier, userRate: key.group?.user_rate_multiplier }))} />
            </div>
            <div className="min-w-0 flex-1 sm:max-w-xs">
              <ConnectionSelect label="选择模型" value={connection.model} onChange={connection.selectModel}
                disabled={!connection.models.length || Boolean(connection.loading)}
                placeholder={connection.loading === 'models' ? '加载模型…' : '选择模型'}
                options={connection.models.map((model) => ({ value: model, label: model }))} />
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
