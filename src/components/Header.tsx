import { useStore } from '../store'
import { useVersionCheck } from '../hooks/useVersionCheck'
import { useTooltip } from '../hooks/useTooltip'
import ViewportTooltip from './ViewportTooltip'
import { useFavoriteCollectionTitle } from './FavoriteCollections'
import { SettingsIcon } from './icons'

export default function Header() {
  const setShowSettings = useStore((s) => s.setShowSettings)

  const activeFavoriteCollectionId = useStore((s) => s.activeFavoriteCollectionId)

  const favoriteCollectionTitle = useFavoriteCollectionTitle()
  const showFavoriteCollectionTitle = Boolean(activeFavoriteCollectionId)
  const { hasUpdate, latestRelease, dismiss } = useVersionCheck()
  const settingsTooltip = useTooltip()

  return (
    <>
      <header data-no-drag-select className="safe-area-top fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-200 dark:border-white/[0.08]">
        <div className="safe-area-x safe-header-inner max-w-7xl mx-auto flex items-center justify-between relative">
          <div className="flex-1 min-w-0 pr-2 flex items-center gap-2">
            <h1 className="inline-flex min-w-0 items-start relative mr-2">
              {showFavoriteCollectionTitle ? (
                <>
                  <span className="min-w-0 truncate text-[17px] font-bold tracking-tight text-gray-800 dark:text-gray-100 sm:hidden" title={favoriteCollectionTitle}>{favoriteCollectionTitle}</span>
                  <a
                    href="https://github.com/CookSleep/gpt_image_playground"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden text-lg font-bold tracking-tight text-gray-800 transition-colors hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300 sm:inline"
                  >
                    GPT Image Playground
                  </a>
                </>
              ) : (
                <a
                  href="https://github.com/CookSleep/gpt_image_playground"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[17px] sm:text-lg font-bold tracking-tight text-gray-800 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  GPT Image Playground
                </a>
              )}
              {hasUpdate && latestRelease && (
                <a
                  href={latestRelease.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={dismiss}
                  className="absolute -right-1 -top-1 translate-x-full -translate-y-1/4 px-1 py-0.5 rounded-[4px] border border-red-500/30 text-[9px] font-black bg-red-500 text-white hover:bg-red-600 transition-all animate-fade-in leading-none shadow-sm"
                  title={`新版本 ${latestRelease.tag}`}
                >
                  NEW
                </a>
              )}
            </h1>
          </div>
          {showFavoriteCollectionTitle && (
            <div className="absolute left-1/2 top-1/2 hidden max-w-[30%] -translate-x-1/2 -translate-y-1/2 sm:flex">
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
