# Strait of Hormuz — Visual Novel Design Patterns
## What Dating Sims and Japanese Text Games Get Right

---

## The Core Lesson

In Persona, you're not "managing social stats." You're hanging out with Ryuji after school and something he says makes you realize your Charm went up. In Ace Attorney, you're not "selecting the correct evidence from inventory." You're slamming your hands on the desk and yelling OBJECTION because you *read* the testimony and caught the lie yourself.

These games have the same underlying systems as yours — hidden stat checks, branching flags, resource management. But the player never feels like they're operating a dashboard. They feel like they're living a story.

Right now, Strait of Hormuz plays like a spreadsheet that occasionally shows you a headline. It should play like you ARE Trump sitting in the Situation Room at 2am, or you ARE Kushner on a private jet trying to close a deal before your exposure blows up in the Washington Post.

---

## 1. The "Route" Feeling — Each Character Is a Different Game [IMPLEMENTED]

### What Dating Sims Do
In dating sims, picking a character at the start doesn't just change your stats. It changes the ENTIRE STORY. Different events fire. Different characters appear. The tone shifts. Picking Makoto's route in Persona 5 is a completely different emotional experience from picking Ann's route. You replay the game to see the other stories.

### What You Have
Each character has:
- 4-5 unique decision events with chain follow-ups
- Unique resource with custom update logic
- Character-specific action variants in action-scenes.json
- Character-specific event flavor text in event-scenes.json (5 events have characterFlavor for all 5 chars)
- 3 unique epilogues each
- Morning brief variants per character
- Day-end reflections keyed to character × mood (105 total)
- Advisor dialogue with 11 reaction types per character
- **Character-voiced morning briefings** with 50 tension-tiered entries (10 per character)
- **Per-character overnight scenes** with mood-specific images (desperate/tense/neutral/confident)
- **Per-character event and action images** via CHARACTER_EVENT_IMAGES and CHARACTER_ACTION_IMAGES
- **Ambient scene images** driven by character state, crisis level, tension, and budget via getAmbientSceneImage()

The route differentiation is now strongly felt through voice, visuals, and narrative atmosphere across all game phases.

### What to Change

**Every screen should be filtered through your character's voice and perspective.**

The morning briefing shouldn't just report facts — it should report facts *the way your character would hear them*:

```
TRUMP MORNING:
"The ratings — your approval — are at 58. Could be better. Should
be better. Fox is running the tanker footage on loop, which is good
for you, but CNN is doing their thing. Oil's at $112. Your people
are feeling it at the pump. Hegseth wants to talk about the carrier
group. He's got that look — the one where he wants to blow something
up. You've got 3 moves today. Make them count."

KUSHNER MORNING:
"Your morning starts with a text from MBS at 4:47am Riyadh time.
Just a link to a Financial Times article about oil prices — no
comment. That's his way of telling you the clock is ticking.
Exposure is at 34 — manageable, but the Post has been asking
questions about the Oman meeting. You have a window today. Three
actions. Every one of them is visible."

ASMONGOLD MORNING:
"Chat is already going wild. Someone clipped yesterday's Iran take
and it's trending on Twitter with 2.3M views. Your credibility is
at 62 — solid, but one bad prediction tanks it. The subreddit
megathread has 14,000 comments. Top post: 'he's actually going to
get us into a war from his gaming chair.' You've got 3 actions.
Stream's live. Everyone's watching."
```

Same underlying data (approval=58, oil=112, AP=3). Completely different experience. The player feels like they ARE that person.

**Status:** characterOpenings in briefings.json now has 50 tension-tiered briefings (10 per character with highTension, lowApproval, budgetCrisis, etc. keys). These feed into the morning briefing system as the primary character voice.

---

## 2. Affinity / Trust as Emotional Core — Not Just a Number [PARTIAL]

### What Dating Sims Do
The relationship stat in a dating sim isn't just a threshold check. It changes how the character TALKS to you. At low affinity, they're cold or formal. At medium, they open up. At high, they're vulnerable, they confide in you, they show a side nobody else sees. The stat change is invisible — you only know it changed because the dialogue shifted.

### Apply This to Your Advisor/Character Dynamic

Your character's unique resource (Political Capital, Command Authority, Exposure, Credibility, Base Enthusiasm) should change how the CHARACTER talks to the PLAYER, not just when they win or lose.

Think of it as your character's internal state — how they're feeling about their own situation:

```
HEGSETH — Command Authority: 80+ (confident)
"[Hegseth leans back in his chair, arms crossed, almost smiling]
'We've got this. The fleet's in position, the chain of command is
clean, and Tehran knows it. Every time they test us, we push back
harder. That's how you win.'"

HEGSETH — Command Authority: 40-60 (strained)
"[Hegseth's jaw tightens. He's reading something on his tablet he
doesn't want you to see.]
'There's... chatter. Some of the brass don't love the timeline.
I've got it handled. But I need you to back me in the next briefing.
Publicly.'"

HEGSETH — Command Authority: <25 (desperate)
"[Hegseth catches you in the hallway. He looks like he hasn't slept.]
'They're going around me. The Joint Chiefs are briefing the Hill
directly. If I lose the room tomorrow, this whole strategy falls
apart. I need an override. I need YOU to walk in there and tell
them I have your full backing. Can you do that?'"
```

Same character. Same game state. But the player FEELS the resource dropping because the character's behavior changed. They didn't check a number — they read a scene and thought "oh no, Pete's losing it."

**Current status:** advisorReactions in dialogue.json has per-character lines for highTension, lowApproval, seizure, diplomatic, victory, lowBudget, highProxy, uniqueResourceLow, and uniqueResourceCritical. This gives 2 tiers for the unique resource (low and critical). Expanding to 4-5 tiers per character would make the dialogue degrade/improve more smoothly as the resource moves.

---

## 3. The "Common Route vs. Character Route" Structure [PARTIAL]

### What Visual Novels Do
Most VNs have a "common route" — shared events everyone sees early on — that branches into "character routes" as your choices accumulate. The branching isn't one decision. It's the SUM of your decisions pulling you toward a specific narrative path. You don't choose a route. You drift into one.

### Apply This to Story Arcs

Your 10 story arcs (the_spark through resolution) currently progress purely by day count. Everyone hits the same arcs on the same days regardless of playstyle. This makes the game feel linear.

**Redesign: Branch the mid-to-late arcs based on player behavior.**

Keep the early arcs shared (days 1-21: the_spark, the_squeeze, diplomatic_window). These establish the crisis and teach mechanics. But from day 22 onward, let the player's cumulative choices fork the narrative:

```
                       COMMON ROUTE (Days 1-21)
                    the_spark → the_squeeze → diplomatic_window
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              HAWK ROUTE      DIPLOMAT ROUTE    DOVE ROUTE
           (warPath ≥ 2,     (dipCap > 50,    (warPath = 0,
           tension > 60)     back_channel     tension < 40)
                    │          active)              │
                    │               │               │
            proxy_war_arc    negotiation_arc   withdrawal_arc
            arms_race_arc    summit_arc        isolation_arc
            final_strike     grand_bargain     managed_exit
```

The player doesn't see these labels. They just notice that the events are shifting to match their playstyle. A hawkish Trump player gets carrier battle events and Pentagon power struggles. A diplomatic Kushner player gets backchannel intrigue and Gulf state summits. A dovish Fuentes player gets domestic pressure and withdrawal logistics.

This is what makes VN players say "I need to replay this" — the sense that there's a completely different story hiding behind different choices.

**Current status:** Story flags exist for branching and arc transitions fire full-screen chapter overlays, but the arcs don't yet fork based on cumulative hawk/diplomat/dove tendency. The event infrastructure supports condition checks; the remaining work is skewing event conditions so that certain clusters become much more likely based on playstyle.

---

## 4. Confession Scenes / Peak Emotional Moments [PARTIAL]

### What Dating Sims Do
Every route has a "confession scene" — a peak emotional moment where the relationship crystalizes. Everything before it was building to this. Everything after it flows from this. In Persona, it's the moment a Confidant reaches Rank 10. In Ace Attorney, it's the final OBJECTION that breaks the case open. These scenes are LONG. They're full of text. They take 5-10 minutes to read. And they're the reason people remember the game.

### Apply This to Your Character Arcs

Each character's unique event chain should build toward a peak scene around days 40-55. This is where the character reveals their real motivation, the stakes become personal, and the player makes a defining choice that locks in their route to the ending.

Examples:

```
TRUMP — T03_political_capital_crisis (day 40-65)
The scene shouldn't just be "your political capital is low, pick
an option." It should be a long, multi-paragraph scene where
Trump is alone in the residence at night, watching himself on
Fox, and for one moment the mask slips. He talks about legacy.
He talks about what it means if this goes wrong. The player's
choice — double down on spectacle or pivot to substance —
defines the rest of the playthrough.

KUSHNER — K03_riyadh_summit (major deal event)
This is Kushner's confession scene. He's in Riyadh, the deal is
on the table, and the scene should make the player feel the
weight of what they're trading. A long, atmospheric passage
about the hotel suite, the desert outside, MBS's expression
when the number is named. The choice — take the deal and all its
compromises, or walk away — defines everything after.

ASMONGOLD — A03_credibility_test
The moment the internet turns on you. Chat is calling you a
fraud. A major OSINT find turns out to be wrong. The scene should
be Asmongold alone at his desk, reading the hate, and the player
choices are about who this person actually is underneath the
persona. Lean into the character or break the fourth wall.
```

These scenes should be the LONGEST text in the game. 500-800 words minimum. The player should spend 2-3 minutes reading. No timers. No countdown. Just text and a choice that matters.

**Current status:** Kushner's K05-K07 conspiracy arc is the closest to a full "confession scene" with multi-part narrative buildup. Other characters don't yet have equivalent deep story chains. The event-scenes.json character events still use the same scene/consequence structure as generic events — peak scenes need their own expanded format with multiple paragraphs, internal monologue, environmental description, and heavy choices.

---

## 5. Slice-of-Life Moments Between Crises [IMPLEMENTED]

### What Japanese Games Do
Persona doesn't go from dungeon to dungeon without breaks. Between palace infiltrations, you go to school, eat ramen, study in the library, hang out on the roof. These quiet moments make the intense moments hit harder. They also make the world feel real — you're not just a crisis manager, you're a person who exists in a world.

### Apply This to Overnight / Morning Transitions

Right now the overnight phase is just a gauge summary. It should be a SCENE. A human moment.

```
TRUMP — Low Tension Night:
"You call Melania at 11pm. She doesn't pick up. You watch the end
of Hannity — they ran your carrier footage, good angle — and eat
two scoops of ice cream standing at the kitchen counter. The
residence is quiet. Tomorrow the IRGC will do something. They
always do something. But tonight, the numbers look good."

KUSHNER — High Exposure Night:
"The FT reporter's email sits in your inbox. 'We're running the
Oman story Tuesday with or without comment.' Your thumb hovers
over the phone. You could call the editor. You could call Jared
Stern at the Post and trade something bigger. You could do nothing
and hope it dies. You pour a glass of water and stare at the
DC skyline. The Washington Monument is lit up like a needle."

ASMONGOLD — After a Wrong Prediction:
"You end the stream without the usual raid. Just 'see you tomorrow'
and kill the feed. The sub count dropped by 800 during the broadcast.
Your Discord is a war zone — half the mods are fighting the other
half. You heat up leftover pizza and open a private browser tab to
check if anyone noticed the prediction was wrong yet. They noticed."
```

**Current status:** Overnight scenes are now fully expanded. CHAR_OVERNIGHT in ui.js has mood-specific images (desperate/tense/neutral/confident) for all 5 characters. day-endings.json has expanded reflections keyed by character. getAmbientSceneImage() in narrative.js provides state-driven contextual images during these transitions based on crisis level, character state, tension, and budget.

---

## 6. The "Affection Gift" Mechanic → Strategic Card Dedication [IMPLEMENTED]

### What Dating Sims Do
Giving gifts to a character isn't just "increase stat." The character reacts. They say something. If it's the right gift, they light up. If it's wrong, they're disappointed. The feedback is TEXTUAL and EMOTIONAL, not numerical.

### Apply This to Strategy Card Selection

When the player picks a strategy card to activate, the character should react based on whether it aligns with their worldview:

```
FUENTES picks "Gulf Coalition" (one of his restricted cards):
→ Can't pick it. But the restriction should be NARRATIVE:
"[Fuentes slams his hand on the desk] 'A coalition? With who? The
Saudis? The Emiratis? These are the people we should be cutting off,
not making deals with. The base didn't put us here to be globalists.
Next option.'"

HEGSETH picks "Carrier Strike" at HIGH funding:
"[Hegseth's eyes light up. He actually grins.] 'Now we're talking.
Full strike posture. The Lincoln, the Truman, everything we've got.
Let Tehran see what a real navy looks like. This is what I came here
to do.'"

KUSHNER picks "Targeted Sanctions":
"[Kushner pauses, choosing his words carefully] 'Sanctions work. But
they take time, and they make the back-channel harder. Every sanction
we add is a card MBS plays against us in the next call. I'll support
it. Just... know what it costs on the other side of the table.'"
```

**Current status:** cardReactions in dialogue.json has been updated with 75 lines (5 characters × 5 categories × positive/reluctant variants). When a card is selected, the character reacts in voice before the card activates.

---

## 7. The Save/Replay Hook — "What If I Had..." [TODO]

### What Visual Novels Do
VNs make you want to replay by showing you WHAT YOU MISSED. After an ending, many VNs show a route completion percentage, unlocked CG gallery entries, or a flowchart showing branches you didn't take. This creates the "what if I had picked the other option" feeling that drives replays.

### Apply This to the Epilogue

After the game ends (win or lose), show:

```
EPILOGUE SCREEN:

[Character epilogue text — you already have 3 per character]

CAMPAIGN SUMMARY:
  Days survived: 67
  Decisions made: 23
  Seizures: 4
  Intercepts: 7
  Peak tension: 89 (Day 34)

YOUR PATH: The Hawk's Gambit
  [Shows which story arc branch you went down]

ROADS NOT TAKEN:
  ✗ You never opened a back-channel with Tehran
  ✗ The Riyadh Summit was available but you missed the conditions
  ✗ Asmongold's OSINT discovery could have changed everything
  ✗ There was a ceasefire option on Day 41 you didn't see

OTHER ENDINGS: 2 of 6 unlocked
  ✓ Military Victory
  ✓ Removed from Office
  ✗ ???
  ✗ ???
  ✗ ???
  ✗ ???
```

The "Roads Not Taken" section is the key VN mechanic — showing the player that a completely different story existed based on choices they didn't make. This transforms a single playthrough into a reason to play again as a different character or with a different strategy.

**Current status:** Not yet implemented. The epilogue shows character epilogue text and campaign stats, but does not yet surface missed branches, hidden endings, or alternative paths.

---

## 8. Silence as a Design Tool [IMPLEMENTED]

### What Japanese Games Do
In Ace Attorney, after a critical revelation, the music stops. The screen holds. No text advances for 2-3 seconds. Then the next line hits.

In Danganronpa, when a character dies, there's a beat of pure silence before the execution animation. That silence is louder than any sound effect.

### Apply This to Crisis Moments

When a crisis event fires (nuclear_threshold, carrier_hit, friendly_fire, etc.), don't immediately blast the klaxon and drop the red modal. Instead:

```
1. The narrative feed goes quiet. No new entries for 2 seconds.
2. The background music fades to silence over 1 second.
3. A single line appears in the feed:

   [FLASH TRAFFIC]

4. One more second of silence.

5. Then the scene text begins, line by line, with 400ms delays:

   "At 0347 local time, the USS Bataan detected an inbound
    anti-ship missile on radar."

   "The CIWS engaged automatically."

   "It missed."

6. THEN the klaxon. THEN the crisis modal with choices.
```

The silence makes the crisis land harder than any amount of red flashing UI chrome. The player was reading, then the reading stopped, then something terrible appeared one line at a time. That's how VNs create tension — by controlling the PACE of text delivery.

**Current status:** Idle asides are implemented — 50 idle asides (10 per character) are wired into _pushAmbientContent() at 20% chance during quiet moments, creating those "silence before the storm" beats. Full crisis-moment silence sequences (music fade, feed pause, line-by-line text delivery) are not yet implemented for major events.

---

## 9. Implementation Priority

Ordered by how much each change transforms the player experience:

### Tier 1 — Changes Everything
1. **Character-voiced morning briefings** [IMPLEMENTED] — characterOpenings in briefings.json has 50 tension-tiered briefings (10 per character with highTension, lowApproval, budgetCrisis, etc. keys). These feed into the morning briefing system as the primary character voice.
2. **Resource-based dialogue shifts** [PARTIAL] — advisorReactions in dialogue.json has per-character lines for 11 reaction types including uniqueResourceLow and uniqueResourceCritical. Currently 2 tiers; expanding to 4-5 tiers would make the degradation/improvement smoother.
3. **Peak character scenes** [PARTIAL] — Kushner's K05-K07 conspiracy arc is the closest to a full confession scene. Other characters' T03/A03/H03/F03 events still need expansion into long-form atmospheric narrative moments.

### Tier 2 — Creates Replay Value
4. **Playstyle-branching arcs** [PARTIAL] — Story flags and arc transition splashes (full-screen chapter overlays) exist, but arcs don't yet fork based on cumulative hawk/diplomat/dove tendency.
5. **Overnight scenes** [IMPLEMENTED] — CHAR_OVERNIGHT in ui.js has mood-specific images (desperate/tense/neutral/confident) for all 5 characters. day-endings.json has expanded reflections keyed by character. getAmbientSceneImage() provides state-driven contextual images.
6. **Epilogue "Roads Not Taken"** [TODO] — Not yet implemented. Post-game does not yet surface missed branches, hidden endings, or alternative paths.

### Tier 3 — Polish and Immersion
7. **Card selection reactions** [IMPLEMENTED] — cardReactions in dialogue.json updated with 75 lines (5 chars × 5 categories × positive/reluctant variants).
8. **Silence before storms** [IMPLEMENTED] — 50 idle asides (10 per character) wired into _pushAmbientContent() at 20% chance during quiet moments. Full crisis-moment silence sequences (music fade, line-by-line delivery) for major events are not yet implemented.
9. **Restriction as character voice** [TODO] — Restricted cards are still greyed out mechanically. Characters don't yet refuse narratively in their own voice.
10. **Scene panel atmosphere** [IMPLEMENTED] — getAmbientSceneImage() in narrative.js is state-driven, showing contextual images based on crisis level, character state, tension, budget, etc.
11. **Arc transition splashes** [IMPLEMENTED] — Full-screen chapter overlays fire when story arc changes.
12. **Character-specific event/action images** [IMPLEMENTED] — CHARACTER_EVENT_IMAGES and CHARACTER_ACTION_IMAGES provide per-character visual identity throughout gameplay.

---

## Content Needs

| Content Type | Status | Remaining Work | Priority |
|-------------|--------|----------------|----------|
| Character-voiced morning briefs (5 chars × 10 situations) | ✅ DONE — 50 tension-tiered briefings in briefings.json | — | Tier 1 |
| Resource-tier dialogue (5 chars × 4 tiers) | PARTIAL — 2 tiers exist (low, critical) | ~10 new passages for 4-5 tier coverage | Tier 1 |
| Peak character scenes (5 chars × 1 scene each) | PARTIAL — Kushner K05-K07 done | 4 long-form scenes (500-800 words each) for other chars | Tier 1 |
| Overnight atmosphere scenes (5 chars × moods) | ✅ DONE — mood-specific images + expanded reflections | — | Tier 2 |
| Card selection reactions (5 cats × 5 chars × variants) | ✅ DONE — 75 lines in dialogue.json | — | Tier 3 |
| Card restriction refusals (per char restricted cards) | Not started | ~15-20 short voice lines | Tier 3 |
| Post-game "Roads Not Taken" hints | Not started | ~30 conditional hint texts | Tier 2 |
| Idle asides (10 per character) | ✅ DONE — 50 asides in _pushAmbientContent() | — | Tier 3 |
| Scene panel atmosphere images | ✅ DONE — getAmbientSceneImage() state-driven | — | Tier 3 |
| Character event/action images | ✅ DONE — CHARACTER_EVENT_IMAGES + CHARACTER_ACTION_IMAGES | — | Tier 3 |
| Arc transition splashes | ✅ DONE — full-screen chapter overlays | — | Tier 2 |

---

## The Feeling We're After

The player picks Trump. They don't feel like they're "playing the Trump character in a policy sim." They feel like they're inside Trump's head during the worst week of his presidency. The morning briefing sounds like his internal monologue. The advisor talks to them the way people talk to Trump. When Political Capital drops, they don't notice a number changing — they notice that people in the room stopped making eye contact.

Then they finish, see the epilogue, see that Kushner's route exists with a completely different story, and immediately start a new game.

That's what dating sims get right. The system is invisible. The character is everything.
