import { describe, expect, it } from 'vitest'
import type { AppSettings, FavoriteCollection } from '../types'
import { DEFAULT_PARAMS } from '../types'
import { DEFAULT_IMAGES_MODEL, DEFAULT_SETTINGS, switchApiProfileProvider } from './apiProfiles'
import { normalizePersistedState } from './persistedState'

const imageA = { id: 'image-a', dataUrl: 'data:image/png;base64,image-a' }
const collectionA: FavoriteCollection = { id: 'collection-a', name: '收藏夹 A', createdAt: 1, updatedAt: 1 }

function source(settings: AppSettings = DEFAULT_SETTINGS) {
  return {
    settings,
    params: { ...DEFAULT_PARAMS },
    prompt: '画廊输入',
    inputImages: [imageA],
    maskDraft: null,
    maskEditorImageId: null,
    dismissedCodexCliPrompts: [],
    galleryInputDraft: null,
    favoriteCollections: [collectionA],
    defaultFavoriteCollectionId: collectionA.id,
    supportPromptDismissed: false,
    supportPromptOpen: false,
    supportPromptSkippedForImportedData: false,
  }
}

function fallback() {
  return {
    settings: DEFAULT_SETTINGS,
    params: { ...DEFAULT_PARAMS },
    dismissedCodexCliPrompts: ['current'],
    favoriteCollections: [collectionA],
    defaultFavoriteCollectionId: collectionA.id,
  }
}

describe('persisted state codec', () => {
  it.each([undefined, 'custom-image-model', '', '   '])('restores profile and legacy top-level tool model %s without autofilling', (imageGenerationModel) => {
    const profile = { apiMode: 'responses', model: 'legacy-text-model', ...(imageGenerationModel === undefined ? {} : { imageGenerationModel }) }
    for (const settings of [profile, { profiles: [profile] }]) {
      const result = normalizePersistedState({ settings }, fallback(), 100)!
      expect(result.state.settings.profiles[0]).toMatchObject({
        model: 'legacy-text-model',
        imageGenerationModel: imageGenerationModel?.trim() ?? '',
      })
    }
  })

  it.each([undefined, 'draft-image-model', ''])('restores saved provider tool model %s instead of inheriting the active model', (imageGenerationModel) => {
    const result = normalizePersistedState({ settings: { profiles: [{
      provider: 'fal',
      imageGenerationModel: DEFAULT_IMAGES_MODEL,
      providerDrafts: { openai: { apiMode: 'responses', model: 'saved-text-model', ...(imageGenerationModel === undefined ? {} : { imageGenerationModel }) } },
    }] } }, fallback(), 100)!
    expect(switchApiProfileProvider(result.state.settings.profiles[0], 'openai')).toMatchObject({
      apiMode: 'responses',
      model: 'saved-text-model',
      imageGenerationModel: imageGenerationModel ?? '',
    })
  })

  it('retains new defaults when no settings were persisted', () => {
    expect(normalizePersistedState({}, fallback(), 100)!.state.settings.profiles[0].imageGenerationModel).toBe(DEFAULT_IMAGES_MODEL)
  })

  it.each(['xhigh', 'max'] as const)('restores the %s GPT Image 2.5 quality level', (quality) => {
    const result = normalizePersistedState({ params: { ...DEFAULT_PARAMS, quality } }, fallback(), 100)!

    expect(result.state.params.quality).toBe(quality)
  })

  it('rejects non-record unknown data and falls back field-by-field for an invalid record', () => {
    class ExternalState {}

    expect(normalizePersistedState(null, fallback(), 100)).toBeNull()
    expect(normalizePersistedState([], fallback(), 100)).toBeNull()
    expect(normalizePersistedState(new Date(), fallback(), 100)).toBeNull()
    expect(normalizePersistedState(new Map(), fallback(), 100)).toBeNull()
    expect(normalizePersistedState(new ExternalState(), fallback(), 100)).toBeNull()

    const result = normalizePersistedState({
      params: { quality: 'invalid', n: Number.NaN },
      dismissedCodexCliPrompts: 'invalid',
      favoriteCollections: 'invalid',
      setPrompt: 'external action must not escape the codec',
    }, fallback(), 100)!

    expect(result.state.params).toEqual(DEFAULT_PARAMS)
    expect(result.state.dismissedCodexCliPrompts).toEqual(['current'])
    expect(result.state.favoriteCollections).toEqual([collectionA])
    expect(result.state).not.toHaveProperty('setPrompt')
  })

  it('preserves an empty deployed profile snapshot when restoring persisted state', () => {
    const result = normalizePersistedState({
      previousPresetConfig: {
        customProviders: [{ id: 'provider-a', name: 'Provider A', submit: { path: 'generate' } }],
        profiles: [],
      },
    }, fallback())!

    expect(result.state.previousPresetConfig?.profiles).toEqual([])
    expect(result.state.previousPresetConfig?.customProviders).toEqual([
      expect.objectContaining({ id: 'provider-a' }),
    ])
  })

})
