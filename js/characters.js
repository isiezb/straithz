/**
 * Characters — each is a completely different game mode
 * Unique resources, lose conditions, events, card pools, special actions
 */

function showTitleScreen() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.id = 'title-screen';
        overlay.innerHTML = `
            <img src="assets/title screen.png" class="title-art" alt="Strait Out of Hormuz">
            <div class="title-prompt">PRESS ANY KEY OR CLICK TO START</div>
        `;
        document.getElementById('game-container').appendChild(overlay);

        // Try to start music on interaction
        function dismiss() {
            const music = document.getElementById('bg-music');
            if (music) { music.volume = 0.3; music.play().catch(() => {}); }
            overlay.classList.add('fading');
            setTimeout(() => { overlay.remove(); resolve(); }, 600);
        }

        overlay.addEventListener('click', dismiss, { once: true });
        document.addEventListener('keydown', function handler() {
            document.removeEventListener('keydown', handler);
            dismiss();
        });
    });
}

const CHARACTERS = [
    {
        id: 'trump', name: 'Donald Trump', title: '45th & 47th President',
        spriteKey: 'portrait_trump', portraitImage: 'assets/trump.png', selectImage: 'assets/char-trump.png',
        ability: 'The Decider',
        abilityDesc: 'Gets ALL cards. 1.5x effects. 4 picks. WIN: Make America win BIG — high approval, oil flowing, low tension.',
        lore: 'February 28, 2026. You authorized the strike that killed Khamenei. 500 targets destroyed in a single night. Now Iran is retaliating with everything they have — 500 missiles, 2,000 drones, and the strait is closing. The Situation Room is yours. The world is watching. You started this. Now finish it.',

        // Unique resource
        uniqueResource: { id: 'politicalCapital', name: 'POLITICAL CAPITAL', value: 80, max: 100, color: '#ddaa44' },

        // Card pool rules
        cardPool: {
            allCards: true,        // Sees ALL cards, not category-filtered
            effectMultiplier: 1.5, // All card effects amplified
            maxPicks: 4,           // Picks 4 instead of 3
            restricted: [],
            exclusiveIds: ['art_of_deal'],
        },

        // Unique lose conditions
        scenario: {
            loseConditions: [
                {
                    id: 'congress_blocks',
                    check: (sim) => sim.uniqueResource <= 0,
                    message: 'Congress has blocked your authority. Your political capital is spent. The 25th Amendment is invoked.',
                },
                {
                    id: 'economic_meltdown',
                    check: (sim) => sim.oilPrice > 180 && sim.budget < 200,
                    message: 'Oil at $180/barrel. The economy is in freefall. Markets crash. Your presidency is over.',
                },
            ],
            winFlavor: 'The art of the deal — on a global scale. Nobody handles pressure like you.',
            winConditions: [
                {
                    id: 'win_big',
                    check: (sim) => sim.domesticApproval >= 75 && sim.oilFlow >= 70 && sim.tension < 35 && sim.day >= 14,
                    message: 'AMERICA WINS BIG. Oil is flowing, the base is ecstatic, and the world knows who solved the crisis. ' +
                        'The polls are through the roof. Trump rallies sell out coast to coast. "Nobody could have done what I did. Nobody."',
                },
            ],
        },

        // Unique events
        uniqueEvents: [
            {
                id: 'T01_fox_news_call', title: 'THE FOX NEWS CALL', image: 'assets/event-trump-fox.png',
                description: 'Fox & Friends is calling. They want you live in 10 minutes. A vintage Trump performance could rally the base — or start an international incident.',
                minDay: 5, maxDay: 15,
                condition: () => true,
                choices: [
                    { text: 'Go on Fox — vintage Trump', effects: { domesticApproval: 15, internationalStanding: -5, tension: 3 },
                      flavor: '"Iran is WEAK. We are STRONG. They will learn!" 40M views in 2 hours. Your staff is already doing damage control.',
                      setFlags: { fox_appearance: true } },
                    { text: 'Decline — stay presidential', effects: { domesticApproval: -8, politicalCapital: 5 },
                      flavor: 'Your team is shocked. Fox runs a segment questioning your "energy." Your base wonders what happened.' },
                    { text: 'Go on Fox but message Iran directly', effects: { tension: 8, diplomaticCapital: 5 },
                      flavor: '"Supreme Leader — if you\'re watching, and I know you are — call me." Unorthodox. But Iran\'s back-channel lights up.',
                      setFlags: { fox_iran_message: true }, chainEvent: 'T04_iran_backchannel', chainDelay: 4,
                      chainHint: 'Iran\'s back-channel is buzzing. Someone may respond...' },
                ],
            },
            {
                id: 'T02_deal_on_table', title: 'THE DEAL ON THE TABLE', image: 'assets/event-trump-deal.png',
                description: 'Your advisors have a framework: comprehensive grand deal with Iran. Sanctions relief, security guarantees, economic partnership. The Nobel Prize play.',
                minDay: 25, maxDay: 45,
                condition: () => SIM.budget > 300 && SIM.diplomaticCapital > 25,
                choices: [
                    { text: 'Go big — comprehensive grand deal', effects: { diplomaticCapital: -15, tension: -8, domesticApproval: -5 },
                      flavor: 'Everything on the table. If Iran engages, this changes everything. If not, humiliation.',
                      setFlags: { grand_deal_proposed: true }, chainEvent: 'T02_deal_response', chainDelay: 5,
                      chainHint: 'Iran is deliberating on your proposal...' },
                    { text: 'Start small — tanker release deal', effects: { diplomaticCapital: 10, tension: -5 },
                      flavor: 'A narrow deal on safe passage. Achievable. Your base asks "where\'s the big deal?"' },
                    { text: 'Announce on Truth Social first', effects: { domesticApproval: 12, diplomaticCapital: -10 },
                      flavor: 'Create public pressure on Iran. Diplomats despair. But 50M views forces Iran to respond.',
                      setFlags: { deal_leaked_truth_social: true } },
                ],
            },
            {
                id: 'T03_political_capital_crisis', title: 'POLITICAL CAPITAL CRISIS', image: 'assets/event-trump-rally.png',
                description: 'Congress is circling. Your political capital is hemorrhaging. Without a win soon, they\'ll pull the plug on your war spending.',
                minDay: 40, maxDay: 65,
                condition: () => SIM.uniqueResource < 20,
                choices: [
                    { text: 'Rally — you know how to work a crowd', effects: { politicalCapital: 20, domesticApproval: 10, internationalStanding: -5, budget: -15 },
                      flavor: 'Biggest rally since 2020. Swing state. "Nobody handles Iran like Trump!" The base erupts.' },
                    { text: 'Cut a deal with Congressional leadership', effects: { politicalCapital: 15, budget: -10, domesticApproval: 5 },
                      flavor: 'You give them a pet project. They give you support. Transactional. Effective.' },
                    { text: 'Fire someone — publicly, dramatically', effects: { politicalCapital: 12, domesticApproval: -5, fogOfWar: 5 },
                      flavor: 'Heads roll on live TV. The base loves it. Staff morale craters. Intel flow slows.' },
                ],
            },
            {
                id: 'T04_iran_backchannel', title: 'IRAN\'S BACK-CHANNEL RESPONSE', image: 'assets/event-trump-truth-social.png',
                description: 'Your Fox News message to Iran worked. Araghchi has responded through Omani intermediaries. A face-to-face is possible.',
                minDay: 10, maxDay: 25,
                condition: () => SIM.storyFlags?.fox_iran_message,
                choices: [
                    { text: 'Send Kushner as envoy', effects: { diplomaticCapital: 10, tension: -5, fogOfWar: 5 },
                      flavor: 'Secret meeting in a Gulf state. High-risk, high-reward. If leaked, it\'s a scandal.',
                      setFlags: { kushner_envoy_sent: true } },
                    { text: 'Official State Department channels', effects: { diplomaticCapital: 5, internationalStanding: 3 },
                      flavor: 'Proper channels. Slower but safer. Araghchi is disappointed by the bureaucracy.' },
                    { text: 'Ignore — let them stew', effects: { tension: 5, politicalCapital: 3 },
                      flavor: 'You sent the message. They received it. Let them wonder. Channel stays open.' },
                ],
            },
            {
                id: 'T02_deal_response', title: 'IRAN RESPONDS TO THE DEAL', image: 'assets/event-grand-bargain.png',
                description: 'Iran has responded to your grand deal proposal. Araghchi says the framework is "interesting but insufficient." Tangsiri says it\'s "American surrender theater."',
                minDay: 30, maxDay: 55,
                condition: () => SIM.storyFlags?.grand_deal_proposed,
                choices: [
                    { text: 'Sweeten the offer', effects: { tension: -10, domesticApproval: -8, diplomaticCapital: 15, iranAggression: -10 },
                      flavor: 'More sanctions relief. More guarantees. The deal takes shape. Hawks are furious.' },
                    { text: 'Walk away — they had their chance', effects: { tension: 8, domesticApproval: 8, iranAggression: 5 },
                      flavor: '"I made the best deal in history and they said no. Their loss." The base loves it.' },
                    { text: 'Leak Tangsiri\'s response to embarrass him', effects: { domesticApproval: 5, iranAggression: 8, diplomaticCapital: -5, fogOfWar: 5 },
                      flavor: 'The world sees Iran\'s hardliner blocking peace. Araghchi is furious at Tangsiri.' },
                ],
            },
        ],

        // Resource update logic (called daily)
        updateResource: function(sim) {
            // Political Capital drains when making controversial moves
            if (sim.tension > 60 && sim.domesticApproval < 50) sim.uniqueResource -= 2;
            if (sim.budget < 300) sim.uniqueResource -= 1;
            // Gains from high approval
            if (sim.domesticApproval > 70) sim.uniqueResource += 1;
            // Gains from decisive action (seizure intercepts)
            if (sim.interceptCount > 0) sim.uniqueResource += 0.5;
            sim.uniqueResource = Math.max(0, Math.min(100, sim.uniqueResource));
        },

        reactions: {
            weekStart: [
                "Let's make some deals. Big deals.",
                "Nobody handles pressure like me. Nobody.",
                "Iran is weak. They know it. We know it.",
            ],
            morningBrief: [
                "Mr. President, here's your Presidential Daily Brief for today.",
                "Good morning, Mr. President. The overnight situation report.",
                "Sir, your morning intelligence brief is ready.",
            ],
            highTension: "This is where we separate the winners from the losers. Stay strong.",
            lowApproval: "The fake news is killing our numbers. We need a win, and fast.",
            seizure: "They seized our tanker? That's an act of war. Hit them back. Hard.",
            diplomatic: "Talk is cheap. But sometimes you gotta talk before you deal.",
            victory: "We won. Biggest win in the history of the strait. Maybe ever.",
            lowBudget: "We're spending too much. Get the Gulf states to pay. They can afford it.",
            highProxy: "These proxy groups are Iran's puppets. Cut the strings.",
            uniqueResourceLow: "We're losing political capital fast. Congress is circling. Need a win.",
            uniqueResourceCritical: "Congress is about to pull the plug. Do something NOW.",
        },

        epilogues: {
            diplomatic: 'They said you couldn\'t do it. They said you were too unpredictable, too brash, too everything. And maybe they were right about all of that. But the deal is signed. Not the grand deal. You learned that grand deals are for Nobel speeches, not for the Persian Gulf. The deal that worked was smaller, uglier, full of compromises your base doesn\'t love and Iran\'s hardliners hate. But tankers are sailing. Oil is flowing. And on the cover of Time magazine, for the third time (but who\'s counting), is your face, with the headline: "The Deal Nobody Wanted." You frame it anyway.',
            military: 'The carrier group is coming home. You\'re on the flight deck for the photo op, obviously. The sailors love you. The polls love you. The defense contractors really love you. Iran\'s navy is functionally neutered, Tangsiri is under house arrest, and the strait is open under American escort. It cost more than anyone will publicly admit, in dollars, in standing, in the quiet funerals that didn\'t make the news. But you learned something in this crisis that surprised even you: sometimes the threat of the deal is more powerful than the deal itself. You\'ll never say that out loud, of course.',
            decline: 'The strait is technically open. Oil is technically flowing. Your approval is technically above water. Everything is technically fine. The deal you cut with Iran is held together by duct tape and mutual exhaustion. Your base pretends to celebrate. The media pretends to care. You pretend it was the plan all along. In the quiet of the Oval Office, you stare at the portrait of Andrew Jackson and think: he would have just blown the whole thing up. Maybe that would have been better. Maybe not. The Art of the Deal, it turns out, sometimes means the deal nobody wanted, including you.',
        },
    },
    {
        id: 'hegseth', name: 'Pete Hegseth', title: 'Secretary of War',
        spriteKey: 'portrait_hegseth', portraitImage: 'assets/pete.png', selectImage: 'assets/char-hegseth.png',
        ability: 'The Warhorse',
        abilityDesc: 'Command Authority resource. Military cards cost authority. WIN: Total war with public support — crush Iran.',
        lore: 'February 28, 2026. The joint strikes went perfectly — 500 targets, Supreme Leader eliminated. But Iran\'s response is unprecedented. Ballistic missiles are inbound. The strait is under siege. You\'ve trained for this your entire life. Two tours in Iraq. A Bronze Star. Now you command the largest naval buildup since 2003.',

        uniqueResource: { id: 'commandAuthority', name: 'COMMAND AUTH', value: 60, max: 100, color: '#dd4444' },

        cardPool: {
            allCards: false,
            effectMultiplier: 1.0,
            maxPicks: 3,
            militaryAuthorityCost: true, // Military cards cost authority
            restricted: [],
            exclusiveIds: ['shock_awe'],
        },

        // Special action: Override (-20 authority, force an immediate military effect)
        specialAction: {
            name: 'OVERRIDE',
            description: 'Force military action. Costs 20 Command Authority.',
            cost: { commandAuthority: 20 },
            cooldown: 0,
            cooldownMax: 14, // 2 weeks
            execute: function(sim) {
                sim.tension += 15;
                sim.iranAggression -= 12;
                sim.conflictRisk += 10;
                sim.warPath += 1;
                sim.domesticApproval += 5;
                addHeadline('SecDef overrides chain of command — direct military action ordered', 'critical');
            },
        },

        scenario: {
            loseConditions: [
                {
                    id: 'fired',
                    check: (sim) => sim.uniqueResource <= 10,
                    checkDays: 3,
                    _days: 0,
                    message: 'The Joint Chiefs have lost confidence. The President asks for your resignation. You\'re fired.',
                },
                {
                    id: 'court_martial',
                    check: (sim) => sim.warPath >= 4 && sim.internationalStanding < 20,
                    message: 'Your aggressive orders led to an international incident. The Hague is involved. You face a court martial.',
                },
            ],
            winFlavor: 'Mission accomplished, sir. The strait is secure. Outstanding work by our troops.',
            winConditions: [
                {
                    id: 'total_war_victory',
                    check: (sim) => sim.warPath >= 4 && sim.domesticApproval >= 55 && sim.iranAggression < 30 && sim.day >= 14,
                    message: 'TOTAL VICTORY. Iran\'s military capability is shattered. The American public stands behind the mission. ' +
                        'Pentagon brass call it "the most decisive military campaign since Desert Storm." Secretary Hegseth\'s war doctrine becomes textbook.',
                },
            ],
        },

        uniqueEvents: [
            {
                id: 'H01_pentagon_power_play', title: 'THE PENTAGON POWER PLAY', image: 'assets/event-hegseth-pentagon.png',
                description: 'Day one at the Pentagon. The Joint Chiefs are sizing you up. Every decision here sets the tone for your entire tenure.',
                minDay: 3, maxDay: 8,
                condition: () => true,
                choices: [
                    { text: 'Assert dominance — present your war plan', effects: { commandAuthority: 10, diplomaticCapital: -5, tension: 3 },
                      flavor: 'You call a full Joint Chiefs meeting and lay it out. Pentagon respects the energy but watches for overreach.' },
                    { text: 'Listen first — build relationships', effects: { commandAuthority: 5, diplomaticCapital: 5 },
                      flavor: 'Three days learning the command structure. Slower start but deeper foundation. Critics call you passive.' },
                    { text: 'Go to the carrier — be with the troops', effects: { commandAuthority: 8, domesticApproval: 10, fogOfWar: 5 },
                      flavor: 'Skip the briefing room. Be on the ship. Spectacular photo op. You missed important briefings though.' },
                ],
            },
            {
                id: 'H02_leak_from_within', title: 'THE LEAK FROM WITHIN', image: 'assets/event-e17-leak.png',
                description: 'Someone in the Pentagon is leaking your classified operational plans to the press. Your authority is being undermined from the inside.',
                minDay: 15, maxDay: 30,
                condition: () => SIM.uniqueResource < 40,
                choices: [
                    { text: 'Confront the suspect directly', effects: { commandAuthority: 10, fogOfWar: -5 },
                      flavor: 'Behind closed doors, military to military. 50/50 you got the right person. The leaks stop... or intensify.',
                      setFlags: { leak_confronted: true } },
                    { text: 'Formal investigation — by the book', effects: { commandAuthority: 5, diplomaticCapital: 5 },
                      flavor: 'Takes 5 days. Guaranteed to find the leaker. But the investigation itself generates embarrassing headlines.',
                      setFlags: { leak_investigation: true }, chainEvent: 'H02_leak_result', chainDelay: 5,
                      chainHint: 'The investigation will take several days...' },
                    { text: 'Leak something yourself — poison the well', effects: { diplomaticCapital: 5, fogOfWar: -3 },
                      flavor: 'Something true but useful. Make all leaks suspect. Clever but ethically questionable.' },
                ],
            },
            {
                id: 'H02_leak_result', title: 'INVESTIGATION RESULTS', image: 'assets/event-hegseth-pentagon.png',
                description: 'The formal investigation identified the leaker: a senior aide with connections to your political opponents.',
                minDay: 20, maxDay: 40,
                condition: () => SIM.storyFlags?.leak_investigation,
                choices: [
                    { text: 'Prosecute — send a message', effects: { commandAuthority: 15, domesticApproval: 5, polarization: 5 },
                      flavor: 'Court martial. The Pentagon watches. Leaks stop cold. But you\'ve made powerful enemies.' },
                    { text: 'Quiet reassignment', effects: { commandAuthority: 8, fogOfWar: -5 },
                      flavor: 'The leaker disappears to a desk in Alaska. No headlines. Problem solved.' },
                ],
            },
            {
                id: 'H03_shock_and_awe', title: 'SHOCK AND AWE MOMENT', image: 'assets/event-hegseth-shock-awe.png',
                description: 'The carriers are in position. Your war plan is ready. A massive coordinated strike could end Iran\'s ability to threaten the strait. This is what you trained for.',
                minDay: 30, maxDay: 50,
                condition: () => SIM.warPath >= 2 && SIM.uniqueResource > 50,
                choices: [
                    { text: 'Launch the full strike package', effects: { tension: 30, warPath: 3, iranAggression: -25, domesticApproval: 15, budget: -50, internationalStanding: -10 },
                      flavor: 'Operation Southern Strike. 500 sorties. Iranian naval capability shattered. The world holds its breath.' },
                    { text: 'Surgical strike — IRGC command center only', effects: { tension: 15, warPath: 1, iranAggression: -15, budget: -25, domesticApproval: 8 },
                      flavor: 'Precision over power. One target. Message sent without crossing the line.' },
                    { text: 'Stage it visibly but don\'t launch — the bluff', effects: { tension: 10, budget: -10, iranAggression: -10 },
                      flavor: 'Satellites will see the preparations. The ultimate bluff. If Iran calls it, you\'re exposed.' },
                ],
            },
            {
                id: 'H04_troop_morale', title: 'TROOP MORALE CRISIS', image: 'assets/event-hegseth-troops.png',
                description: 'Extended deployment is taking its toll. Sailors are exhausted. Maintenance crews are running on fumes. The fleet needs rest but the crisis isn\'t over.',
                minDay: 50, maxDay: 70,
                condition: () => SIM.day > 30,
                choices: [
                    { text: 'Visit every deployed unit personally', effects: { commandAuthority: 15, domesticApproval: 10 },
                      flavor: 'Two days of morale tours. The troops genuinely love this. Your advisors manage without you.' },
                    { text: 'Order R&R rotation', effects: { budget: -20, commandAuthority: 5, iranAggression: 3 },
                      flavor: 'Fresh crews in, tired ones home. Operational risk during transition but long-term gain.' },
                    { text: 'Plan a visible operational success', effects: { commandAuthority: 10, domesticApproval: 8, tension: 8 },
                      flavor: 'Give the troops a win. Morale through victory. If it works, it\'s brilliant. If it fails, devastating.' },
                ],
            },
        ],

        updateResource: function(sim) {
            // Authority regenerates slowly
            sim.uniqueResource += 0.5;
            // Military actions without results drain authority
            if (sim.tension > 50 && sim.interceptCount === 0 && sim.seizureCount > 0) sim.uniqueResource -= 1;
            // Successful intercepts boost authority
            if (sim.interceptCount > 0) sim.uniqueResource += 1;
            // Below 25: orders are delayed (simulated by reduced naval effectiveness)
            sim.uniqueResource = Math.max(0, Math.min(100, sim.uniqueResource));
        },

        reactions: {
            weekStart: [
                "Good morning, sir. Here's the tactical picture.",
                "Our forces are ready. Waiting on your orders.",
                "Let's review our options and make a decision.",
            ],
            morningBrief: [
                "Good morning, Mr. Secretary. Overnight SITREP on your desk.",
                "Sir, CENTCOM's morning operational update is in.",
                "Daily force readiness report, Mr. Secretary.",
            ],
            highTension: "Tension is high but our forces are disciplined. We've trained for this.",
            lowApproval: "Sir, the politics will sort themselves. Focus on the mission.",
            seizure: "That's a hostile act against commercial shipping. Rules of engagement are clear.",
            diplomatic: "I defer to State on diplomacy. But we keep our forces ready.",
            victory: "Mission accomplished, sir. The strait is secure. Outstanding work by our troops.",
            lowBudget: "We need to be smart about resource allocation. Prioritize force protection.",
            highProxy: "The proxy networks are a force multiplier for Iran. We need to degrade them.",
            uniqueResourceLow: "The brass is losing confidence. I need to show them results, fast.",
            uniqueResourceCritical: "The Joint Chiefs want my resignation. One more mistake and it's over.",
        },

        epilogues: {
            diplomatic: 'You never expected diplomacy to be your legacy. The war plans were ready. The carriers were in position. But somewhere between the third carrier group and the first ceasefire, you realized that the best victory is the one where your troops come home without a scratch. The Pentagon will never fully accept you, but the troops know. They know you were ready to fight and chose not to.',
            military: 'The Pentagon will never fully accept you. You know that. The old guard with their Ivy League degrees and their Clausewitz quotes will always see you as the TV guy who got lucky. But the troops know. The ones who were on the Eisenhower when the fast-boats came. The ones who heard your voice on the radio saying "weapons free" and trusted it. You walk the halls of the Pentagon now with a different kind of authority. Not the kind that comes from rings or stars, but the kind that comes from having been right when it mattered. Your memoir will be a bestseller. The chapter on Day 43 will be the one they excerpt.',
            decline: 'The strait is open but the cost was staggering. Your command authority eroded with every decision that didn\'t produce a clear win. The Joint Chiefs tolerate you now, which is worse than opposing you. The troops still salute, but the enthusiasm is gone. Your Fox News friends stop calling. The memoir deal shrinks. In the end, you managed the crisis without catastrophe, which is another way of saying you didn\'t lose badly enough for anyone to notice.',
        },
    },
    {
        id: 'kushner', name: 'Jared Kushner', title: 'Senior Advisor',
        spriteKey: 'portrait_kushner', portraitImage: 'assets/kushner.png', selectImage: 'assets/char-kushner.png',
        ability: 'The Operator',
        abilityDesc: 'Contacts & exposure system. Build trust, avoid leaks. WIN: Enrich yourself and build lasting relationships.',
        lore: 'February 28, 2026. The bombs are falling on Iran. Every Gulf leader has your personal number and they\'re all calling at once. MBS wants guarantees. MBZ wants a timeline. The strait is closing and the oil markets are in freefall. The Abraham Accords were just the beginning — now you need those relationships to prevent a regional catastrophe.',

        uniqueResource: { id: 'exposure', name: 'EXPOSURE', value: 10, max: 100, color: '#aa44dd', inverted: true },

        // Contacts system
        contacts: [
            { id: 'mbs', name: 'MBS (Saudi Arabia)', trust: 40, maxTrust: 100, unlockCard: 'saudi_deal' },
            { id: 'mbz', name: 'MBZ (UAE)', trust: 35, maxTrust: 100, unlockCard: 'uae_port_access' },
            { id: 'erdogan', name: 'Erdogan (Turkey)', trust: 15, maxTrust: 100, unlockCard: 'bosphorus_leverage' },
            { id: 'zarif', name: 'Araghchi (Iran Moderate)', trust: 5, maxTrust: 100, unlockCard: 'secret_channel' },
            { id: 'netanyahu', name: 'Netanyahu (Israel)', trust: 50, maxTrust: 100, unlockCard: 'mossad_intel' },
        ],

        cardPool: {
            allCards: false,
            effectMultiplier: 1.0,
            maxPicks: 3,
            restricted: ['missile_strike', 'active_intercept', 'shock_awe'], // No heavy military
            exclusiveIds: ['abraham_accords'],
        },

        scenario: {
            loseConditions: [
                {
                    id: 'exposed',
                    check: (sim) => sim.uniqueResource >= 80,
                    message: 'Your back-channel dealings are fully exposed. Congressional investigation. Criminal referral. Your career is over.',
                },
                {
                    id: 'two_leaks',
                    check: (sim) => (sim._leakCount || 0) >= 2,
                    message: 'Two major leaks. The press has everything. The President distances himself. You\'re radioactive.',
                },
            ],
            winFlavor: 'The relationships we built made this possible. This is just the beginning.',
            winConditions: [
                {
                    id: 'kushner_enrichment',
                    check: (sim) => sim.uniqueResource >= 55 && sim.diplomaticCapital >= 50 && sim.budget >= 400 && sim.day >= 14,
                    message: 'THE ART OF THE DEAL (FAMILY EDITION). Your back-channel relationships delivered a ceasefire — and a portfolio of Gulf state investments. ' +
                        'Kushner Industries quietly signs a $2B development deal with Saudi Arabia. "It was never about the money," you tell reporters. It was always about the money.',
                },
            ],
        },

        uniqueEvents: [
            {
                id: 'K01_mbs_calls', title: 'MBS CALLS', image: 'assets/event-kushner-mbs.png',
                description: 'Mohammed bin Salman is on the line. Just like old times. But now you\'re not just Jared — you\'re the one making decisions.',
                minDay: 3, maxDay: 8,
                condition: () => true,
                choices: [
                    { text: 'Speaker phone — team present', effects: { diplomaticCapital: 3, internationalStanding: 5 },
                      flavor: 'Transparent. MBS is cautious — he\'s used to private Jared, not official Jared. He shares less.',
                      contactEffect: { id: 'mbs', trust: 2 } },
                    { text: 'Take it alone — just like old times', effects: { fogOfWar: -10, diplomaticCapital: 5, exposure: 5 },
                      flavor: 'MBS opens up. He has intelligence on Iran that your CIA doesn\'t have. Staff worried about what you\'re not sharing.',
                      contactEffect: { id: 'mbs', trust: 8 } },
                    { text: 'Propose a Riyadh summit', effects: { diplomaticCapital: 10, exposure: 15 },
                      flavor: 'Bring all Gulf leaders to the table. Big play. Big exposure risk.',
                      contactEffect: { id: 'mbs', trust: 5 },
                      setFlags: { riyadh_summit_proposed: true }, chainEvent: 'K03_riyadh_summit', chainDelay: 7,
                      chainHint: 'Summit preparations will take about a week...' },
                ],
            },
            {
                id: 'K02_exposure_spikes', title: 'EXPOSURE METER SPIKES', image: 'assets/event-kushner-exposure.png',
                description: 'A Washington Post investigation is connecting the dots on your back-channel communications. Your exposure is dangerously high.',
                minDay: 20, maxDay: 40,
                condition: () => SIM.uniqueResource > 50,
                choices: [
                    { text: 'Get ahead of it — press conference', effects: { domesticApproval: 5, exposure: -10 },
                      flavor: 'Frame your back-channel work as strategic genius. If your credibility holds, you control the narrative.' },
                    { text: 'Go dark — cancel all appearances', effects: { exposure: -5, domesticApproval: -3 },
                      flavor: 'Let the story die. Opponents fill the vacuum with their narrative.' },
                    { text: 'Leak your own successes anonymously', effects: { exposure: -8, domesticApproval: 5, internationalStanding: 3 },
                      flavor: 'Plant stories about breakthroughs without fingerprints. If traced: catastrophic.',
                      setFlags: { planted_stories: true } },
                ],
            },
            {
                id: 'K03_riyadh_summit', title: 'THE RIYADH SUMMIT', image: 'assets/event-kushner-summi.png',
                description: 'Gulf leaders are gathered in Riyadh. MBS is hosting. The eyes of the world are on this room. This is your Abraham Accords moment.',
                minDay: 15, maxDay: 30,
                condition: () => SIM.storyFlags?.riyadh_summit_proposed,
                choices: [
                    { text: 'Push for joint Gulf statement against Iran', effects: { internationalStanding: 15, diplomaticCapital: 10 },
                      flavor: 'Unity signal. Iran is isolated. The statement makes front pages worldwide.',
                      contactEffect: { id: 'mbs', trust: 10 } },
                    { text: 'Private bilateral meetings — hallway diplomacy', effects: { diplomaticCapital: 10, fogOfWar: -5 },
                      flavor: 'The real work happens in hallways. No public statement but quiet progress on every front.',
                      contactEffect: { id: 'mbs', trust: 5 } },
                    { text: 'Propose economic framework — Abraham Accords II', effects: { diplomaticCapital: 15, exposure: 10, domesticApproval: 5 },
                      flavor: 'Gulf investment for US security guarantees. The big swing. This is what you came for.',
                      setFlags: { abraham_accords_2: true } },
                ],
            },
            {
                id: 'K04_araghchi_gambit', title: 'ARAGHCHI\'S GAMBIT', image: 'assets/vent-kushner-zarif.png',
                description: 'Iran\'s Foreign Minister Araghchi is offering a comprehensive framework through intermediaries. But he needs something concrete: a sanctions concession.',
                minDay: 35, maxDay: 55,
                condition: () => {
                    const c = SIM.character?.contacts?.find(c => c.id === 'zarif');
                    return c && c.trust >= 30;
                },
                choices: [
                    { text: 'Meet secretly — accept the risk', effects: { diplomaticCapital: 15, tension: -10, iranAggression: -8, exposure: 15 },
                      flavor: 'Three hours in a Muscat hotel room. This could end the crisis or end your career.',
                      contactEffect: { id: 'zarif', trust: 15 },
                      setFlags: { araghchi_meeting: true }, chainEvent: 'K04_framework', chainDelay: 4,
                      chainHint: 'Araghchi will take the framework back to Tehran...' },
                    { text: 'Demand proof first — release the hostages', effects: { diplomaticCapital: -5, tension: 3 },
                      flavor: 'Test if he actually has power. 40% he delivers a breakthrough. 60% the channel weakens.',
                      contactEffect: { id: 'zarif', trust: -5 } },
                    { text: 'Record the meeting secretly — insurance', effects: { exposure: 5, fogOfWar: -5 },
                      flavor: 'You gain leverage. If discovered, all contacts lose trust and exposure explodes.',
                      setFlags: { secret_recording: true } },
                ],
            },
            {
                id: 'K04_framework', title: 'THE FRAMEWORK RESPONSE', image: 'assets/event-envoy.png',
                description: 'Araghchi brought your framework to Tehran. Mojtaba is skeptical. Tangsiri is hostile. But the moderates see an opening.',
                minDay: 40, maxDay: 60,
                condition: () => SIM.storyFlags?.araghchi_meeting,
                choices: [
                    { text: 'Push forward — more concessions', effects: { tension: -15, iranAggression: -12, domesticApproval: -10, diplomaticCapital: 20 },
                      flavor: 'The framework solidifies. Hawks scream betrayal. But the guns go quiet.' },
                    { text: 'Hold firm — no more concessions', effects: { tension: -5, diplomaticCapital: 5 },
                      flavor: 'Progress stalls. Araghchi is frustrated but the channel survives.' },
                    { text: 'Publicize the framework — force Iran\'s hand', effects: { domesticApproval: 8, exposure: 20, tension: 5, diplomaticCapital: -10 },
                      flavor: 'The world knows. Iran must respond publicly. Araghchi is burned.' },
                ],
            },
        ],

        updateResource: function(sim) {
            // Exposure naturally grows when operating
            if (sim.diplomaticCapital > 50) sim.uniqueResource += 0.3;
            // Decays slightly when quiet
            if (sim.tension < 30) sim.uniqueResource -= 0.2;
            sim.uniqueResource = Math.max(0, Math.min(100, sim.uniqueResource));
        },

        reactions: {
            weekStart: [
                "I've been on the phone with Riyadh and Abu Dhabi. Here's where things stand.",
                "The key is relationships. Let me tell you what I'm hearing.",
                "There's an opportunity here if we play it right.",
            ],
            morningBrief: [
                "Your overnight diplomatic traffic summary, sir.",
                "Three missed calls from Gulf capitals. Here's the brief.",
                "Back-channel status update and morning intelligence digest.",
            ],
            highTension: "High tension, but I have a back-channel that might help. Let me work it.",
            lowApproval: "The numbers aren't great, but a diplomatic win would turn this around fast.",
            seizure: "This is a provocation. But it's also leverage. Let's use it at the table.",
            diplomatic: "This is where we shine. I know these people. They'll listen.",
            victory: "The relationships we built made this possible. This is just the beginning.",
            lowBudget: "MBS owes us a favor. Let me make a call about cost-sharing.",
            highProxy: "The Saudis can handle the Houthis if we give them the right incentives.",
            uniqueResourceLow: "We're flying under the radar. Good. Keep it that way.",
            uniqueResourceCritical: "Someone is leaking. If my exposure gets any higher, this all falls apart.",
        },

        epilogues: {
            diplomatic: 'Nobody knows what you did. That\'s the point. The framework that ended the crisis has seven signatories and zero fingerprints. The Omani intermediary got a medal. Araghchi got promoted. MBS got the security guarantee he wanted. And you got what you always get: the satisfaction of having been in the room when it happened, and the quiet knowledge that without you, there would have been no room. Your exposure meter, miraculously, peaked and receded. The investigations found nothing because there was nothing to find. Just a man making phone calls. Abraham Accords II will be the official name, though the actual accord looks nothing like what you originally envisioned. It\'s better. It\'s real.',
            military: 'The back-channels went silent when the bombs started falling. Every contact you built, every trust you earned, every whispered conversation in hotel lobbies across the Gulf — all of it evaporated in the first strike package. MBS stopped returning calls. Araghchi disappeared. The framework you spent weeks building became classified wreckage. But the military victory happened anyway, and you survived, which in Washington is its own kind of win. The exposure never quite caught you. The investigations found shadows, not substance. You\'ll be back.',
            decline: 'The contacts are still there, technically. MBS texts occasionally. The Omani intermediary sends holiday greetings. But the grand framework — the Abraham Accords II, the thing that was going to change everything — never quite materialized. The strait is open. The crisis is managed. Your exposure meter settled at a level that\'s uncomfortable but not fatal. In the end, the shadow diplomat cast no shadow at all. Just a man who almost changed the world, and settled for keeping it from getting worse.',
        },
    },
    {
        id: 'asmongold', name: 'Asmongold', title: 'Streamer & Analyst',
        spriteKey: 'portrait_asmongold', portraitImage: 'assets/asmongold.png', selectImage: 'assets/char-asmongold.png',
        ability: 'The Analyst',
        abilityDesc: 'Credibility resource. Intel Feed mini-game. WIN: Be right about everything — high credibility, low fog, public loves you.',
        lore: 'February 28, 2026. Chat, this is not a drill. The US just killed Iran\'s Supreme Leader. 2,000 drones are inbound. The strait is closing. Your 14-hour stream analyzing leaked Pentagon documents got you here — now the Joint Chiefs are asking YOUR assessment of Iran\'s response. The intel is flooding in faster than anyone can process. Except you.',

        uniqueResource: { id: 'credibility', name: 'CREDIBILITY', value: 50, max: 100, color: '#4488dd' },

        // Intel Feed templates (populated each week)
        intelTemplates: {
            signals: [
                'IRGC naval assets repositioning near Larak Island',
                'Intercept: IRGC commander orders mine deployment in shipping lane',
                'Satellite imagery shows missile battery activation at Bandar Abbas',
                'Unusual encrypted traffic from IRGC Quds Force HQ',
                'Iranian submarine leaving port — unusual departure pattern',
                'HUMINT: Moderate faction planning internal challenge to IRGC',
                'Chinese oil tanker diverted from Iranian port — sanctions working',
                'Russian cargo vessel entered Bandar Abbas with military containers',
            ],
            noise: [
                'Fishing boats spotted near oil platform — probably just fishing',
                'Static burst on encrypted channel — likely equipment malfunction',
                'Unverified Twitter rumor about Iranian troop movements',
                'Satellite pass shows normal port activity at Bushehr',
                'Commercial shipping radar contact — false alarm',
                'Intercepted call mentions "package" — context unclear',
                'Social media post from Iranian soldier — personal, not operational',
                'Weather satellite data shows storm approaching strait',
                'Routine Iranian naval exercise announced via public channels',
                'AI-generated deepfake of Iranian general circulating on Telegram',
            ],
        },

        cardPool: {
            allCards: false,
            effectMultiplier: 1.0,
            maxPicks: 3,
            restricted: ['missile_strike', 'carrier_strike', 'shock_awe'], // Limited military
            exclusiveIds: ['osint_flood'],
        },

        scenario: {
            loseConditions: [
                {
                    id: 'no_credibility',
                    check: (sim) => sim.uniqueResource <= 5,
                    checkDays: 3,
                    _days: 0,
                    message: 'Your credibility is gone. The Joint Chiefs stop answering your calls. Chat is disappointed. Stream over.',
                },
            ],
            winFlavor: 'GG EZ. Chat, we actually saved the strait. Let\'s go.',
            winConditions: [
                {
                    id: 'called_it',
                    check: (sim) => sim.uniqueResource >= 70 && sim.domesticApproval >= 60 && sim.fogOfWar < 40 && sim.day >= 14,
                    message: 'ASMONGOLD WAS RIGHT. Every prediction landed. Chat clipped every call. The mainstream media is seething. ' +
                        'Viewer count hits 500K as world leaders tune in for your post-crisis analysis. "I literally told you guys this would happen on day one." GG EZ.',
                },
            ],
        },

        uniqueEvents: [
            {
                id: 'A01_osint_discovery', title: 'THE OSINT DISCOVERY', image: 'assets/vent-asmongold-osint.png',
                description: 'Your crowdsourced OSINT network found something the intelligence community missed: satellite imagery showing Iranian mobile missile launchers dispersing from known bases.',
                minDay: 3, maxDay: 8,
                condition: () => true,
                choices: [
                    { text: 'Share with intelligence community', effects: { fogOfWar: -5, credibility: 5, commandAuthority: 3 },
                      flavor: 'Teamwork. The IC is impressed but slightly threatened by your methods.' },
                    { text: 'Publish it yourself — radical transparency', effects: { fogOfWar: -15, credibility: 10, domesticApproval: 8, commandAuthority: -5 },
                      flavor: 'The public trusts YOU, not the spooks. IC is furious. Your methods work.',
                      setFlags: { osint_published: true } },
                    { text: 'Hold it — use as internal leverage', effects: { fogOfWar: -3, credibility: 5 },
                      flavor: 'You know something they don\'t. That\'s power. You\'re playing their game now.' },
                ],
            },
            {
                id: 'A02_disinfo_attack', title: 'THE DISINFORMATION ATTACK', image: 'assets/event-asmongold-disinfo.png',
                description: 'Iranian state media has launched a coordinated disinformation campaign. Deepfakes of your "classified briefings" are going viral. 200M views and counting.',
                minDay: 15, maxDay: 30,
                condition: () => SIM.uniqueResource > 40,
                choices: [
                    { text: 'Debunk live on stream', effects: { credibility: 10, fogOfWar: -10, domesticApproval: 8 },
                      flavor: 'Real-time forensic analysis. Chat goes wild. Iran\'s info-ops team regroups — they\'ll try harder.',
                      setFlags: { disinfo_debunked: true } },
                    { text: 'Trace to source — expose the network', effects: { credibility: 20, fogOfWar: -20, internationalStanding: 10 },
                      flavor: 'Three days of work. The entire Iranian disinformation network exposed. Devastating.',
                      setFlags: { disinfo_network_exposed: true }, chainEvent: 'A02_disinfo_escalation', chainDelay: 5,
                      chainHint: 'Iran\'s info-ops will escalate after being exposed...' },
                    { text: 'Counter-narrative — fight fire with fire', effects: { credibility: 5, domesticApproval: 10, fogOfWar: -8 },
                      flavor: 'Don\'t just debunk, tell a better story. You\'re in the propaganda game now.' },
                ],
            },
            {
                id: 'A02_disinfo_escalation', title: 'IRAN ESCALATES INFO-WAR', image: 'assets/event-asmongold-disinfo.png',
                description: 'After you exposed their network, Iran has hired Russian cyber units for a more sophisticated campaign. AI-generated footage of "US war crimes" flooding social media.',
                minDay: 20, maxDay: 40,
                condition: () => SIM.storyFlags?.disinfo_network_exposed,
                choices: [
                    { text: 'Escalate — full information war', effects: { credibility: 15, fogOfWar: -15, tension: 5, budget: -15 },
                      flavor: 'You build a counter-disinformation unit. The information battlefield becomes its own front.' },
                    { text: 'Appeal to platforms — content moderation', effects: { credibility: 8, domesticApproval: -3, internationalStanding: 5 },
                      flavor: 'Tech companies reluctantly act. Some content removed. Your base calls it censorship.' },
                ],
            },
            {
                id: 'A03_credibility_test', title: 'THE CREDIBILITY TEST', image: 'assets/event-asmongold-stream.png',
                description: 'Your credibility is at an all-time high. The question is: what do you spend it on? A presidential address, a UN presentation, or bank it for later?',
                minDay: 30, maxDay: 50,
                condition: () => SIM.fogOfWar < 30,
                choices: [
                    { text: 'Presidential address — data not rhetoric', effects: { domesticApproval: 15, credibility: 10, fogOfWar: -5 },
                      flavor: 'Information advantage is overwhelming. Your opponents can\'t compete with your data.' },
                    { text: 'UN presentation — full transparency', effects: { internationalStanding: 15, diplomaticCapital: 10, fogOfWar: 5 },
                      flavor: 'Unprecedented transparency at the UN. Methods exposed but the world trusts you.' },
                    { text: 'Bank it — save for when you really need it', effects: { credibility: 5 },
                      flavor: 'Wise but boring. The credibility grows slowly. Your moment will come.' },
                ],
            },
            {
                id: 'A04_chat_demands_action', title: 'CHAT DEMANDS ACTION', image: 'assets/event-asmongold-reddit.png',
                description: 'Viewer count is dropping. Chat is spamming "DO SOMETHING." Your base expects entertainment alongside governance. The analytics are brutal.',
                minDay: 20, maxDay: 35,
                condition: () => SIM.domesticApproval < 50,
                choices: [
                    { text: 'Dramatic military action — full livestream', effects: { domesticApproval: 15, tension: 10, warPath: 1 },
                      flavor: 'Content meets crisis. Either brilliant or catastrophic. Chat explodes either way.' },
                    { text: 'Push back — explain restraint is strategy', effects: { credibility: 5, domesticApproval: -3 },
                      flavor: 'Educational content. Some viewers leave. The loyal ones stay harder.' },
                    { text: 'Pivot to humor — self-deprecating bit', effects: { domesticApproval: 8, credibility: 3 },
                      flavor: '"Being president is harder than raiding." Viral clip. Opponents don\'t know how to attack a joke.' },
                ],
            },
        ],

        updateResource: function(sim) {
            // Credibility decays if fog of war is high (you're not producing intel)
            if (sim.fogOfWar > 60) sim.uniqueResource -= 0.5;
            // Gains from good intel (low fog)
            if (sim.fogOfWar < 30) sim.uniqueResource += 0.3;
            // Bad decisions hurt credibility
            if (sim.warPath > 2 && sim.uniqueResource > 30) sim.uniqueResource -= 1;
            sim.uniqueResource = Math.max(0, Math.min(100, sim.uniqueResource));
        },

        reactions: {
            weekStart: [
                "Alright chat, let's see what we're working with this week.",
                "Dude, this geopolitics stuff is actually insane.",
                "OK so basically Iran is malding right now. Let me explain.",
            ],
            morningBrief: [
                "Chat, the overnight mod-curated intel feed just dropped.",
                "OK dude, the mods flagged the important stuff from last night.",
                "Morning intel digest — crowd-sourced and verified by the community.",
            ],
            highTension: "Chat, the tension is actually insane right now. We need to chill.",
            lowApproval: "Guys, our approval is in the gutter. We're getting ratio'd by Congress.",
            seizure: "They just took our tanker. This is actually a bruh moment.",
            diplomatic: "Diplomacy arc? Let's see if Iran wants to talk or if they're just baiting.",
            victory: "GG EZ. Chat, we actually saved the strait. Let's go.",
            lowBudget: "We're literally going broke. Budget diff is real.",
            highProxy: "The proxy stuff is getting out of hand. We need to address it.",
            uniqueResourceLow: "Chat, our credibility is tanking. Nobody trusts our analysis anymore.",
            uniqueResourceCritical: "Dude, if credibility hits zero we're literally done. We need good intel NOW.",
        },

        epilogues: {
            diplomatic: 'You streamed the final press conference. Twelve million concurrent viewers. The chat was, for once, almost entirely supportive, though someone did manage to post the crab emoji forty thousand times. The intelligence community will study your methods for decades: the fusion of open-source analysis with classified assets, the radical transparency that somehow made secrecy more effective, the way you turned public attention into a strategic weapon. You broke every rule they taught at Langley and got better results than anyone who followed them. The fog of war, for the first time in the history of modern conflict, was lower at the end than at the beginning.',
            military: 'Chat wanted content and you gave them content. The problem is, the content was a war. Your credibility carried you further than anyone expected, but in the end, the missiles don\'t care about your viewer count. The military victory happened not because of your analysis but despite it — the generals did what generals do, and you provided cover. Your stream of the final operation hit 20 million viewers. The Pentagon banned streaming from classified briefings the next day.',
            decline: 'The stream is still going but the viewer count is dropping. The crisis ended not with a bang but with a slow fade to normalcy, which is terrible for content. Your credibility is intact but irrelevant — nobody needs an analyst when there\'s nothing to analyze. Chat has moved on to the next thing. The fog of war settled back to its natural state. You go back to gaming, which is fine. But late at night, you pull up the shipping maps and check the strait. Old habits.',
        },
    },
    {
        id: 'fuentes', name: 'Nick Fuentes', title: 'Political Commentator',
        spriteKey: 'portrait_fuentes', portraitImage: 'assets/nick.png', selectImage: 'assets/char-fuentes.png',
        ability: 'The Outsider',
        abilityDesc: 'Base Enthusiasm drops without America First cards. WIN: Pull out of the Middle East without losing global power.',
        lore: 'February 28, 2026. They actually did it. The establishment launched a war with Iran without asking the American people. Now there are 2,000 Iranian missiles in the air and gas is headed to $6 a gallon. Your base is furious. The populist coalition demands someone who will put America First — not the military-industrial complex. You\'re the youngest national security advisor in history.',

        uniqueResource: { id: 'baseEnthusiasm', name: 'BASE', value: 85, max: 100, color: '#ff6644' },

        // Track consecutive weeks of "America First" policy
        _withdrawalStreak: 0,
        _addressNationUses: 0,

        cardPool: {
            allCards: false,
            effectMultiplier: 1.0,
            maxPicks: 3,
            restricted: ['gulf_coalition', 'un_resolution', 'humanitarian_corridor', 'summit_proposal'], // No globalist cards
            exclusiveIds: ['populist_rally'],
        },

        specialAction: {
            name: 'ADDRESS THE NATION',
            description: 'Rally the base. Diminishing returns (60→45→30→20).',
            cooldown: 0,
            cooldownMax: 7,
            execute: function(sim) {
                const uses = sim.character._addressNationUses || 0;
                const gains = [60, 45, 30, 20, 15, 10, 10];
                const gain = gains[Math.min(uses, gains.length - 1)];
                // Scale to reasonable base enthusiasm gains
                const scaledGain = Math.round(gain / 4);
                sim.uniqueResource = Math.min(100, sim.uniqueResource + scaledGain);
                sim.domesticApproval += Math.round(scaledGain / 2);
                sim.polarization += 5;
                sim.internationalStanding -= 3;
                sim.character._addressNationUses = uses + 1;
                addHeadline(`National address: "America First, America Always." Base rallies.`, 'good');
            },
        },

        scenario: {
            loseConditions: [
                {
                    id: 'base_abandons',
                    check: (sim) => sim.uniqueResource <= 10,
                    message: 'Your base has abandoned you. Without grassroots support, Congress moves to remove you. The populist experiment is over.',
                },
                {
                    id: 'establishment_coup',
                    check: (sim) => sim.internationalStanding > 60 && sim.domesticApproval < 30,
                    message: 'You became what you swore to fight. The establishment co-opted you. Your base sees a sellout.',
                },
            ],
            winFlavor: 'America First wins again. The establishment said it couldn\'t be done.',
            winConditions: [
                {
                    id: 'america_first_victory',
                    check: (sim) => sim.warPath <= 1 && sim.internationalStanding >= 40 && sim.uniqueResource >= 60 && sim.day >= 14,
                    message: 'AMERICA FIRST WINS. The troops are coming home. Iran backed down without a single American casualty. ' +
                        'Global power intact, base ecstatic. The establishment is speechless. "We did it without their wars, without their deals, without their permission."',
                },
            ],
        },

        uniqueEvents: [
            {
                id: 'F01_base_demands_blood', title: 'THE BASE DEMANDS BLOOD', image: 'assets/event-fuentes-base.png',
                description: 'Your supporters are in the streets. "BRING THEM HOME." The base that elected you demands you end foreign wars — not manage them.',
                minDay: 5, maxDay: 12,
                condition: () => true,
                choices: [
                    { text: 'Fiery speech — America First, pull the fleet', effects: { baseEnthusiasm: 15, internationalStanding: -10, oilFlow: -10, iranAggression: 8 },
                      flavor: 'The base erupts. Allies panic. Oil markets crater. This is what they voted for.' },
                    { text: 'Walk the line — strength protects freedom', effects: { baseEnthusiasm: 5, internationalStanding: 5, diplomaticCapital: 3 },
                      flavor: 'Moderate your message. The base is confused but patient. You live to fight another day.' },
                    { text: 'Redirect anger at defense contractors', effects: { baseEnthusiasm: 10, commandAuthority: -5, domesticApproval: 5 },
                      flavor: 'Channel anger at the military-industrial complex. Pentagon quietly starts undermining you.' },
                ],
            },
            {
                id: 'F02_international_pariah', title: 'THE INTERNATIONAL PARIAH MOMENT', image: 'assets/event-fuentes-pariah.png',
                description: 'The UN General Assembly passed a resolution condemning your policies. European allies have recalled ambassadors. You are internationally isolated.',
                minDay: 20, maxDay: 40,
                condition: () => SIM.internationalStanding < 25,
                choices: [
                    { text: 'Embrace it — badge of honor', effects: { baseEnthusiasm: 15, internationalStanding: -5, domesticApproval: 8 },
                      flavor: '"We didn\'t come here to make friends with Davos." Standing floor locks. No recovery.' },
                    { text: 'Course correct — reach out to one key ally', effects: { internationalStanding: 10, baseEnthusiasm: -5, diplomaticCapital: 5 },
                      flavor: 'Painful but necessary. One ally is enough to break the isolation.' },
                    { text: 'Find unconventional allies — Russia, India', effects: { internationalStanding: 5, diplomaticCapital: 5, baseEnthusiasm: -3 },
                      flavor: 'Outside the Western consensus. New partnerships. Old allies further alienated.' },
                ],
            },
            {
                id: 'F03_america_first_rally', title: 'THE AMERICA FIRST RALLY', image: 'assets/event-fuentes-isolation.png',
                description: 'Biggest rally of your career. 80,000 people. Every camera in America pointed at you. This is your moment to define the crisis on your terms.',
                minDay: 15, maxDay: 30,
                condition: () => SIM.uniqueResource > 40,
                choices: [
                    { text: 'Define the crisis — sovereignty, not oil', effects: { baseEnthusiasm: 20, domesticApproval: 15, internationalStanding: -8, budget: -15 },
                      flavor: '"This isn\'t about Iranian oil. This is about American sovereignty." The crowd goes wild.' },
                    { text: 'Surprise everyone — announce peace initiative', effects: { baseEnthusiasm: 10, internationalStanding: 10, diplomaticCapital: 5 },
                      flavor: 'Reframe peace as strength. The base is confused but comes around. The world is stunned.' },
                    { text: 'Scorched earth — name domestic enemies', effects: { baseEnthusiasm: 25, internationalStanding: -15, polarization: 15, diplomaticCapital: -10 },
                      flavor: 'You just burned every bridge in Washington. Your base has never been more loyal.' },
                ],
            },
            {
                id: 'F04_assassination_whisper', title: 'THE ASSASSINATION WHISPER', image: 'assets/event-fuentes-assassination.png',
                description: 'Secret Service has intercepted credible threats. Your polarizing stance has made you a target. They recommend reduced public appearances.',
                minDay: 40, maxDay: 65,
                condition: () => SIM.uniqueResource < 30 && SIM.internationalStanding < 20,
                choices: [
                    { text: 'Accept recommendations — reduce visibility', effects: { baseEnthusiasm: -5, fogOfWar: 3 },
                      flavor: 'Reduced appearances. The base wonders where you went. Intel resources diverted to protection.' },
                    { text: 'Defy the threat publicly', effects: { baseEnthusiasm: 10, domesticApproval: 5, assassinationRisk: 15 },
                      flavor: '"They want me dead because I\'m telling the truth." A speech about courage. Genuine personal risk.' },
                    { text: 'Weaponize it politically', effects: { baseEnthusiasm: 15, domesticApproval: 8, fogOfWar: 5, diplomaticCapital: -5 },
                      flavor: 'Release the intelligence to supporters. Rally around the embattled leader. Agencies are furious.' },
                ],
            },
        ],

        updateResource: function(sim) {
            // Base Enthusiasm drops 12/week (~1.7/day) without America First cards
            const hasAmericaFirst = sim.activeStances?.some(s => {
                const allCards = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS)];
                const card = allCards.find(c => c.id === s.cardId);
                return card && (card.id === 'america_first' || card.id === 'populist_rally');
            });
            if (!hasAmericaFirst) {
                sim.uniqueResource -= 1.7;
            } else {
                sim.uniqueResource += 0.5; // Small gain for staying on message
            }
            // International engagement drains base
            if (sim.internationalStanding > 60) sim.uniqueResource -= 0.5;
            sim.uniqueResource = Math.max(0, Math.min(100, sim.uniqueResource));
        },

        reactions: {
            weekStart: [
                "The American people come first. Always.",
                "The establishment wants us to play their game. We won't.",
                "Let's focus on what matters — American interests.",
            ],
            morningBrief: [
                "Morning brief from our team. The establishment doesn't want you to see this.",
                "Here's what really happened overnight — not the media spin.",
                "Your advisors compiled the real intelligence. No filter.",
            ],
            highTension: "High tension? Good. Let them know we're not backing down.",
            lowApproval: "Our base is solid. The silent majority sees through the media lies.",
            seizure: "Iran thinks they can push us around? Wrong. America doesn't negotiate with thugs.",
            diplomatic: "Diplomacy is a tool of the globalists. But sometimes you use the enemy's tools.",
            victory: "America First wins again. The establishment said it couldn't be done.",
            lowBudget: "We're spending American money on foreign wars. Bring the troops home.",
            highProxy: "Iran's proxies are attacking us because we're still in the Middle East. Think about it.",
            uniqueResourceLow: "The base is losing faith. We need to show them we're still fighting for THEM.",
            uniqueResourceCritical: "If we lose the base, we lose everything. Address the nation. NOW.",
        },

        epilogues: {
            diplomatic: 'You didn\'t fire a shot. That was the promise, and against every prediction, every editorial, every smirking pundit who said the isolationist couldn\'t handle a real crisis, you kept it. The strait is open not because you forced it open but because you made it more expensive for Iran to keep it closed than to let it flow. Your base calls it the greatest foreign policy achievement since... well, they can\'t agree on the comparison, which is fine. Standing at 40 doesn\'t sound impressive until you remember it started at 12 and every expert said it would hit zero. The allies who mocked you are quiet now. They\'re not grateful. They\'ll never be grateful. But they\'re quiet. And the troops are home. Every single one of them.',
            military: 'You promised America First and delivered America at War. The base fractured the moment the first bomb dropped. Half of them understood that sometimes you fight to protect what matters. The other half never forgave you. The strait is open. Iran is cowed. The troops are coming home, eventually. But the movement you built, the coalition that was supposed to change everything — it didn\'t survive contact with reality. You won the crisis and lost the cause.',
            decline: 'The troops are coming home because there\'s nothing left to do, not because you brought them home. The crisis fizzled. The strait opened. Iran got bored. Your base takes credit anyway, and you let them. The international standing never recovered, but your base doesn\'t care about international standing, which was always the point. You survived. The establishment is still standing too, which means nobody really won. The next crisis will find a different outsider. Maybe they\'ll do better. Maybe there is no better.',
        },
    },
];

function getAdvisorReaction(key) {
    if (!SIM.character || !SIM.character.reactions) return '';
    const reaction = SIM.character.reactions[key];
    if (Array.isArray(reaction)) {
        return reaction[Math.floor(Math.random() * reaction.length)];
    }
    return reaction || '';
}

function showLoreScreen(character) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.id = 'lore-overlay';
        overlay.className = 'lore-overlay';

        const portraitHtml = character.portraitImage
            ? `<img class="lore-portrait" src="${character.portraitImage}" alt="${character.name}" width="128" height="128" style="image-rendering:pixelated">`
            : `<canvas class="lore-portrait" id="lore-portrait" width="112" height="112"></canvas>`;

        overlay.innerHTML = `
            <div class="lore-box">
                <div class="lore-scanlines"></div>
                ${portraitHtml}
                <div class="lore-name">${character.name}</div>
                <div class="lore-title">${character.title}</div>
                <div class="lore-ability">${character.ability}: ${character.abilityDesc}</div>
                <div class="lore-text" id="lore-text"></div>
                <button class="lore-proceed-btn" id="lore-proceed" style="display:none">[ ENTER THE SITUATION ROOM ]</button>
            </div>
        `;

        document.getElementById('game-container').appendChild(overlay);

        if (!character.portraitImage) {
            const canvas = document.getElementById('lore-portrait');
            if (canvas && SPRITES[character.spriteKey]) {
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(SPRITES[character.spriteKey], 0, 0, 112, 112);
            }
        }

        const textEl = document.getElementById('lore-text');
        const proceedBtn = document.getElementById('lore-proceed');
        const fullText = character.lore || '';
        let charIdx = 0;
        let typing = true;

        function typeNext() {
            if (!typing) return;
            if (charIdx < fullText.length) {
                textEl.textContent += fullText[charIdx];
                charIdx++;
                setTimeout(typeNext, 30);
            } else {
                typing = false;
                proceedBtn.style.display = '';
            }
        }

        typeNext();

        overlay.addEventListener('click', (e) => {
            if (e.target === proceedBtn) return;
            if (typing) {
                typing = false;
                textEl.textContent = fullText;
                proceedBtn.style.display = '';
            }
        });

        proceedBtn.addEventListener('click', () => {
            overlay.remove();
            resolve();
        });
    });
}

function showCharacterSelect() {
    return new Promise((resolve) => {
        const overlay = document.getElementById('char-select');
        overlay.style.display = 'flex';

        let selectedIdx = null;

        function render() {
            const trump = CHARACTERS[0];
            const advisors = CHARACTERS.slice(1);

            function renderCard(ch, i) {
                const imgSrc = ch.selectImage || ch.portraitImage;
                return `
                    <div class="char-card ${selectedIdx === i ? 'selected' : ''}" data-idx="${i}">
                        ${imgSrc
                            ? `<img class="char-portrait" src="${imgSrc}" alt="${ch.name}" style="image-rendering:pixelated">`
                            : `<canvas class="char-portrait" id="char-portrait-${i}" width="56" height="56"></canvas>`
                        }
                        <div class="char-info">
                            <div class="char-name">${ch.name}</div>
                            <div class="char-title">${ch.title}</div>
                        </div>
                        ${selectedIdx === i ? `
                            <div class="char-ability">
                                <span class="ability-name">${ch.ability}</span>
                                <span class="ability-desc">${ch.abilityDesc}</span>
                                ${ch.uniqueResource ? `<span class="ability-resource" style="color:${ch.uniqueResource.color}">${ch.uniqueResource.name}: ${ch.uniqueResource.value}</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            }

            overlay.innerHTML = `
                <div class="char-select-box">
                    <h1>STRAIT OF HORMUZ</h1>
                    <p class="char-subtitle">Select your role</p>

                    <div class="char-president-row">
                        <div class="char-card char-card-president ${selectedIdx === 0 ? 'selected' : ''}" data-idx="0">
                            ${(trump.selectImage || trump.portraitImage)
                                ? `<img class="char-portrait char-portrait-lg" src="${trump.selectImage || trump.portraitImage}" alt="${trump.name}" style="image-rendering:pixelated">`
                                : `<canvas class="char-portrait" id="char-portrait-0" width="56" height="56"></canvas>`
                            }
                            <div class="char-info">
                                <div class="char-name">${trump.name}</div>
                                <div class="char-title">${trump.title}</div>
                            </div>
                            ${selectedIdx === 0 ? `
                                <div class="char-ability">
                                    <span class="ability-name">${trump.ability}</span>
                                    <span class="ability-desc">${trump.abilityDesc}</span>
                                    ${trump.uniqueResource ? `<span class="ability-resource" style="color:${trump.uniqueResource.color}">${trump.uniqueResource.name}: ${trump.uniqueResource.value}</span>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="char-divider"><span>OR CHOOSE AN ADVISOR</span></div>

                    <div class="char-grid">
                        ${advisors.map((ch, i) => renderCard(ch, i + 1)).join('')}
                    </div>

                    <button class="begin-btn ${selectedIdx !== null ? 'ready' : ''}" id="begin-btn">
                        ${selectedIdx !== null ? '[ BEGIN SIMULATION ]' : '[ SELECT A CHARACTER ]'}
                    </button>
                </div>
            `;

            CHARACTERS.forEach((ch, i) => {
                if (ch.portraitImage) return; // Using <img> tag instead
                const canvas = document.getElementById('char-portrait-' + i);
                if (canvas && SPRITES[ch.spriteKey]) {
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(SPRITES[ch.spriteKey], 0, 0, 56, 56);
                }
            });

            overlay.querySelectorAll('.char-card').forEach(card => {
                card.addEventListener('click', () => {
                    selectedIdx = parseInt(card.dataset.idx);
                    render();
                });
            });

            const beginBtn = document.getElementById('begin-btn');
            beginBtn.addEventListener('click', () => {
                if (selectedIdx !== null) {
                    overlay.style.display = 'none';
                    resolve(CHARACTERS[selectedIdx]);
                }
            });
        }

        render();
    });
}
