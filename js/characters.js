/**
 * Characters — each is a completely different game mode
 * Unique resources, lose conditions, events, card pools, special actions
 */

function showTitleScreen() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.id = 'title-screen';
        overlay.innerHTML = `
            <img src="${DATA.dialogue.titleScreen.imageSrc}" class="title-art" alt="${DATA.dialogue.titleScreen.imageAlt}">
            <div class="title-prompt">${DATA.dialogue.titleScreen.prompt}</div>
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
        id: 'trump', name: '', title: '',
        spriteKey: 'portrait_trump', portraitImage: 'assets/trump.png', selectImage: 'assets/char-trump.png',
        ability: '',
        abilityDesc: '',
        lore: [],

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
                id: 'T01_fox_news_call', title: '', image: 'assets/event-trump-fox.png',
                description: '',
                minDay: 5, maxDay: 15,
                condition: () => true,
                choices: [
                    { text: '', effects: { domesticApproval: 15, internationalStanding: -5, tension: 3 },
                      flavor: '',
                      setFlags: { fox_appearance: true } },
                    { text: '', effects: { domesticApproval: -8, politicalCapital: 5 },
                      flavor: '' },
                    { text: '', effects: { tension: 8, diplomaticCapital: 5 },
                      flavor: '',
                      setFlags: { fox_iran_message: true }, chainEvent: 'T04_iran_backchannel', chainDelay: 4,
                      chainHint: 'Iran\'s back-channel is buzzing. Someone may respond...' },
                ],
            },
            {
                id: 'T02_deal_on_table', title: '', image: 'assets/event-trump-deal.png',
                description: '',
                minDay: 25, maxDay: 45,
                condition: () => SIM.budget > 300 && SIM.diplomaticCapital > 25,
                choices: [
                    { text: '', effects: { diplomaticCapital: -15, tension: -8, domesticApproval: -5 },
                      flavor: '',
                      setFlags: { grand_deal_proposed: true }, chainEvent: 'T02_deal_response', chainDelay: 5,
                      chainHint: 'Iran is deliberating on your proposal...' },
                    { text: '', effects: { diplomaticCapital: 10, tension: -5 },
                      flavor: '' },
                    { text: '', effects: { domesticApproval: 12, diplomaticCapital: -10 },
                      flavor: '',
                      setFlags: { deal_leaked_truth_social: true } },
                ],
            },
            {
                id: 'T03_political_capital_crisis', title: '', image: 'assets/event-trump-rally.png',
                description: '',
                minDay: 40, maxDay: 65,
                condition: () => SIM.uniqueResource < 20,
                choices: [
                    { text: '', effects: { politicalCapital: 20, domesticApproval: 10, internationalStanding: -5, budget: -15 },
                      flavor: '' },
                    { text: '', effects: { politicalCapital: 15, budget: -10, domesticApproval: 5 },
                      flavor: '' },
                    { text: '', effects: { politicalCapital: 12, domesticApproval: -5, fogOfWar: 5 },
                      flavor: '' },
                ],
            },
            {
                id: 'T04_iran_backchannel', title: '', image: 'assets/event-trump-truth-social.png',
                description: '',
                minDay: 10, maxDay: 25,
                condition: () => SIM.storyFlags?.fox_iran_message,
                choices: [
                    { text: '', effects: { diplomaticCapital: 10, tension: -5, fogOfWar: 5 },
                      flavor: '',
                      setFlags: { kushner_envoy_sent: true } },
                    { text: '', effects: { diplomaticCapital: 5, internationalStanding: 3 },
                      flavor: '' },
                    { text: '', effects: { tension: 5, politicalCapital: 3 },
                      flavor: '' },
                ],
            },
            {
                id: 'T02_deal_response', title: '', image: 'assets/event-grand-bargain.png',
                description: '',
                minDay: 30, maxDay: 55,
                condition: () => SIM.storyFlags?.grand_deal_proposed,
                choices: [
                    { text: '', effects: { tension: -10, domesticApproval: -8, diplomaticCapital: 15, iranAggression: -10 },
                      flavor: '' },
                    { text: '', effects: { tension: 8, domesticApproval: 8, iranAggression: 5 },
                      flavor: '' },
                    { text: '', effects: { domesticApproval: 5, iranAggression: 8, diplomaticCapital: -5, fogOfWar: 5 },
                      flavor: '' },
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
            weekStart: [],
            morningBrief: [],
            highTension: '',
            lowApproval: '',
            seizure: '',
            diplomatic: '',
            victory: '',
            lowBudget: '',
            highProxy: '',
            uniqueResourceLow: '',
            uniqueResourceCritical: '',
        },

        epilogues: {
            diplomatic: '',
            military: '',
            decline: '',
        },
    },
    {
        id: 'hegseth', name: '', title: '',
        spriteKey: 'portrait_hegseth', portraitImage: 'assets/pete.png', selectImage: 'assets/char-hegseth.png',
        ability: '',
        abilityDesc: '',
        lore: [],

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
                id: 'H01_pentagon_power_play', title: '', image: 'assets/event-hegseth-pentagon.png',
                description: '',
                minDay: 3, maxDay: 8,
                condition: () => true,
                choices: [
                    { text: '', effects: { commandAuthority: 10, diplomaticCapital: -5, tension: 3 },
                      flavor: '' },
                    { text: '', effects: { commandAuthority: 5, diplomaticCapital: 5 },
                      flavor: '' },
                    { text: '', effects: { commandAuthority: 8, domesticApproval: 10, fogOfWar: 5 },
                      flavor: '' },
                ],
            },
            {
                id: 'H02_leak_from_within', title: '', image: 'assets/event-e17-leak.png',
                description: '',
                minDay: 15, maxDay: 30,
                condition: () => SIM.uniqueResource < 40,
                choices: [
                    { text: '', effects: { commandAuthority: 10, fogOfWar: -5 },
                      flavor: '',
                      setFlags: { leak_confronted: true } },
                    { text: '', effects: { commandAuthority: 5, diplomaticCapital: 5 },
                      flavor: '',
                      setFlags: { leak_investigation: true }, chainEvent: 'H02_leak_result', chainDelay: 5,
                      chainHint: 'The investigation will take several days...' },
                    { text: '', effects: { diplomaticCapital: 5, fogOfWar: -3 },
                      flavor: '' },
                ],
            },
            {
                id: 'H02_leak_result', title: '', image: 'assets/event-hegseth-pentagon.png',
                description: '',
                minDay: 20, maxDay: 40,
                condition: () => SIM.storyFlags?.leak_investigation,
                choices: [
                    { text: '', effects: { commandAuthority: 15, domesticApproval: 5, polarization: 5 },
                      flavor: '' },
                    { text: '', effects: { commandAuthority: 8, fogOfWar: -5 },
                      flavor: '' },
                ],
            },
            {
                id: 'H03_shock_and_awe', title: '', image: 'assets/event-hegseth-shock-awe.png',
                description: '',
                minDay: 30, maxDay: 50,
                condition: () => SIM.warPath >= 2 && SIM.uniqueResource > 50,
                choices: [
                    { text: '', effects: { tension: 30, warPath: 3, iranAggression: -25, domesticApproval: 15, budget: -50, internationalStanding: -10 },
                      flavor: '' },
                    { text: '', effects: { tension: 15, warPath: 1, iranAggression: -15, budget: -25, domesticApproval: 8 },
                      flavor: '' },
                    { text: '', effects: { tension: 10, budget: -10, iranAggression: -10 },
                      flavor: '' },
                ],
            },
            {
                id: 'H04_troop_morale', title: '', image: 'assets/event-hegseth-troops.png',
                description: '',
                minDay: 50, maxDay: 70,
                condition: () => SIM.day > 30,
                choices: [
                    { text: '', effects: { commandAuthority: 15, domesticApproval: 10 },
                      flavor: '' },
                    { text: '', effects: { budget: -20, commandAuthority: 5, iranAggression: 3 },
                      flavor: '' },
                    { text: '', effects: { commandAuthority: 10, domesticApproval: 8, tension: 8 },
                      flavor: '' },
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
            weekStart: [],
            morningBrief: [],
            highTension: '',
            lowApproval: '',
            seizure: '',
            diplomatic: '',
            victory: '',
            lowBudget: '',
            highProxy: '',
            uniqueResourceLow: '',
            uniqueResourceCritical: '',
        },

        epilogues: {
            diplomatic: '',
            military: '',
            decline: '',
        },
    },
    {
        id: 'kushner', name: '', title: '',
        spriteKey: 'portrait_kushner', portraitImage: 'assets/kushner.png', selectImage: 'assets/char-kushner.png',
        ability: '',
        abilityDesc: '',
        lore: [],

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
                id: 'K01_mbs_calls', title: '', image: 'assets/event-kushner-mbs.png',
                description: '',
                minDay: 3, maxDay: 8,
                condition: () => true,
                choices: [
                    { text: '', effects: { diplomaticCapital: 3, internationalStanding: 5 },
                      flavor: '',
                      contactEffect: { id: 'mbs', trust: 2 } },
                    { text: '', effects: { fogOfWar: -10, diplomaticCapital: 5, exposure: 5 },
                      flavor: '',
                      contactEffect: { id: 'mbs', trust: 8 } },
                    { text: '', effects: { diplomaticCapital: 10, exposure: 15 },
                      flavor: '',
                      contactEffect: { id: 'mbs', trust: 5 },
                      setFlags: { riyadh_summit_proposed: true }, chainEvent: 'K03_riyadh_summit', chainDelay: 7,
                      chainHint: 'Summit preparations will take about a week...' },
                ],
            },
            {
                id: 'K02_exposure_spikes', title: '', image: 'assets/event-kushner-exposure.png',
                description: '',
                minDay: 20, maxDay: 40,
                condition: () => SIM.uniqueResource > 50,
                choices: [
                    { text: '', effects: { domesticApproval: 5, exposure: -10 },
                      flavor: '' },
                    { text: '', effects: { exposure: -5, domesticApproval: -3 },
                      flavor: '' },
                    { text: '', effects: { exposure: -8, domesticApproval: 5, internationalStanding: 3 },
                      flavor: '',
                      setFlags: { planted_stories: true } },
                ],
            },
            {
                id: 'K03_riyadh_summit', title: '', image: 'assets/event-kushner-summi.png',
                description: '',
                minDay: 15, maxDay: 30,
                condition: () => SIM.storyFlags?.riyadh_summit_proposed,
                choices: [
                    { text: '', effects: { internationalStanding: 15, diplomaticCapital: 10 },
                      flavor: '',
                      contactEffect: { id: 'mbs', trust: 10 } },
                    { text: '', effects: { diplomaticCapital: 10, fogOfWar: -5 },
                      flavor: '',
                      contactEffect: { id: 'mbs', trust: 5 } },
                    { text: '', effects: { diplomaticCapital: 15, exposure: 10, domesticApproval: 5 },
                      flavor: '',
                      setFlags: { abraham_accords_2: true } },
                ],
            },
            {
                id: 'K04_araghchi_gambit', title: '', image: 'assets/vent-kushner-zarif.png',
                description: '',
                minDay: 35, maxDay: 55,
                condition: () => {
                    const c = SIM.character?.contacts?.find(c => c.id === 'zarif');
                    return c && c.trust >= 30;
                },
                choices: [
                    { text: '', effects: { diplomaticCapital: 15, tension: -10, iranAggression: -8, exposure: 15 },
                      flavor: '',
                      contactEffect: { id: 'zarif', trust: 15 },
                      setFlags: { araghchi_meeting: true }, chainEvent: 'K04_framework', chainDelay: 4,
                      chainHint: 'Araghchi will take the framework back to Tehran...' },
                    { text: '', effects: { diplomaticCapital: -5, tension: 3 },
                      flavor: '',
                      contactEffect: { id: 'zarif', trust: -5 } },
                    { text: '', effects: { exposure: 5, fogOfWar: -5 },
                      flavor: '',
                      setFlags: { secret_recording: true } },
                ],
            },
            {
                id: 'K04_framework', title: '', image: 'assets/event-envoy.png',
                description: '',
                minDay: 40, maxDay: 60,
                condition: () => SIM.storyFlags?.araghchi_meeting,
                choices: [
                    { text: '', effects: { tension: -15, iranAggression: -12, domesticApproval: -10, diplomaticCapital: 20 },
                      flavor: '' },
                    { text: '', effects: { tension: -5, diplomaticCapital: 5 },
                      flavor: '' },
                    { text: '', effects: { domesticApproval: 8, exposure: 20, tension: 5, diplomaticCapital: -10 },
                      flavor: '' },
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
            weekStart: [],
            morningBrief: [],
            highTension: '',
            lowApproval: '',
            seizure: '',
            diplomatic: '',
            victory: '',
            lowBudget: '',
            highProxy: '',
            uniqueResourceLow: '',
            uniqueResourceCritical: '',
        },

        epilogues: {
            diplomatic: '',
            military: '',
            decline: '',
        },
    },
    {
        id: 'asmongold', name: '', title: '',
        spriteKey: 'portrait_asmongold', portraitImage: 'assets/asmongold.png', selectImage: 'assets/char-asmongold.png',
        ability: '',
        abilityDesc: '',
        lore: [],

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
                id: 'A01_osint_discovery', title: '', image: 'assets/vent-asmongold-osint.png',
                description: '',
                minDay: 3, maxDay: 8,
                condition: () => true,
                choices: [
                    { text: '', effects: { fogOfWar: -5, credibility: 5, commandAuthority: 3 },
                      flavor: '' },
                    { text: '', effects: { fogOfWar: -15, credibility: 10, domesticApproval: 8, commandAuthority: -5 },
                      flavor: '',
                      setFlags: { osint_published: true } },
                    { text: '', effects: { fogOfWar: -3, credibility: 5 },
                      flavor: '' },
                ],
            },
            {
                id: 'A02_disinfo_attack', title: '', image: 'assets/event-asmongold-disinfo.png',
                description: '',
                minDay: 15, maxDay: 30,
                condition: () => SIM.uniqueResource > 40,
                choices: [
                    { text: '', effects: { credibility: 10, fogOfWar: -10, domesticApproval: 8 },
                      flavor: '',
                      setFlags: { disinfo_debunked: true } },
                    { text: '', effects: { credibility: 20, fogOfWar: -20, internationalStanding: 10 },
                      flavor: '',
                      setFlags: { disinfo_network_exposed: true }, chainEvent: 'A02_disinfo_escalation', chainDelay: 5,
                      chainHint: 'Iran\'s info-ops will escalate after being exposed...' },
                    { text: '', effects: { credibility: 5, domesticApproval: 10, fogOfWar: -8 },
                      flavor: '' },
                ],
            },
            {
                id: 'A02_disinfo_escalation', title: '', image: 'assets/event-asmongold-disinfo.png',
                description: '',
                minDay: 20, maxDay: 40,
                condition: () => SIM.storyFlags?.disinfo_network_exposed,
                choices: [
                    { text: '', effects: { credibility: 15, fogOfWar: -15, tension: 5, budget: -15 },
                      flavor: '' },
                    { text: '', effects: { credibility: 8, domesticApproval: -3, internationalStanding: 5 },
                      flavor: '' },
                ],
            },
            {
                id: 'A03_credibility_test', title: '', image: 'assets/event-asmongold-stream.png',
                description: '',
                minDay: 30, maxDay: 50,
                condition: () => SIM.fogOfWar < 30,
                choices: [
                    { text: '', effects: { domesticApproval: 15, credibility: 10, fogOfWar: -5 },
                      flavor: '' },
                    { text: '', effects: { internationalStanding: 15, diplomaticCapital: 10, fogOfWar: 5 },
                      flavor: '' },
                    { text: '', effects: { credibility: 5 },
                      flavor: '' },
                ],
            },
            {
                id: 'A04_chat_demands_action', title: '', image: 'assets/event-asmongold-reddit.png',
                description: '',
                minDay: 20, maxDay: 35,
                condition: () => SIM.domesticApproval < 50,
                choices: [
                    { text: '', effects: { domesticApproval: 15, tension: 10, warPath: 1 },
                      flavor: '' },
                    { text: '', effects: { credibility: 5, domesticApproval: -3 },
                      flavor: '' },
                    { text: '', effects: { domesticApproval: 8, credibility: 3 },
                      flavor: '' },
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
            weekStart: [],
            morningBrief: [],
            highTension: '',
            lowApproval: '',
            seizure: '',
            diplomatic: '',
            victory: '',
            lowBudget: '',
            highProxy: '',
            uniqueResourceLow: '',
            uniqueResourceCritical: '',
        },

        epilogues: {
            diplomatic: '',
            military: '',
            decline: '',
        },
    },
    {
        id: 'fuentes', name: '', title: '',
        spriteKey: 'portrait_fuentes', portraitImage: 'assets/nick.png', selectImage: 'assets/char-fuentes.png',
        ability: '',
        abilityDesc: '',
        lore: [],

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
                id: 'F01_base_demands_blood', title: '', image: 'assets/event-fuentes-base.png',
                description: '',
                minDay: 5, maxDay: 12,
                condition: () => true,
                choices: [
                    { text: '', effects: { baseEnthusiasm: 15, internationalStanding: -10, oilFlow: -10, iranAggression: 8 },
                      flavor: '' },
                    { text: '', effects: { baseEnthusiasm: 5, internationalStanding: 5, diplomaticCapital: 3 },
                      flavor: '' },
                    { text: '', effects: { baseEnthusiasm: 10, commandAuthority: -5, domesticApproval: 5 },
                      flavor: '' },
                ],
            },
            {
                id: 'F02_international_pariah', title: '', image: 'assets/event-fuentes-pariah.png',
                description: '',
                minDay: 20, maxDay: 40,
                condition: () => SIM.internationalStanding < 25,
                choices: [
                    { text: '', effects: { baseEnthusiasm: 15, internationalStanding: -5, domesticApproval: 8 },
                      flavor: '' },
                    { text: '', effects: { internationalStanding: 10, baseEnthusiasm: -5, diplomaticCapital: 5 },
                      flavor: '' },
                    { text: '', effects: { internationalStanding: 5, diplomaticCapital: 5, baseEnthusiasm: -3 },
                      flavor: '' },
                ],
            },
            {
                id: 'F03_america_first_rally', title: '', image: 'assets/event-fuentes-isolation.png',
                description: '',
                minDay: 15, maxDay: 30,
                condition: () => SIM.uniqueResource > 40,
                choices: [
                    { text: '', effects: { baseEnthusiasm: 20, domesticApproval: 15, internationalStanding: -8, budget: -15 },
                      flavor: '' },
                    { text: '', effects: { baseEnthusiasm: 10, internationalStanding: 10, diplomaticCapital: 5 },
                      flavor: '' },
                    { text: '', effects: { baseEnthusiasm: 25, internationalStanding: -15, polarization: 15, diplomaticCapital: -10 },
                      flavor: '' },
                ],
            },
            {
                id: 'F04_assassination_whisper', title: '', image: 'assets/event-fuentes-assassination.png',
                description: '',
                minDay: 40, maxDay: 65,
                condition: () => SIM.uniqueResource < 30 && SIM.internationalStanding < 20,
                choices: [
                    { text: '', effects: { baseEnthusiasm: -5, fogOfWar: 3 },
                      flavor: '' },
                    { text: '', effects: { baseEnthusiasm: 10, domesticApproval: 5, assassinationRisk: 15 },
                      flavor: '' },
                    { text: '', effects: { baseEnthusiasm: 15, domesticApproval: 8, fogOfWar: 5, diplomaticCapital: -5 },
                      flavor: '' },
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
            weekStart: [],
            morningBrief: [],
            highTension: '',
            lowApproval: '',
            seizure: '',
            diplomatic: '',
            victory: '',
            lowBudget: '',
            highProxy: '',
            uniqueResourceLow: '',
            uniqueResourceCritical: '',
        },

        epilogues: {
            diplomatic: '',
            military: '',
            decline: '',
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
                <button class="lore-proceed-btn" id="lore-proceed" style="display:none">${DATA.dialogue.loreScreen.proceedButton}</button>
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
                    <h1>${DATA.dialogue.characterSelect.heading}</h1>
                    <p class="char-subtitle">${DATA.dialogue.characterSelect.subtitle}</p>

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

                    <div class="char-divider"><span>${DATA.dialogue.characterSelect.dividerText}</span></div>

                    <div class="char-grid">
                        ${advisors.map((ch, i) => renderCard(ch, i + 1)).join('')}
                    </div>

                    <button class="begin-btn ${selectedIdx !== null ? 'ready' : ''}" id="begin-btn">
                        ${selectedIdx !== null ? DATA.dialogue.characterSelect.beginButtonReady : DATA.dialogue.characterSelect.beginButtonDefault}
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

function hydrateCharacters() {
    const cd = DATA.characters.characters;
    const dd = DATA.dialogue;

    CHARACTERS.forEach(ch => {
        const t = cd[ch.id];
        if (!t) return;
        ch.name = t.name;
        ch.title = t.title;
        ch.ability = t.ability;
        ch.abilityDesc = t.abilityDesc;
        ch.lore = t.lore;
        ch.morningBrief = t.morningBrief;
        ch.epilogues = t.epilogues;
        // Hydrate unique events
        if (t.uniqueEvents && ch.uniqueEvents) {
            ch.uniqueEvents.forEach(ev => {
                const et = t.uniqueEvents[ev.id];
                if (!et) return;
                ev.title = et.title;
                ev.description = et.description;
                if (et.choices) {
                    ev.choices.forEach((c, i) => {
                        if (et.choices[i]) {
                            c.label = et.choices[i].label;
                            if (et.choices[i].flavor) c.flavor = et.choices[i].flavor;
                        }
                    });
                }
            });
        }
    });

    // Hydrate advisor reactions
    CHARACTERS.forEach(ch => {
        const r = dd.advisorReactions[ch.id];
        if (!r || !ch.reactions) return;
        Object.keys(r).forEach(k => {
            ch.reactions[k] = r[k];
        });
    });
}
