/**
 * Data Loader — fetches all JSON text data into window.DATA
 * Must be loaded before other game scripts.
 * Call await loadGameData() before using DATA.
 */
window.DATA = {};

async function loadGameData() {
    const files = ['cards', 'events', 'interrupts', 'intel', 'characters', 'dialogue', 'headlines', 'action-scenes', 'briefings', 'event-scenes', 'reactions', 'day-endings'];
    const results = await Promise.all(
        files.map(name =>
            fetch('data/' + name + '.json')
                .then(r => { if (!r.ok) throw new Error('Failed to load ' + name + '.json'); return r.json(); })
        )
    );
    files.forEach((name, i) => { window.DATA[name] = results[i]; });
}
