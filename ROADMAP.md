# SAAGAR — what is left from the master prompt

Status verified by grepping the shipped code on 14 October 2026.
Live: 51 pages, deployed to Cloudflare Pages `saagar-hub` → sagardahal123.com.np.

## Done

- [x] Clay theme on every page, header/footer, 13 games, 25 tools, skills, Nepal laws
- [x] Google AdSense loader on every page (deliberately **not** on 404.html), `ads.txt`,
      `google-adsense-account` meta, sitemap, robots
- [x] Trust pages: About, Contact, Terms, Community rules, Report, Privacy (AdSense review set)
- [x] Dark/light, text size, **lite mode**, Nepali/English switch (`assets/settings.js`)
- [x] PWA: manifest, service worker with offline shell, generated 192/512/maskable icons
- [x] Clay mascot, 4 poses (`assets/mascot.js`)
- [x] Sound engine, one file, full sound map (`assets/sound.js`) — hooked into dice rolls,
      turn ding, toasts and site-wide tap pop
- [x] Daily challenge: 5 questions/day (3 Nepal GK + 2 logic), midnight Nepal reset,
      streaks, XP, levels, badges, emoji share, 1080×1080 share card (`assets/daily.js`)
- [x] Rooms, lobby, text chat, quick reactions, voice (PeerJS), room QR
- [x] Play-money-only notices (games hub + Teen Patti) for gambling-policy safety
- [x] Cache busting + tuned headers (Cloudflare serves assets with a 4-hour cache)

## Phase 3 — games: feel (half done)

- [ ] Wire game moments to sound: piece hops, captures, home arpeggio, coin pockets,
      queen chime, checker toks, Connect 4 thunk, pencil pop, RPS reveal
- [ ] Shared animation helpers: hop, squash, shake, pulse, glow, confetti, floating “+1”
- [ ] Pieces hop cell by cell; captured pieces fly home; coins slide with friction;
      cards fly and flip in 3D; dice land on the logic-produced number
- [ ] Snakes & Ladders: 5 snakes + 5 ladders, no crossings, S-shaped snakes in one SVG
      overlay (viewBox 0 0 100 100), dice 72px below the board, no title/timer overlap
- [ ] Board quality pass: Ludo (15×15, extruded pawns), Carrom, Teen Patti (felt, 64×92 cards)
- [ ] Mark “Featured” vs “Coming soon” on the games hub
- [ ] Desktop-only tilt cards
- [ ] Consolidate sounds: `assets/chat.js` still carries its own WAV generator
      (`makeSound`/`playSound`) from before the engine existed — fold it into
      `assets/sound.js` so there is one sound system, not two

## Phase 6 — rooms, voice, safety (partial)

- [ ] Managed WebRTC voice (LiveKit/Agora) behind one config switch — needs a service decision
- [ ] Global + per-room kill switch for chat and voice
- [ ] Monthly voice-minute counter: alert at 70%, auto voice-off at 95%
- [ ] Bad-word filter (Nepali, Roman Nepali, English) — not present in code
- [ ] Self-declared age group: under 16 → quick reactions only, voice off (currently only promised in text)
- [ ] Spectator mode, one-tap rematch, recent rooms list, host mute/kick UI checks
- [ ] Reports queue + banned devices + feature-flag panel (admin) — no admin exists yet

## Phase 7 — growth (started)

- [x] Daily challenge, streaks, XP, badges, share card
- [ ] Leaderboards: global, by district, by college/school, among friends
- [ ] Referral without money: invite friends to unlock badges and avatar items
- [ ] Clay avatar customisation
- [ ] PWA push notifications (opt-in after first completed game, never on first visit)
- [ ] Quizzes beyond the daily: “Know your rights”, “Which skill suits you?”, Nepal GK, Loksewa practice
- [ ] Seasonal themes (Dashain, Tihar, Holi, Baisakh 1) — none in code
- [ ] Community: Facebook/Viber links, feedback button, public changelog, feature voting
- [ ] Seasonal/weekly events with cosmetic-only rewards

## Phase 4/5 — tools and learn

- [ ] One shared tool template everywhere; central config for rates/fees/limits with source + “last updated”
- [ ] Per-tool: Copy / Download / Share buttons, “More tools”, “Take a break: play a game”
- [ ] Skills: roadmap cards → mini quiz → share card
- [ ] Laws: Situation / what the law says (act + dafa) / example / what to do / who to contact,
      with source, “last updated”, “needs verification” flags for anything unconfirmed
- [ ] Cover image / Open Graph image per game and per room

## Phase 8 — QA

- [ ] Lighthouse mobile before/after on the heaviest pages (ludo 69 KB gzipped is the worst)
- [ ] Reduced-motion and lite-mode test matrix
- [ ] A full played round of each of the 13 games on a 360px screen
- [ ] Security review: chat/room input sanitising, rate limits, room URL noindex
- [ ] Two-device voice test

## Not code — needs you

- [ ] AdSense dashboard: add/verify the domain, enable Privacy & messaging (GDPR/CCPA consent), Request review
- [ ] Nepali review: nav labels (`गृहपृष्ठ`, `औजार`, `खेल`, `दैनिक`, `सीप`, `कानुन`), `आवाज` (sound),
      and the नेपाली TL;DR blocks on the five trust pages
- [ ] Decide the voice service (LiveKit vs Agora) before Phase 6 voice work
- [ ] Confirm which games to mark “Featured” and which to park as “Coming soon”
