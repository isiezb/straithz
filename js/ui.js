/**
 * UI Controller — Daily Desk terminal screens
 * All screens use the lore intro typewriter aesthetic
 * Phases: initial_pick → daily_report → dayplay → event → daily_report (loop)
 * Action Point system during dayplay (Game Dev Tycoon style)
 */

const TERMINAL = document.getElementById('terminal-overlay');

// ======================== ACTION POINT SYSTEM ========================

const INTERRUPTS = [
    // ===== INTELLIGENCE (INT-01 to INT-05) =====
    { text: "NSA flagged unusual encrypted traffic from an IRGC base. Analysts need 2 hours to decode.", choices: [
        { label: "Divert analysts now", effects: { fogOfWar: -5, budget: -5 } },
        { label: "Queue for tomorrow", effects: {} }
    ]},
    { text: "4-hour weather gap over Bandar Abbas for satellite imagery.", choices: [
        { label: "Redirect satellite", effects: { budget: -5, fogOfWar: -3 } },
        { label: "Keep scheduled targets", effects: {} }
    ]},
    { text: "Iranian naval officer at Swiss embassy claiming he has operational plans.", choices: [
        { label: "Send team immediately", effects: { fogOfWar: -8, tension: 3 } },
        { label: "Vet through channels", effects: { fogOfWar: -3 } }
    ]},
    { text: "IRGC commanders call intercepted. Best translator on leave.", choices: [
        { label: "Use backup translator", effects: { fogOfWar: -5 } },
        { label: "Wait for expert", effects: { fogOfWar: -3 } }
    ]},
    { text: "Telegram accounts posting Iranian military schedules. Could be real or counterintel.", choices: [
        { label: "Act cautiously on the intel", effects: { fogOfWar: -3 } },
        { label: "Flag and move on", effects: {} }
    ]},

    // ===== DIPLOMATIC (INT-06 to INT-10) =====
    { text: "French ambassador in your lobby, upset about yesterday's briefing. No appointment.", choices: [
        { label: "See him now", effects: { internationalStanding: 3 } },
        { label: "Schedule tomorrow", effects: { internationalStanding: -2 } }
    ]},
    { text: "Omani intermediary has a time-sensitive message from Araghchi.", choices: [
        { label: "Read now", effects: { diplomaticCapital: 3, tension: -2 } },
        { label: "Read after current action", effects: { diplomaticCapital: 1 } }
    ]},
    { text: "UN Secretary General wants to discuss ceasefire framework.", choices: [
        { label: "Take call", effects: { diplomaticCapital: 3, internationalStanding: 2 } },
        { label: "Call back later", effects: { internationalStanding: -2 } }
    ]},
    { text: "Russian surveillance ship entered the Persian Gulf.", choices: [
        { label: "Diplomatic note", effects: { internationalStanding: 2 } },
        { label: "Shadow with destroyer", effects: { budget: -5, tension: 2 } }
    ]},
    { text: "South Korea's trade minister calling. They import 70% of oil through Hormuz.", choices: [
        { label: "Reassure personally", effects: { internationalStanding: 3, oilFlow: 2 } },
        { label: "Refer to deputy", effects: {} }
    ]},

    // ===== MILITARY (INT-11 to INT-15) =====
    { text: "Radar on USS Eisenhower down. 8-hour repair estimate.", choices: [
        { label: "Keep on station degraded", effects: { conflictRisk: 3 } },
        { label: "Pull back for repairs", effects: { budget: -10, conflictRisk: -2 } }
    ]},
    { text: "Destroyer captain: Iranian speedboats approaching fast, below warning threshold. Wants weapons-free prep.", choices: [
        { label: "Grant weapons-free", effects: { tension: 3, conflictRisk: 2 } },
        { label: "Maintain ROE", effects: {} }
    ]},
    { text: "US patrol nearly fired on UAE Coast Guard. IFF confusion. UAE wants explanation.", choices: [
        { label: "Apologize, review protocols", effects: { internationalStanding: 3 } },
        { label: "Blame UAE coordination", effects: { internationalStanding: -5 } }
    ]},
    { text: "SOCOM proposes covert recon of suspected Iranian weapons cache on an island.", choices: [
        { label: "Approve mission", effects: { budget: -15, fogOfWar: -8, tension: 5 } },
        { label: "Deny", effects: {} }
    ]},
    { text: "Patrol vessel detected naval mine in shipping lane.", choices: [
        { label: "Send minesweeper", effects: { budget: -10, oilFlow: -3 } },
        { label: "Investigate with drones", effects: { budget: -5, oilFlow: -5 } }
    ]},

    // ===== DOMESTIC (INT-16 to INT-20) =====
    { text: 'Senator tweeted classified operational details: "The American people deserve to know."', choices: [
        { label: "Demand investigation", effects: { domesticApproval: 3, fogOfWar: 2 } },
        { label: "Brief FBI privately", effects: {} }
    ]},
    { text: "Trucker convoy blocking highway outside DC over fuel prices.", choices: [
        { label: "Express sympathy, review subsidies", effects: { domesticApproval: 3, budget: -10 } },
        { label: "Say nothing", effects: { domesticApproval: -3 } }
    ]},
    { text: "SecState and SecDef screaming match in the hallway. Staff shaken.", choices: [
        { label: "Mediate personally", effects: { polarization: -3 } },
        { label: "Let them work it out", effects: { polarization: 2 } }
    ]},
    { text: "Snap poll dropped. Comms team wants to know if you respond.", choices: [
        { label: "Rapid response matching mood", effects: { domesticApproval: 2 } },
        { label: "Stay the course", effects: {} }
    ]},
    { text: "Major veterans org issued statement on your military posture.", choices: [
        { label: "Respond publicly", effects: { domesticApproval: 3 } },
        { label: "No response", effects: {} }
    ]},

    // ===== CRISIS (INT-21 to INT-25) =====
    { text: "Damaged tanker leaking crude into the strait. Environmental disaster developing.", choices: [
        { label: "Divert naval assets to help", effects: { budget: -15, internationalStanding: 5 } },
        { label: "Let flag state handle it", effects: { internationalStanding: -5, oilFlow: -3 } }
    ]},
    { text: "Qatar Airways 777 deviated into restricted airspace. Both sides scrambling.", choices: [
        { label: "De-escalate via hotline", effects: { diplomaticCapital: 5, tension: -5 } },
        { label: "Scramble escort fighters", effects: { tension: 3 } }
    ]},
    { text: "6.4 magnitude earthquake in southwestern Iran. Significant casualties.", choices: [
        { label: "Offer humanitarian aid immediately", effects: { internationalStanding: 10, tension: -8, budget: -10 }, setFlags: { humanitarian_rescue: true } },
        { label: "Express condolences only", effects: { internationalStanding: -3 } }
    ]},
    { text: "Oil futures spiked 8% on false seizure rumor.", choices: [
        { label: "Public denial with intel backing", effects: { fogOfWar: -3, oilPrice: -5 } },
        { label: "Let it ride", effects: { oilPrice: 3 } }
    ]},
    { text: "Large crowd at US embassy Baghdad. Hezbollah flags visible.", choices: [
        { label: "Reinforce security", effects: { budget: -5 } },
        { label: "Begin evacuation planning", effects: { budget: -10, domesticApproval: -3 } }
    ]},

    // ===== CHARACTER-SPECIFIC (INT-26 to INT-35) =====
    { text: "You posted an internal strategy memo to Truth Social instead of group chat. Up for 47 seconds.", choices: [
        { label: "Claim intentional \u2014 4D chess", effects: { domesticApproval: 3, fogOfWar: 5 } },
        { label: "Delete and deny", effects: { domesticApproval: -3 } }
    ], condition: () => SIM.character?.id === 'trump' },

    { text: "Major donor calling from Mar-a-Lago, demanding to know why oil stocks are down.", choices: [
        { label: "Schmooze", effects: { domesticApproval: 2 } },
        { label: "Have assistant handle it", effects: { domesticApproval: -2 } }
    ], condition: () => SIM.character?.id === 'trump' },

    { text: "Marine unit challenges you to PT on carrier visit. Cameras rolling.", choices: [
        { label: "Accept and crush it", effects: { domesticApproval: 5, internationalStanding: 3 } },
        { label: "Politely decline", effects: { domesticApproval: -2 } }
    ], condition: () => SIM.character?.id === 'hegseth' },

    { text: "Generals split 50/50 on next move. They're looking at you.", choices: [
        { label: "Decide immediately", effects: { tension: 3 } },
        { label: "Ask for more analysis", effects: { diplomaticCapital: 2 } }
    ], condition: () => SIM.character?.id === 'hegseth' },

    { text: 'Unknown number sent coordinates in Dubai: "Tomorrow. 3pm. Come alone. \u2014Z"', choices: [
        { label: "Go", effects: { fogOfWar: -10, diplomaticCapital: 5 } },
        { label: "Trace number first", effects: { fogOfWar: -3 } }
    ], condition: () => SIM.character?.id === 'kushner' },

    { text: "Your father-in-law wants a full briefing over dinner. He has opinions.", choices: [
        { label: "Brief honestly", effects: { domesticApproval: 3 } },
        { label: "Sanitized version", effects: {} }
    ], condition: () => SIM.character?.id === 'kushner' },

    { text: "Someone in your intel briefing is leaking to a hostile Twitch streamer.", choices: [
        { label: "Find the source", effects: { fogOfWar: -5 } },
        { label: "Feed false intel through leak", effects: { fogOfWar: -3 } }
    ], condition: () => SIM.character?.id === 'asmongold' },

    { text: "A subreddit crowdsourced satellite analysis and found something your IC missed.", choices: [
        { label: "Engage, give credit", effects: { domesticApproval: 5, fogOfWar: -3 } },
        { label: "Classify it", effects: { fogOfWar: -3, domesticApproval: -5 } }
    ], condition: () => SIM.character?.id === 'asmongold' },

    { text: 'Prominent figure in your movement denounced you as "globalist capitulation."', choices: [
        { label: "Attack back, purge", effects: { domesticApproval: -5, polarization: 5 } },
        { label: "Reach out privately", effects: { domesticApproval: 5 } }
    ], condition: () => SIM.character?.id === 'fuentes' },

    { text: "Nobody will co-sponsor your resolution. Party leadership won't call back.", choices: [
        { label: "Bypass Congress, national address", effects: { domesticApproval: 5, polarization: 3 } },
        { label: "Compromise with Congress", effects: { domesticApproval: -3, internationalStanding: 3 } }
    ], condition: () => SIM.character?.id === 'fuentes' },
];

const _intelSnippets = [
    'SIGINT intercept: IRGC naval base at Bandar Abbas showing surge activity.',
    'Satellite imagery: Heydar-110 fast boats deployed to forward position near Larak Island.',
    'HUMINT report: Iranian commander expressing doubts about escalation — moderates gaining.',
    'Intercepted comms: IRGC supply convoy scheduled for next 48 hours via Kish Island.',
    'MQ-9 Reaper footage: mine-laying vessel spotted in western shipping lane.',
    'Signal analysis: Iranian C2 network traffic spike — possible operation imminent.',
    'Asset report: IRGC and Foreign Ministry in open disagreement over strategy.',
    'NSA intercept: Chinese tankers negotiating alternate route via Pakistani port.',
    'Satellite: IRIS Shahid Bagheri drone carrier has left port — heading southeast.',
    'HUMINT: Iran stockpiling enriched uranium at underground Fordow facility.',
    'Intercepted call: Iraqi militia commander receiving targeting data from Tehran.',
    'Imagery: New anti-ship missile battery activated at Qeshm Island — 30km from shipping lane.',
    'SIGINT: Houthi leadership in contact with IRGC Quds Force — coordinating Red Sea ops.',
    'Asset report: Iranian regime concerned about public unrest over economic collapse.',
    'Satellite: Russia-flagged cargo vessel entered Bandar Abbas with military containers.',
    'NSA: APT33 staging infrastructure for cyberattack on Gulf state port systems.',
    'HUMINT: Mojtaba Khamenei consolidating IRGC loyalty — purging moderates from command.',
    'Satellite: Three carrier groups now visible in Arabian Sea — Lincoln, Truman, Carl Vinson.',
    'SIGINT: IRGC Navy switching to burst transmissions — harder to intercept.',
    'Asset report: Iranian civilian protests in Isfahan over economic collapse and war.',
    'Imagery: New IRGC fast boat base detected on Farur Island — 20+ Heydar-class vessels.',
    'NSA intercept: Russian military advisors detected at IRGC Aerospace Force HQ.',
    'HUMINT: Chinese ambassador in Tehran offering "comprehensive strategic package" to Iran.',
    'Satellite: Iranian mobile missile launchers dispersing from known bases — targeting unknown.',
    'SIGINT: Houthi commanders receiving encrypted satellite phones from IRGC Quds Force.',
    'Asset report: IRGC Quds Force activating sleeper cells in Bahrain and Kuwait.',
    'Imagery: IRIS Shahid Bagheri drone carrier detected deploying explosive drone boats.',
];

// Floating number stack counter for positioning

// ======================== ACTION TOOLTIPS ========================

const ACTION_TIPS = {
    'gather-intel':     { desc: 'Deploy CIA assets to reduce fog of war. Better intel means better decisions.', effect: 'Fog -8' },
    'analyze-threats':  { desc: 'Review current intelligence for actionable patterns and forecasts.', effect: 'Fog -3 (if fog low)' },
    'phone-call':       { desc: 'Call a foreign leader. Builds diplomatic capital and can shift alliances.', effect: 'Diplomacy +4, Tension -2' },
    'draft-proposal':   { desc: 'Draft a formal diplomatic proposal. Slow but powerful for international standing.', effect: 'Standing +5' },
    'demand-un-session':{ desc: 'Demand emergency UN Security Council session on the strait crisis.', effect: 'Standing +3, Tension -3' },
    'reposition-fleet': { desc: 'Move naval assets to deter Iranian aggression or protect shipping lanes.', effect: 'Tension +3, Iran aggr. -2' },
    'change-roe':       { desc: 'Cycle rules of engagement: Defensive → Moderate → Aggressive. Affects all engagements.', effect: 'Changes ROE' },
    'escort-tankers':   { desc: 'Assign warships to escort oil tankers through the strait. Protects oil flow.', effect: 'Oil flow +3, Tension +2' },
    'precision-strike': { desc: 'Strike a specific military target. Effective but escalatory.', effect: 'Iran aggr. -5, Tension +8' },
    'spec-ops-raid':    { desc: 'Special forces raid on Iranian military assets. High risk, high reward.', effect: 'Iran aggr. -6, Fog -5' },
    'air-strikes':      { desc: 'Launch sustained air campaign against Iranian military infrastructure.', effect: 'Iran aggr. -10, WarPath +1' },
    'sead-mission':     { desc: 'Suppress enemy air defenses. Enables further air operations.', effect: 'Tension +5, Fog -5' },
    'ground-troops':    { desc: 'Deploy ground forces to Iranian-held territory. Major escalation.', effect: 'Iran aggr. -15, WarPath +1' },
    'seize-islands':    { desc: 'Seize strategic Iranian islands controlling the strait.', effect: 'Iran aggr. -12, WarPath +1' },
    'full-mobilization':{ desc: 'Full military mobilization. Total commitment to war footing.', effect: 'All military metrics shift' },
    'press-conference': { desc: 'Hold a press conference to shape the narrative and boost approval.', effect: 'Approval +3, Polarization -2' },
    'brief-congress':   { desc: 'Brief congressional leaders. Builds political support for your strategy.', effect: 'Approval +2' },
    'adjust-sanctions': { desc: 'Tighten or loosen sanctions on Iran. Affects their economy and aggression.', effect: 'Iran econ ±5' },
    'market-intervention':{ desc: 'Release strategic oil reserves or subsidize fuel to stabilize markets.', effect: 'Oil price -5' },
    'issue-ultimatum':  { desc: 'Deliver a public ultimatum to Iran. Dramatic but polarizing.', effect: 'Tension +8, Approval +5' },
    'emergency-coalition':{ desc: 'Form an emergency multinational coalition for strait operations.', effect: 'Standing +5, Budget +15' },
    'escalate':         { desc: 'Increase military escalation level. Unlocks more aggressive options.', effect: 'Escalation +1' },
    'deescalate':       { desc: 'Reduce military escalation. Locks out aggressive options but eases tension.', effect: 'Escalation -1, Tension -5' },
    // Bible actions
    'prisoner_exchange':   { desc: 'Propose a hostage/prisoner swap through intermediaries.', effect: 'Tension -5, Approval +5' },
    'covert_operation':    { desc: 'Plan and execute a clandestine mission against Iranian assets.', effect: 'Iran aggr. -8, Fog -10' },
    'emergency_budget':    { desc: 'Go to Congress for emergency funding.', effect: 'Budget +200' },
    'media_offensive':     { desc: 'Coordinated media blitz to shape the narrative.', effect: 'Fog -8, Approval +5' },
    'backchannel_message': { desc: 'Send a private message to Iran through intermediaries.', effect: 'Tension -3' },
    'allied_consultation': { desc: 'Conference call with allied leaders to build coalition support.', effect: 'Standing +3, Diplo +3' },
    'sanctions_adjustment':{ desc: 'Fine-tune sanctions: tighten or loosen specific measures. Delayed effects.', effect: 'Iran econ -3, delayed -5' },
    'intel_sharing':       { desc: 'Share classified intel with allies to build trust.', effect: 'Standing +5, Diplo +3' },
    'humanitarian_corridor':{ desc: 'Establish safe passage for civilian vessels and aid.', effect: 'Standing +10, Tension -3' },
    'economic_stimulus':   { desc: 'Domestic economic action to offset crisis impacts.', effect: 'Approval +8, Oil price -5' },
    'cyber_recon':         { desc: 'Probe Iranian digital infrastructure for vulnerabilities.', effect: 'Fog -10' },
    'war_powers_consult':  { desc: 'Brief Congressional leadership on military escalation.', effect: 'Approval +3, Polariz. -3' },
    'regional_flyover':    { desc: 'Visible show of force with strategic bombers over the Gulf.', effect: 'Tension +5, Iran aggr. -5' },
    'summit_proposal':     { desc: 'Propose a major international summit on the strait crisis.', effect: 'Standing +8, Diplo -10' },
    'press_embargo':       { desc: 'Request media blackout on sensitive operations.', effect: 'Fog -5, Approval -2' },
};

// ======================== BIBLE ACTIONS (Content Bible expansion) ========================

const BIBLE_ACTIONS = [
    {
        id: 'prisoner_exchange',
        name: 'PRISONER EXCHANGE',
        category: 'diplomacy',
        ap: 2, cost: 20,
        condition: () => SIM.seizureCount > 0,
        execute: function() {
            const success = SIM.diplomaticCapital > 30 && SIM.iranFactionBalance > 40;
            if (success) {
                _applyEffects({ tension: -8, domesticApproval: 10, diplomaticCapital: -8, iranAggression: -5 });
                addHeadline('BREAKING: Prisoner exchange agreed — crew coming home', 'good');
                showToast('Prisoner exchange successful!', 'good');
            } else {
                _applyEffects({ tension: 3, diplomaticCapital: -5 });
                addHeadline('Prisoner exchange talks collapse — Iran demands more concessions', 'bad');
                showToast('Exchange negotiations failed', 'bad');
            }
        },
    },
    {
        id: 'covert_operation',
        name: 'COVERT OPERATION',
        category: 'intelligence',
        ap: 3, cost: 25,
        condition: () => SIM.fogOfWar < 50,
        execute: function() {
            const success = Math.random() < 0.7;
            if (success) {
                _applyEffects({ iranAggression: -10, fogOfWar: -15, tension: 5, conflictRisk: 3 });
                addHeadline('Reports of explosion at Iranian military facility — cause unknown', 'neutral');
                showToast('Covert operation: SUCCESS', 'good');
            } else {
                _applyEffects({ tension: 15, internationalStanding: -10, iranAggression: 10, fogOfWar: 5 });
                addHeadline('Iran claims to have captured US special operations personnel', 'critical');
                showToast('Covert operation: COMPROMISED', 'bad');
            }
        },
    },
    {
        id: 'emergency_budget',
        name: 'EMERGENCY BUDGET REQUEST',
        category: 'domestic',
        ap: 1, cost: 0,
        condition: () => SIM.budget < 100,
        execute: function() {
            const success = SIM.domesticApproval > 40;
            if (success) {
                _applyEffects({ budget: 200, domesticApproval: -3, polarization: 3 });
                addHeadline('Congress approves $200M emergency appropriation for strait operations', 'good');
                showToast('+$200M budget approved', 'good');
            } else {
                _applyEffects({ budget: 50, domesticApproval: -5, polarization: 5 });
                addHeadline('Congress slashes emergency budget request — only $50M approved', 'bad');
                showToast('Budget request partially denied', 'bad');
            }
        },
    },
    {
        id: 'media_offensive',
        name: 'MEDIA OFFENSIVE',
        category: 'domestic',
        ap: 2, cost: 10,
        condition: () => SIM.fogOfWar > 60,
        execute: function() {
            _applyEffects({ fogOfWar: -8, domesticApproval: 5, internationalStanding: 3, polarization: -2 });
            addHeadline('White House launches coordinated media offensive on strait crisis', 'neutral');
            showToast('Media offensive launched', 'good');
        },
    },
    {
        id: 'backchannel_message',
        name: 'BACK-CHANNEL MESSAGE',
        category: 'diplomacy',
        ap: 1, cost: 0,
        condition: () => SIM.storyFlags?.backchannel_accepted || SIM.diplomaticCapital > 20,
        execute: function() {
            _applyEffects({ tension: -3, diplomaticCapital: -2, iranAggression: -2 });
            addHeadline('Sources: back-channel communications between Washington and Tehran ongoing', 'neutral');
            showToast('Message sent through intermediaries', 'good');
        },
    },
    {
        id: 'allied_consultation',
        name: 'ALLIED CONSULTATION',
        category: 'diplomacy',
        ap: 1, cost: 0,
        condition: () => SIM.internationalStanding > 30,
        execute: function() {
            _applyEffects({ internationalStanding: 3, diplomaticCapital: 3 });
            addHeadline('Allied leaders express support for US strait strategy in joint call', 'good');
            showToast('Allied consultation complete', 'good');
        },
    },
    {
        id: 'sanctions_adjustment',
        name: 'SANCTIONS ADJUSTMENT',
        category: 'economic',
        ap: 1, cost: 0,
        condition: () => true,
        execute: function() {
            _applyEffects({ iranEconomy: -3, tension: 2, iranAggression: 2, internationalStanding: -2 });
            SIM.pendingEffects.push({
                cardId: 'sanctions_adj', cardName: 'Sanctions Adjustment', category: 'economic',
                effects: { iranEconomy: -5, iranAggression: -3 },
                activateOnDay: SIM.day + 3,
            });
            addHeadline('Treasury announces targeted sanctions adjustments on Iranian entities', 'neutral');
            showToast('Sanctions adjusted — effects in 3 days', 'good');
        },
    },
    {
        id: 'intel_sharing',
        name: 'INTELLIGENCE SHARING',
        category: 'intelligence',
        ap: 1, cost: 0,
        condition: () => SIM.fogOfWar < 40 && SIM.internationalStanding > 30,
        execute: function() {
            _applyEffects({ internationalStanding: 5, diplomaticCapital: 3, fogOfWar: 3 });
            addHeadline('US shares classified strait intelligence with coalition partners', 'good');
            showToast('Intel shared with allies', 'good');
        },
    },
    {
        id: 'humanitarian_corridor',
        name: 'HUMANITARIAN CORRIDOR',
        category: 'diplomacy',
        ap: 2, cost: 15,
        condition: () => SIM.warPath >= 2,
        execute: function() {
            _applyEffects({ internationalStanding: 10, tension: -3, domesticApproval: 3, oilFlow: 5 });
            addHeadline('US establishes humanitarian corridor through Strait of Hormuz', 'good');
            showToast('Humanitarian corridor established', 'good');
        },
    },
    {
        id: 'economic_stimulus',
        name: 'ECONOMIC STIMULUS',
        category: 'economic',
        ap: 1, cost: 30,
        condition: () => SIM.oilPrice > 120,
        execute: function() {
            _applyEffects({ domesticApproval: 8, oilPrice: -5, budget: -30 });
            addHeadline('President announces economic stimulus package to offset oil crisis', 'good');
            showToast('Economic stimulus deployed', 'good');
        },
    },
    {
        id: 'cyber_recon',
        name: 'CYBER RECONNAISSANCE',
        category: 'intelligence',
        ap: 1, cost: 10,
        condition: () => SIM.fogOfWar > 30,
        execute: function() {
            _applyEffects({ fogOfWar: -10 });
            const discovery = Math.random() < 0.3;
            if (discovery) {
                _applyEffects({ fogOfWar: -10 });
                addHeadline('NSA cyber reconnaissance reveals Iranian naval operation plans', 'good');
                showToast('Major intelligence breakthrough!', 'good');
            } else {
                addHeadline('Cyber reconnaissance gathering data on Iranian networks', 'neutral');
                showToast('Cyber recon complete', 'good');
            }
        },
    },
    {
        id: 'war_powers_consult',
        name: 'WAR POWERS CONSULTATION',
        category: 'domestic',
        ap: 1, cost: 0,
        condition: () => SIM.warPath >= 3,
        execute: function() {
            _applyEffects({ domesticApproval: 3, polarization: -3, internationalStanding: 3 });
            SIM.storyFlags.war_powers_briefed = true;
            addHeadline('President briefs Congressional Gang of Eight on military operations', 'neutral');
            showToast('Congress briefed — war powers satisfied', 'good');
        },
    },
    {
        id: 'regional_flyover',
        name: 'REGIONAL FLYOVER',
        category: 'military',
        ap: 1, cost: 15,
        condition: () => true,
        execute: function() {
            _applyEffects({ tension: 5, iranAggression: -5, domesticApproval: 3, internationalStanding: -2 });
            addHeadline('B-52 strategic bombers conduct visible flyover of Persian Gulf', 'neutral');
            showToast('Show of force: B-52 flyover', 'good');
        },
    },
    {
        id: 'summit_proposal',
        name: 'SUMMIT PROPOSAL',
        category: 'diplomacy',
        ap: 2, cost: 20,
        condition: () => SIM.diplomaticCapital > 40,
        execute: function() {
            _applyEffects({ diplomaticCapital: -10, internationalStanding: 8, tension: -5, domesticApproval: 3 });
            SIM.storyFlags.summit_proposed = true;
            addHeadline('US proposes international summit on Strait of Hormuz crisis', 'good');
            showToast('Summit proposed — diplomatic momentum building', 'good');
        },
    },
    {
        id: 'press_embargo',
        name: 'PRESS EMBARGO',
        category: 'domestic',
        ap: 1, cost: 0,
        condition: () => SIM.fogOfWar > 50,
        execute: function() {
            _applyEffects({ fogOfWar: -5, domesticApproval: -2, polarization: 2 });
            addHeadline('White House requests voluntary media embargo on strait operations', 'neutral');
            showToast('Press embargo requested', 'good');
        },
    },
];

// ======================== COLLAPSIBLE SECTION STATE ========================

const _sitCollapsed = {
    force: false,
    wire: false,
    intel: true,     // collapsed by default
    strategy: true,  // collapsed by default
    pending: true,   // collapsed by default
    decisions: true, // collapsed by default
};

function initUI() {
    updateGauges();
    setupKeyboardShortcuts();
    _injectActionPanelStyles();
    initMusic();
    initSituationPanel();
    updateCenterPanel();
}

// ======================== SITUATION PANEL (left sidebar) ========================

function initSituationPanel() {
    const panel = document.getElementById('situation-panel');
    if (!panel) return;
    panel.style.display = '';
    updateSituationPanel();
}

function updateSituationPanel() {
    const panel = document.getElementById('situation-panel');
    if (!panel || panel.style.display === 'none') return;

    const g = calculateGauges();
    const r = calculateRating();
    const esc = ESCALATION_LADDER[Math.min(SIM.warPath, 5)];

    function valClass(v) { return v >= 60 ? 'good' : v >= 35 ? 'warning' : 'danger'; }

    // Recent headlines (last 6)
    const recent = SIM.headlines.slice(-6);
    const headlinesHtml = recent.map(h => {
        const prefix = h.level === 'critical' ? '<span class="wire-prefix wire-flash">FLASH</span> '
                     : h.level === 'warning' ? '<span class="wire-prefix wire-urgent">URGENT</span> '
                     : '';
        return `<div class="sit-headline ${h.level}">${prefix}${h.text}</div>`;
    }).join('');

    // Intel (last 3)
    const intelHtml = SIM.intelBriefings.slice(-3).map(b => {
        const cls = b.confidence === 'HIGH' ? 'conf-high' : b.confidence === 'MEDIUM' ? 'conf-medium' : 'conf-low';
        return `<div class="sit-intel-item"><span class="${cls}">[${b.confidence}]</span> ${b.text}</div>`;
    }).join('') || '<div class="sit-intel-item" style="color:#2a6a4a">No current intel.</div>';

    // Pending orders
    const pendingHtml = SIM.pendingEffects.map(p => {
        const eta = p.activateOnDay - SIM.day;
        return `<div class="sit-pending">\u25B7 ${p.cardName} \u2014 ${eta === 1 ? 'TOMORROW' : eta + 'd'}</div>`;
    }).join('');

    // Active stances
    const allCards = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS), ...Object.values(CONTACT_CARDS)];
    const stancesHtml = SIM.activeStances.map(s => {
        const card = allCards.find(c => c.id === s.cardId);
        if (!card) return '';
        return `<div class="sit-row"><span>${card.name}</span><span class="sit-val" style="color:${s.funding === 'high' ? '#dd4444' : s.funding === 'medium' ? '#ddaa44' : '#2a6a4a'}">${s.funding.toUpperCase()}</span></div>`;
    }).join('') || '<div class="sit-row" style="color:#2a6a4a">No active strategies</div>';

    // Situation summary text
    const tankerCount = SIM.tankers.filter(t => !t.seized).length;
    const seizedCount = SIM.tankers.filter(t => t.seized).length;
    const navyCount = SIM.navyShips.length;
    const boatCount = SIM.iranBoats.length;
    const mineCount = SIM.mines.length;
    const roeLabel = SIM.roe === 'aggressive' ? 'AGGRESSIVE' : SIM.roe === 'moderate' ? 'MODERATE' : 'DEFENSIVE';
    const roeColor = SIM.roe === 'aggressive' ? '#dd4444' : SIM.roe === 'moderate' ? '#ddaa44' : '#44dd88';

    function collSec(key, label, bodyHtml, alwaysShow) {
        if (alwaysShow) {
            return `<div class="sit-section"><div class="sit-label">${label}</div>${bodyHtml}</div>`;
        }
        const isCollapsed = _sitCollapsed[key];
        return `<div class="sit-section">
            <div class="sit-label collapsible ${isCollapsed ? 'collapsed' : ''}" data-sit-key="${key}">
                <span class="sit-toggle">\u25BC</span> ${label}
            </div>
            <div class="sit-section-body ${isCollapsed ? 'collapsed' : ''}" data-sit-body="${key}">
                ${bodyHtml}
            </div>
        </div>`;
    }

    const forceHtml = `
        <div class="sit-row"><span>USN Ships</span><span class="sit-val ${navyCount > 0 ? 'good' : 'danger'}">${navyCount}${SIM.carrier ? ' +CSG' : ''}</span></div>
        <div class="sit-row"><span>Tankers in transit</span><span class="sit-val">${tankerCount}</span></div>
        ${seizedCount > 0 ? `<div class="sit-row"><span>Seized</span><span class="sit-val danger">${seizedCount}</span></div>` : ''}
        <div class="sit-row"><span>IRGC boats</span><span class="sit-val ${boatCount > 3 ? 'danger' : boatCount > 0 ? 'warning' : 'good'}">${boatCount}</span></div>
        ${mineCount > 0 ? `<div class="sit-row"><span>Sea mines</span><span class="sit-val danger">${mineCount}</span></div>` : ''}
        ${SIM.drones.length > 0 ? `<div class="sit-row"><span>Drones</span><span class="sit-val warning">${SIM.drones.length}</span></div>` : ''}
        <div class="sit-row"><span>Iran posture</span><span class="sit-val warning">${(SIM.iranStrategy || 'unknown').toUpperCase()}</span></div>
        <div class="sit-row"><span>Intercepts</span><span class="sit-val good">${SIM.interceptCount}</span></div>
    `;

    panel.innerHTML = `
        <div class="sit-section">
            <div class="sit-label">SITUATION REPORT \u2014 DAY ${SIM.day}</div>
            <div class="sit-row"><span style="color:${esc.color}">${esc.name}</span><span class="sit-val" style="color:${esc.color}">${SIM.warPath}/5</span></div>
            <div class="sit-row"><span>ROE</span><span class="sit-val" style="color:${roeColor}">${roeLabel}</span></div>
            <div class="sit-row"><span>Strait</span><span class="sit-val ${SIM.straitOpenDays > 0 ? 'good' : 'danger'}">${SIM.straitOpenDays > 0 ? SIM.straitOpenDays + '/7 OPEN' : 'CONTESTED'}</span></div>
            <div class="sit-row"><span>Budget</span><span class="sit-val ${SIM.budget > 500 ? 'good' : SIM.budget > 200 ? 'warning' : 'danger'}">$${Math.round(SIM.budget)}M</span></div>
            <div class="sit-row"><span>Rating</span><span class="sit-val ${r.score >= 60 ? 'good' : r.score >= 35 ? 'warning' : 'danger'}">${r.grade}</span></div>
            ${typeof _getWinProgress === 'function' ? _getWinProgress() : ''}
        </div>
        ${collSec('force', 'FORCE DISPOSITION', forceHtml)}
        ${collSec('wire', 'WIRE FEED', headlinesHtml || '<div class="sit-headline" style="color:#2a6a4a">No breaking news.</div>')}
        ${collSec('intel', '<span class="wire-classify">TS//SI</span> INTEL', intelHtml)}
        ${SIM.activeStances.length > 0 ? collSec('strategy', 'ACTIVE STRATEGY', stancesHtml) : ''}
        ${pendingHtml ? collSec('pending', 'PENDING ORDERS', pendingHtml) : ''}
        ${_buildDecisionLogHtml()}
    `;

    // Wire up collapsible toggles
    panel.querySelectorAll('.sit-label.collapsible').forEach(label => {
        label.addEventListener('click', () => {
            const key = label.dataset.sitKey;
            _sitCollapsed[key] = !_sitCollapsed[key];
            label.classList.toggle('collapsed');
            const body = panel.querySelector(`[data-sit-body="${key}"]`);
            if (body) body.classList.toggle('collapsed');
        });
    });
}

function hideSituationPanel() {
    const panel = document.getElementById('situation-panel');
    if (panel) panel.style.display = 'none';
    const centerPanel = document.getElementById('center-panel');
    if (centerPanel) centerPanel.classList.add('no-sitpanel');
}

function showSituationPanel() {
    const panel = document.getElementById('situation-panel');
    if (panel) panel.style.display = '';
    updateSituationPanel();
}

// ======================== CENTER PANEL (Situation Room) ========================

function updateCenterPanel() {
    const panel = document.getElementById('center-panel');
    if (!panel) return;

    const flow = Math.round(SIM.oilFlow);
    const flowCls = flow >= 60 ? 'good' : flow >= 35 ? 'warning' : flow < 20 ? 'blocked' : 'danger';
    const flowPctCls = flow >= 60 ? '' : flow >= 35 ? 'warning' : 'danger';

    const navyCount = SIM.navyShips.length;
    const boatCount = SIM.iranBoats.length;
    const seizedCount = SIM.tankers.filter(t => t.seized).length;
    const tankerCount = SIM.tankers.filter(t => !t.seized).length;
    const mineCount = SIM.mines.length;
    const droneCount = SIM.drones.length;
    const esc = ESCALATION_LADDER[Math.min(SIM.warPath, 5)];

    // AP dots
    const ap = SIM.actionPoints || 0;
    const apDots = Array.from({ length: 5 }, (_, i) => i < ap
        ? '<span class="ap-dot filled">\u25CF</span>'
        : '<span class="ap-dot empty">\u25CB</span>'
    ).join('');

    // Game date
    const startDate = new Date(2026, 1, 28); // Feb 28, 2026
    const gameDate = new Date(startDate);
    gameDate.setDate(gameDate.getDate() + SIM.day - 1);
    const dateStr = gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Recent headlines (last 8)
    const recent = SIM.headlines.slice(-8);
    const feedHtml = recent.map(h => {
        const prefix = h.level === 'critical' ? '<span class="feed-time">FLASH</span>'
                     : h.level === 'warning' ? '<span class="feed-time">ALERT</span>'
                     : '<span class="feed-time">WIRE</span>';
        return `<div class="cp-feed-item ${h.level}">${prefix} ${h.text}</div>`;
    }).reverse().join('');

    // Threat meters
    const threats = [
        { label: 'TENSION', val: Math.round(SIM.tension), max: 100 },
        { label: 'IRAN AGGR', val: Math.round(SIM.iranAggression), max: 100 },
        { label: 'CONFLICT', val: Math.round(SIM.conflictRisk), max: 100 },
        { label: 'FOG OF WAR', val: Math.round(SIM.fogOfWar), max: 100 },
    ];
    const threatHtml = threats.map(t => {
        const pct = Math.round((t.val / t.max) * 100);
        const cls = t.val >= 70 ? 'danger' : t.val >= 40 ? 'warning' : 'good';
        return `<div class="cp-threat-row">
            <span class="cp-threat-label">${t.label}</span>
            <div class="cp-threat-bar"><div class="cp-threat-fill gauge-fill ${cls}" style="width:${pct}%"></div></div>
            <span class="cp-threat-val ${cls}">${t.val}</span>
        </div>`;
    }).join('');

    // Iran strategy display
    const iranColors = { restrained: '#44dd88', probing: '#ddaa44', escalatory: '#dd8844', confrontational: '#dd4444' };
    const iranColor = iranColors[SIM.iranStrategy] || '#88aa99';

    // Win progress
    const winHtml = typeof _getWinProgress === 'function' ? _getWinProgress() : '';

    panel.innerHTML = `<div class="cp-content">
        <div class="cp-header">
            <div class="cp-header-label">SITUATION ROOM</div>
            <div class="cp-day">DAY ${SIM.day}</div>
            <div class="cp-date">${dateStr}</div>
            <div class="cp-ap">ACTION POINTS: ${apDots}</div>
        </div>

        <div class="cp-oil-flow">
            <div class="cp-oil-label">STRAIT OIL FLOW</div>
            <div class="cp-oil-bar"><div class="cp-oil-fill ${flowCls}" style="width:${flow}%"></div></div>
            <div class="cp-oil-pct ${flowPctCls}">${flow}%</div>
            <div class="cp-oil-detail">${tankerCount} tankers in transit${seizedCount > 0 ? ` \u2022 <span style="color:#dd4444">${seizedCount} SEIZED</span>` : ''} \u2022 $${Math.round(SIM.oilPrice)}/bbl</div>
        </div>

        <div class="cp-forces">
            <div class="cp-force-card">
                <div class="cp-force-label">US NAVAL FORCES</div>
                <div class="cp-force-val">${navyCount} SHIPS</div>
                <div class="cp-force-sub">${SIM.carrier ? 'CSG EISENHOWER deployed' : 'No carrier group'}${droneCount > 0 ? ` \u2022 ${droneCount} drones` : ''}</div>
            </div>
            <div class="cp-force-card threat">
                <div class="cp-force-label">IRGC NAVAL FORCES</div>
                <div class="cp-force-val ${boatCount > 4 ? 'danger' : boatCount > 2 ? 'warning' : ''}">${boatCount} BOATS</div>
                <div class="cp-force-sub">Posture: <span style="color:${iranColor}">${(SIM.iranStrategy || 'unknown').toUpperCase()}</span>${mineCount > 0 ? ` \u2022 <span style="color:#dd4444">${mineCount} mines</span>` : ''}</div>
            </div>
            <div class="cp-force-card">
                <div class="cp-force-label">ESCALATION LEVEL</div>
                <div class="cp-force-val" style="color:${esc.color};font-size:14px">${esc.name}</div>
                <div class="cp-force-sub">${esc.description}</div>
            </div>
            <div class="cp-force-card">
                <div class="cp-force-label">INTERCEPTS / SEIZURES</div>
                <div class="cp-force-val" style="font-size:14px"><span style="color:#44dd88">${SIM.interceptCount}</span> / <span style="color:#dd4444">${SIM.seizureCount}</span></div>
                <div class="cp-force-sub">Crisis level: ${['NONE', 'ELEVATED', 'MAJOR', 'CRITICAL'][Math.min(SIM.crisisLevel, 3)]}</div>
            </div>
        </div>

        <div class="cp-threat">
            <div class="cp-feed-label">THREAT ASSESSMENT</div>
            ${threatHtml}
        </div>

        <div class="cp-win-tracker">
            ${winHtml}
        </div>

        <div class="cp-feed">
            <div class="cp-feed-label">LIVE WIRE FEED</div>
            ${feedHtml || '<div class="cp-feed-item" style="color:#2a6a4a">No current reports.</div>'}
        </div>
    </div>`;
}

function showCenterPanel() {
    const panel = document.getElementById('center-panel');
    if (panel) panel.style.display = '';
    updateCenterPanel();
}

function hideCenterPanel() {
    const panel = document.getElementById('center-panel');
    if (panel) panel.style.display = 'none';
}

// ======================== TERMINAL HELPERS ========================

function openTerminal(html) {
    hideActionPanel();
    TERMINAL.innerHTML = `
        <div class="terminal-bg"></div>
        <div class="terminal-box">
            <div class="terminal-scanlines"></div>
            ${html}
        </div>
    `;
    TERMINAL.classList.add('active');
}

function closeTerminal() {
    TERMINAL.classList.remove('active');
    TERMINAL.innerHTML = '';
}

/** Typewriter effect — types text into element, returns promise when done */
function typewrite(el, text, speed) {
    speed = speed || 25;
    return new Promise(resolve => {
        let i = 0;
        el.classList.add('typewriter-cursor');
        function next() {
            if (i < text.length) {
                el.textContent += text[i];
                i++;
                setTimeout(next, speed);
            } else {
                el.classList.remove('typewriter-cursor');
                resolve();
            }
        }
        next();
    });
}

/** Fade in buttons after a delay */
function fadeInButtons(container, delay) {
    delay = delay || 300;
    const btns = container.querySelectorAll('.term-btn');
    btns.forEach((btn, i) => {
        setTimeout(() => btn.classList.add('visible'), delay + i * 150);
    });
}

// ======================== GAUGES ========================

let _prevGaugeSnapshot = null;

function updateGauges() {
    const g = calculateGauges();
    const prev = _prevGaugeSnapshot || g;

    setGauge('gauge-stability', g.stability, g.stability - prev.stability);
    setGauge('gauge-economy', g.economy, g.economy - prev.economy);
    setGauge('gauge-support', g.support, g.support - prev.support);
    setGauge('gauge-intel', g.intel, g.intel - prev.intel);

    _prevGaugeSnapshot = { ...g };

    // Day counter in HUD
    const dayEl = document.getElementById('hud-day');
    if (dayEl) dayEl.textContent = _getDateString();

    if (typeof updateSituationPanel === 'function') {
        const now = performance.now();
        if (!updateGauges._lastSitUpdate || now - updateGauges._lastSitUpdate > 1000) {
            updateGauges._lastSitUpdate = now;
            updateSituationPanel();
        }
    }

    // Rating
    const ratingEl = document.getElementById('hud-rating');
    if (ratingEl) {
        const r = calculateRating();
        ratingEl.textContent = r.grade;
        ratingEl.className = 'hud-rating ' + (r.score >= 60 ? 'good' : r.score >= 35 ? 'warning' : 'danger');
    }

    // Strait counter moved to situation panel win progress

    // --- Warpath gauge ---
    const wpEl = document.getElementById('gauge-warpath');
    if (wpEl) {
        const wpVal = wpEl.querySelector('.gauge-value');
        if (wpVal) {
            wpVal.textContent = SIM.warPath + '/5';
            wpVal.className = 'gauge-value ' + (SIM.warPath >= 4 ? 'danger' : SIM.warPath >= 3 ? 'warning' : 'good');
        }
    }

    // --- Budget gauge ---
    const bgEl = document.getElementById('gauge-budget');
    if (bgEl) {
        const bgVal = bgEl.querySelector('.gauge-value');
        if (bgVal) {
            bgVal.textContent = '$' + Math.round(SIM.budget) + 'M';
            bgVal.className = 'gauge-value ' + (SIM.budget < 200 ? 'danger' : SIM.budget < 500 ? 'warning' : 'good');
        }
    }

    // --- Lose-condition warnings ---
    const warnEl = document.getElementById('hud-warning');
    if (warnEl) {
        let warn = '';
        if (SIM.warPath >= 4) warn = '\u26A0 WAR IMMINENT';
        else if (SIM.domesticApproval <= 20) warn = '\u26A0 REMOVAL LIKELY';
        else if (SIM.internationalStanding <= 15) warn = '\u26A0 ISOLATION';
        else if (SIM.polarization >= 75) warn = '\u26A0 UNREST';
        else if (SIM.budget < 100) warn = '\u26A0 BUDGET CRISIS';
        warnEl.textContent = warn;
        warnEl.style.display = warn ? '' : 'none';
    }
}

function setGauge(id, value, delta) {
    const el = document.getElementById(id);
    if (!el) return;
    const fill = el.querySelector('.gauge-fill');
    const valEl = el.querySelector('.gauge-value');
    const trendEl = el.querySelector('.gauge-trend');
    if (fill) {
        fill.style.width = value + '%';
        fill.className = 'gauge-fill ' + (value >= 60 ? 'good' : value >= 35 ? 'warning' : 'danger');
    }
    if (valEl) {
        // Asmongold: fuzzy numbers at low credibility
        let displayVal = Math.round(value);
        if (SIM.character?.id === 'asmongold' && SIM.uniqueResource < 30) {
            const fuzz = Math.round((30 - SIM.uniqueResource) * 0.5);
            displayVal = Math.round(value / (fuzz + 1)) * (fuzz + 1);
            displayVal = '~' + displayVal;
        }
        valEl.textContent = displayVal;
        valEl.className = 'gauge-value ' + (value >= 60 ? 'good' : value >= 35 ? 'warning' : 'danger');
    }
    // Trend arrow
    if (trendEl && delta !== undefined) {
        const d = Math.round(delta);
        if (d > 0) { trendEl.textContent = '\u25B2+' + d; trendEl.className = 'gauge-trend up'; }
        else if (d < 0) { trendEl.textContent = '\u25BC' + d; trendEl.className = 'gauge-trend down'; }
        else { trendEl.textContent = ''; trendEl.className = 'gauge-trend stable'; }
    }
    // Flash when gauge changes significantly
    if (delta < -2) {
        el.classList.remove('danger-flash', 'good-flash');
        void el.offsetWidth;
        el.classList.add('danger-flash');
    } else if (delta > 2) {
        el.classList.remove('danger-flash', 'good-flash');
        void el.offsetWidth;
        el.classList.add('good-flash');
    }
}

// ======================== ADVISOR RECOMMENDATION ========================

function getAdvisorRecommendation() {
    if (SIM.tension > 70 && SIM.iranAggression > 60) {
        return 'Diplomatic approach recommended \u2014 military escalation risks war.';
    }
    if (SIM.oilFlow < 30) {
        return 'Priority: restore oil flow. Naval patrol and coalition recommended.';
    }
    if (SIM.fogOfWar > 70) {
        return 'Intelligence is critical. Deploy surveillance assets.';
    }
    if (SIM.domesticApproval < 35) {
        return 'Domestic support collapsing. Consider media campaign.';
    }
    if (SIM.budget < 300) {
        return 'Budget critical. Cut costs or negotiate burden-sharing.';
    }
    return 'Stay the course. Monitor the situation.';
}

// ======================== KEY DRIVERS (why gauges changed) ========================

function _getKeyDrivers() {
    const drivers = [];
    // Tension drivers
    if (SIM.crisisLevel >= 1) drivers.push({ text: `Crisis Level ${SIM.crisisLevel} adding tension`, cls: 'down-bad' });
    if (SIM.diplomaticCapital > 60) drivers.push({ text: 'Strong diplomacy reducing tension', cls: 'up-good' });
    // Oil
    if (SIM.oilFlow < 40) drivers.push({ text: `Oil flow low (${Math.round(SIM.oilFlow)}%) — prices rising`, cls: 'down-bad' });
    if (SIM.proxyThreat > 30) drivers.push({ text: `Proxy attacks disrupting shipping (threat: ${Math.round(SIM.proxyThreat)})`, cls: 'down-bad' });
    const seized = SIM.tankers.filter(t => t.seized).length;
    if (seized > 0) drivers.push({ text: `${seized} tanker${seized > 1 ? 's' : ''} seized — flow and approval hit`, cls: 'down-bad' });
    // Approval
    if (SIM.budget < 200) drivers.push({ text: 'Budget crisis hurting approval', cls: 'down-bad' });
    if (SIM.oilFlow < 30) drivers.push({ text: 'Gas prices crushing domestic support', cls: 'down-bad' });
    // Iran
    if (SIM.iranEconomy < 30) drivers.push({ text: 'Iran economy collapsed — aggression rising', cls: 'down-bad' });
    if (SIM.chinaRelations < 30) drivers.push({ text: 'China buying Iranian oil — sanctions less effective', cls: 'down-bad' });
    // Positive
    if (SIM.interceptCount > 0) drivers.push({ text: `${SIM.interceptCount} intercepts boosting approval`, cls: 'up-good' });
    if (SIM.straitOpenDays > 0) drivers.push({ text: `Strait open ${SIM.straitOpenDays}/7 days toward victory`, cls: 'up-good' });
    // Player deltas
    const pd = SIM.playerDeltas;
    if (pd.tension < -3) drivers.push({ text: 'Your actions are reducing tension', cls: 'up-good' });
    if (pd.tension > 3) drivers.push({ text: 'Your actions are increasing tension', cls: 'down-bad' });
    if (pd.oilFlow > 3) drivers.push({ text: 'Your actions are improving oil flow', cls: 'up-good' });
    if (pd.domesticApproval > 3) drivers.push({ text: 'Your actions are boosting approval', cls: 'up-good' });
    if (pd.domesticApproval < -3) drivers.push({ text: 'Your actions are hurting approval', cls: 'down-bad' });

    if (drivers.length === 0) drivers.push({ text: 'Situation holding steady', cls: 'stable' });

    return drivers.slice(0, 5).map(d =>
        `<div class="morning-news-item" style="font-size:11px"><span class="og-delta ${d.cls}">\u25CF</span> ${d.text}</div>`
    ).join('');
}

// ======================== FIRST MORNING (Immersive Day 1 Intro) ========================

function showFirstMorning() {
    const charName = SIM.character ? SIM.character.name : 'ADVISOR';
    const charTitle = SIM.character ? SIM.character.title : '';

    const advisorImg = SIM.character ? SIM.character.portraitImage : null;

    openTerminal(`
        <div class="fm-top-row">
            <img src="assets/us-flag.png" class="fm-flag" alt="US">
            <div class="fm-top-center">
                <div class="term-header" style="color:#dd4444">FEB 28, 2026 \u2014 0547 HOURS</div>
                <div class="term-title" style="color:#dd4444">SITUATION ROOM</div>
            </div>
            <img src="assets/iran-flag.png" class="fm-flag" alt="Iran">
        </div>
        ${advisorImg ? `<img src="${advisorImg}" class="fm-advisor-portrait" alt="${charName}">` : ''}
        <div class="term-line dim" style="margin-bottom:12px">EYES ONLY \u2014 ${charName.toUpperCase()}, ${charTitle.toUpperCase()}</div>

        <div class="term-section">
            <div class="term-section-label" style="color:#dd4444">AP FLASH \u2014 WIRE FEED</div>
            <div id="fm-wire" class="morning-news-item critical" style="min-height:120px"></div>
        </div>

        <div class="term-section" id="fm-sitrep-section" style="display:none">
            <div class="term-section-label"><span class="wire-prefix wire-sitrep">SITREP 280547ZFEB26</span></div>
            <div id="fm-sitrep" class="term-line" style="min-height:60px"></div>
        </div>

        <div class="term-section" id="fm-orders-section" style="display:none">
            <div class="term-section-label" style="color:#ddaa44">YOUR ORDERS</div>
            <div id="fm-orders" class="term-line" style="min-height:40px"></div>
        </div>

        <div class="term-btn-row" id="fm-buttons" style="display:none">
            <button class="term-btn danger-btn" id="fm-proceed">[ ENTER THE SITUATION ROOM ]</button>
        </div>
    `);

    const wireEl = document.getElementById('fm-wire');
    const sitrepSection = document.getElementById('fm-sitrep-section');
    const sitrepEl = document.getElementById('fm-sitrep');
    const ordersSection = document.getElementById('fm-orders-section');
    const ordersEl = document.getElementById('fm-orders');
    const buttonsRow = document.getElementById('fm-buttons');

    const wireText = 'US-Israel joint strikes hit 500 targets across Iran. Supreme Leader Khamenei confirmed killed. Iran retaliating with 500+ ballistic missiles and 2,000 drones — 60% targeting US forces in region. IRGC Navy deploying across Strait of Hormuz. Tanker MV Advantage Sweet seized. Oil surges past $110. Lloyd\'s suspends all war risk coverage. Three carrier strike groups en route.';

    const sitrepText = 'IRIS Dena frigate sunk — first major naval engagement since 1988. KC-135 tanker down, 3 KIA. Al Udeid and Al Dhafra bases under ballistic missile attack. Mojtaba Khamenei emerging as Supreme Leader successor with full IRGC backing. Houthis resuming Red Sea attacks. Hezbollah mobilizing on Lebanese border. China and Russia calling emergency UNSC session.';

    const ordersText = `You are ${charName}. The strait is closed. Oil is spiking. Three carrier groups are in theater. Iran\'s leadership is in chaos but its military is retaliating hard. The world is watching what you do in the next 24 hours. There are no good options — only less bad ones.`;

    let skipped = false;

    // Allow click to skip typewriter
    TERMINAL.addEventListener('click', function skipHandler(e) {
        if (e.target.id === 'fm-proceed') return;
        if (!skipped) {
            skipped = true;
            wireEl.textContent = wireText;
            sitrepSection.style.display = '';
            sitrepEl.textContent = sitrepText;
            ordersSection.style.display = '';
            ordersEl.textContent = ordersText;
            buttonsRow.style.display = '';
            fadeInButtons(TERMINAL, 100);
            TERMINAL.removeEventListener('click', skipHandler);
        }
    });

    // Typewriter sequence
    typewrite(wireEl, wireText, 18).then(() => {
        if (skipped) return;
        sitrepSection.style.display = '';
        return typewrite(sitrepEl, sitrepText, 15);
    }).then(() => {
        if (skipped) return;
        ordersSection.style.display = '';
        return typewrite(ordersEl, ordersText, 20);
    }).then(() => {
        if (skipped) return;
        buttonsRow.style.display = '';
        fadeInButtons(TERMINAL, 300);
    });

    // Wait for button
    const waitForButton = setInterval(() => {
        const btn = document.getElementById('fm-proceed');
        if (btn) {
            btn.addEventListener('click', () => {
                clearInterval(waitForButton);
                closeTerminal();
                // Day 1: go to initial card pick first, THEN dayplay
                SIM.phase = 'initial_pick';
                showInitialPick();
            });
            clearInterval(waitForButton);
        }
    }, 100);
}

// ======================== INITIAL PICK (Day 1) ========================

function showInitialPick() {
    const hand = dealHand(SIM.character, 1, SIM.playedExclusives);
    const maxPicks = (SIM.character.cardPool && SIM.character.cardPool.maxPicks) || 3;
    const selected = []; // [{card, funding}]

    function render() {
        const catColors = { military: '#dd4444', diplomatic: '#4488dd', economic: '#ddaa44', intelligence: '#44dd88', domestic: '#aa88dd' };
        const recommendation = getAdvisorRecommendation();

        openTerminal(`
            <div class="term-header">DAY 1 \u2014 INITIAL STRATEGY</div>
            <div class="term-title">SELECT ${maxPicks} CARDS</div>
            <div class="term-line dim">"${getAdvisorReaction('weekStart')}" \u2014 ${SIM.character.name}</div>
            <div class="term-line" style="color:#ddaa44;margin:4px 0 8px 0">\u25B6 ${recommendation}</div>
            <div class="initial-cards">
                ${hand.map((card, i) => {
                    const sel = selected.find(s => s.card === card);
                    const isSelected = !!sel;
                    const catColor = catColors[card.category] || '#44dd88';
                    const disabled = selected.length >= maxPicks && !isSelected;
                    return `
                        <div class="initial-card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}" data-idx="${i}">
                            <div class="icard-cat" style="color:${catColor}">${card.category.toUpperCase()}</div>
                            <div class="icard-name">${card.name}</div>
                            <div class="icard-desc">${card.description}</div>
                            ${isSelected ? `
                                <div class="icard-funding">
                                    <button class="fund-btn ${sel.funding === 'low' ? 'active' : ''}" data-card="${i}" data-fund="low">LOW</button>
                                    <button class="fund-btn ${sel.funding === 'medium' ? 'active' : ''}" data-card="${i}" data-fund="medium">MED</button>
                                    <button class="fund-btn ${sel.funding === 'high' ? 'active' : ''}" data-card="${i}" data-fund="high">HIGH</button>
                                </div>
                                <div class="icard-hint">${card.hint[sel.funding]}</div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="term-line dim" style="text-align:center;margin-top:8px">${selected.length} selected (up to ${maxPicks})</div>
            <div class="term-btn-row">
                <button class="term-btn ${selected.length > 0 ? 'visible' : ''}" id="pick-confirm">
                    [ DEPLOY STRATEGY ]
                </button>
            </div>
        `);

        // Card click
        TERMINAL.querySelectorAll('.initial-card').forEach(cardEl => {
            cardEl.addEventListener('click', (e) => {
                if (e.target.classList.contains('fund-btn')) return;
                const idx = parseInt(cardEl.dataset.idx);
                const card = hand[idx];
                const existingIdx = selected.findIndex(s => s.card === card);
                if (existingIdx >= 0) {
                    selected.splice(existingIdx, 1);
                } else if (selected.length < maxPicks) {
                    selected.push({ card, funding: 'medium' });
                }
                render();
            });
        });

        // Funding buttons
        TERMINAL.querySelectorAll('.fund-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.card);
                const card = hand[idx];
                const sel = selected.find(s => s.card === card);
                if (sel) { sel.funding = btn.dataset.fund; render(); }
            });
        });

        // Confirm
        const confirmBtn = document.getElementById('pick-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (selected.length === 0) return;
                applyStances(selected);
                closeTerminal();
                resetActionPoints();
                startDayPlay();
            });
        }
    }

    render();
}

/** Apply selected stances to SIM — military activates fast, diplomacy/economics delayed */
function applyStances(selected) {
    // Track exclusive cards
    for (const s of selected) {
        const isBonus = Object.values(CHARACTER_BONUS_CARDS).some(b => b.id === s.card.id);
        if (isBonus || s.card.exclusive) {
            if (!SIM.playedExclusives.includes(s.card.id)) SIM.playedExclusives.push(s.card.id);
        }
    }
    // Hegseth: military cards cost command authority
    if (SIM.character.cardPool && SIM.character.cardPool.militaryAuthorityCost) {
        for (const s of selected) {
            const allCards = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS)];
            const card = allCards.find(c => c.id === s.card.id);
            if (card && card.category === 'military') {
                const cost = s.funding === 'high' ? 15 : s.funding === 'medium' ? 8 : 3;
                SIM.uniqueResource -= cost;
            }
        }
    }
    // Track alignment shifts from card choices
    for (const s of selected) {
        if (s.card.effects && s.card.effects[s.funding] && typeof shiftAlignment === 'function') {
            shiftAlignment(s.card.effects[s.funding]);
        }
    }
    // Queue effects with implementation delay
    for (const s of selected) {
        const delay = s.card.delayDays || (typeof CATEGORY_DELAY !== 'undefined' ? CATEGORY_DELAY[s.card.category] : 1) || 1;
        if (delay <= 1) {
            // Military: instant activation
            if (!SIM.activeStances.find(st => st.cardId === s.card.id)) {
                SIM.activeStances.push({ cardId: s.card.id, funding: s.funding });
                SIM.stanceActivationDay[s.card.id] = SIM.day;
            }
            addHeadline(`SITREP: ${s.card.name} (${s.funding.toUpperCase()}) operational`, 'normal');
        } else {
            // Delayed activation
            if (typeof queueCardEffects === 'function') {
                queueCardEffects(s.card, s.funding);
            } else {
                SIM.activeStances.push({ cardId: s.card.id, funding: s.funding });
                SIM.stanceActivationDay[s.card.id] = SIM.day;
                addHeadline(`Strategy deployed: ${s.card.name} (${s.funding})`, 'normal');
            }
        }
    }
}

// ======================== DAILY REPORT (merged morning + overnight) ========================

function showDailyReport() {
    // Day 1: show immersive first morning instead of generic report
    if (SIM.day === 1) {
        showFirstMorning();
        return;
    }

    const recommendation = getAdvisorRecommendation();

    // Top headline from overnight
    const todayHeadlines = SIM.headlines.filter(h => h.day === SIM.day);
    const topHeadline = todayHeadlines.filter(h => h.level !== 'normal').slice(-1)[0]
        || todayHeadlines.slice(-1)[0]
        || { text: 'No major developments overnight.', level: 'normal' };
    const hlClass = topHeadline.level === 'critical' ? 'wire-flash' : topHeadline.level === 'warning' ? 'wire-urgent' : '';

    // Special action button
    let specialActionHtml = '';
    if (SIM.character.specialAction && SIM.character.specialAction.cooldown === 0) {
        specialActionHtml = `<button class="term-btn" id="btn-special-action">[ ${SIM.character.specialAction.name.toUpperCase()} ]</button>`;
    }

    // Story arc header
    const arc = typeof getCurrentStoryArc === 'function' ? getCurrentStoryArc() : null;
    const arcHtml = arc ? `<div class="story-arc-header" style="color:${arc.color}; font-size:9px; letter-spacing:3px; margin-bottom:2px">\u2501 ${arc.name} \u2501</div>
        <div class="term-line dim" style="font-size:10px; margin-bottom:8px; font-style:italic">${arc.brief}</div>` : '';

    // Active synergies
    let synergyHtml = '';
    if (typeof getActiveSynergies === 'function') {
        const synergies = getActiveSynergies();
        if (synergies.length > 0) {
            synergyHtml = `<div style="margin:6px 0; border-top:1px solid #224; padding-top:4px">
                <div style="font-size:9px; letter-spacing:2px; color:#888; margin-bottom:2px">ACTIVE SYNERGIES</div>
                ${synergies.map(s => `<div style="color:#ddaa44; font-size:10px">\u2605 ${s.name}: ${s.description}</div>`).join('')}
            </div>`;
        }
    }

    // Card level-ups
    let levelUpHtml = '';
    if (typeof getCardLevel === 'function' && SIM.activeStances.length > 0) {
        const allCards = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS), ...Object.values(CONTACT_CARDS)];
        const levelUps = SIM.activeStances.map(s => {
            const card = allCards.find(c => c.id === s.cardId);
            const lvl = getCardLevel(s.cardId);
            return { card, lvl };
        }).filter(({ lvl }) => lvl.level >= 2);
        if (levelUps.length > 0) {
            levelUpHtml = `<div style="margin:4px 0">
                ${levelUps.map(({ card, lvl }) => `<div style="color:#44dd88; font-size:10px">\u25B2 ${card ? card.name : '?'}: ${lvl.name} (+${Math.round(lvl.bonus * 100)}%)</div>`).join('')}
            </div>`;
        }
    }

    openTerminal(`
        ${arcHtml}
        <div class="term-header">${_getDateString()} \u2014 DAY ${SIM.day}</div>
        <div class="term-line dim" style="margin:4px 0">"${_getMorningBrief()}" \u2014 ${SIM.character.name}</div>
        <div class="term-line ${hlClass}" style="margin:4px 0">${topHeadline.text}</div>
        ${SIM.iranVisibleMoves && SIM.iranVisibleMoves.length > 0 ? `<div style="margin:4px 0; font-size:10px; color:#dd6644">\u26A0 IRAN: ${SIM.iranVisibleMoves[SIM.iranVisibleMoves.length - 1].text}</div>` : ''}
        <div class="term-line" style="color:#ddaa44;margin:8px 0">\u25B6 ${recommendation}</div>
        ${synergyHtml}
        ${levelUpHtml}

        <div class="term-btn-row">
            <button class="term-btn" id="btn-maintain">[ BEGIN DAY ]</button>
            <button class="term-btn warning-btn" id="btn-adjust">[ ADJUST STRATEGY ]</button>
            ${specialActionHtml}
        </div>
    `);

    fadeInButtons(TERMINAL, 400);

    document.getElementById('btn-maintain').addEventListener('click', () => {
        closeTerminal();
        resetActionPoints();
        startDayPlay();
    });

    document.getElementById('btn-adjust').addEventListener('click', () => {
        showAdjustStrategy();
    });

    const specialBtn = document.getElementById('btn-special-action');
    if (specialBtn) {
        specialBtn.addEventListener('click', () => {
            executeSpecialAction();
            showDailyReport();
        });
    }
}

// ======================== CHARACTER SPECIAL ACTION ========================

function executeSpecialAction() {
    if (!SIM.character.specialAction || SIM.character.specialAction.cooldown > 0) return;

    const action = SIM.character.specialAction;

    // Execute the action's effect if it has one
    if (typeof action.execute === 'function') {
        action.execute(SIM);
    } else if (action.effects) {
        for (const [key, val] of Object.entries(action.effects)) {
            if (SIM[key] !== undefined) {
                SIM[key] = Math.max(0, Math.min(100, SIM[key] + val));
            }
        }
    }

    // Set cooldown
    action.cooldown = action.cooldownMax || action.cooldownDuration || 3;

    addHeadline(`Special action: ${action.name}`, 'good');
    showToast(`${action.name} activated!`, 'good');
}

// ======================== ADJUST STRATEGY ========================

function showAdjustStrategy() {
    const hand = dealHand(SIM.character, SIM.week, SIM.playedExclusives);
    const allCards = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS), ...Object.values(CONTACT_CARDS)];
    const catColors = { military: '#dd4444', diplomatic: '#4488dd', economic: '#ddaa44', intelligence: '#44dd88', domestic: '#aa88dd' };
    const maxPicks = (SIM.character.cardPool && SIM.character.cardPool.maxPicks) || 3;

    // Current stances
    const currentCards = SIM.activeStances.map(s => {
        return { card: allCards.find(c => c.id === s.cardId), funding: s.funding };
    }).filter(s => s.card);

    // If no active stances, show card selection instead of swap
    if (currentCards.length === 0) {
        showInitialPick();
        return;
    }

    // Limit 2 swaps per day
    if ((SIM.swapsToday || 0) >= 2) {
        showToast('No swaps remaining today', 'warning');
        return;
    }

    let removingIdx = null;
    let replacement = null;

    // Available replacements: cards in hand that aren't currently active
    const activeIds = SIM.activeStances.map(s => s.cardId);
    const available = hand.filter(c => !activeIds.includes(c.id));

    function render() {
        openTerminal(`
            <div class="term-header">ADJUST STRATEGY \u2014 DAY ${SIM.day}</div>
            <div class="term-title">SWAP CARD (${2 - (SIM.swapsToday || 0)} swaps left today)</div>
            <div class="term-line warning">Changing course costs credibility. Choose wisely.</div>

            <div class="term-section">
                <div class="term-section-label">CURRENT STRATEGY \u2014 click to remove</div>
                ${currentCards.map((s, i) => {
                    const catColor = catColors[s.card.category] || '#44dd88';
                    return `<div class="adjust-card ${removingIdx === i ? 'selected' : ''}" data-remove="${i}">
                        <div class="adjust-card-cat" style="color:${catColor}">${s.card.category.toUpperCase()}</div>
                        <div class="adjust-card-name">${s.card.name}</div>
                        <div class="adjust-card-desc">${s.card.description}</div>
                    </div>`;
                }).join('')}
            </div>

            ${removingIdx !== null ? `
                <div class="term-section">
                    <div class="term-section-label">AVAILABLE REPLACEMENTS</div>
                    ${available.length > 0 ? available.map((card, i) => {
                        const catColor = catColors[card.category] || '#44dd88';
                        const isSelected = replacement && replacement.card.id === card.id;
                        return `<div class="adjust-card ${isSelected ? 'selected' : ''}" data-replace="${i}">
                            <div class="adjust-card-cat" style="color:${catColor}">${card.category.toUpperCase()}</div>
                            <div class="adjust-card-name">${card.name}</div>
                            <div class="adjust-card-desc">${card.description}</div>
                            ${isSelected ? `
                                <div class="adjust-funding">
                                    <button class="fund-btn ${replacement.funding === 'low' ? 'active' : ''}" data-fund="low">LOW</button>
                                    <button class="fund-btn ${replacement.funding === 'medium' ? 'active' : ''}" data-fund="medium">MED</button>
                                    <button class="fund-btn ${replacement.funding === 'high' ? 'active' : ''}" data-fund="high">HIGH</button>
                                </div>
                            ` : ''}
                        </div>`;
                    }).join('') : '<div class="term-line dim">No replacements available.</div>'}
                </div>
            ` : ''}

            <div class="term-btn-row">
                <button class="term-btn" id="btn-cancel-adjust">[ CANCEL ]</button>
                ${replacement ? `<button class="term-btn visible" id="btn-confirm-swap">[ CONFIRM SWAP ]</button>` : ''}
            </div>
        `);

        fadeInButtons(TERMINAL, 200);

        // Remove card click
        TERMINAL.querySelectorAll('[data-remove]').forEach(el => {
            el.addEventListener('click', () => {
                removingIdx = parseInt(el.dataset.remove);
                replacement = null;
                render();
            });
        });

        // Replacement card click
        TERMINAL.querySelectorAll('[data-replace]').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.classList.contains('fund-btn')) return;
                const idx = parseInt(el.dataset.replace);
                replacement = { card: available[idx], funding: 'medium' };
                render();
            });
        });

        // Funding buttons
        TERMINAL.querySelectorAll('.fund-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (replacement) { replacement.funding = btn.dataset.fund; render(); }
            });
        });

        // Cancel
        const cancelBtn = document.getElementById('btn-cancel-adjust');
        if (cancelBtn) cancelBtn.addEventListener('click', () => {
            if (SIM.phase === 'dayplay') {
                closeTerminal();
                if (typeof showActionPanel === 'function') showActionPanel();
            } else {
                showDailyReport();
            }
        });

        // Confirm swap
        const confirmBtn = document.getElementById('btn-confirm-swap');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const removed = currentCards[removingIdx];
                SIM.activeStances = SIM.activeStances.filter(s => s.cardId !== removed.card.id);
                delete SIM.stanceActivationDay[removed.card.id];

                SIM.activeStances.push({ cardId: replacement.card.id, funding: replacement.funding });
                SIM.stanceActivationDay[replacement.card.id] = SIM.day;

                const isBonus = Object.values(CHARACTER_BONUS_CARDS).some(b => b.id === replacement.card.id);
                if (isBonus || replacement.card.exclusive) {
                    if (!SIM.playedExclusives.includes(replacement.card.id)) SIM.playedExclusives.push(replacement.card.id);
                }

                SIM.swapsToday = (SIM.swapsToday || 0) + 1;
                addHeadline(`Strategy changed: ${removed.card.name} \u2192 ${replacement.card.name}`, 'warning');

                closeTerminal();
                if (SIM.phase === 'dayplay') {
                    if (typeof showActionPanel === 'function') showActionPanel();
                } else {
                    resetActionPoints();
                    startDayPlay();
                }
            });
        }
    }

    render();
}

// ======================== ACTION PANEL (replaces Quick Actions) ========================

function resetActionPoints() {
    SIM.actionPoints = 5;
    SIM.swapsToday = 0;
    if (SIM.roe === undefined) SIM.roe = 'defensive';
}

function _applyEffect(key, val) {
    // Apply the immediate effect
    if (key === 'oilFlow') SIM.oilFlow = Math.max(10, Math.min(100, SIM.oilFlow + val));
    else if (key === 'oilPrice') SIM.oilPrice = Math.max(40, SIM.oilPrice + val);
    else if (key === 'tension') SIM.tension = Math.max(0, Math.min(100, SIM.tension + val));
    else if (key === 'domesticApproval') SIM.domesticApproval = Math.max(0, Math.min(100, SIM.domesticApproval + val));
    else if (key === 'internationalStanding') SIM.internationalStanding = Math.max(0, Math.min(100, SIM.internationalStanding + val));
    else if (key === 'iranAggression') SIM.iranAggression = Math.max(0, Math.min(100, SIM.iranAggression + val));
    else if (key === 'budget') SIM.budget += val;
    else if (key === 'conflictRisk') SIM.conflictRisk = Math.max(0, Math.min(100, SIM.conflictRisk + val));
    else if (key === 'fogOfWar') SIM.fogOfWar = Math.max(0, Math.min(100, SIM.fogOfWar + val));
    else if (key === 'diplomaticCapital') SIM.diplomaticCapital = Math.max(0, Math.min(100, SIM.diplomaticCapital + val));
    else if (key === 'proxyThreat') SIM.proxyThreat = Math.max(0, Math.min(100, SIM.proxyThreat + val));
    else if (key === 'chinaRelations') SIM.chinaRelations = Math.max(0, Math.min(100, SIM.chinaRelations + val));
    else if (key === 'polarization') SIM.polarization = Math.max(0, Math.min(100, SIM.polarization + val));
    else if (key === 'assassinationRisk') SIM.assassinationRisk = Math.max(0, Math.min(100, SIM.assassinationRisk + val));
    else if (key === 'warPath') SIM.warPath = Math.max(0, SIM.warPath + val);
    else if (key === 'iranEconomy') SIM.iranEconomy = Math.max(0, Math.min(100, SIM.iranEconomy + val));
    else if (key === 'interceptCount') SIM.interceptCount = (SIM.interceptCount || 0) + val;
    else if (key === 'oilFlowProtection') SIM.oilFlow = Math.max(10, Math.min(100, SIM.oilFlow + val));
    // Character unique resource keys
    else if (key === 'politicalCapital' || key === 'commandAuthority' || key === 'credibility'
          || key === 'baseEnthusiasm' || key === 'exposure') {
        SIM.uniqueResource = Math.max(0, Math.min(100, SIM.uniqueResource + val));
    }

    // Also accumulate into playerDeltas so dailyUpdate() doesn't wipe the effect
    if (SIM.playerDeltas && key in SIM.playerDeltas) {
        SIM.playerDeltas[key] += val;
    }
}

function _applyEffects(effects) {
    for (const [key, val] of Object.entries(effects)) {
        _applyEffect(key, val);
    }
    showEffectSummary(effects);
    updateGauges();
}

function _getROELabel() {
    const roe = SIM.roe || 'defensive';
    if (roe === 'defensive') return 'DEFENSIVE';
    if (roe === 'moderate') return 'MODERATE';
    return 'AGGRESSIVE';
}

function _getROEColor() {
    const roe = SIM.roe || 'defensive';
    if (roe === 'defensive') return '#44dd88';
    if (roe === 'moderate') return '#ddaa44';
    return '#dd4444';
}

function showActionPanel() {
    hideActionPanel();

    // Update layout for action panel
    const centerPanel = document.getElementById('center-panel');
    const gaugeBar = document.getElementById('gauge-bar');
    if (centerPanel) centerPanel.classList.remove('no-actpanel');
    if (gaugeBar) gaugeBar.style.right = '280px';

    const panel = document.createElement('div');
    panel.id = 'action-panel';

    function renderPanel() {
        const ap = SIM.actionPoints || 0;
        const apDots = Array.from({ length: 5 }, (_, i) => i < ap
            ? '<span class="ap-dot filled">\u25CF</span>'
            : '<span class="ap-dot empty">\u25CB</span>'
        ).join('');

        const budgetStr = '$' + Math.round(SIM.budget) + 'M';
        const roeLabel = _getROELabel();
        const roeColor = _getROEColor();

        // Determine if special action is available
        let specialHtml = '';
        if (SIM.character && SIM.character.specialAction && SIM.character.specialAction.cooldown === 0) {
            specialHtml = `
                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#ddaa44">SPECIAL</div>
                    <button class="ap-btn special" data-action="special">${SIM.character.specialAction.name.toUpperCase()}</button>
                </div>
            `;
        } else if (SIM.character && SIM.character.specialAction && SIM.character.specialAction.cooldown > 0) {
            specialHtml = `
                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#ddaa44">SPECIAL</div>
                    <button class="ap-btn disabled">${SIM.character.specialAction.name.toUpperCase()} (${SIM.character.specialAction.cooldown}d)</button>
                </div>
            `;
        }

        const esc = SIM.warPath || 0;
        const escInfo = ESCALATION_LADDER[Math.min(esc, 5)];
        const escName = escInfo ? escInfo.name : 'UNKNOWN';
        const escColor = escInfo ? escInfo.color : '#888';

        // Tooltip helper
        function tip(action) {
            const t = ACTION_TIPS[action];
            if (!t) return '';
            return `<span class="ap-tooltip">${t.desc}<div class="tt-effect">${t.effect}</div></span>`;
        }

        // Helper: locked button if escalation too low
        function milBtn(label, action, reqLevel, cost) {
            const costStr = cost ? ` <span class="ap-cost">$${cost}M</span>` : '';
            if (esc < reqLevel) {
                const reqName = ESCALATION_LADDER[reqLevel].name;
                return `<button class="ap-btn locked" title="Requires ${reqName}"><span class="ap-lock">\u25A0 LVL${reqLevel}</span> ${label}${costStr}</button>`;
            }
            const budgetOk = !cost || SIM.budget >= cost;
            return `<button class="ap-btn ${ap <= 0 || !budgetOk ? 'disabled' : ''}" data-action="${action}">${label}${costStr}${tip(action)}</button>`;
        }

        // Generate bible actions grouped by category
        function _getBibleActionsHtml() {
            const catColors = { intelligence: '#44dd88', diplomacy: '#4488dd', military: '#dd4444', domestic: '#aa88dd', economic: '#ddaa44' };
            const catLabels = { intelligence: 'INTELLIGENCE+', diplomacy: 'DIPLOMACY+', military: 'MILITARY+', domestic: 'DOMESTIC+', economic: 'ECONOMIC+' };
            const available = BIBLE_ACTIONS.filter(a => {
                try { return a.condition(); } catch(e) { return false; }
            });
            if (available.length === 0) return '';
            const grouped = {};
            available.forEach(a => {
                if (!grouped[a.category]) grouped[a.category] = [];
                grouped[a.category].push(a);
            });
            let html = '<div class="ap-category"><div class="ap-cat-header" style="color:#88ddaa;cursor:pointer" id="bible-actions-toggle">\u25B6 MORE ACTIONS</div><div id="bible-actions-list" style="display:none">';
            for (const cat of Object.keys(grouped)) {
                html += `<div class="ap-cat-header" style="color:${catColors[cat] || '#888'};font-size:9px;margin-top:6px">${catLabels[cat] || cat.toUpperCase()}</div>`;
                grouped[cat].forEach(a => {
                    const costStr = a.cost ? ` <span class="ap-cost">$${a.cost}M</span>` : '';
                    const apStr = a.ap > 1 ? ` <span class="ap-cost">${a.ap}AP</span>` : '';
                    const budgetOk = !a.cost || SIM.budget >= a.cost;
                    const apOk = ap >= a.ap;
                    html += `<button class="ap-btn ${!apOk || !budgetOk ? 'disabled' : ''}" data-action="bible_${a.id}">${a.name}${costStr}${apStr}${tip(a.id)}</button>`;
                });
            }
            html += '</div></div>';
            return html;
        }

        // Can escalate if not already at max and AP available
        const canEscalate = esc < 5 && ap > 0;
        const nextEsc = ESCALATION_LADDER[Math.min(esc + 1, 5)];

        panel.innerHTML = `
            <div class="ap-header">
                <div class="ap-title">ACTIONS</div>
                <div class="ap-points">AP: ${apDots}</div>
                <div class="ap-budget">${budgetStr}</div>
                ${SIM.character?.id === 'trump' ? `<div class="ap-budget" style="color:#ddaa44">PC: ${Math.round(SIM.uniqueResource)} (-2/action)</div>` : ''}
            </div>

            <div class="ap-escalation-bar">
                <span class="ap-esc-label">ESCALATION:</span>
                <span class="ap-esc-level" style="color:${escColor}">${escName}</span>
                <span class="ap-esc-pips">${Array.from({length: 6}, (_, i) => `<span class="ap-esc-pip ${i <= esc ? 'active' : ''}" style="${i <= esc ? 'background:' + ESCALATION_LADDER[i].color : ''}">${i}</span>`).join('')}</span>
            </div>

            <div class="ap-scroll">
                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#44dd88">INTELLIGENCE</div>
                    <button class="ap-btn ${ap <= 0 || SIM.budget < 15 ? 'disabled' : ''}" data-action="gather-intel">GATHER INTEL <span class="ap-cost">$15M</span>${tip('gather-intel')}</button>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="analyze-threats">ANALYZE THREATS${tip('analyze-threats')}</button>
                </div>

                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#4488dd">DIPLOMACY</div>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="phone-call">MAKE PHONE CALL${tip('phone-call')}</button>
                    <button class="ap-btn ${ap <= 0 || SIM.budget < 10 ? 'disabled' : ''}" data-action="draft-proposal">DRAFT PROPOSAL <span class="ap-cost">$10M</span>${tip('draft-proposal')}</button>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="demand-un-session">DEMAND UN SESSION${tip('demand-un-session')}</button>
                </div>

                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#dd4444">MILITARY <span style="color:${escColor};font-size:8px">[${escName}]</span></div>
                    ${milBtn('REPOSITION FLEET', 'reposition-fleet', 1, 0)}
                    ${milBtn('CHANGE ROE <span class="ap-roe" style="color:' + roeColor + '">[' + roeLabel + ']</span>', 'change-roe', 1, 0)}
                    ${milBtn('ESCORT TANKERS', 'escort-tankers', 1, 10)}
                    ${milBtn('PRECISION STRIKE', 'precision-strike', 2, 30)}
                    ${milBtn('SPECIAL OPS RAID', 'spec-ops-raid', 2, 25)}
                    ${milBtn('LAUNCH AIR STRIKES', 'air-strikes', 3, 50)}
                    ${milBtn('SUPPRESS AIR DEFENSES', 'sead-mission', 3, 40)}
                    ${milBtn('DEPLOY GROUND FORCES', 'ground-troops', 4, 80)}
                    ${milBtn('SEIZE IRANIAN ISLANDS', 'seize-islands', 4, 60)}
                    ${milBtn('FULL MOBILIZATION', 'full-mobilization', 5, 100)}
                </div>

                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#aa88dd">DOMESTIC</div>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="press-conference">PRESS CONFERENCE${tip('press-conference')}</button>
                    <button class="ap-btn ${ap <= 0 || SIM.budget < 5 ? 'disabled' : ''}" data-action="brief-congress">BRIEF CONGRESS <span class="ap-cost">$5M</span>${tip('brief-congress')}</button>
                </div>

                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#ddaa44">ECONOMIC</div>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="adjust-sanctions">ADJUST SANCTIONS${tip('adjust-sanctions')}</button>
                    <button class="ap-btn ${ap <= 0 || SIM.budget < 25 ? 'disabled' : ''}" data-action="market-intervention">MARKET INTERVENTION <span class="ap-cost">$25M</span>${tip('market-intervention')}</button>
                </div>

                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#dd4444">ESCALATION</div>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="issue-ultimatum">ISSUE ULTIMATUM${tip('issue-ultimatum')}</button>
                    <button class="ap-btn ${ap <= 0 || SIM.budget < 20 ? 'disabled' : ''}" data-action="emergency-coalition">EMERGENCY COALITION <span class="ap-cost">$20M</span>${tip('emergency-coalition')}</button>
                    ${canEscalate ? `<button class="ap-btn escalate-btn" data-action="escalate" title="Move to: ${nextEsc.name}">ESCALATE \u25B2 <span style="color:${nextEsc.color}">${nextEsc.name}</span>${tip('escalate')}</button>` : ''}
                    ${esc > 0 ? `<button class="ap-btn deescalate-btn ${ap <= 0 ? 'disabled' : ''}" data-action="deescalate">DE-ESCALATE \u25BC${tip('deescalate')}</button>` : ''}
                </div>

                ${specialHtml}
                ${_getCharacterActions(ap)}
                ${_getBibleActionsHtml()}
            </div>

            <div class="ap-win-hint">
                ${typeof _getWinProgress === 'function' ? _getWinProgress() : ''}
            </div>

            <div class="ap-footer">
                ${(SIM.swapsToday || 0) < 2 ? `<button class="ap-swap-btn" id="btn-swap-card">[ SWAP CARD \u2022 ${2 - (SIM.swapsToday || 0)} left ]</button>` : ''}
                <button class="ap-end-btn" data-action="end-day">[ END DAY ]</button>
            </div>
        `;

        // Wire up buttons
        panel.querySelectorAll('.ap-btn:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (!action) return;
                _executeAction(action, renderPanel);
            });
        });

        panel.querySelector('.ap-end-btn').addEventListener('click', () => {
            _endDay();
        });

        const swapBtn = panel.querySelector('#btn-swap-card');
        if (swapBtn) {
            swapBtn.addEventListener('click', () => {
                hideActionPanel();
                showAdjustStrategy();
            });
        }

        // Wire up MORE ACTIONS toggle
        const bibleToggle = panel.querySelector('#bible-actions-toggle');
        if (bibleToggle) {
            bibleToggle.addEventListener('click', () => {
                const list = panel.querySelector('#bible-actions-list');
                if (list) {
                    const hidden = list.style.display === 'none';
                    list.style.display = hidden ? '' : 'none';
                    bibleToggle.textContent = (hidden ? '\u25BC' : '\u25B6') + ' MORE ACTIONS';
                }
            });
        }
    }

    document.body.appendChild(panel);
    panel._renderFn = renderPanel;
    renderPanel();

    // Slide-in animation
    requestAnimationFrame(() => {
        panel.classList.add('visible');
    });

    // Day 1: show advisor guide walkthrough
    if (SIM.day === 1 && !SIM._guideSeen) {
        SIM._guideSeen = true;
        setTimeout(() => _showAdvisorGuide(), 800);
    }
}

// ======================== ADVISOR GUIDE (Day 1 tutorial) ========================

const _GUIDE_STEPS = [
    {
        anchor: 'gauge-bar',
        position: 'below',
        title: 'ADVISOR BRIEFING',
        text: 'These are your <em>4 key gauges</em>: Stability, Economy, Support, and Intel. Keep them balanced. If any drops critically low, you lose.',
    },
    {
        anchor: 'situation-panel',
        position: 'right',
        title: 'SITUATION PANEL',
        text: 'Your intelligence dashboard. The <em>Situation Report</em> at top shows the essentials. Click section headers to expand details like Force Disposition and Wire Feed.',
    },
    {
        anchor: 'action-panel',
        position: 'left',
        title: 'ACTIONS',
        text: 'You get <em>5 Action Points</em> per day. Each action costs 1 AP. Some also cost budget. You can swap up to 2 cards per day. When done, hit END DAY.',
    },
    {
        anchor: 'action-panel',
        position: 'left',
        offsetY: 200,
        title: 'ESCALATION',
        text: 'The <em>Escalation Ladder</em> controls which military options are available. Higher escalation unlocks stronger actions but brings you closer to war.',
    },
];

function _showAdvisorGuide() {
    let step = 0;

    function showStep() {
        // Remove previous
        document.querySelectorAll('.advisor-guide').forEach(el => el.remove());

        if (step >= _GUIDE_STEPS.length) return;

        const s = _GUIDE_STEPS[step];
        const anchorEl = document.getElementById(s.anchor);
        if (!anchorEl) { step++; showStep(); return; }

        const rect = anchorEl.getBoundingClientRect();
        const guide = document.createElement('div');
        guide.className = 'advisor-guide';

        let arrowClass = '';
        let top, left;

        switch (s.position) {
            case 'below':
                top = rect.bottom + 12;
                left = rect.left + rect.width / 2 - 160;
                arrowClass = 'down';
                break;
            case 'right':
                top = rect.top + (s.offsetY || rect.height / 3);
                left = rect.right + 14;
                arrowClass = 'right';
                break;
            case 'left':
                top = rect.top + (s.offsetY || rect.height / 4);
                left = rect.left - 340;
                arrowClass = 'left';
                break;
        }

        // Clamp to viewport
        top = Math.max(10, Math.min(window.innerHeight - 200, top));
        left = Math.max(10, Math.min(window.innerWidth - 340, left));

        guide.style.top = top + 'px';
        guide.style.left = left + 'px';

        guide.innerHTML = `
            <div class="advisor-guide-arrow ${arrowClass}"></div>
            <div class="guide-title">${s.title}</div>
            <div class="guide-text">${s.text}</div>
            <button class="guide-dismiss">${step < _GUIDE_STEPS.length - 1 ? '[ NEXT ]' : '[ GOT IT ]'}</button>
            <div class="guide-step">STEP ${step + 1} / ${_GUIDE_STEPS.length}</div>
        `;

        document.body.appendChild(guide);

        guide.querySelector('.guide-dismiss').addEventListener('click', () => {
            guide.remove();
            step++;
            showStep();
        });
    }

    showStep();
}

function _getCharacterActions(ap) {
    const charId = SIM.character?.id;
    if (!charId) return '';

    if (charId === 'hegseth') {
        return `<div class="ap-category">
            <div class="ap-cat-header" style="color:#dd4444">SECDEF EXCLUSIVE</div>
            <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="deploy-marines">DEPLOY MARINES</button>
            <button class="ap-btn ${ap <= 0 || SIM.budget < 20 ? 'disabled' : ''}" data-action="combat-air-patrol">COMBAT AIR PATROL <span class="ap-cost">$20M</span></button>
        </div>`;
    }
    if (charId === 'fuentes') {
        return `<div class="ap-category">
            <div class="ap-cat-header" style="color:#ff6644">AMERICA FIRST</div>
            <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="rally-base">RALLY THE BASE</button>
            <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="media-blitz">MEDIA BLITZ</button>
        </div>`;
    }
    if (charId === 'kushner' && SIM.character.contacts) {
        const contactBtns = SIM.character.contacts
            .filter(c => c.trust >= 10)
            .map(c => `<button class="ap-btn ${ap <= 0 || SIM.budget < 10 ? 'disabled' : ''}" data-action="call-contact-${c.id}">CALL ${c.name.split('(')[0].trim()} <span class="ap-cost">$10M</span></button>`)
            .join('');
        if (contactBtns) {
            return `<div class="ap-category">
                <div class="ap-cat-header" style="color:#aa44dd">CONTACTS</div>
                ${contactBtns}
            </div>`;
        }
    }
    return '';
}

function _executeAction(actionId, rerenderFn) {
    if (SIM.actionPoints <= 0) return;

    // Trump: AP actions cost Political Capital
    if (SIM.character?.id === 'trump' && actionId !== 'special') {
        SIM.uniqueResource = Math.max(0, SIM.uniqueResource - 2);
    }

    let toastMsg = '';
    let toastLevel = 'normal';

    switch (actionId) {
        case 'gather-intel':
            if (SIM.budget < 15) return;
            SIM.budget -= 15;
            SIM.fogOfWar = Math.max(0, SIM.fogOfWar - 8);
            showFloatingNumber('fogOfWar', -8);
            showFloatingNumber('budget', -15);
            const intelItem = typeof generateIntelItem === 'function' ? generateIntelItem() : null;
            if (intelItem) {
                toastMsg = `[${intelItem.confidence}] ${intelItem.text}`;
            } else {
                toastMsg = _intelSnippets[Math.floor(Math.random() * _intelSnippets.length)];
            }
            toastLevel = 'good';
            addHeadline('CIA OPS NOTICE [TS//SI]: Intelligence collection operation conducted.', 'normal');
            break;

        case 'analyze-threats':
            if (SIM.fogOfWar < 50) {
                // Useful info
                const analyses = [
                    'Analysis: Iran unlikely to escalate further this week.',
                    'Analysis: IRGC supply lines vulnerable to interdiction.',
                    'Analysis: Chinese mediation window closing.',
                    'Analysis: Iran internal faction split detected — moderates gaining.',
                    'Analysis: Proxy forces in Iraq repositioning.',
                ];
                toastMsg = analyses[Math.floor(Math.random() * analyses.length)];
                toastLevel = 'good';
                SIM.fogOfWar = Math.max(0, SIM.fogOfWar - 3);
                showFloatingNumber('fogOfWar', -3);
            } else {
                toastMsg = 'Too much fog \u2014 intel unclear';
                toastLevel = 'warning';
            }
            addHeadline('Threat analysis conducted.', 'normal');
            break;

        case 'phone-call':
            if (SIM.tension > 60) {
                SIM.tension = Math.max(0, SIM.tension - 5);
                SIM.iranAggression = Math.min(100, SIM.iranAggression + 2);
                showFloatingNumber('tension', -5);
                showFloatingNumber('iranAggression', 2);
                toastMsg = 'De-escalation call placed';
                toastLevel = 'good';
            } else if (SIM.chinaRelations < 40) {
                SIM.chinaRelations = Math.min(100, SIM.chinaRelations + 5);
                showFloatingNumber('chinaRelations', 5);
                toastMsg = 'Called Beijing';
                toastLevel = 'good';
            } else if (SIM.internationalStanding < 40) {
                SIM.internationalStanding = Math.min(100, SIM.internationalStanding + 5);
                showFloatingNumber('internationalStanding', 5);
                toastMsg = 'Allied outreach';
                toastLevel = 'good';
            } else {
                SIM.diplomaticCapital = Math.min(100, SIM.diplomaticCapital + 3);
                showFloatingNumber('diplomaticCapital', 3);
                toastMsg = 'Routine diplomatic call';
                toastLevel = 'normal';
            }
            addHeadline('Diplomatic phone call made.', 'normal');
            break;

        case 'draft-proposal':
            if (SIM.budget < 10) return;
            SIM.budget -= 10;
            SIM.diplomaticCapital = Math.min(100, SIM.diplomaticCapital + 5);
            showFloatingNumber('diplomaticCapital', 5);
            showFloatingNumber('budget', -10);
            toastMsg = 'Diplomatic proposal drafted';
            toastLevel = 'good';
            addHeadline('Diplomatic proposal circulated to allies.', 'normal');
            break;

        case 'reposition-fleet':
            SIM.tension = Math.min(100, SIM.tension + 2);
            SIM.oilFlow = Math.min(100, SIM.oilFlow + 3);
            showFloatingNumber('tension', 2);
            showFloatingNumber('oilFlow', 3);
            toastMsg = 'Fleet repositioned — show of strength';
            toastLevel = 'normal';
            addHeadline('Naval fleet repositioned in the strait.', 'normal');
            break;

        case 'change-roe': {
            const roeOrder = ['defensive', 'moderate', 'aggressive'];
            const currentIdx = roeOrder.indexOf(SIM.roe || 'defensive');
            const nextIdx = (currentIdx + 1) % roeOrder.length;
            SIM.roe = roeOrder[nextIdx];

            if (SIM.roe === 'moderate') {
                SIM.tension = Math.min(100, SIM.tension + 3);
                SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 1);
                showFloatingNumber('tension', 3);
                showFloatingNumber('domesticApproval', 1);
                toastMsg = 'ROE set to MODERATE \u2014 balanced posture';
            } else if (SIM.roe === 'aggressive') {
                SIM.tension = Math.min(100, SIM.tension + 5);
                SIM.iranAggression = Math.max(0, SIM.iranAggression - 3);
                SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 2);
                showFloatingNumber('tension', 5);
                showFloatingNumber('iranAggression', -3);
                showFloatingNumber('internationalStanding', -2);
                toastMsg = 'ROE set to AGGRESSIVE \u2014 Iran deterred, allies uneasy';
            } else {
                SIM.tension = Math.max(0, SIM.tension - 3);
                SIM.internationalStanding = Math.min(100, SIM.internationalStanding + 2);
                showFloatingNumber('tension', -3);
                showFloatingNumber('internationalStanding', 2);
                toastMsg = 'ROE set to DEFENSIVE \u2014 de-escalation';
            }
            toastLevel = 'normal';
            addHeadline(`Rules of engagement changed to ${SIM.roe.toUpperCase()}.`, 'normal');
            break;
        }

        case 'press-conference':
            SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 4);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 1);
            SIM.polarization = Math.min(100, SIM.polarization + 1);
            showFloatingNumber('domesticApproval', 4);
            showFloatingNumber('internationalStanding', -1);
            showFloatingNumber('polarization', 1);
            toastMsg = 'Press conference held';
            toastLevel = 'normal';
            addHeadline('White House holds press conference on strait crisis.', 'normal');
            break;

        case 'brief-congress':
            if (SIM.budget < 5) return;
            SIM.budget -= 5;
            SIM.polarization = Math.max(0, SIM.polarization - 3);
            SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 2);
            showFloatingNumber('polarization', -3);
            showFloatingNumber('domesticApproval', 2);
            showFloatingNumber('budget', -5);
            toastMsg = 'Congressional briefing completed';
            toastLevel = 'good';
            addHeadline('Classified briefing delivered to Congress.', 'normal');
            break;

        case 'adjust-sanctions':
            SIM.iranEconomy = Math.max(0, SIM.iranEconomy - 3);
            SIM.chinaRelations = Math.max(0, SIM.chinaRelations - 2);
            SIM.iranAggression = Math.min(100, SIM.iranAggression + 2);
            showFloatingNumber('iranEconomy', -3);
            showFloatingNumber('chinaRelations', -2);
            showFloatingNumber('iranAggression', 2);
            toastMsg = 'Sanctions tightened';
            toastLevel = 'warning';
            addHeadline('New sanctions imposed on Iranian entities.', 'normal');
            break;

        case 'market-intervention':
            if (SIM.budget < 25) return;
            SIM.budget -= 25;
            SIM.oilPrice = Math.max(40, SIM.oilPrice - 5);
            showFloatingNumber('oilPrice', -5);
            showFloatingNumber('budget', -25);
            toastMsg = 'Strategic reserve released \u2014 oil prices down';
            toastLevel = 'good';
            addHeadline('Strategic petroleum reserve release authorized.', 'normal');
            break;

        case 'escort-tankers':
            if (SIM.budget < 10 || SIM.warPath < 1) return;
            SIM.budget -= 10;
            SIM.oilFlow = Math.min(100, SIM.oilFlow + 5);
            SIM.tension = Math.min(100, SIM.tension + 2);
            showFloatingNumber('oilFlow', 5);
            showFloatingNumber('tension', 2);
            showFloatingNumber('budget', -10);
            SIM.tankers.filter(t => !t.seized && !t.escorted).slice(0, 2).forEach(t => t.escorted = true);
            toastMsg = 'Navy escorts assigned to tanker convoy';
            toastLevel = 'good';
            addHeadline('USN begins tanker escort operations through Strait of Hormuz.', 'normal');
            break;

        case 'precision-strike':
            if (SIM.budget < 30 || SIM.warPath < 2) return;
            SIM.budget -= 30;
            SIM.tension = Math.min(100, SIM.tension + 12);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 8);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 5);
            SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 3);
            SIM.warPath = Math.min(5, SIM.warPath + 1);
            showFloatingNumber('tension', 12);
            showFloatingNumber('iranAggression', -8);
            showFloatingNumber('internationalStanding', -5);
            showFloatingNumber('domesticApproval', 3);
            showFloatingNumber('warPath', 1);
            showFloatingNumber('budget', -30);
            if (SIM.iranBoats.length > 1) SIM.iranBoats.splice(0, Math.min(2, SIM.iranBoats.length - 1));
            spawnEffect(0.45, 0.42, 'explosion');
            toastMsg = 'Tomahawk strike on IRGC naval base';
            toastLevel = 'warning';
            addHeadline('BREAKING: US precision strike destroys IRGC fast boat pens at Bandar Abbas', 'critical');
            break;

        case 'spec-ops-raid':
            if (SIM.budget < 25 || SIM.warPath < 2) return;
            SIM.budget -= 25;
            SIM.fogOfWar = Math.max(0, SIM.fogOfWar - 12);
            SIM.tension = Math.min(100, SIM.tension + 6);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 4);
            showFloatingNumber('fogOfWar', -12);
            showFloatingNumber('tension', 6);
            showFloatingNumber('iranAggression', -4);
            showFloatingNumber('budget', -25);
            if (SIM.mines.length > 0) SIM.mines.splice(0, Math.min(3, SIM.mines.length));
            toastMsg = 'SEAL team neutralizes mine-laying operation';
            toastLevel = 'good';
            addHeadline('SOCOM: Special operations forces conduct raid on Iranian mining assets', 'normal');
            break;

        case 'air-strikes':
            if (SIM.budget < 50 || SIM.warPath < 3) return;
            SIM.budget -= 50;
            SIM.tension = Math.min(100, SIM.tension + 18);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 15);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 8);
            SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 5);
            SIM.conflictRisk = Math.min(100, SIM.conflictRisk + 10);
            SIM.warPath = Math.min(5, SIM.warPath + 1);
            showFloatingNumber('tension', 18);
            showFloatingNumber('iranAggression', -15);
            showFloatingNumber('internationalStanding', -8);
            showFloatingNumber('domesticApproval', 5);
            showFloatingNumber('conflictRisk', 10);
            showFloatingNumber('warPath', 1);
            showFloatingNumber('budget', -50);
            SIM.iranBoats.splice(0, Math.floor(SIM.iranBoats.length * 0.6));
            SIM.drones.splice(0, Math.floor(SIM.drones.length * 0.5));
            spawnEffect(0.40, 0.35, 'explosion');
            spawnEffect(0.50, 0.30, 'explosion');
            toastMsg = 'Air campaign targets IRGC coastal installations';
            toastLevel = 'critical';
            addHeadline('FLASH: US launches sustained air strikes against Iranian military targets', 'critical');
            break;

        case 'sead-mission':
            if (SIM.budget < 40 || SIM.warPath < 3) return;
            SIM.budget -= 40;
            SIM.tension = Math.min(100, SIM.tension + 10);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 6);
            SIM.fogOfWar = Math.max(0, SIM.fogOfWar - 8);
            showFloatingNumber('tension', 10);
            showFloatingNumber('iranAggression', -6);
            showFloatingNumber('fogOfWar', -8);
            showFloatingNumber('budget', -40);
            spawnEffect(0.48, 0.28, 'explosion');
            toastMsg = 'SEAD mission suppresses Iranian radar and SAM sites';
            toastLevel = 'warning';
            addHeadline('US Wild Weasel missions knock out Iranian air defense network along coast', 'critical');
            break;

        case 'ground-troops':
            if (SIM.budget < 80 || SIM.warPath < 4) return;
            SIM.budget -= 80;
            SIM.tension = Math.min(100, SIM.tension + 25);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 20);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 15);
            SIM.domesticApproval = Math.max(0, SIM.domesticApproval - 5);
            SIM.polarization = Math.min(100, SIM.polarization + 10);
            SIM.conflictRisk = Math.min(100, SIM.conflictRisk + 20);
            SIM.oilFlow = Math.min(100, SIM.oilFlow + 10);
            showFloatingNumber('tension', 25);
            showFloatingNumber('iranAggression', -20);
            showFloatingNumber('internationalStanding', -15);
            showFloatingNumber('domesticApproval', -5);
            showFloatingNumber('polarization', 10);
            showFloatingNumber('conflictRisk', 20);
            showFloatingNumber('oilFlow', 10);
            showFloatingNumber('budget', -80);
            toastMsg = 'USMC and Army deploy to secure strait coastline';
            toastLevel = 'critical';
            addHeadline('FLASH: US ground forces land on Iranian coast — Bandar Abbas secured', 'critical');
            break;

        case 'seize-islands':
            if (SIM.budget < 60 || SIM.warPath < 4) return;
            SIM.budget -= 60;
            SIM.tension = Math.min(100, SIM.tension + 15);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 12);
            SIM.oilFlow = Math.min(100, SIM.oilFlow + 8);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 10);
            showFloatingNumber('tension', 15);
            showFloatingNumber('iranAggression', -12);
            showFloatingNumber('oilFlow', 8);
            showFloatingNumber('internationalStanding', -10);
            showFloatingNumber('budget', -60);
            SIM.mines = [];
            spawnEffect(0.48, 0.36, 'explosion');
            toastMsg = 'Marines seize Abu Musa and Tunb islands — mines cleared';
            toastLevel = 'critical';
            addHeadline('FLASH: USMC amphibious assault seizes Iranian-held islands in Strait of Hormuz', 'critical');
            break;

        case 'full-mobilization':
            if (SIM.budget < 100 || SIM.warPath < 5) return;
            SIM.budget -= 100;
            SIM.tension = 100;
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 30);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 20);
            SIM.domesticApproval = Math.max(0, SIM.domesticApproval - 10);
            SIM.polarization = Math.min(100, SIM.polarization + 20);
            SIM.conflictRisk = 100;
            SIM.oilFlow = Math.min(100, SIM.oilFlow + 15);
            showFloatingNumber('tension', 100);
            showFloatingNumber('iranAggression', -30);
            showFloatingNumber('internationalStanding', -20);
            showFloatingNumber('domesticApproval', -10);
            showFloatingNumber('polarization', 20);
            showFloatingNumber('oilFlow', 15);
            showFloatingNumber('budget', -100);
            SIM.iranBoats = [];
            SIM.mines = [];
            SIM.drones = [];
            toastMsg = 'Total war footing — all reserves activated';
            toastLevel = 'critical';
            addHeadline('FLASH: President orders full military mobilization. Draft authorization sent to Congress.', 'critical');
            break;

        case 'demand-un-session':
            SIM.internationalStanding = Math.min(100, SIM.internationalStanding + 3);
            SIM.diplomaticCapital = Math.min(100, SIM.diplomaticCapital + 4);
            SIM.tension = Math.max(0, SIM.tension - 2);
            showFloatingNumber('internationalStanding', 3);
            showFloatingNumber('diplomaticCapital', 4);
            showFloatingNumber('tension', -2);
            toastMsg = 'Emergency UNSC session requested';
            toastLevel = 'normal';
            addHeadline('US demands emergency UN Security Council session on Strait of Hormuz.', 'normal');
            break;

        case 'escalate': {
            if (SIM.warPath >= 5) return;
            SIM.warPath = Math.min(5, SIM.warPath + 1);
            const newEsc = ESCALATION_LADDER[SIM.warPath];
            SIM.tension = Math.min(100, SIM.tension + 8);
            SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 3);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 4);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 3);
            showFloatingNumber('warPath', 1);
            showFloatingNumber('tension', 8);
            showFloatingNumber('domesticApproval', 3);
            showFloatingNumber('internationalStanding', -4);
            showFloatingNumber('iranAggression', -3);
            toastMsg = `Escalated to ${newEsc.name}`;
            toastLevel = 'warning';
            addHeadline(`ESCALATION: US military posture elevated to ${newEsc.name}`, 'critical');
            break;
        }

        case 'deescalate': {
            if (SIM.warPath <= 0) return;
            SIM.warPath = Math.max(0, SIM.warPath - 1);
            const deEsc = ESCALATION_LADDER[SIM.warPath];
            SIM.tension = Math.max(0, SIM.tension - 5);
            SIM.internationalStanding = Math.min(100, SIM.internationalStanding + 5);
            SIM.domesticApproval = Math.max(0, SIM.domesticApproval - 3);
            SIM.iranAggression = Math.min(100, SIM.iranAggression + 4);
            showFloatingNumber('warPath', -1);
            showFloatingNumber('tension', -5);
            showFloatingNumber('internationalStanding', 5);
            showFloatingNumber('domesticApproval', -3);
            showFloatingNumber('iranAggression', 4);
            toastMsg = `De-escalated to ${deEsc.name}`;
            toastLevel = 'good';
            addHeadline(`DE-ESCALATION: US military posture lowered to ${deEsc.name}`, 'normal');
            break;
        }

        case 'issue-ultimatum':
            SIM.tension = Math.min(100, SIM.tension + 8);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 5);
            SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 5);
            SIM.warPath = Math.min(5, SIM.warPath + 1);
            showFloatingNumber('tension', 8);
            showFloatingNumber('iranAggression', -5);
            showFloatingNumber('domesticApproval', 5);
            showFloatingNumber('warPath', 1);
            toastMsg = 'Ultimatum issued: "Cease all hostile actions within 72 hours"';
            toastLevel = 'warning';
            addHeadline('US issues formal ultimatum to Iran on strait freedom of navigation.', 'critical');
            break;

        case 'emergency-coalition':
            if (SIM.budget < 20) return;
            SIM.budget -= 20;
            SIM.internationalStanding = Math.min(100, SIM.internationalStanding + 5);
            SIM.oilFlow = Math.min(100, SIM.oilFlow + 3);
            SIM.diplomaticCapital = Math.min(100, SIM.diplomaticCapital + 5);
            showFloatingNumber('internationalStanding', 5);
            showFloatingNumber('oilFlow', 3);
            showFloatingNumber('diplomaticCapital', 5);
            showFloatingNumber('budget', -20);
            toastMsg = 'Emergency coalition call — allies responding';
            toastLevel = 'good';
            addHeadline('Emergency coalition meeting convened on strait crisis.', 'normal');
            break;

        case 'special':
            executeSpecialAction();
            break;

        // === Hegseth exclusive actions ===
        case 'deploy-marines':
            SIM.tension = Math.min(100, SIM.tension + 8);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 6);
            SIM.oilFlow = Math.min(100, SIM.oilFlow + 4);
            SIM.uniqueResource = Math.max(0, SIM.uniqueResource - 8);
            toastMsg = 'Marines deployed — securing key chokepoints';
            toastLevel = 'normal';
            addHeadline('US Marines deployed to secure strait positions.', 'warning');
            break;

        case 'combat-air-patrol':
            if (SIM.budget < 20) return;
            SIM.budget -= 20;
            SIM.tension = Math.min(100, SIM.tension + 5);
            SIM.fogOfWar = Math.max(0, SIM.fogOfWar - 10);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 4);
            toastMsg = 'F/A-18s on station — full air dominance';
            toastLevel = 'good';
            addHeadline('Combat air patrols established over the strait.', 'normal');
            break;

        // === Fuentes exclusive actions ===
        case 'rally-base':
            SIM.uniqueResource = Math.min(100, SIM.uniqueResource + 8);
            SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 3);
            SIM.polarization = Math.min(100, SIM.polarization + 4);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 2);
            toastMsg = '"America First!" — base enthusiasm surges';
            toastLevel = 'good';
            addHeadline('Populist rally energizes the base.', 'normal');
            break;

        case 'media-blitz':
            SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 5);
            SIM.uniqueResource = Math.min(100, SIM.uniqueResource + 3);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 3);
            toastMsg = 'Media blitz — controlling the narrative';
            toastLevel = 'normal';
            addHeadline('Media blitz pushes America First messaging.', 'normal');
            break;

        default:
            // Bible actions (content bible expansion)
            if (actionId.startsWith('bible_')) {
                const bibleId = actionId.replace('bible_', '');
                const bibleAction = BIBLE_ACTIONS.find(a => a.id === bibleId);
                if (!bibleAction) return;
                if (SIM.actionPoints < bibleAction.ap) return;
                if (bibleAction.cost && SIM.budget < bibleAction.cost) return;
                try { if (!bibleAction.condition()) return; } catch(e) { return; }
                if (bibleAction.cost) {
                    SIM.budget -= bibleAction.cost;
                    showFloatingNumber('budget', -bibleAction.cost);
                }
                // Bible actions spend their own AP amount (may be >1)
                // We subtract (ap - 1) here because the common code below subtracts 1
                if (bibleAction.ap > 1) {
                    SIM.actionPoints = Math.max(0, SIM.actionPoints - (bibleAction.ap - 1));
                }
                bibleAction.execute();
                toastMsg = ''; // execute() handles its own toasts
                break;
            }
            // Kushner contact calls
            if (actionId.startsWith('call-contact-')) {
                const contactId = actionId.replace('call-contact-', '');
                const contact = SIM.character?.contacts?.find(c => c.id === contactId);
                if (!contact || SIM.budget < 10) return;
                SIM.budget -= 10;
                contact.trust = Math.min(100, contact.trust + 8);
                SIM.diplomaticCapital = Math.min(100, SIM.diplomaticCapital + 4);
                SIM.uniqueResource = Math.min(100, SIM.uniqueResource + 5);
                toastMsg = `Called ${contact.name} — trust +8, now ${contact.trust}`;
                toastLevel = 'good';
                addHeadline(`Back-channel call to ${contact.name.split('(')[0].trim()}.`, 'normal');
                break;
            }
            return;
    }

    // Spend AP
    SIM.actionPoints = Math.max(0, SIM.actionPoints - 1);

    // Sound feedback
    if (typeof SFX !== 'undefined') {
        if (toastLevel === 'good') SFX.chime();
        else SFX.click();
    }

    if (toastMsg) showToast(toastMsg, toastLevel);
    _flushFloatingNumbers();
    updateGauges();

    // If AP exhausted, re-render panel (all buttons disabled, END DAY remains)
    if (SIM.actionPoints <= 0) {
        rerenderFn();
        showToast('Action points spent — END DAY when ready', 'warning');
        return;
    }

    // Random interrupt check (30% chance)
    if (Math.random() < 0.3) {
        setTimeout(() => {
            showInterrupt(rerenderFn);
        }, 400);
    } else {
        rerenderFn();
    }
}

function _endDay() {
    hideActionPanel();
    if (typeof SFX !== 'undefined') SFX.transition();
    advanceDay();
}

function _getWinProgress() {
    if (!SIM.character || !SIM.character.scenario || !SIM.character.scenario.winConditions) {
        // Generic win: strait open days
        const pct = Math.min(100, Math.round((SIM.straitOpenDays / 7) * 100));
        // Daily checklist
        const recentSeizures = SIM.recentSeizureDays ? SIM.recentSeizureDays.filter(d => SIM.day - d <= 3).length : 0;
        const checks = [
            { label: 'Oil Flow > 55%', ok: SIM.oilFlow > 55 },
            { label: 'Tension < 45', ok: SIM.tension < 45 },
            { label: 'No seizures (3d)', ok: recentSeizures === 0 },
            { label: 'No active crisis', ok: SIM.crisisLevel === 0 },
        ];
        const checkHtml = checks.map(c => `<span style="color:${c.ok ? '#44dd88' : '#dd4444'}">${c.ok ? '\u2713' : '\u2717'} ${c.label}</span>`).join(' ');
        return `<div class="win-progress">
            <div class="win-progress-label">OBJECTIVE: STRAIT OPEN 7 DAYS</div>
            <div class="win-progress-bar"><div class="win-progress-fill" style="width:${pct}%"></div></div>
            <div class="win-progress-text">${SIM.straitOpenDays}/7 days</div>
            <div style="font-size:9px;margin-top:4px;line-height:1.6">${checkHtml}</div>
        </div>`;
    }

    const wc = SIM.character.scenario.winConditions[0];
    const met = wc.check(SIM);
    const sustained = wc._days || 0;
    const pct = met ? Math.min(100, Math.round((sustained / 3) * 100)) : 0;

    // Build a readable condition summary
    const charId = SIM.character.id;
    const labels = {
        trump: 'WIN BIG: High approval + oil flowing + low tension',
        hegseth: 'TOTAL VICTORY: Escalation 4+ + approval 55+ + Iran crushed',
        kushner: 'THE DEAL: Exposure 55+ + diplomacy 50+ + budget 400+',
        asmongold: 'CALLED IT: Credibility 70+ + approval 60+ + fog low',
        fuentes: 'AMERICA FIRST: Escalation 1- + standing 40+ + base 60+',
    };
    const label = labels[charId] || 'Complete your objective';

    return `<div class="win-progress">
        <div class="win-progress-label">${label}</div>
        <div class="win-progress-bar"><div class="win-progress-fill" style="width:${pct}%;${met ? '' : 'background:#ddaa44;box-shadow:0 0 4px rgba(221,170,68,0.3)'}"></div></div>
        <div class="win-progress-text">${met ? sustained + '/3 days sustained' : 'Conditions not yet met'}</div>
    </div>`;
}

function showInterrupt(afterCallback) {
    const panel = document.getElementById('action-panel');
    if (!panel) { if (afterCallback) afterCallback(); return; }

    const eligible = INTERRUPTS.filter(i => !i.condition || i.condition());
    if (eligible.length === 0) { if (afterCallback) afterCallback(); return; }
    const interrupt = eligible[Math.floor(Math.random() * eligible.length)];
    if (typeof SFX !== 'undefined') SFX.klaxon();

    // Create interrupt overlay inside the action panel
    const overlay = document.createElement('div');
    overlay.className = 'ap-interrupt';
    overlay.innerHTML = `
        <div class="ap-interrupt-flash">INCOMING</div>
        <div class="ap-interrupt-text">${interrupt.text}</div>
        <div class="ap-interrupt-choices">
            ${interrupt.choices.map((c, i) => `
                <button class="ap-interrupt-btn" data-choice="${i}">${c.label}</button>
            `).join('')}
        </div>
    `;

    panel.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
        overlay.classList.add('visible');
    });

    overlay.querySelectorAll('.ap-interrupt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const choiceIdx = parseInt(btn.dataset.choice);
            const choice = interrupt.choices[choiceIdx];
            const gaugesBefore = calculateGauges();

            // Apply effects
            _applyEffects(choice.effects);

            // Apply story flags if present
            if (choice.setFlags && SIM.storyFlags) {
                for (const [flag, val] of Object.entries(choice.setFlags)) {
                    SIM.storyFlags[flag] = val;
                }
            }

            const gaugesAfter = calculateGauges();

            // Log to decision log for situation panel
            SIM.decisionLog.push({
                title: interrupt.text.length > 50 ? interrupt.text.substring(0, 47) + '...' : interrupt.text,
                choice: choice.label,
                effects: { ...choice.effects },
                gaugesBefore,
                gaugesAfter,
                day: SIM.day,
                type: 'interrupt',
            });

            // Toast the result
            const effectStrs = Object.entries(choice.effects)
                .filter(([k, v]) => v !== 0)
                .map(([k, v]) => `${formatEffectName(k)} ${v > 0 ? '+' : ''}${v}`)
                .join(', ');
            if (effectStrs) {
                showToast(`${choice.label}: ${effectStrs}`, 'normal');
            }

            addHeadline(`Interrupt: ${interrupt.text.substring(0, 40)}... \u2014 ${choice.label}`, 'normal');

            // Remove overlay
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
                if (afterCallback) afterCallback();
            }, 300);
        });
    });
}

function hideActionPanel() {
    const existing = document.getElementById('action-panel');
    if (existing) existing.remove();

    // Restore layout widths
    const centerPanel = document.getElementById('center-panel');
    const gaugeBar = document.getElementById('gauge-bar');
    if (centerPanel) centerPanel.classList.add('no-actpanel');
    if (gaugeBar) gaugeBar.style.right = '';
}


// ======================== FLOATING NUMBERS ========================

let _pendingFloats = {};
function showFloatingNumber(metricKey, value) {
    _pendingFloats[metricKey] = (_pendingFloats[metricKey] || 0) + value;
}
function _flushFloatingNumbers() {
    if (Object.keys(_pendingFloats).length > 0) {
        showEffectSummary(_pendingFloats);
        _pendingFloats = {};
    }
}

function showEffectSummary(effects, targetEl) {
    if (!effects || Object.keys(effects).length === 0) return;

    const badIfUp = ['tension', 'iranAggression', 'conflictRisk', 'fogOfWar', 'polarization',
                     'assassinationRisk', 'warPath', 'proxyThreat', 'exposure', 'oilPrice'];

    const parts = [];
    for (const [key, val] of Object.entries(effects)) {
        if (val === 0) continue;
        const name = formatEffectName(key);
        const isPositive = val > 0;
        const isGood = badIfUp.includes(key) ? !isPositive : isPositive;
        const cls = isGood ? 'eff-good' : 'eff-bad';
        parts.push(`<span class="${cls}">${isPositive ? '+' : ''}${val} ${name}</span>`);
    }
    if (parts.length === 0) return;

    const el = document.createElement('div');
    el.className = 'effect-summary';
    el.innerHTML = parts.join(' &middot; ');

    // If a target container is given, append there; otherwise show as toast
    if (targetEl) {
        targetEl.appendChild(el);
    } else {
        showToast(parts.map(p => p.replace(/<[^>]+>/g, '')).join(' · '), 'info');
    }
}

// ======================== DECISION EVENTS ========================

function showDecisionEvent(event) {
    hideActionPanel();
    if (typeof SFX !== 'undefined') {
        if (event.crisis) SFX.klaxon();
        else SFX.phone();
    }
    let countdown = event.countdown || 0;
    let countdownInterval = null;
    const isCrisis = event.crisis === true;

    function renderEvent() {
        const btnClass = isCrisis ? 'crisis-choice' : 'decision-choice';

        const choicesHtml = event.choices.map((choice, i) => {
            const hints = Object.entries(choice.effects).map(([key, val]) => {
                if (val === 0) return '';
                const isNeg = ['tension', 'iranAggression', 'conflictRisk', 'fogOfWar', 'polarization', 'assassinationRisk', 'warPath', 'proxyThreat', 'exposure'].includes(key)
                    ? val > 0 : val < 0;
                const arrow = Math.abs(val) > 10 ? (val > 0 ? '\u25B2\u25B2' : '\u25BC\u25BC') : (val > 0 ? '\u25B2' : '\u25BC');
                return `<span class="${isNeg ? 'negative' : 'positive'}">${formatEffectName(key)} ${arrow}</span>`;
            }).filter(Boolean).join(' ');

            return `
                <button class="${btnClass}" data-idx="${i}">
                    <span class="choice-text">${choice.text}</span>
                    <span class="choice-effects">${hints || 'No immediate effects'}</span>
                </button>
            `;
        }).join('');

        const crisisHeader = isCrisis ? '<div class="crisis-header">\u2588 CRISIS TELEPHONE \u2588</div>' : '';
        const headerStyle = isCrisis ? 'color:#dd4444' : '';
        const titleStyle = isCrisis ? 'color:#dd4444;text-shadow:0 0 10px rgba(221,68,68,0.4)' : '';
        const eventImg = _getEventCategoryImage(event);

        openTerminal(`
            ${crisisHeader}
            ${eventImg ? `<img src="${eventImg}" class="event-category-art" alt="Event">` : ''}
            ${countdown > 0 ? `<div class="decision-timer">${countdown}s</div>` : ''}
            <div class="term-header" style="${headerStyle}">DAY ${SIM.day} \u2014 ${isCrisis ? 'CRISIS' : 'DECISION REQUIRED'}</div>
            <div class="term-title" style="${titleStyle}">${event.title}</div>
            <div class="term-line" style="margin-bottom:16px${isCrisis ? ';color:#dd8888' : ''}">${event.description}</div>
            <div class="term-section">
                <div class="term-section-label" ${isCrisis ? 'style="color:#dd4444"' : ''}>${isCrisis ? 'NO SAFE OPTIONS' : 'OPTIONS'}</div>
                ${choicesHtml}
            </div>
        `);

        // Add crisis styling to terminal
        if (isCrisis) TERMINAL.classList.add('crisis-terminal');
        else TERMINAL.classList.remove('crisis-terminal');

        TERMINAL.querySelectorAll('.' + btnClass).forEach(btn => {
            btn.addEventListener('click', () => {
                if (countdownInterval) clearInterval(countdownInterval);
                TERMINAL.classList.remove('crisis-terminal');
                resolveDecision(event, parseInt(btn.dataset.idx));
            });
        });
    }

    renderEvent();

    if (countdown > 0) {
        countdownInterval = setInterval(() => {
            countdown--;
            const timerEl = TERMINAL.querySelector('.decision-timer');
            if (timerEl) timerEl.textContent = countdown > 0 ? `${countdown}s` : 'TIME UP';
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                TERMINAL.classList.remove('crisis-terminal');
                resolveDecision(event, 0);
            }
        }, 1000);
    }
}

function _buildImpactSummary(effects, gaugesBefore, gaugesAfter) {
    // Raw effect lines
    const effectLines = Object.entries(effects)
        .filter(([k, v]) => v !== 0)
        .map(([k, v]) => {
            const name = formatEffectName(k);
            const badIfUp = ['tension', 'iranAggression', 'conflictRisk', 'fogOfWar', 'polarization',
                             'assassinationRisk', 'warPath', 'proxyThreat', 'exposure', 'oilPrice'];
            const isGood = badIfUp.includes(k) ? v < 0 : v > 0;
            const color = isGood ? '#44dd88' : '#dd4444';
            const sign = v > 0 ? '+' : '';
            return `<span style="color:${color}">${name} ${sign}${v}</span>`;
        });

    // Gauge deltas
    const gaugeNames = { stability: 'STABILITY', economy: 'ECONOMY', support: 'SUPPORT', intel: 'INTEL' };
    const gaugeDeltaLines = [];
    for (const [key, label] of Object.entries(gaugeNames)) {
        const delta = gaugesAfter[key] - gaugesBefore[key];
        if (delta !== 0) {
            const color = delta > 0 ? '#44dd88' : '#dd4444';
            const sign = delta > 0 ? '+' : '';
            gaugeDeltaLines.push(`<span style="color:${color}">${label} ${sign}${delta}</span>`);
        }
    }

    if (effectLines.length === 0 && gaugeDeltaLines.length === 0) return '';

    let html = '<div class="impact-summary">';
    html += '<div class="impact-label">IMMEDIATE IMPACT</div>';
    if (effectLines.length > 0) {
        html += '<div class="impact-effects">' + effectLines.join(' &middot; ') + '</div>';
    }
    if (gaugeDeltaLines.length > 0) {
        html += '<div class="impact-gauges">' + gaugeDeltaLines.join(' &middot; ') + '</div>';
    }
    html += '</div>';
    return html;
}

function _buildDecisionLogHtml() {
    if (!SIM.decisionLog || SIM.decisionLog.length === 0) return '';
    // Show last 5 decisions, newest first
    const recent = SIM.decisionLog.slice(-5).reverse();
    const entries = recent.map(entry => {
        const typeIcon = entry.type === 'crisis' ? '<span style="color:#dd4444">\u26A0</span>'
                       : entry.type === 'interrupt' ? '<span style="color:#ddaa44">\u26A1</span>'
                       : '<span style="color:#44dd88">\u25B6</span>';

        // Gauge deltas
        const gaugeNames = { stability: 'STB', economy: 'ECO', support: 'SUP', intel: 'INT' };
        const deltas = [];
        for (const [key, label] of Object.entries(gaugeNames)) {
            const delta = entry.gaugesAfter[key] - entry.gaugesBefore[key];
            if (delta !== 0) {
                const color = delta > 0 ? '#44dd88' : '#dd4444';
                const sign = delta > 0 ? '+' : '';
                deltas.push(`<span style="color:${color}">${label}${sign}${delta}</span>`);
            }
        }
        const deltaStr = deltas.length > 0 ? deltas.join(' ') : '<span style="color:#2a6a4a">no gauge change</span>';

        const title = entry.title.length > 35 ? entry.title.substring(0, 32) + '...' : entry.title;

        return `<div class="sit-decision-entry">
            <div class="sit-decision-header">${typeIcon} <span class="sit-decision-day">D${entry.day}</span> ${title}</div>
            <div class="sit-decision-choice">\u2192 ${entry.choice}</div>
            <div class="sit-decision-impact">${deltaStr}</div>
        </div>`;
    }).join('');

    const isCollapsed = _sitCollapsed.decisions;
    return `<div class="sit-section">
        <div class="sit-label collapsible ${isCollapsed ? 'collapsed' : ''}" data-sit-key="decisions">
            <span class="sit-toggle">\u25BC</span> DECISION LOG
        </div>
        <div class="sit-section-body ${isCollapsed ? 'collapsed' : ''}" data-sit-body="decisions">
            ${entries}
        </div>
    </div>`;
}

function resolveDecision(event, choiceIdx) {
    const choice = event.choices[choiceIdx];
    const gaugesBefore = calculateGauges();

    // Track hidden alignment
    if (typeof shiftAlignment === 'function') shiftAlignment(choice.effects);

    // Apply effects
    for (const [key, val] of Object.entries(choice.effects)) {
        _applyEffect(key, val);
    }
    showEffectSummary(choice.effects);

    // Set story flags from choice
    if (choice.setFlags) {
        for (const [flag, val] of Object.entries(choice.setFlags)) {
            SIM.storyFlags[flag] = val;
        }
    }

    // Schedule chain follow-up event
    if (choice.chainEvent && choice.chainDelay) {
        SIM.scheduledEvents.push({
            eventId: choice.chainEvent,
            triggerDay: SIM.day + choice.chainDelay,
            sourceEvent: event.id,
        });
    }

    // Contact trust effects (Kushner)
    if (choice.contactEffect && SIM.character.contacts) {
        const contact = SIM.character.contacts.find(c => c.id === choice.contactEffect.id);
        if (contact) {
            contact.trust = Math.max(0, Math.min(100, contact.trust + choice.contactEffect.trust));
            if (choice.contactEffect.trust > 0) addHeadline(`${contact.name}: trust increased to ${contact.trust}`, 'good');
        }
    }

    const gaugesAfter = calculateGauges();

    // Log to decision log for situation panel
    SIM.decisionLog.push({
        title: event.title,
        choice: choice.text,
        effects: { ...choice.effects },
        gaugesBefore,
        gaugesAfter,
        day: SIM.day,
        type: event.crisis ? 'crisis' : 'decision',
    });

    addHeadline(`Decision: ${event.title} \u2014 ${choice.text}`, 'normal');
    if (choice.flavor) addHeadline(choice.flavor, 'good');

    SIM.decisionHistory.push({
        id: event.id, title: event.title,
        choiceText: choice.text, day: SIM.day,
    });

    // Build impact summary for result screen
    const impactHtml = _buildImpactSummary(choice.effects, gaugesBefore, gaugesAfter);

    // Chain event hint
    const chainHint = choice.chainEvent ? `<div class="term-line dim" style="margin-top:8px; font-style:italic; color:#ddaa44">${choice.chainHint || 'This decision will have consequences...'}</div>` : '';

    // Show result
    openTerminal(`
        <div class="term-header">DECISION MADE</div>
        <div class="term-title">${choice.text.toUpperCase()}</div>
        <div class="term-line" style="margin-top:12px">${choice.flavor || ''}</div>
        ${impactHtml}
        ${chainHint}
        <div class="term-btn-row">
            <button class="term-btn" id="btn-decision-continue">[ CONTINUE ]</button>
        </div>
    `);

    fadeInButtons(TERMINAL, 300);

    document.getElementById('btn-decision-continue').addEventListener('click', () => {
        closeTerminal();
        SIM.decisionEventActive = false;

        // After event resolves, go to daily report (overnight)
        SIM.phase = 'overnight';
        showDailyReport();
    });
}

// ======================== TOAST NOTIFICATIONS ========================

function showToast(text, level) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    while (container.children.length >= 4) container.removeChild(container.firstChild);

    const toast = document.createElement('div');
    toast.className = `toast toast-${level}`;
    toast.textContent = text;
    toast.addEventListener('animationend', (e) => {
        if (e.animationName === 'toastFadeOut') toast.remove();
    });
    container.appendChild(toast);

    // Also flash on canvas
    if (typeof triggerEventFlash === 'function') {
        triggerEventFlash(text, level);
    }
}

// ======================== POST-MORTEM ========================

function generatePostMortem() {
    const g = calculateGauges();

    function metricGrade(val) {
        if (val >= 80) return { grade: 'S', cls: 'good' };
        if (val >= 65) return { grade: 'A', cls: 'good' };
        if (val >= 50) return { grade: 'B', cls: 'good' };
        if (val >= 35) return { grade: 'C', cls: 'warning' };
        if (val >= 20) return { grade: 'D', cls: 'danger' };
        return { grade: 'F', cls: 'danger' };
    }

    const grades = {
        stability: metricGrade(g.stability),
        economy: metricGrade(g.economy),
        support: metricGrade(g.support),
        intel: metricGrade(g.intel),
    };

    const gradeLabels = { stability: 'Stability', economy: 'Economy', support: 'Support', intel: 'Intel' };

    let breakdownHtml = '<div class="pm-breakdown">';
    for (const [key, gr] of Object.entries(grades)) {
        breakdownHtml += `<div class="pm-metric"><span class="pm-metric-name">${gradeLabels[key]}</span><span class="pm-metric-grade ${gr.cls}">${gr.grade}</span></div>`;
    }
    breakdownHtml += '</div>';

    // Decision recap
    let decisionHtml = '';
    if (SIM.decisionHistory.length > 0) {
        const recent = SIM.decisionHistory.slice(-5);
        decisionHtml = '<div class="term-section"><div class="term-section-label">KEY DECISIONS</div>';
        for (const d of recent) {
            decisionHtml += `<div class="term-line dim">Day ${d.day}: ${d.title} \u2014 ${d.choiceText}</div>`;
        }
        decisionHtml += '</div>';
    }

    return breakdownHtml + decisionHtml;
}

// ======================== GAME OVER ========================

function showGameOverScreen() {
    hideActionPanel();
    const rating = calculateRating();
    const postMortem = generatePostMortem();
    const gradeClass = rating.score >= 60 ? 'good' : rating.score >= 35 ? 'warning' : 'danger';
    const g = calculateGauges();

    const gaugeBreakdown = [
        { label: 'STABILITY', val: Math.round(g.stability) },
        { label: 'ECONOMY', val: Math.round(g.economy) },
        { label: 'SUPPORT', val: Math.round(g.support) },
        { label: 'INTEL', val: Math.round(g.intel) },
    ].map(item => {
        const cls = item.val >= 60 ? 'good' : item.val >= 35 ? 'warning' : 'danger';
        const color = item.val >= 60 ? '#44dd88' : item.val >= 35 ? '#ddaa44' : '#dd4444';
        return `<div class="gameover-gauge-col">
            <div class="go-gauge-label">${item.label}</div>
            <div class="go-gauge-val" style="color:${color}">${item.val}</div>
        </div>`;
    }).join('');

    const outcomeImg = SIM.gameWon ? 'assets/victory.png' : 'assets/defeat.png';
    const reactionImg = SIM.gameWon
        ? _getReactionImage('victory')
        : _getReactionImage('defeat');

    // Determine epilogue from character
    let epilogueText = '';
    let epilogueImg = '';
    if (SIM.character?.epilogues) {
        const ep = SIM.character.epilogues;
        if (SIM.gameWon && SIM.warPath <= 1 && ep.diplomatic) {
            epilogueText = ep.diplomatic;
            epilogueImg = 'assets/epilogue-diplomatic.png';
        } else if (SIM.gameWon && SIM.warPath >= 2 && ep.military) {
            epilogueText = ep.military;
            epilogueImg = 'assets/epilogue-military.png';
        } else if (!SIM.gameWon && ep.decline) {
            epilogueText = ep.decline;
            epilogueImg = 'assets/epilogue-managed-decline.png';
        } else if (SIM.gameWon && ep.diplomatic) {
            epilogueText = ep.diplomatic;
            epilogueImg = 'assets/epilogue-diplomatic.png';
        }
    }
    if (!SIM.gameWon && !epilogueText) {
        epilogueImg = 'assets/epilogue-defeat.png';
    }

    openTerminal(`
        <img src="${outcomeImg}" class="gameover-art" alt="${SIM.gameWon ? 'Victory' : 'Defeat'}">

        <div class="gameover-title ${SIM.gameWon ? 'victory' : 'defeat'}">
            ${SIM.gameWon ? 'MISSION COMPLETE' : 'MISSION FAILED'}
        </div>

        ${reactionImg ? `<img src="${reactionImg}" class="gameover-reaction" alt="Advisor reaction">` : ''}

        <div class="gameover-grade ${gradeClass}">${rating.grade}</div>
        <div class="gameover-sublabel">${rating.label.toUpperCase()} \u2014 SCORE ${rating.score}/100</div>

        <div class="gameover-gauge-breakdown">${gaugeBreakdown}</div>

        <div class="gameover-reason">${SIM.gameOverReason}</div>

        ${epilogueText ? `<div class="term-section">
            <div class="term-section-label">EPILOGUE</div>
            ${epilogueImg ? `<img src="${epilogueImg}" class="gameover-epilogue-art" alt="Epilogue" style="width:100%; max-width:480px; image-rendering:pixelated; margin:8px auto; display:block">` : ''}
            <div class="gameover-epilogue" style="color:#44dd88; font-style:italic; line-height:1.6; padding:8px 0">${epilogueText}</div>
        </div>` : ''}

        <div class="term-section">
            <div class="term-section-label">FINAL STATS</div>
            <div class="stat-row"><span>Character</span><span>${SIM.character ? SIM.character.name : 'None'}</span></div>
            <div class="stat-row"><span>Days Survived</span><span>${SIM.day}</span></div>
            <div class="stat-row"><span>Escalation</span><span style="color:${_getEscalationColor()}">${_getEscalationName()} (${SIM.warPath}/5)</span></div>
            <div class="stat-row"><span>Strait Open</span><span>${SIM.straitOpenDays}/7 days</span></div>
            <div class="stat-row"><span>Tankers Seized</span><span>${SIM.seizureCount}</span></div>
            <div class="stat-row"><span>Intercepts</span><span>${SIM.interceptCount}</span></div>
            <div class="stat-row"><span>Budget Remaining</span><span>$${Math.round(SIM.budget)}M / $900M</span></div>
            <div class="stat-row"><span>Decisions Made</span><span>${(SIM.decisionLog || []).length}</span></div>
            ${SIM.character && SIM.character.uniqueResource ? `<div class="stat-row"><span>${SIM.character.uniqueResource.name}</span><span>${Math.round(SIM.uniqueResource)}/100</span></div>` : ''}
        </div>

        <div class="term-section">
            <div class="term-section-label">PERFORMANCE</div>
            ${postMortem}
        </div>

        <div class="term-btn-row">
            <button class="term-btn" id="btn-restart">[ PLAY AGAIN ]</button>
        </div>
    `);

    fadeInButtons(TERMINAL, 1200);

    document.getElementById('btn-restart').addEventListener('click', restartGame);
}

// ======================== RESTART ========================

function restartGame() {
    closeTerminal();
    hideActionPanel();

    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) toastContainer.innerHTML = '';

    // Reset SIM to defaults
    for (const [key, val] of Object.entries(SIM_DEFAULTS)) {
        SIM[key] = Array.isArray(val) ? [] : (typeof val === 'object' && val !== null) ? {} : val;
    }

    // Reset character-specific state
    if (SIM.character) {
        if (SIM.character._addressNationUses !== undefined) SIM.character._addressNationUses = 0;
        if (SIM.character._withdrawalStreak !== undefined) SIM.character._withdrawalStreak = 0;
        if (SIM.character.specialAction) SIM.character.specialAction.cooldown = 0;
        if (SIM.character.contacts) {
            const defaults = CHARACTERS.find(c => c.id === SIM.character.id);
            if (defaults && defaults.contacts) {
                for (let i = 0; i < SIM.character.contacts.length; i++) {
                    SIM.character.contacts[i].trust = defaults.contacts[i].trust;
                }
            }
        }
        if (SIM.character.scenario?.loseConditions) {
            for (const lc of SIM.character.scenario.loseConditions) {
                lc._days = 0;
            }
        }
    }

    // Reset action points and ROE
    resetActionPoints();
    SIM.roe = 'defensive';

    initSimulation();
    updateGauges();
    showDailyReport();
}

// ======================== KEYBOARD SHORTCUTS ========================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (SIM.gameOver && e.key === 'r') {
            restartGame();
            return;
        }
    });
}

// ======================== MUSIC ========================

function initMusic() {
    const audio = document.getElementById('bg-music');
    const muteBtn = document.getElementById('mute-btn');
    if (!audio || !muteBtn) return;

    // Try to play (will fail without user interaction)
    audio.volume = 0.3;

    muteBtn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().catch(() => {});
            muteBtn.textContent = '\u266B';
            muteBtn.classList.remove('muted');
        } else {
            audio.pause();
            muteBtn.textContent = '\u266B';
            muteBtn.classList.add('muted');
        }
    });

    // Auto-play on first user click anywhere
    document.addEventListener('click', function startMusic() {
        audio.play().catch(() => {});
        if (typeof SFX !== 'undefined') { SFX.init(); SFX.crtBuzz(); }
        document.removeEventListener('click', startMusic);
    }, { once: true });

    // Sync SFX mute with music mute
    muteBtn.addEventListener('click', () => {
        if (typeof SFX !== 'undefined') SFX.mute(audio.paused);
    });
}

// ======================== NEWS TICKERS ========================


// ======================== HELPERS ========================

function _getDateString() {
    // Game starts Feb 28, 2026
    const startDate = new Date(2026, 1, 28); // Feb 28
    const gameDate = new Date(startDate);
    gameDate.setDate(gameDate.getDate() + SIM.day - 1);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[gameDate.getMonth()]} ${gameDate.getDate()}, 2026`;
}

function _getBriefingTitle() {
    if (!SIM.character) return 'DAILY BRIEFING';
    switch (SIM.character.id) {
        case 'trump': return 'PRESIDENTIAL DAILY BRIEF';
        case 'hegseth': return 'SECDEF MORNING SITREP';
        case 'kushner': return 'DIPLOMATIC TRAFFIC SUMMARY';
        case 'asmongold': return 'MOD-CURATED INTEL FEED';
        case 'fuentes': return 'AMERICA FIRST DAILY BRIEF';
        default: return 'DAILY BRIEFING';
    }
}

function _getMorningBrief() {
    return getAdvisorReaction('morningBrief') || getAdvisorReaction('weekStart');
}

function _getEscalationColor() {
    const level = SIM.warPath || 0;
    const colors = ['#44dd88', '#88aa44', '#ddaa44', '#dd6644', '#dd4444', '#ff0000'];
    return colors[Math.min(level, 5)];
}

function _getEscalationName() {
    const level = SIM.warPath || 0;
    const names = ['DIPLOMATIC', 'NAVAL STANDOFF', 'LIMITED STRIKES', 'AIR CAMPAIGN', 'GROUND WAR', 'TOTAL WAR'];
    return names[Math.min(level, 5)];
}

function formatEffectName(key) {
    const names = {
        tension: 'Tension', oilFlowProtection: 'Oil Protection', oilPrice: 'Oil Price',
        domesticApproval: 'Approval', internationalStanding: 'Standing',
        iranAggression: 'Iran Aggression', iranEconomy: 'Iran Economy',
        cost: 'Cost', conflictRisk: 'Conflict Risk', fogOfWar: 'Fog of War',
        diplomaticCapital: 'Diplomacy', proxyThreat: 'Proxy Threat',
        chinaRelations: 'China',
        polarization: 'Polarization', assassinationRisk: 'Assassination Risk',
        warPath: 'Escalation', navalPresence: 'Naval Presence',
        blockadeLevel: 'Blockade', intelLevel: 'Intel Level', carrier: 'Carrier',
        politicalCapital: 'Political Capital', commandAuthority: 'Command Auth',
        credibility: 'Credibility', baseEnthusiasm: 'Base', exposure: 'Exposure',
        oilFlow: 'Oil Flow', budget: 'Budget', interceptCount: 'Intercepts',
    };
    return names[key] || key;
}

// ======================== REACTION PORTRAITS ========================

const REACTION_IMAGES = {
    trump:     { angry: 'assets/trump-angry.png',    positive: 'assets/trump-smug.png' },
    hegseth:   { angry: 'assets/pete-angry.png',     positive: 'assets/pete.png' },
    kushner:   { angry: 'assets/kushner.png',         positive: 'assets/kushner-scheming.png' },
    asmongold: { angry: 'assets/asmongold.png',       positive: 'assets/asmongold-hype.png' },
    fuentes:   { angry: 'assets/nick.png',            positive: 'assets/nick.png' },
};

function _getReactionImage(context) {
    if (!SIM.character) return null;
    const reactions = REACTION_IMAGES[SIM.character.id];
    if (!reactions) return null;

    if (context === 'victory') return reactions.positive;
    if (context === 'defeat') return reactions.angry;
    if (context === 'crisis') return reactions.angry;
    if (context === 'good') return reactions.positive;
    return null;
}

function _getEventCategoryImage(event) {
    if (!event) return '';
    // Per-event image override (for story events with unique art)
    if (event.image) return event.image;
    // Determine category from event content
    const title = (event.title || '').toLowerCase();
    const desc = (event.description || '').toLowerCase();
    const text = title + ' ' + desc;

    if (event.crisis) return 'assets/event-military.png';
    if (text.match(/strike|carrier|navy|military|missile|bomb|war|attack|drone|mine|boat|ship|escort|convoy|swarm|submarine/))
        return 'assets/event-military.png';
    if (text.match(/diplomat|talk|negotiate|un |resolution|mediati|ceasefire|summit|back.?channel|treaty|muscat/))
        return 'assets/event-diplomatic.png';
    if (text.match(/oil|sanction|econom|price|gas|trade|insur|budget|barrel|reserve|bank|fund/))
        return 'assets/event-economic.png';
    if (text.match(/intel|spy|cyber|drone|surveil|sigint|humint|leak|defect|source|classified/))
        return 'assets/event-intel.png';
    return 'assets/event-military.png'; // default
}

// ======================== ACTION PANEL CSS ========================
// All action panel, interrupt, and floating number styles are in css/style.css

function _injectActionPanelStyles() {
    // Styles moved to css/style.css
}
