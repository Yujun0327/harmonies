// @vitest-environment jsdom
import { flushSync, mount, unmount } from 'svelte'
import { beforeEach, describe, expect, it } from 'vitest'
import { HotseatSession } from '../src/app/session.svelte'
import GameScreen from '../src/ui/GameScreen.svelte'
import Home from '../src/ui/Home.svelte'

// jsdom has no Web Animations API; without this stub Svelte transitions hang.
if (!Element.prototype.animate) {
  Element.prototype.animate = function () {
    const anim = {
      finished: Promise.resolve(),
      cancel() {},
      finish() {},
      set onfinish(cb: (() => void) | null) {
        cb?.()
      },
    }
    return anim as unknown as Animation
  } as typeof Element.prototype.animate
}

function screenText(target: HTMLElement): string {
  return target.textContent ?? ''
}

describe('Home', () => {
  beforeEach(() => localStorage.clear())

  it('renders the three ways to play and the fan disclaimer', () => {
    const target = document.createElement('div')
    document.body.appendChild(target)
    const app = mount(Home, {
      target,
      props: { onHotseat: () => {}, onCreateRoom: () => {}, onJoinRoom: () => {} },
    })
    flushSync()
    const text = screenText(target)
    expect(text).toContain('Harmonies')
    expect(text).toContain('fan-made')
    expect(text).toContain('hotseat')
    expect(text).toContain('create online room')
    unmount(app)
    target.remove()
  })
})

describe('GameScreen (hotseat)', () => {
  beforeEach(() => localStorage.clear())

  function mountGame() {
    const session = new HotseatSession(2, ['Ana', 'Bo'])
    const target = document.createElement('div')
    document.body.appendChild(target)
    const app = mount(GameScreen, {
      target,
      props: { session, onExit: () => {}, onRematch: () => {} },
    })
    flushSync()
    return { session, target, app }
  }

  it('plays a full first turn through the DOM', () => {
    const { session, target, app } = mountGame()

    // five clearing slots, all takeable on the opening turn
    const slots = [...target.querySelectorAll<HTMLButtonElement>('.clearing .slot')]
    expect(slots).toHaveLength(5)
    expect(slots.filter((b) => !b.disabled)).toHaveLength(5)

    slots[0].click()
    flushSync()
    expect(session.state.pendingTokens).toHaveLength(3)

    // the first pending token is auto-selected → legal hexes are highlighted
    for (let i = 0; i < 3; i++) {
      const hot = target.querySelector<SVGGElement>('.hex.clickable')
      expect(hot, `highlighted hex for token ${i + 1}`).not.toBeNull()
      hot!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      flushSync()
    }
    expect(session.state.pendingTokens).toHaveLength(0)

    const end = [...target.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.textContent!.includes('end turn'),
    )!
    expect(end.disabled).toBe(false)
    end.click()
    flushSync()
    expect(session.state.turn).toBe(1)
    expect(screenText(target)).toContain('Bo')

    unmount(app)
    target.remove()
  })

  it('drafts an animal card through the DOM', () => {
    const { session, target, app } = mountGame()
    ;[...target.querySelectorAll<HTMLButtonElement>('.clearing .slot')][0].click()
    flushSync()

    const plates = [...target.querySelectorAll<HTMLButtonElement>('.card-row .plate')]
    expect(plates).toHaveLength(5)
    const clickable = plates.filter((p) => !p.disabled)
    expect(clickable).toHaveLength(5)
    clickable[0].click()
    flushSync()
    expect(session.state.players[0].inProgress).toHaveLength(1)
    expect(screenText(target)).toContain('my cards (1/4)')

    unmount(app)
    target.remove()
  })
})
