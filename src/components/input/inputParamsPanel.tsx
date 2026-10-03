import type { ApiProfile, TaskParams } from '../../types'
import { dismissAllTooltips } from '../../lib/tooltipDismiss'
import Select from '../Select'
import ButtonTooltip from './buttonTooltip'

interface HintTooltipState {
  visible: boolean
  show: () => void
  hide: () => void
  clearTimer: () => void
  startTouch: () => void
}

export default function InputParamsPanel({
  cols,
  params,
  setParams,
  activeProfile,
  isFalProvider,
  isFalTextToImage,
  displaySize,
  qualityOptions,
  selectClass,
  outputImageLimit,
  nInput,
  setNInputFocused,
  commitN,
  handleNInputChange,
  handleNLimitIncreaseAttempt,
  hideNLimitHint,
  nLimitHint,
  nLimitHintText,
  streamConcurrentByN,
  streamConcurrentHint,
  sizeHint,
  qualityHint,
  onOpenSizePicker,
}: {
  cols: string
  params: TaskParams
  setParams: (patch: Partial<TaskParams>) => void
  activeProfile: ApiProfile
  isFalProvider: boolean
  isFalTextToImage: boolean
  displaySize: string
  qualityOptions: Array<{ label: string; value: string }>
  selectClass: string
  outputImageLimit: number
  nInput: string
  setNInputFocused: (focused: boolean) => void
  commitN: () => void
  handleNInputChange: (value: string) => void
  handleNLimitIncreaseAttempt: (preventDefault: () => void) => void
  hideNLimitHint: () => void
  nLimitHint: HintTooltipState
  nLimitHintText: string
  streamConcurrentByN: boolean
  streamConcurrentHint: HintTooltipState
  sizeHint: HintTooltipState
  qualityHint: HintTooltipState
  onOpenSizePicker: () => void
}) {
  return (
    <div className={`grid ${cols} gap-2 text-xs flex-1`}>
      <label
        className="relative flex flex-col gap-0.5"
        onMouseEnter={sizeHint.show}
        onMouseLeave={sizeHint.hide}
        onTouchStart={sizeHint.startTouch}
        onTouchEnd={sizeHint.clearTimer}
        onTouchCancel={sizeHint.hide}
        onClick={sizeHint.show}
      >
        <span className="text-gray-400 dark:text-gray-500 ml-1">尺寸</span>
        <button
          type="button"
          onClick={() => { dismissAllTooltips(); onOpenSizePicker() }}
          className="px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-gray-700 bg-white/50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 focus:outline-none text-xs text-left transition-all duration-200 shadow-sm font-mono"
        >
          {displaySize}
        </button>
        <ButtonTooltip
          visible={(isFalTextToImage || activeProfile.codexCli) && sizeHint.visible}
          text={isFalTextToImage
            ? <>fal.ai 的文生图模式不支持 <code className="rounded bg-white/10 px-1 py-0.5 font-mono">auto</code> 参数</>
            : 'Codex CLI 不支持尺寸参数，此处设置仅基于提示词工程'}
        />
      </label>
      <label
        className="relative flex flex-col gap-0.5"
        onMouseEnter={qualityHint.show}
        onMouseLeave={qualityHint.hide}
        onTouchStart={qualityHint.startTouch}
        onTouchEnd={qualityHint.clearTimer}
        onTouchCancel={qualityHint.hide}
        onClick={qualityHint.show}
      >
        <span className="text-gray-400 dark:text-gray-500 ml-1">质量</span>
        <Select
          value={activeProfile.codexCli ? 'auto' : isFalProvider && params.quality === 'auto' ? 'high' : params.quality}
          onChange={(val) => {
            if (!activeProfile.codexCli) setParams({ quality: val as TaskParams['quality'] })
          }}
          options={qualityOptions}
          disabled={activeProfile.codexCli}
          showValueTooltips={false}
          className={activeProfile.codexCli
            ? 'px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800 opacity-50 cursor-not-allowed text-xs transition-all duration-200 shadow-sm'
            : selectClass}
        />
        <ButtonTooltip
          visible={(activeProfile.codexCli || isFalProvider) && qualityHint.visible}
          text={isFalProvider ? <>fal.ai 不支持 <code className="rounded bg-white/10 px-1 py-0.5 font-mono">auto</code> 质量参数</> : 'Codex CLI 不支持质量参数'}
        />
      </label>
      <label
        className="relative flex flex-col gap-0.5"
        onMouseEnter={() => { streamConcurrentHint.show() }}
        onMouseLeave={() => { hideNLimitHint(); streamConcurrentHint.hide() }}
        onTouchStart={() => { streamConcurrentHint.startTouch() }}
        onTouchEnd={() => streamConcurrentHint.clearTimer()}
        onTouchCancel={() => {
          streamConcurrentHint.clearTimer()
          hideNLimitHint()
          streamConcurrentHint.hide()
        }}
        onClick={() => { streamConcurrentHint.show() }}
      >
        <span className="text-gray-400 dark:text-gray-500 ml-1">数量</span>
        <input
          value={nInput}
          onChange={(e) => handleNInputChange(e.target.value)}
          onFocus={() => setNInputFocused(true)}
          onBlur={() => {
            setNInputFocused(false)
            commitN()
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              handleNLimitIncreaseAttempt(() => e.preventDefault())
            }
          }}
          onWheel={(e) => {
            if (e.deltaY < 0) {
              handleNLimitIncreaseAttempt(() => e.preventDefault())
            }
          }}
          type={'number'}
          min={1}
          max={outputImageLimit}
          className={`px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-gray-700 focus:outline-none text-xs transition-all duration-200 shadow-sm ${
            'bg-white/50 dark:bg-gray-800'
          }`}
        />
        <ButtonTooltip visible={nLimitHint.visible} text={nLimitHintText} />
        <ButtonTooltip visible={streamConcurrentByN && streamConcurrentHint.visible && !nLimitHint.visible} text="数量大于 1 时会将多图生成拆分为并发单图" />
      </label>
    </div>
  )
}
