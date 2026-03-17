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
        spriteKey: 'portrait_trump', portraitImage: 'assets/trump.png',
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
                id: 'truth_social_post', title: 'TRUTH SOCIAL MOMENT',
                description: 'Your phone is buzzing. A well-timed post could rally the base — or start a diplomatic incident.',
                minDay: 3, maxDay: 80,
                condition: () => true,
                choices: [
                    { text: 'Post tough talk on Iran', effects: { domesticApproval: 8, tension: 10, iranAggression: 5, politicalCapital: 5 }, flavor: '"Iran is WEAK. We are STRONG. They will learn!" 40M views in 2 hours.' },
                    { text: 'Post about the economy', effects: { domesticApproval: 5, politicalCapital: 3 }, flavor: '"Gas prices coming DOWN thanks to YOUR President!" Markets respond.' },
                    { text: 'Put the phone down', effects: {}, flavor: 'Staff breathes a sigh of relief.' },
                ],
            },
            {
                id: 'european_demand', title: 'EUROPEAN ALLIES DEMAND CONSULTATION',
                description: 'France and Germany are furious you acted without consulting NATO. They threaten to withdraw naval support.',
                minDay: 10, maxDay: 60,
                condition: () => SIM.tension > 30,
                choices: [
                    { text: 'Tell them to pay up or shut up', effects: { domesticApproval: 10, internationalStanding: -12, politicalCapital: 8 }, flavor: '"The US pays for everything. Where were you?" The base loves it.' },
                    { text: 'Invite them to a summit', effects: { internationalStanding: 8, tension: -5, politicalCapital: -5 }, flavor: 'A grudging meeting produces a joint statement.' },
                    { text: 'Ignore them', effects: { internationalStanding: -5, politicalCapital: 3 }, flavor: 'Europe fumes. You move on.' },
                ],
            },
            {
                id: 'pentagon_leak', title: 'PENTAGON LEAK',
                description: 'Someone in the Pentagon leaked your classified strategy memo. The press has it.',
                minDay: 15, maxDay: 70,
                condition: () => SIM.fogOfWar < 60,
                choices: [
                    { text: 'Fire everyone involved', effects: { domesticApproval: 5, politicalCapital: -10, fogOfWar: 10 }, flavor: 'Heads roll. Morale at the Pentagon drops. Intel flow slows.' },
                    { text: 'Use it as disinformation', effects: { iranAggression: -5, fogOfWar: -8, politicalCapital: 5 }, flavor: 'You claim the memo was planted. Iran recalculates.' },
                    { text: 'Address it publicly', effects: { domesticApproval: 3, polarization: 3 }, flavor: 'A combative press conference. The story fades.' },
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
    },
    {
        id: 'hegseth', name: 'Pete Hegseth', title: 'Secretary of War',
        spriteKey: 'portrait_hegseth', portraitImage: 'assets/pete.png',
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
                id: 'joint_chiefs_revolt', title: 'JOINT CHIEFS PUSHBACK',
                description: 'The Joint Chiefs are pushing back on your aggressive posture. They want a more measured approach.',
                minDay: 8, maxDay: 60,
                condition: () => SIM.tension > 40,
                choices: [
                    { text: 'Override them', effects: { commandAuthority: -15, tension: 8, iranAggression: -5, domesticApproval: 3 }, flavor: 'You pull rank. The brass is unhappy but complies.' },
                    { text: 'Find middle ground', effects: { commandAuthority: 5, tension: -3 }, flavor: 'A compromise. The brass appreciates being heard.' },
                    { text: 'Accept their plan', effects: { commandAuthority: 10, tension: -8, domesticApproval: -3 }, flavor: 'You defer to military expertise. Some call it leadership.' },
                ],
            },
            {
                id: 'fox_interview', title: 'FOX NEWS INTERVIEW REQUEST',
                description: 'Your old network wants an exclusive. Great for domestic support but could reveal operational details.',
                minDay: 5, maxDay: 70,
                condition: () => true,
                choices: [
                    { text: 'Full interview — go big', effects: { domesticApproval: 10, commandAuthority: 5, fogOfWar: 8, internationalStanding: -3 }, flavor: 'Ratings through the roof. The Pentagon is nervous about what you revealed.' },
                    { text: 'Brief, controlled appearance', effects: { domesticApproval: 5, commandAuthority: 3 }, flavor: 'A polished 5 minutes. Nothing leaked.' },
                    { text: 'Decline — stay focused', effects: { commandAuthority: 3 }, flavor: 'The network is disappointed. Your staff is relieved.' },
                ],
            },
            {
                id: 'carrier_captain_engage', title: 'CARRIER CAPTAIN REQUEST',
                description: 'USS Eisenhower captain requests permission to engage Iranian fast boats harassing the task force. 15 seconds to decide.',
                minDay: 12, maxDay: 80,
                condition: () => SIM.carrier !== null && SIM.iranBoats.length > 2,
                countdown: 15,
                choices: [
                    { text: 'Weapons free', effects: { tension: 25, iranAggression: -15, commandAuthority: -10, warPath: 2, domesticApproval: 8 }, flavor: 'Guns open up. Two IRGC boats disabled. The world watches in horror and awe.' },
                    { text: 'Warning shots only', effects: { tension: 10, iranAggression: -5, commandAuthority: 5 }, flavor: 'Tracer fire across the bow. The boats scatter.' },
                    { text: 'Do not engage', effects: { commandAuthority: -8, iranAggression: 5, domesticApproval: -5 }, flavor: 'The captain is furious. Crew morale drops.' },
                ],
            },
            {
                id: 'senate_hearing', title: 'SENATE ARMED SERVICES HEARING',
                description: 'Senators grill you on military spending and rules of engagement. Your credibility is on the line.',
                minDay: 20, maxDay: 75,
                condition: () => SIM.budget < 800,
                choices: [
                    { text: 'Warrior testimony — passionate defense', effects: { domesticApproval: 8, commandAuthority: 10, polarization: 5 }, flavor: 'You pound the table. "I will not apologize for defending American interests." Standing ovation from hawks.' },
                    { text: 'Data-driven briefing', effects: { domesticApproval: 3, commandAuthority: 5, polarization: -3 }, flavor: 'Charts and intel wins over undecided senators.' },
                    { text: 'Refuse to appear', effects: { domesticApproval: -10, commandAuthority: -10, polarization: 8 }, flavor: 'Constitutional crisis. Media goes nuclear.' },
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
    },
    {
        id: 'kushner', name: 'Jared Kushner', title: 'Senior Advisor',
        spriteKey: 'portrait_kushner', portraitImage: 'assets/kushner.png',
        ability: 'The Operator',
        abilityDesc: 'Contacts & exposure system. Build trust, avoid leaks. WIN: Enrich yourself and build lasting relationships.',
        lore: 'February 28, 2026. The bombs are falling on Iran. Every Gulf leader has your personal number and they\'re all calling at once. MBS wants guarantees. MBZ wants a timeline. The strait is closing and the oil markets are in freefall. The Abraham Accords were just the beginning — now you need those relationships to prevent a regional catastrophe.',

        uniqueResource: { id: 'exposure', name: 'EXPOSURE', value: 10, max: 100, color: '#aa44dd', inverted: true },

        // Contacts system
        contacts: [
            { id: 'mbs', name: 'MBS (Saudi Arabia)', trust: 40, maxTrust: 100, unlockCard: 'saudi_deal' },
            { id: 'mbz', name: 'MBZ (UAE)', trust: 35, maxTrust: 100, unlockCard: 'uae_port_access' },
            { id: 'erdogan', name: 'Erdogan (Turkey)', trust: 15, maxTrust: 100, unlockCard: 'bosphorus_leverage' },
            { id: 'zarif', name: 'Zarif (Iran Moderate)', trust: 5, maxTrust: 100, unlockCard: 'secret_channel' },
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
                id: 'mbs_deal', title: 'MBS PRIVATE DINNER',
                description: 'MBS invites you to Riyadh for a private dinner. He wants to discuss a grand bargain — Saudi recognition of Israel in exchange for US security guarantees.',
                minDay: 8, maxDay: 50,
                condition: () => {
                    const c = SIM.character.contacts?.find(c => c.id === 'mbs');
                    return c && c.trust >= 30;
                },
                choices: [
                    { text: 'Accept and negotiate', effects: { internationalStanding: 10, tension: -8, exposure: 15, diplomaticCapital: 15 }, flavor: 'A historic dinner. The deal framework takes shape. But someone photographed you boarding the Saudi jet.', contactEffect: { id: 'mbs', trust: 20 } },
                    { text: 'Send a deputy', effects: { diplomaticCapital: 5 }, flavor: 'MBS is insulted. Progress stalls.', contactEffect: { id: 'mbs', trust: -10 } },
                    { text: 'Decline — too risky', effects: { exposure: -5 }, flavor: 'You stay invisible. The opportunity passes.', contactEffect: { id: 'mbs', trust: -5 } },
                ],
            },
            {
                id: 'iran_face_to_face', title: 'ZARIF BACK-CHANNEL',
                description: 'Zarif\'s intermediary offers a secret face-to-face in Oman. Massive risk — massive reward.',
                minDay: 15, maxDay: 70,
                condition: () => {
                    const c = SIM.character.contacts?.find(c => c.id === 'zarif');
                    return c && c.trust >= 10;
                },
                choices: [
                    { text: 'Meet him secretly', effects: { tension: -15, iranAggression: -12, exposure: 25, domesticApproval: -8 }, flavor: 'Three hours in a Muscat hotel room. Breakthrough on prisoner exchange. If this leaks, you\'re done.', contactEffect: { id: 'zarif', trust: 25 } },
                    { text: 'Send a message through channels', effects: { tension: -5, iranAggression: -3, exposure: 5 }, flavor: 'A modest exchange of positions. Better than nothing.', contactEffect: { id: 'zarif', trust: 5 } },
                    { text: 'It\'s a trap — decline', effects: { iranAggression: 3 }, flavor: 'Zarif is disappointed. Hardliners gain influence.' },
                ],
            },
            {
                id: 'journalist_sniffing', title: 'JOURNALIST ON YOUR TRAIL',
                description: 'A New York Times journalist is asking questions about your back-channel communications. Your exposure is growing.',
                minDay: 12, maxDay: 75,
                condition: () => SIM.uniqueResource > 30,
                choices: [
                    { text: 'Give an exclusive interview', effects: { exposure: -10, domesticApproval: 5 }, flavor: 'You control the narrative. For now.' },
                    { text: 'Have allies discredit the reporter', effects: { exposure: -5, internationalStanding: -3, polarization: 3 }, flavor: 'The story is buried. But the reporter is still digging.' },
                    { text: 'Ignore it', effects: { exposure: 8 }, flavor: 'The story publishes. Questions mount.' },
                ],
            },
            {
                id: 'wall_street_play', title: 'WALL STREET BACKCHANNEL',
                description: 'Your Wall Street contacts offer to quietly stabilize oil futures — for a favor later.',
                minDay: 10, maxDay: 60,
                condition: () => SIM.oilPrice > 110,
                choices: [
                    { text: 'Accept the deal', effects: { oilPrice: -15, exposure: 15, domesticApproval: 5 }, flavor: 'Markets calm. But the favor is a blank check.' },
                    { text: 'Decline — too dirty', effects: {}, flavor: 'You keep your hands clean. Markets stay volatile.' },
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
    },
    {
        id: 'asmongold', name: 'Asmongold', title: 'Streamer & Analyst',
        spriteKey: 'portrait_asmongold', portraitImage: 'assets/asmongold.png',
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
                id: 'anomaly_detected', title: 'PORT ANOMALY DETECTED',
                description: 'Your OSINT network detected unusual activity at Bandar Abbas. Could be a major military buildup — or a commercial cargo operation.',
                minDay: 5, maxDay: 60,
                condition: () => SIM.fogOfWar < 65,
                choices: [
                    { text: 'Flag it as threat — high confidence', effects: { fogOfWar: -15, tension: 8, credibility: 10 }, flavor: 'Satellite confirmation: you were right. Military convoy spotted. Credibility soars.' },
                    { text: 'Flag it as threat — low confidence', effects: { fogOfWar: -5, tension: 3, credibility: -5 }, flavor: 'Investigation shows normal shipping. False alarm costs you credibility.' },
                    { text: 'Monitor and wait', effects: { fogOfWar: -3 }, flavor: 'By the time you confirm, the moment has passed.' },
                ],
            },
            {
                id: 'chat_found_something', title: 'CHAT FOUND SOMETHING',
                description: 'Your crowdsourced OSINT community found Iranian fast boat patterns in AIS data. It\'s either brilliant or a security risk.',
                minDay: 10, maxDay: 70,
                condition: () => true,
                choices: [
                    { text: 'Share with Pentagon', effects: { fogOfWar: -20, credibility: 15, domesticApproval: 5 }, flavor: 'The Pentagon is impressed. Your methods are unconventional but effective.' },
                    { text: 'Verify first', effects: { fogOfWar: -8, credibility: 5 }, flavor: 'After careful analysis, you present verified findings.' },
                    { text: 'Ignore — too risky to share', effects: { credibility: -3 }, flavor: 'You let it go. Chat is disappointed.' },
                ],
            },
            {
                id: 'cia_contradicts', title: 'CIA CONTRADICTS YOUR ASSESSMENT',
                description: 'The CIA says your analysis of Iranian intentions is wrong. Your credibility is on the line.',
                minDay: 15, maxDay: 75,
                condition: () => SIM.uniqueResource > 30,
                choices: [
                    { text: 'Stand your ground with data', effects: { credibility: 12, tension: 5, fogOfWar: -10 }, flavor: 'Your data proves right. The CIA admits their sources were compromised.' },
                    { text: 'Defer to the CIA', effects: { credibility: -8, fogOfWar: 5 }, flavor: 'You back down. Later events show you were right. Should have trusted your analysis.' },
                    { text: 'Propose joint analysis', effects: { credibility: 3, fogOfWar: -5, diplomaticCapital: 3 }, flavor: 'A collaborative approach. Both sides save face.' },
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
    },
    {
        id: 'fuentes', name: 'Nick Fuentes', title: 'Political Commentator',
        spriteKey: 'portrait_fuentes', portraitImage: 'assets/nick.png',
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
                id: 'base_demands_withdrawal', title: 'BASE DEMANDS WITHDRAWAL',
                description: 'Your supporters are demanding you bring the troops home. "We elected you to END foreign wars, not start new ones."',
                minDay: 8, maxDay: 70,
                condition: () => SIM.navyShips.length > 3,
                choices: [
                    { text: 'Begin withdrawal', effects: { domesticApproval: 12, baseEnthusiasm: 20, internationalStanding: -15, tension: -5, iranAggression: 8 }, flavor: 'Ships turn for home. The base erupts in celebration. Allies are horrified.' },
                    { text: 'Promise withdrawal "soon"', effects: { baseEnthusiasm: 5, domesticApproval: 3 }, flavor: 'Vague enough to buy time. The base is skeptical but patient.' },
                    { text: 'Explain the strategic need', effects: { baseEnthusiasm: -10, domesticApproval: -3, internationalStanding: 3 }, flavor: 'The base doesn\'t want to hear it. "You sound like the establishment."' },
                ],
            },
            {
                id: 'ally_breaks', title: 'ALLY BREAKS WITH YOU',
                description: 'A key congressional ally publicly breaks with you over foreign policy. Your coalition is fracturing.',
                minDay: 12, maxDay: 60,
                condition: () => SIM.internationalStanding > 40,
                choices: [
                    { text: 'Attack them publicly', effects: { baseEnthusiasm: 10, polarization: 8, domesticApproval: -5 }, flavor: '"They were never really with us." Your base rallies, but the coalition shrinks.' },
                    { text: 'Reach out privately', effects: { baseEnthusiasm: -5, polarization: -3 }, flavor: 'A quiet conversation. The ally stays quiet but doesn\'t return.' },
                    { text: 'Replace them with a loyalist', effects: { baseEnthusiasm: 8, polarization: 5 }, flavor: 'A new voice carries your message. The purge sends a signal.' },
                ],
            },
            {
                id: 'gulf_self_defense', title: 'GULF STATES SELF-DEFENSE PACT',
                description: 'Gulf states form their own mutual defense pact, excluding the US. A sign of declining US influence.',
                minDay: 18, maxDay: 75,
                condition: () => SIM.internationalStanding < 40,
                choices: [
                    { text: 'Celebrate — let them handle it', effects: { baseEnthusiasm: 15, internationalStanding: -10, tension: 5, domesticApproval: 8 }, flavor: '"Finally! Let them defend themselves!" The base loves it.' },
                    { text: 'Demand a seat at the table', effects: { internationalStanding: 5, baseEnthusiasm: -8 }, flavor: 'Trying to stay relevant. Neither side is happy.' },
                    { text: 'Offer to lead the pact', effects: { internationalStanding: 8, baseEnthusiasm: -15, domesticApproval: -5 }, flavor: 'Your base screams betrayal. "This is exactly what we voted against!"' },
                ],
            },
            {
                id: 'isolationist_bill', title: 'AMERICA FIRST ACT',
                description: 'Your allies in Congress propose the "America First Act" — mandatory withdrawal from Middle East within 90 days.',
                minDay: 20, maxDay: 80,
                condition: () => true,
                choices: [
                    { text: 'Champion the bill', effects: { baseEnthusiasm: 20, domesticApproval: 10, internationalStanding: -20, tension: -10, iranAggression: 15 }, flavor: 'The bill passes committee. The world watches in disbelief.' },
                    { text: 'Support in principle, delay in practice', effects: { baseEnthusiasm: 5, domesticApproval: 3 }, flavor: 'You nod along but slow-walk it. Classic Washington.' },
                    { text: 'Oppose — not the right time', effects: { baseEnthusiasm: -15, domesticApproval: -5, internationalStanding: 5 }, flavor: '"He\'s become one of them." The base turns on you.' },
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
                return `
                    <div class="char-card ${selectedIdx === i ? 'selected' : ''}" data-idx="${i}">
                        ${ch.portraitImage
                            ? `<img class="char-portrait" src="${ch.portraitImage}" alt="${ch.name}" style="image-rendering:pixelated">`
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
                            ${trump.portraitImage
                                ? `<img class="char-portrait char-portrait-lg" src="${trump.portraitImage}" alt="${trump.name}" style="image-rendering:pixelated">`
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
