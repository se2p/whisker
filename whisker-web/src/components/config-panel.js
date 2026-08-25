const {$} = require('../web-libs');

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
            const card = e.currentTarget;
            this._selectAlgorithm(card.dataset.configPath, card);
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

        $(this.el).find('#whisker-search-config')
            .toggle(!isLearning);
        $(this.el).find('#whisker-learning-config')
            .toggle(isLearning);

        $('#bbt-toggles').toggle(!isLearning);

        if (isLearning) {
            const sel = this.el.querySelector('#whisker-learning-config .whisker-algo-select');
            if (sel) sel.value = defaultPath;
            this._populateLearningSettings(window._whiskerSelectedConfig, defaultPath);
        } else {
            this.el.querySelectorAll('.whisker-algo-card').forEach(card => {
                card.classList.toggle('whisker-algo-card--active', card.dataset.configPath === defaultPath);
            });
            this._populateGlobalSettings(window._whiskerSelectedConfig);
            this._populateAlgoSettings(window._whiskerSelectedConfig, defaultPath);
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
        $(this.el).find('#whisker-search-config')
            .toggle(!isLearning);
        $(this.el).find('#whisker-learning-config')
            .toggle(isLearning);

        if (isLearning) {
            const sel = this.el.querySelector('#whisker-learning-config .whisker-algo-select');
            if (sel) sel.value = matchedPath;
            this._populateLearningSettings(configStr, matchedPath);
        } else {
            this.el.querySelectorAll('.whisker-algo-card').forEach(card => {
                card.classList.toggle('whisker-algo-card--active', card.dataset.configPath === matchedPath);
            });
            this._populateGlobalSettings(configStr);
            this._populateAlgoSettings(configStr, matchedPath);
        }
    }

    // ── Search-based ──────────────────────────────────────────────────────────

    _selectAlgorithm(configPath, clickedCard) {
        this.el.querySelectorAll('.whisker-algo-card').forEach(c => c.classList.remove('whisker-algo-card--active'));
        clickedCard.classList.add('whisker-algo-card--active');
        window._whiskerSelectedConfig = window._whiskerConfigMap[configPath] || null;
        this._populateGlobalSettings(window._whiskerSelectedConfig);
        this._populateAlgoSettings(window._whiskerSelectedConfig, configPath);
    }

    _updateGlobalSetting(key, value, btn) {
        if (!window._whiskerSelectedConfig) return;
        const cfg = JSON.parse(window._whiskerSelectedConfig);
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
        window._whiskerSelectedConfig = JSON.stringify(cfg);
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
        if (!window._whiskerSelectedConfig) return;
        const cfg = JSON.parse(window._whiskerSelectedConfig);
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
        window._whiskerSelectedConfig = JSON.stringify(cfg);
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
        const extChecked = !!(cfg.localSearch && cfg.localSearch.some(s => s.type === 'Extension'));
        document.getElementById('cfg-local-search-extension').checked = extChecked;
        document.getElementById('cfg-ls-ext-prob').classList.toggle('whisker-disabled', !extChecked);
        document.getElementById('cfg-ls-ext-prob-val').disabled = !extChecked;
        const extEntry = cfg.localSearch && cfg.localSearch.find(s => s.type === 'Extension');
        if (extEntry) document.getElementById('cfg-ls-ext-prob-val').value = extEntry.probability;
        const redChecked = !!(cfg.localSearch && cfg.localSearch.some(s => s.type === 'Reduction'));
        document.getElementById('cfg-local-search-reduction').checked = redChecked;
        document.getElementById('cfg-ls-red-prob').classList.toggle('whisker-disabled', !redChecked);
        document.getElementById('cfg-ls-red-prob-val').disabled = !redChecked;
        const redEntry = cfg.localSearch && cfg.localSearch.find(s => s.type === 'Reduction');
        if (redEntry) document.getElementById('cfg-ls-red-prob-val').value = redEntry.probability;
    }

    // ── Learning-based ────────────────────────────────────────────────────────

    _selectLearningAlgorithm(select) {
        const configPath = select.value;
        window._whiskerSelectedConfig = window._whiskerConfigMap[configPath] || null;
        this._populateLearningSettings(window._whiskerSelectedConfig, configPath);
        const cfg = window._whiskerSelectedConfig ? JSON.parse(window._whiskerSelectedConfig) : {};
        const isDql = cfg.testGenerator === 'reinforcementLearning';
        const ntCard = document.querySelector('.network-topology-card');
        if (ntCard) ntCard.style.display = isDql ? 'none' : '';
        const snCard = document.querySelector('.species-networks-card');
        if (snCard) snCard.style.display = isDql ? 'none' : '';
        const spcCard = document.querySelector('.species-pop-chart-card');
        if (spcCard) spcCard.style.display = isDql ? 'none' : '';
    }

    _updateLearningSetting(key, value) {
        if (!window._whiskerSelectedConfig) return;
        const cfg = JSON.parse(window._whiskerSelectedConfig);
        const clamp01 = v => Math.min(1, Math.max(0, Number(v)));
        const clamp0 = v => Math.max(0, Number(v));
        const int = (v, min = 1) => {
            const n = Number(v); return (isNaN(n) || n < min) ? null : n;
        };
        const isDql = this._isDefined(cfg.stoppingCondition.conditions) === false;
        const mutationKeys = [
            'mutationAddConnection',
            'mutationAddNode',
            'mutateWeights',
            'mutateToggleEnableConnection'
        ];

        if (key === 'timeBudget') {
            const n = int(value);
            if (n === null) return;
            if (isDql) {
                cfg.stoppingCondition.duration = n * 1000;
            } else {
                cfg.stoppingCondition.conditions[1].duration = n * 1000;
            }
        } else if (key === 'populationSize') {
            const n = int(value); if (n !== null) cfg.populationSize = n;
        } else if (key === 'activationFunction') {
            if (cfg.chromosome) cfg.chromosome.activationFunction = value;
        } else if (key === 'numberOfSpecies') {
            const n = int(value); if (n !== null) cfg.numberOfSpecies = n;
        } else if (key === 'distanceThreshold') {
            const n = clamp0(value);
            if (!isNaN(n)) {
                if (!cfg.compatibility) cfg.compatibility = {};
                cfg.compatibility.distanceThreshold = n;
            }
        } else if (key === 'penalizingAge') {
            const n = int(value); if (n !== null) cfg.penalizingAge = n;
        } else if (key === 'switchObjectiveCount') {
            const n = int(value); if (n !== null) cfg.switchObjectiveCount = n;
        } else if (key === 'maxArchiveSize') {
            const n = int(value); if (n !== null) cfg.maxArchiveSize = n;
        } else if (key === 'randomSelectionProbability') {
            const n = clamp01(value); if (!isNaN(n)) cfg.randomSelectionProbability = n;
        } else if (key === 'learningRate') {
            const n = Number(value);
            if (!isNaN(n) && n > 0) {
                if (!cfg.training) cfg.training = {};
                cfg.training.learningRate = n;
            }
        } else if (key === 'batchSize') {
            const n = int(value);
            if (n !== null) {
                if (!cfg.training) cfg.training = {};
                cfg.training.batchSize = n;
            }
        } else if (key === 'gamma') {
            const n = clamp01(value);
            if (!isNaN(n)) {
                if (!cfg.reward) cfg.reward = {};
                cfg.reward.gamma = n;
            }
        } else if (key === 'epsilonEnd') {
            const n = clamp01(value);
            if (!isNaN(n)) {
                if (!cfg.epsilonGreedy) cfg.epsilonGreedy = {};
                cfg.epsilonGreedy.epsilonEnd = n;
            }
        } else if (key === 'parentsPerSpecies') {
            const n = clamp01(value); if (!isNaN(n)) cfg.parentsPerSpecies = n;
        } else if (key === 'ageSignificance') {
            const n = clamp0(value); if (!isNaN(n)) cfg.ageSignificance = n;
        } else if (key === 'distanceModifier') {
            const n = clamp0(value);
            if (!isNaN(n)) {
                if (!cfg.compatibility) cfg.compatibility = {};
                cfg.compatibility.distanceModifier = n;
            }
        } else if (key === 'disjointCoefficient') {
            const n = clamp0(value);
            if (!isNaN(n)) {
                if (!cfg.compatibility) cfg.compatibility = {};
                cfg.compatibility.disjointCoefficient = n;
            }
        } else if (key === 'excessCoefficient') {
            const n = clamp0(value);
            if (!isNaN(n)) {
                if (!cfg.compatibility) cfg.compatibility = {};
                cfg.compatibility.excessCoefficient = n;
            }
        } else if (key === 'weightCoefficient') {
            const n = clamp0(value);
            if (!isNaN(n)) {
                if (!cfg.compatibility) cfg.compatibility = {};
                cfg.compatibility.weightCoefficient = n;
            }
        } else if (mutationKeys.includes(key)) {
            const n = clamp01(value);
            if (!isNaN(n)) {
                if (!cfg.mutation) cfg.mutation = {};
                cfg.mutation[key] = n;
            }
        } else if (key === 'perturbationPower') {
            const n = clamp0(value);
            if (!isNaN(n)) {
                if (!cfg.mutation) cfg.mutation = {};
                cfg.mutation.perturbationPower = n;
            }
        } else if (key === 'crossoverWithoutMutation') {
            const n = clamp01(value);
            if (!isNaN(n)) {
                if (!cfg.crossover) cfg.crossover = {};
                cfg.crossover.crossoverWithoutMutation = n;
            }
        } else if (key === 'trainingEpochs') {
            const n = int(value);
            if (n !== null) {
                if (!cfg.training) cfg.training = {};
                cfg.training.epochs = n;
            }
        } else if (key === 'trainingFrequency') {
            const n = int(value);
            if (n !== null) {
                if (!cfg.training) cfg.training = {};
                cfg.training.frequency = n;
            }
        } else if (key === 'trainingOptimizer') {
            if (!cfg.training) cfg.training = {};
            cfg.training.optimizer = value;
        } else if (key === 'coverageTarget') {
            const learningIsDql = this._isDefined(cfg.stoppingCondition.conditions) === false;
            if (learningIsDql) {
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
        }
        window._whiskerSelectedConfig = JSON.stringify(cfg);
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
        if (this._isDefined(cfg.populationSize)) {
            document.getElementById('cfg-learning-populationSize').value = cfg.populationSize;
        }
        if (cfg.chromosome && cfg.chromosome.activationFunction) {
            document.getElementById('cfg-learning-activationFunction').value =
                cfg.chromosome.activationFunction;
        }
        if (this._isDefined(cfg.switchObjectiveCount)) {
            document.getElementById('cfg-learning-switchObjectiveCount').value =
                cfg.switchObjectiveCount;
        }
        if (this._isDefined(cfg.maxArchiveSize)) {
            document.getElementById('cfg-learning-maxArchiveSize').value = cfg.maxArchiveSize;
        }
        if (this._isDefined(cfg.randomSelectionProbability)) {
            document.getElementById('cfg-learning-randomSelectionProbability').value =
                cfg.randomSelectionProbability;
        }
        if (cfg.training) {
            if (this._isDefined(cfg.training.learningRate)) {
                document.getElementById('cfg-learning-learningRate').value = cfg.training.learningRate;
            }
            if (this._isDefined(cfg.training.batchSize)) {
                document.getElementById('cfg-learning-batchSize').value = cfg.training.batchSize;
            }
            if (this._isDefined(cfg.training.epochs)) {
                document.getElementById('cfg-learning-trainingEpochs').value = cfg.training.epochs;
            }
            if (this._isDefined(cfg.training.frequency)) {
                document.getElementById('cfg-learning-trainingFrequency').value = cfg.training.frequency;
            }
            if (cfg.training.optimizer) {
                document.getElementById('cfg-learning-trainingOptimizer').value = cfg.training.optimizer;
            }
        }
        if (cfg.network && cfg.network.hiddenLayers) {
            this._renderHiddenLayers(cfg.network.hiddenLayers);
        }
        if (cfg.reward && this._isDefined(cfg.reward.gamma)) {
            document.getElementById('cfg-learning-gamma').value = cfg.reward.gamma;
        }
        if (
            cfg.epsilonGreedy &&
            this._isDefined(cfg.epsilonGreedy.epsilonEnd)
        ) {
            document.getElementById('cfg-learning-epsilonEnd').value = cfg.epsilonGreedy.epsilonEnd;
        }
        if (cfg.mutation) {
            if (
                this._isDefined(cfg.mutation.mutationAddConnection)
            ) {
                document.getElementById('cfg-learning-mutationAddConnection').value =
                    cfg.mutation.mutationAddConnection;
            }
            if (this._isDefined(cfg.mutation.mutationAddNode)) {
                document.getElementById('cfg-learning-mutationAddNode').value = cfg.mutation.mutationAddNode;
            }
            if (this._isDefined(cfg.mutation.mutateWeights)) {
                document.getElementById('cfg-learning-mutateWeights').value = cfg.mutation.mutateWeights;
            }
            if (this._isDefined(cfg.mutation.perturbationPower)) {
                document.getElementById('cfg-learning-perturbationPower').value = cfg.mutation.perturbationPower;
            }
            if (
                this._isDefined(cfg.mutation.mutateToggleEnableConnection)
            ) {
                document.getElementById('cfg-learning-mutateToggleEnableConnection').value =
                    cfg.mutation.mutateToggleEnableConnection;
            }
        }
        if (
            cfg.crossover &&
            this._isDefined(cfg.crossover.crossoverWithoutMutation)
        ) {
            document.getElementById('cfg-learning-crossoverWithoutMutation').value =
                cfg.crossover.crossoverWithoutMutation;
        }
        if (this._isDefined(cfg.numberOfSpecies)) {
            document.getElementById('cfg-learning-numberOfSpecies').value = cfg.numberOfSpecies;
        }
        if (this._isDefined(cfg.parentsPerSpecies)) {
            document.getElementById('cfg-learning-parentsPerSpecies').value = cfg.parentsPerSpecies;
        }
        if (this._isDefined(cfg.ageSignificance)) {
            document.getElementById('cfg-learning-ageSignificance').value = cfg.ageSignificance;
        }
        if (this._isDefined(cfg.penalizingAge)) {
            document.getElementById('cfg-learning-penalizingAge').value = cfg.penalizingAge;
        }
        if (cfg.compatibility) {
            if (
                this._isDefined(cfg.compatibility.distanceThreshold)
            ) {
                document.getElementById('cfg-learning-distanceThreshold').value =
                    cfg.compatibility.distanceThreshold;
            }
            if (
                this._isDefined(cfg.compatibility.distanceModifier)
            ) {
                document.getElementById('cfg-learning-distanceModifier').value =
                    cfg.compatibility.distanceModifier;
            }
            if (
                this._isDefined(cfg.compatibility.disjointCoefficient)
            ) {
                document.getElementById('cfg-learning-disjointCoefficient').value =
                    cfg.compatibility.disjointCoefficient;
            }
            if (
                this._isDefined(cfg.compatibility.excessCoefficient)
            ) {
                document.getElementById('cfg-learning-excessCoefficient').value =
                    cfg.compatibility.excessCoefficient;
            }
            if (
                this._isDefined(cfg.compatibility.weightCoefficient)
            ) {
                document.getElementById('cfg-learning-weightCoefficient').value =
                    cfg.compatibility.weightCoefficient;
            }
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
