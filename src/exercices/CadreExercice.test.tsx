import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDelai, useSerie } from './CadreExercice'
import { useProgression } from '../store/progression'

/** Question factice : un simple numéro, suffisant pour suivre le déroulé. */
function fabriqueQuestions() {
  let prochain = 0
  return () => ({ numero: prochain++ })
}

beforeEach(() => {
  useProgression.setState({
    resultats: {},
    badges: [],
    bonnesReponses: 0,
    dernierJour: null,
    serie: 0,
    maitrise: {},
  })
})

describe('actions différées', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('exécute l’action après le délai', () => {
    const action = vi.fn()
    const { result } = renderHook(() => useDelai())

    act(() => result.current(action, 1000))
    expect(action).not.toHaveBeenCalled()

    act(() => void vi.advanceTimersByTime(1000))
    expect(action).toHaveBeenCalledOnce()
  })

  it('annule les actions en attente au démontage', () => {
    // Un enfant qui appuie sur « Quitter » pendant la pause de correction ne
    // doit pas voir sa réponse comptée après coup.
    const action = vi.fn()
    const { result, unmount } = renderHook(() => useDelai())

    act(() => result.current(action, 1000))
    unmount()
    act(() => void vi.advanceTimersByTime(5000))

    expect(action).not.toHaveBeenCalled()
  })

  it('annule toutes les actions en attente, pas seulement la dernière', () => {
    const premiere = vi.fn()
    const seconde = vi.fn()
    const { result, unmount } = renderHook(() => useDelai())

    act(() => {
      result.current(premiere, 500)
      result.current(seconde, 1500)
    })
    unmount()
    act(() => void vi.advanceTimersByTime(5000))

    expect(premiere).not.toHaveBeenCalled()
    expect(seconde).not.toHaveBeenCalled()
  })

  it('garde la même fonction d’un rendu à l’autre', () => {
    // Elle est utilisée dans des useCallback : une identité changeante les
    // ferait tous se recréer à chaque rendu.
    const { result, rerender } = renderHook(() => useDelai())
    const premiere = result.current
    rerender()
    expect(result.current).toBe(premiere)
  })
})

describe('déroulé d’une série', () => {
  it('avance d’une question à chaque réponse', () => {
    const { result } = renderHook(() => useSerie('test', 3, fabriqueQuestions()))

    expect(result.current.indice).toBe(0)
    expect(result.current.question.numero).toBe(0)

    act(() => result.current.repondre(true))
    expect(result.current.indice).toBe(1)
    expect(result.current.question.numero).toBe(1)
  })

  it('se termine après le nombre de questions demandé', () => {
    const { result } = renderHook(() => useSerie('test', 3, fabriqueQuestions()))

    act(() => result.current.repondre(true))
    act(() => result.current.repondre(true))
    expect(result.current.terminee).toBe(false)

    act(() => result.current.repondre(true))
    expect(result.current.terminee).toBe(true)
    expect(result.current.score).toBe(100)
    expect(result.current.justes).toBe(3)
  })

  it('calcule un score partiel juste', () => {
    const { result } = renderHook(() => useSerie('test', 4, fabriqueQuestions()))

    act(() => result.current.repondre(true))
    act(() => result.current.repondre(false))
    act(() => result.current.repondre(true))
    act(() => result.current.repondre(false))

    expect(result.current.score).toBe(50)
    expect(result.current.justes).toBe(2)
  })

  it('accepte les réponses partielles', () => {
    const { result } = renderHook(() => useSerie('test', 2, fabriqueQuestions()))

    act(() => result.current.repondrePartiel(0.5))
    act(() => result.current.repondrePartiel(1))

    expect(result.current.score).toBe(75)
    // Une réponse en dessous de 70 % ne compte pas comme juste.
    expect(result.current.justes).toBe(1)
  })

  it('borne un score partiel hors de [0, 1]', () => {
    const { result } = renderHook(() => useSerie('test', 1, fabriqueQuestions()))
    act(() => result.current.repondrePartiel(5))
    expect(result.current.score).toBe(100)
  })
})

describe('collecte des erreurs', () => {
  it('ne retient que les questions ratées', () => {
    const { result } = renderHook(() => useSerie('test', 3, fabriqueQuestions()))

    act(() => result.current.repondre(true, { attendue: 'do' }))
    act(() => result.current.repondre(false, { attendue: 'ré', donnee: 'mi' }))
    act(() => result.current.repondre(false, { attendue: 'fa', donnee: 'sol' }))

    expect(result.current.erreurs).toHaveLength(2)
    expect(result.current.erreurs[0]).toMatchObject({ attendue: 'ré', donnee: 'mi' })
    expect(result.current.erreurs[1]).toMatchObject({ attendue: 'fa', donnee: 'sol' })
  })

  it('conserve la question d’origine pour pouvoir la rejouer', () => {
    const { result } = renderHook(() => useSerie('test', 2, fabriqueQuestions()))

    act(() => result.current.repondre(false, { attendue: 'do' }))
    expect(result.current.erreurs[0]!.question).toEqual({ numero: 0 })
  })
})

describe('regroupement des erreurs à l’affichage', () => {
  it('garde chaque erreur séparément dans l’état', () => {
    // Le regroupement est purement visuel : le rejeu doit reproposer autant
    // de questions qu'il y a eu d'erreurs, répétitions comprises.
    const { result } = renderHook(() => useSerie('test', 3, fabriqueQuestions()))

    act(() => result.current.repondre(false, { attendue: 'mi', donnee: 'do', notes: [64] }))
    act(() => result.current.repondre(false, { attendue: 'mi', donnee: 'ré', notes: [64] }))
    act(() => result.current.repondre(false, { attendue: 'do', donnee: 'ré', notes: [60] }))

    expect(result.current.erreurs).toHaveLength(3)

    act(() => result.current.rejouerErreurs())
    expect(result.current.total).toBe(3)
  })
})

describe('rejeu des erreurs', () => {
  it('relance une série composée des seules questions ratées', () => {
    const { result } = renderHook(() => useSerie('test', 4, fabriqueQuestions()))

    act(() => result.current.repondre(true))
    act(() => result.current.repondre(false, { attendue: 'a' }))
    act(() => result.current.repondre(true))
    act(() => result.current.repondre(false, { attendue: 'b' }))

    expect(result.current.terminee).toBe(true)
    const ratees = result.current.erreurs.map((e) => e.question.numero)

    act(() => result.current.rejouerErreurs())

    expect(result.current.modeRevision).toBe(true)
    expect(result.current.total).toBe(2)
    expect(result.current.terminee).toBe(false)
    expect(result.current.question.numero).toBe(ratees[0])

    act(() => result.current.repondre(true))
    expect(result.current.question.numero).toBe(ratees[1])
  })

  it('ne fait rien s’il n’y a aucune erreur', () => {
    const { result } = renderHook(() => useSerie('test', 1, fabriqueQuestions()))
    act(() => result.current.repondre(true))
    act(() => result.current.rejouerErreurs())
    expect(result.current.modeRevision).toBe(false)
  })

  it('n’écrase pas le résultat de l’activité', () => {
    const { result } = renderHook(() => useSerie('test', 2, fabriqueQuestions()))

    act(() => result.current.repondre(true))
    act(() => result.current.repondre(true))
    expect(useProgression.getState().resultats.test?.etoiles).toBe(3)

    // Une reprise porte sur une poignée de questions choisies : la compter
    // comme une tentative fausserait la note de l'activité.
    act(() => result.current.recommencer())
    act(() => result.current.repondre(false, { attendue: 'x' }))
    act(() => result.current.repondre(false, { attendue: 'y' }))
    act(() => result.current.rejouerErreurs())
    act(() => result.current.repondre(false))
    act(() => result.current.repondre(false))

    expect(useProgression.getState().resultats.test?.etoiles).toBe(3)
  })
})

describe('remise à zéro', () => {
  it('repart d’une série neuve', () => {
    const { result } = renderHook(() => useSerie('test', 2, fabriqueQuestions()))

    act(() => result.current.repondre(false, { attendue: 'a' }))
    act(() => result.current.repondre(false, { attendue: 'b' }))
    act(() => result.current.recommencer())

    expect(result.current.indice).toBe(0)
    expect(result.current.justes).toBe(0)
    expect(result.current.erreurs).toHaveLength(0)
    expect(result.current.terminee).toBe(false)
    expect(result.current.modeRevision).toBe(false)
    expect(result.current.total).toBe(2)
  })
})

describe('suivi de maîtrise', () => {
  it('enregistre chaque élément travaillé en fin de série', () => {
    const { result } = renderHook(() =>
      useSerie('test', 2, fabriqueQuestions(), {
        cleMaitrise: (question) => `note:${question.numero}`,
      }),
    )

    act(() => result.current.repondre(true))
    act(() => result.current.repondre(false))

    const maitrise = useProgression.getState().maitrise
    expect(maitrise['note:0']).toMatchObject({ vues: 1, erreurs: 0 })
    expect(maitrise['note:1']).toMatchObject({ vues: 1, erreurs: 1 })
  })

  it('n’écrit rien tant que la série n’est pas finie', () => {
    const { result } = renderHook(() =>
      useSerie('test', 3, fabriqueQuestions(), {
        cleMaitrise: (question) => `note:${question.numero}`,
      }),
    )

    act(() => result.current.repondre(false))
    // L'écriture est groupée en fin de série pour ne pas faire ramer
    // l'exercice sur une tablette d'entrée de gamme.
    expect(useProgression.getState().maitrise).toEqual({})
  })

  it('enregistre aussi la maîtrise pendant une reprise', () => {
    const { result } = renderHook(() =>
      useSerie('test', 1, fabriqueQuestions(), {
        cleMaitrise: (question) => `note:${question.numero}`,
      }),
    )

    act(() => result.current.repondre(false, { attendue: 'x' }))
    act(() => result.current.rejouerErreurs())
    act(() => result.current.repondre(true))

    expect(useProgression.getState().maitrise['note:0']).toMatchObject({ vues: 2, erreurs: 1 })
  })
})
