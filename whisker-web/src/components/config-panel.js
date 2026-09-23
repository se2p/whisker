const {$} = require('../web-libs');

// Shared numeric parsers for _updateLearningSetting()'s field table - module-level rather than redefined
// as closures on every call.
const clamp01 = v => Math.min(1, Math.max(0, Number(v)));
const clamp0 = v => Math.max(0, Number(v));
const toInt = (v, min = 1) => {
    const n = Number(v);
    return (isNaN(n) || n < min) ? null : n;
};

const _algoSettingsMap = {
    'config/mio.json': [
        'minimize', 'assertions', 'minimizeAssertions',
        'localSearchExtension', 'localSearchReduction'
    ],
    'config/mosa.json': [
        'minimize', 'assertions', 'minimizeAssertions',
        'localSearchExtension', 'localSearchReduction'
    ],
    'config/random.json': [],
    'config/oneplusone.json': ['minimize'],
    'config/randomSearch.json': ['minimize', 'assertions', 'minimizeAssertions']
};

const _dqlPath = 'config/ReinforcementLearning/dql.json';

const _allLearningSettings = [
    'populationSize', 'activationFunction', 'penalizingAge',
    'switchObjectiveCount', 'maxArchiveSize', 'randomSelectionProbability',
    'coverageTarget', 'groundTruth', 'searchOperators', 'speciation',
    'dqlTraining', 'hiddenLayers'
];

const _learningSettingsMap = {
    'config/Neuroevolution/neatest.json': [
        'populationSize', 'activationFunction', 'switchObjectiveCount',
        'coverageTarget', 'searchOperators', 'speciation', 'penalizingAge'
    ],
    'config/Neuroevolution/neatestBackprop.json': [
        'populationSize', 'activationFunction', 'switchObjectiveCount',
        'coverageTarget', 'groundTruth', 'searchOperators', 'speciation',
        'penalizingAge'
    ],
    'config/Neuroevolution/cosineNovelty.json': [
        'populationSize', 'activationFunction', 'switchObjectiveCount',
        'coverageTarget', 'searchOperators', 'speciation', 'penalizingAge'
    ],
    'config/Neuroevolution/eventNovelty.json': [
        'populationSize', 'activationFunction', 'switchObjectiveCount',
        'coverageTarget', 'searchOperators', 'speciation', 'penalizingAge'
    ],
    'config/Neuroevolution/random.json': [
        'populationSize', 'activationFunction', 'switchObjectiveCount',
        'coverageTarget', 'searchOperators', 'speciation', 'penalizingAge'
    ],
    'config/Neuroevolution/mio.json': [
        'activationFunction', 'maxArchiveSize', 'randomSelectionProbability',
        'coverageTarget', 'searchOperators', 'speciation'
    ],
    'config/Neuroevolution/mosa.json': [
        'populationSize', 'activationFunction', 'coverageTarget',
        'searchOperators', 'speciation'
    ],
    'config/Neuroevolution/newsd.json': [
        'populationSize', 'activationFunction', 'switchObjectiveCount',
        'coverageTarget', 'searchOperators', 'speciation'
    ],
    'config/Neuroevolution/score.json': [
        'populationSize', 'activationFunction', 'coverageTarget',
        'searchOperators', 'speciation', 'penalizingAge'
    ],
    'config/Neuroevolution/survive.json': [
        'populationSize', 'activationFunction', 'coverageTarget',
        'searchOperators', 'speciation', 'penalizingAge'
    ],
    'config/ReinforcementLearning/dql.json': [
        'coverageTarget', 'dqlTraining', 'hiddenLayers'
    ]
};

// Named validators for _LEARNING_FIELDS below - each returns the parsed/clamped value, or null if `value`
// doesn't pass (in which case the field is left untouched, same as the original per-key branches did).
const _learningFieldClampers = {
    int: v => toInt(v),
    prob: v => {
        const n = clamp01(v); return isNaN(n) ? null : n;
    },
    nonneg: v => {
        const n = clamp0(v); return isNaN(n) ? null : n;
    },
    positive: v => {
        const n = Number(v); return (!isNaN(n) && n > 0) ? n : null;
    },
    raw: v => v
};

// Declarative shape of every simple learning-config field: where it lives in the config object, and how its value is validated. `noCreate` mirrors the one field (activationFunction) whose parent object
// This single table drives both _applyLearningField() and _populateLearningField()
// `timeBudget`, `coverageTarget` (each need an isDql branch) and hiddenLayers/network (its own widget)
// aren't simple enough for this shape and stay hand-written in the two functions.
const _learningFields = {
    populationSize: {path: ['populationSize'], clamp: 'int'},
    activationFunction: {path: ['chromosome', 'activationFunction'], clamp: 'raw', noCreate: true, readCheck: 'truthy'},
    numberOfSpecies: {path: ['numberOfSpecies'], clamp: 'int'},
    distanceThreshold: {path: ['compatibility', 'distanceThreshold'], clamp: 'nonneg'},
    penalizingAge: {path: ['penalizingAge'], clamp: 'int'},
    switchObjectiveCount: {path: ['switchObjectiveCount'], clamp: 'int'},
    maxArchiveSize: {path: ['maxArchiveSize'], clamp: 'int'},
    randomSelectionProbability: {path: ['randomSelectionProbability'], clamp: 'prob'},
    learningRate: {path: ['training', 'learningRate'], clamp: 'positive'},
    batchSize: {path: ['training', 'batchSize'], clamp: 'int'},
    gamma: {path: ['reward', 'gamma'], clamp: 'prob'},
    epsilonEnd: {path: ['epsilonGreedy', 'epsilonEnd'], clamp: 'prob'},
    parentsPerSpecies: {path: ['parentsPerSpecies'], clamp: 'prob'},
    ageSignificance: {path: ['ageSignificance'], clamp: 'nonneg'},
    distanceModifier: {path: ['compatibility', 'distanceModifier'], clamp: 'nonneg'},
    disjointCoefficient: {path: ['compatibility', 'disjointCoefficient'], clamp: 'nonneg'},
    excessCoefficient: {path: ['compatibility', 'excessCoefficient'], clamp: 'nonneg'},
    weightCoefficient: {path: ['compatibility', 'weightCoefficient'], clamp: 'nonneg'},
    mutationAddConnection: {path: ['mutation', 'mutationAddConnection'], clamp: 'prob'},
    mutationAddNode: {path: ['mutation', 'mutationAddNode'], clamp: 'prob'},
    mutateWeights: {path: ['mutation', 'mutateWeights'], clamp: 'prob'},
    mutateToggleEnableConnection: {path: ['mutation', 'mutateToggleEnableConnection'], clamp: 'prob'},
    perturbationPower: {path: ['mutation', 'perturbationPower'], clamp: 'nonneg'},
    crossoverWithoutMutation: {path: ['crossover', 'crossoverWithoutMutation'], clamp: 'prob'},
    trainingEpochs: {path: ['training', 'epochs'], clamp: 'int'},
    trainingFrequency: {path: ['training', 'frequency'], clamp: 'int'},
    trainingOptimizer: {path: ['training', 'optimizer'], clamp: 'raw', readCheck: 'truthy'}
};

// Dashboard cards that only make sense for the learning-based algorithms.
const LEARNING_ONLY_CARDS = ['.network-topology-card', '.species-networks-card', '.species-pop-chart-card'];

class ConfigPanel {
    constructor(element) {
        this.el = element;
        window._whiskerSelectedConfig = null;
        this._initEventListeners();
    }

    _isDefined(value) {
        return value !== void 0 && value !== null;
    }

    _initEventListeners() {
        const el = this.el;

        // Algorithm card selection
        $(el).on('click', '.whisker-algo-card', e => {
            this._selectAlgorithm(e.currentTarget.dataset.configPath);
        });

        // Global settings inputs
        $(el).on('input', '#cfg-time-budget', e => {
            this._updateGlobalSetting('timeBudget', e.currentTarget.value);
        });
        $(el).on('input', '#cfg-max-events', e => {
            this._updateGlobalSetting('maxEvents', e.currentTarget.value);
        });

        // Coverage target buttons (search)
        $(el).on('click', '.whisker-coverage-btn[data-coverage-value]', e => {
            const btn = e.currentTarget;
            const isLearning = btn.id.startsWith('cfg-learning');
            if (isLearning) {
                this._updateLearningSetting('coverageTarget', btn.dataset.coverageValue);
            } else {
                this._updateGlobalSetting('coverageTarget', btn.dataset.coverageValue, btn);
            }
        });

        // Advanced config collapse toggles
        $(el).on('click', '.whisker-advanced-header', e => {
            this._toggleAdvancedConfig(e.currentTarget);
        });

        // Algo-specific checkboxes
        $(el).on('change', '#cfg-minimize', e => {
            this._updateAlgoSetting('minimize', e.currentTarget.checked);
        });
        $(el).on('change', '#cfg-assertions', e => {
            const checked = e.currentTarget.checked;
            this._updateAlgoSetting('assertions', checked);
            if (!checked) {
                this._updateAlgoSetting('minimizeAssertions', false);
                document.getElementById('cfg-minimizeAssertions').checked = false;
            }
            document.getElementById('cfg-row-minimizeAssertions').classList.toggle('whisker-disabled', !checked);
            document.getElementById('cfg-minimizeAssertions').disabled = !checked;
        });
        $(el).on('change', '#cfg-minimizeAssertions', e => {
            this._updateAlgoSetting('minimizeAssertions', e.currentTarget.checked);
        });
        $(el).on('change', '#cfg-local-search-extension', e => {
            const checked = e.currentTarget.checked;
            this._updateAlgoSetting('localSearchExtension', checked);
            document.getElementById('cfg-ls-ext-prob').classList.toggle('whisker-disabled', !checked);
            document.getElementById('cfg-ls-ext-prob-val').disabled = !checked;
        });
        $(el).on('input', '#cfg-ls-ext-prob-val', e => {
            this._updateAlgoSetting('localSearchExtensionProb', e.currentTarget.value);
        });
        $(el).on('change', '#cfg-local-search-reduction', e => {
            const checked = e.currentTarget.checked;
            this._updateAlgoSetting('localSearchReduction', checked);
            document.getElementById('cfg-ls-red-prob').classList.toggle('whisker-disabled', !checked);
            document.getElementById('cfg-ls-red-prob-val').disabled = !checked;
        });
        $(el).on('input', '#cfg-ls-red-prob-val', e => {
            this._updateAlgoSetting('localSearchReductionProb', e.currentTarget.value);
        });

        // Learning algorithm select
        $(el).on('change', '.whisker-algo-select', e => {
            this._selectLearningAlgorithm(e.currentTarget);
        });

        // Learning settings inputs (data-learning-key)
        $(el).on('input change', '[data-learning-key]', e => {
            this._updateLearningSetting(e.currentTarget.dataset.learningKey, e.currentTarget.value);
        });

        // Hidden layers
        $(el).on('click', '.whisker-add-layer-btn', () => this._addHiddenLayer());
        $(el).on('click', '.whisker-layer-remove-btn', e => {
            this._removeHiddenLayer(parseInt(e.currentTarget.dataset.layerIndex, 10));
        });
        $(el).on('input', '.whisker-hidden-layer-input', e => {
            this._updateHiddenLayer(parseInt(e.currentTarget.dataset.layerIndex, 10), e.currentTarget.value);
        });
    }

    // ── Tab / mode switching ──────────────────────────────────────────────────

    switchToMode(isLearning) {
        const defaultPath = isLearning ? 'config/Neuroevolution/neatest.json' : 'config/mio.json';
        window._whiskerSelectedConfig = window._whiskerConfigMap[defaultPath] || null;
        $('#bbt-toggles').toggle(!isLearning);
        this._activateConfigView(window._whiskerSelectedConfig, defaultPath, isLearning);
    }

    // Shows the search or learning panel per isLearning and populates it from configStr/path - shared by
    // switchToMode(), applyUploadedConfig() and _selectAlgorithm().
    _activateConfigView(configStr, path, isLearning) {
        $(this.el).find('#whisker-search-config')
            .toggle(!isLearning);
        $(this.el).find('#whisker-learning-config')
            .toggle(isLearning);
        for (const selector of LEARNING_ONLY_CARDS) {
            const card = document.querySelector(selector);
            if (card) card.style.display = isLearning ? '' : 'none';
        }
        if (isLearning) {
            const sel = this.el.querySelector('#whisker-learning-config .whisker-algo-select');
            if (sel) sel.value = path;
            this._populateLearningSettings(configStr, path);
        } else {
            this.el.querySelectorAll('.whisker-algo-card').forEach(card => {
                card.classList.toggle('whisker-algo-card--active', card.dataset.configPath === path);
            });
            this._populateGlobalSettings(configStr);
            this._populateAlgoSettings(configStr, path);
        }
    }

    // ── Config upload ─────────────────────────────────────────────────────────

    applyUploadedConfig(configStr, fileName) {
        window._whiskerSelectedConfig = configStr;
        let cfg;
        try {
            cfg = JSON.parse(configStr);
        } catch (e) {
            return;
        }

        let matchedPath = null;
        for (const path in window._whiskerConfigMap) {
            if (path.split('/').pop() === fileName) {
                try {
                    const stored = JSON.parse(window._whiskerConfigMap[path]);
                    if (stored.testGenerator === cfg.testGenerator) {
                        matchedPath = path; break;
                    }
                } catch (_e) { /* invalid JSON in config map, skip */ }
            }
        }
        if (!matchedPath) return;

        const isLearning = cfg.testGenerator === 'neuroevolution' || cfg.testGenerator === 'reinforcementLearning';

        document.getElementById('whisker-tab-search').classList.toggle('active', !isLearning);
        document.getElementById('whisker-tab-learning').classList.toggle('active', isLearning);
        this._activateConfigView(configStr, matchedPath, isLearning);
    }

    // ── Search-based ──────────────────────────────────────────────────────────

    _selectAlgorithm(configPath) {
        window._whiskerSelectedConfig = window._whiskerConfigMap[configPath] || null;
        this._activateConfigView(window._whiskerSelectedConfig, configPath, false);
    }

    // Reads the currently selected config, lets `mutate` change it, and writes it back - shared by every
    // _updateXSetting() method so each only has to say how it mutates, not how to read/guard/write.
    // No-op (mutate not called) if nothing is selected yet.
    _updateConfig(mutate) {
        if (!window._whiskerSelectedConfig) return;
        const cfg = JSON.parse(window._whiskerSelectedConfig);
        mutate(cfg);
        window._whiskerSelectedConfig = JSON.stringify(cfg);
    }

    _updateGlobalSetting(key, value, btn) {
        this._updateConfig(cfg => {
            if (key === 'timeBudget') {
                const num = Number(value);
                if (isNaN(num) || num < 1) return;
                cfg.stoppingCondition.conditions[0].duration = num * 1000;
            } else if (key === 'maxEvents') {
                const num = Number(value);
                if (isNaN(num) || num < 1) return;
                if ('maxLength' in cfg.chromosome) cfg.chromosome.maxLength = num;
                if ('maxSampleLength' in cfg.chromosome) cfg.chromosome.maxSampleLength = num;
            } else if (key === 'coverageTarget') {
                if (!cfg.fitnessFunction) cfg.fitnessFunction = {type: 'statement', targets: []};
                cfg.fitnessFunction.type = value;
                this.el.querySelectorAll('.whisker-coverage-btn').forEach(b => b.classList.remove('whisker-coverage-btn--active'));
                if (btn) btn.classList.add('whisker-coverage-btn--active');
            }
        });
    }

    _populateGlobalSettings(configStr) {
        if (!configStr) return;
        const cfg = JSON.parse(configStr);
        if (
            cfg.stoppingCondition &&
            cfg.stoppingCondition.conditions &&
            cfg.stoppingCondition.conditions[0]
        ) {
            document.getElementById('cfg-time-budget').value =
                cfg.stoppingCondition.conditions[0].duration / 1000;
        }
        if (cfg.chromosome) {
            const maxEvents = this._isDefined(cfg.chromosome.maxLength) ?
                cfg.chromosome.maxLength :
                cfg.chromosome.maxSampleLength;
            if (this._isDefined(maxEvents)) {
                document.getElementById('cfg-max-events').value = maxEvents;
            }
        }
        const coverageType = cfg.fitnessFunction && cfg.fitnessFunction.type;
        this.el.querySelectorAll('.whisker-coverage-btn').forEach(b => {
            b.classList.remove('whisker-coverage-btn--active');
        });
        const activeBtn = document.getElementById(
            `cfg-coverage-${coverageType || 'statement'}`
        );
        if (activeBtn) activeBtn.classList.add('whisker-coverage-btn--active');
    }

    _updateAlgoSetting(key, value) {
        this._updateConfig(cfg => {
            if (key === 'minimize' || key === 'assertions' || key === 'minimizeAssertions') {
                cfg[key] = value;
            } else if (key === 'localSearchExtension') {
                if (!cfg.localSearch) cfg.localSearch = [];
                const extIdx = cfg.localSearch.findIndex(s => s.type === 'Extension');
                if (value && extIdx === -1) {
                    cfg.localSearch.push({
                        type: 'Extension',
                        probability: 0.3,
                        newEventProbability: 0.5
                    });
                }
                if (!value && extIdx !== -1) cfg.localSearch.splice(extIdx, 1);
            } else if (key === 'localSearchReduction') {
                if (!cfg.localSearch) cfg.localSearch = [];
                const redIdx = cfg.localSearch.findIndex(s => s.type === 'Reduction');
                if (value && redIdx === -1) {
                    cfg.localSearch.push({type: 'Reduction', probability: 0.3});
                }
                if (!value && redIdx !== -1) cfg.localSearch.splice(redIdx, 1);
            } else if (key === 'localSearchExtensionProb') {
                const prob = Math.min(1, Math.max(0, Number(value)));
                if (isNaN(prob) || !cfg.localSearch) return;
                const entry = cfg.localSearch.find(s => s.type === 'Extension');
                if (entry) entry.probability = prob;
            } else if (key === 'localSearchReductionProb') {
                const prob = Math.min(1, Math.max(0, Number(value)));
                if (isNaN(prob) || !cfg.localSearch) return;
                const entry = cfg.localSearch.find(s => s.type === 'Reduction');
                if (entry) entry.probability = prob;
            }
        });
    }

    _populateAlgoSettings(configStr, configPath) {
        const allSettings = ['minimize', 'assertions', 'minimizeAssertions', 'localSearchExtension', 'localSearchReduction'];
        const active = _algoSettingsMap[configPath] || [];
        allSettings.forEach(s => {
            const row = document.getElementById(`cfg-row-${s}`);
            if (row) row.style.display = active.includes(s) ? '' : 'none';
        });
        if (!configStr) return;
        const cfg = JSON.parse(configStr);
        document.getElementById('cfg-minimize').checked = !!cfg.minimize;
        const assertionsChecked = !!cfg.assertions;
        document.getElementById('cfg-assertions').checked = assertionsChecked;
        document.getElementById('cfg-minimizeAssertions').checked = !!cfg.minimizeAssertions;
        document.getElementById('cfg-row-minimizeAssertions').classList.toggle('whisker-disabled', !assertionsChecked);
        document.getElementById('cfg-minimizeAssertions').disabled = !assertionsChecked;

        [
            {type: 'Extension', checkboxId: 'cfg-local-search-extension', rowId: 'cfg-ls-ext-prob', valId: 'cfg-ls-ext-prob-val'},
            {type: 'Reduction', checkboxId: 'cfg-local-search-reduction', rowId: 'cfg-ls-red-prob', valId: 'cfg-ls-red-prob-val'}
        ].forEach(({type, checkboxId, rowId, valId}) => {
            const checked = !!(cfg.localSearch && cfg.localSearch.some(s => s.type === type));
            document.getElementById(checkboxId).checked = checked;
            document.getElementById(rowId).classList.toggle('whisker-disabled', !checked);
            document.getElementById(valId).disabled = !checked;
            const entry = cfg.localSearch && cfg.localSearch.find(s => s.type === type);
            if (entry) document.getElementById(valId).value = entry.probability;
        });
    }

    // ── Learning-based ────────────────────────────────────────────────────────

    _selectLearningAlgorithm(select) {
        const configPath = select.value;
        window._whiskerSelectedConfig = window._whiskerConfigMap[configPath] || null;
        this._populateLearningSettings(window._whiskerSelectedConfig, configPath);
        const cfg = window._whiskerSelectedConfig ? JSON.parse(window._whiskerSelectedConfig) : {};
        const isDql = cfg.testGenerator === 'reinforcementLearning';
        ['.network-topology-card', '.species-networks-card', '.species-pop-chart-card'].forEach(selector => {
            const card = document.querySelector(selector);
            if (card) card.style.display = isDql ? 'none' : '';
        });
    }

    // Writes value into cfg at the field's path (creating parents unless noCreate), per _learningFields.
    // No-ops if the key isn't a table field or the value doesn't validate. Returns whether it was a field.
    _applyLearningField(cfg, key, value) {
        const field = _learningFields[key];
        if (!field) return false;
        const clamped = _learningFieldClampers[field.clamp](value);
        if (clamped === null) return true;
        let target = cfg;
        for (let i = 0; i < field.path.length - 1; i++) {
            const segment = field.path[i];
            if (!target[segment]) {
                if (field.noCreate) return true;
                target[segment] = {};
            }
            target = target[segment];
        }
        target[field.path[field.path.length - 1]] = clamped;
        return true;
    }

    // Reads the field's value out of cfg and, if it passes readCheck, sets it on its input/select.
    _populateLearningField(cfg, key) {
        const field = _learningFields[key];
        if (!field) return;
        let target = cfg;
        for (let i = 0; i < field.path.length - 1 && target; i++) {
            target = target[field.path[i]];
        }
        let value;
        if (target) value = target[field.path[field.path.length - 1]];
        const ok = field.readCheck === 'truthy' ? !!value : this._isDefined(value);
        if (!ok) return;
        const el = document.getElementById(`cfg-learning-${key}`);
        if (el) el.value = value;
    }

    _updateLearningSetting(key, value) {
        this._updateConfig(cfg => {
            const isDql = this._isDefined(cfg.stoppingCondition.conditions) === false;
            if (key === 'timeBudget') {
                const n = toInt(value);
                if (n === null) return;
                if (isDql) {
                    cfg.stoppingCondition.duration = n * 1000;
                } else {
                    cfg.stoppingCondition.conditions[1].duration = n * 1000;
                }
            } else if (key === 'coverageTarget') {
                if (isDql) {
                    if (!cfg.coverageObjective) cfg.coverageObjective = {};
                    cfg.coverageObjective.type = value;
                } else {
                    if (!cfg.fitnessFunction) cfg.fitnessFunction = {};
                    cfg.fitnessFunction.type = value;
                }
                document.getElementById('cfg-learning-coverage-statement')
                    .classList.toggle('whisker-coverage-btn--active', value === 'statement');
                document.getElementById('cfg-learning-coverage-branch')
                    .classList.toggle('whisker-coverage-btn--active', value === 'branch');
            } else {
                this._applyLearningField(cfg, key, value);
            }
        });
    }

    _populateLearningSettings(configStr, configPath) {
        const active = _learningSettingsMap[configPath] || [];
        _allLearningSettings.forEach(key => {
            const group = document.getElementById(`cfg-learning-${key}-group`);
            if (group) group.style.display = active.includes(key) ? '' : 'none';
        });
        if (!configStr) return;
        const cfg = JSON.parse(configStr);
        const isDql = configPath === _dqlPath;

        const durationMs = isDql ? cfg.stoppingCondition.duration : cfg.stoppingCondition.conditions[1].duration;
        document.getElementById('cfg-learning-timeBudget').value = durationMs / 1000;

        Object.keys(_learningFields).forEach(key => this._populateLearningField(cfg, key));

        if (cfg.network && cfg.network.hiddenLayers) {
            this._renderHiddenLayers(cfg.network.hiddenLayers);
        }

        const coverageType = isDql ?
            (cfg.coverageObjective && cfg.coverageObjective.type) :
            (cfg.fitnessFunction && cfg.fitnessFunction.type);
        if (coverageType) {
            document.getElementById('cfg-learning-coverage-statement')
                .classList.toggle('whisker-coverage-btn--active', coverageType === 'statement');
            document.getElementById('cfg-learning-coverage-branch')
                .classList.toggle('whisker-coverage-btn--active', coverageType === 'branch');
        }
    }

    // ── Hidden layers ─────────────────────────────────────────────────────────

    _renderHiddenLayers(layers) {
        const container = document.getElementById('cfg-learning-hiddenLayers-container');
        if (!container) return;
        container.innerHTML = '';
        layers.forEach((size, i) => {
            const row = document.createElement('div');
            row.className = 'whisker-hidden-layer-row';
            const label = document.createElement('span');
            label.className = 'whisker-layer-label';
            label.textContent = `Layer ${i + 1}`;
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'whisker-setting-input whisker-hidden-layer-input';
            input.value = size;
            input.min = 1;
            input.step = 1;
            input.dataset.layerIndex = i;
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'whisker-layer-remove-btn';
            removeBtn.innerHTML = '<i class="fas fa-minus"></i>';
            removeBtn.dataset.layerIndex = i;
            if (layers.length === 1) {
                removeBtn.disabled = true;
                removeBtn.style.opacity = '0.3';
                removeBtn.style.cursor = 'not-allowed';
            }
            row.appendChild(label);
            row.appendChild(input);
            row.appendChild(removeBtn);
            container.appendChild(row);
        });
    }

    _addHiddenLayer() {
        if (!window._whiskerSelectedConfig) return;
        const cfg = JSON.parse(window._whiskerSelectedConfig);
        if (!cfg.network) cfg.network = {};
        if (!cfg.network.hiddenLayers) cfg.network.hiddenLayers = [];
        cfg.network.hiddenLayers.push(64);
        window._whiskerSelectedConfig = JSON.stringify(cfg);
        this._renderHiddenLayers(cfg.network.hiddenLayers);
    }

    _removeHiddenLayer(index) {
        if (!window._whiskerSelectedConfig) return;
        const cfg = JSON.parse(window._whiskerSelectedConfig);
        if (!cfg.network || !cfg.network.hiddenLayers || cfg.network.hiddenLayers.length <= 1) return;
        cfg.network.hiddenLayers.splice(index, 1);
        window._whiskerSelectedConfig = JSON.stringify(cfg);
        this._renderHiddenLayers(cfg.network.hiddenLayers);
    }

    _updateHiddenLayer(index, value) {
        if (!window._whiskerSelectedConfig) return;
        const num = Number(value);
        if (isNaN(num) || num < 1) return;
        const cfg = JSON.parse(window._whiskerSelectedConfig);
        if (!cfg.network || !cfg.network.hiddenLayers) return;
        cfg.network.hiddenLayers[index] = num;
        window._whiskerSelectedConfig = JSON.stringify(cfg);
    }

    _toggleAdvancedConfig(btn) {
        const body = btn.nextElementSibling;
        const isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : '';
        btn.classList.toggle('whisker-advanced-header--open', !isOpen);
    }
}

module.exports = ConfigPanel;
