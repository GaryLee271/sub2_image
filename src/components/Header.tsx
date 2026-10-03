import { useStore } from '../store'
import { useTooltip } from '../hooks/useTooltip'
import ViewportTooltip from './ViewportTooltip'
import { useFavoriteCollectionTitle } from './FavoriteCollections'
import { ChevronDownIcon, SettingsIcon } from './icons'

export default function Header() {
  const setShowSettings = useStore((s) => s.setShowSettings)

  const activeFavoriteCollectionId = useStore((s) => s.activeFavoriteCollectionId)

  const favoriteCollectionTitle = useFavoriteCollectionTitle()
  const showFavoriteCollectionTitle = Boolean(activeFavoriteCollectionId)
  const settingsTooltip = useTooltip()

  return (
    <>
      <header data-no-drag-select className="safe-area-top fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-200 dark:border-white/[0.08]">
        <div className="safe-area-x safe-header-inner max-w-7xl mx-auto flex items-center justify-between relative">
          <div className="flex-1 min-w-0 pr-2 flex items-center gap-2">
            {['选择 Key', '选择模型'].map((label) => (
              <div key={label} className="relative min-w-0 w-32 sm:w-44">
                <select
                  aria-label={label}
                  defaultValue=""
                  className="w-full appearance-none rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-100/70 dark:bg-white/[0.04] py-2 pl-3 pr-8 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="">{label}</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            ))}
          </div>
          {showFavoriteCollectionTitle && (
            <div className="hidden min-w-0 max-w-[30%] px-3 sm:flex">
              <div className="truncate rounded px-2 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300" title={favoriteCollectionTitle}>
                {favoriteCollectionTitle}
              </div>
            </div>
          )}
          <div className="flex items-center gap-1 shrink-0">
            <div
              className="relative"
              {...settingsTooltip.handlers}
            >
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                aria-label="设置"
              >
                <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <ViewportTooltip visible={settingsTooltip.visible} className="whitespace-nowrap">
                设置
              </ViewportTooltip>
            </div>
          </div>
        </div>
      </header>
      <div className="safe-area-top invisible pointer-events-none" aria-hidden="true">
        <div className="safe-header-inner" />
      </div>
    </>
  )
}
