// ==UserScript==
// @name         Ikariam Resource and Army Grid
// @namespace    Kronos
// @version      2.3 (buildings: correct upgrade target + RTL support)
// @description  Enhanced multi-city tracking with buildings overview – shows total current → total target for upgrades (fixed)
// @author       Kronos
// @match        *://*.ikariam.gameforge.com/*
// @grant        GM_addStyle
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @downloadURL  https://raw.githubusercontent.com/Hayato500/IkaGrid/refs/heads/main/Ikariam%20Resource%20and%20Army%20Grid.js
// @updateURL    https://raw.githubusercontent.com/Hayato500/IkaGrid/refs/heads/main/Ikariam%20Resource%20and%20Army%20Grid.js
// ==/UserScript==

(() => {
    'use strict';

    const BASE_URL = 'https://raw.githubusercontent.com/Hayato500/IkaGrid/main';

    const Constants = {
        STORAGE_KEYS: {
            DATA: 'ikariamResourceGrid',
            POSITION: 'ikariamResourceGridPosition',
            MINIMIZED: 'ikariamResourceGridMinimized',
            VIEW: 'ikariamResourceGridView'
        },
        IMAGE_PATHS: {
            BUTTONS: {
                MINIMIZE: `${BASE_URL}/Buttons/Minimize.png`,
                MAXIMIZE: `${BASE_URL}/Buttons/Maximize.png`,
                SELECTED: `${BASE_URL}/Buttons/Button_Standard_Selected.png`,
                DESELECTED: `${BASE_URL}/Buttons/Button_Standard_Deselected.png`
            },
            RESOURCES: {
                WOOD: `${BASE_URL}/Resources/icon_wood.png`,
                WINE: `${BASE_URL}/Resources/icon_wine.png`,
                MARBLE: `${BASE_URL}/Resources/icon_marble.png`,
                CRYSTAL: `${BASE_URL}/Resources/icon_glass.png`,
                SULFUR: `${BASE_URL}/Resources/icon_sulfur.png`
            },
            UNITS: `${BASE_URL}/Units/`,
            BUILDINGS: `${BASE_URL}/Buildings/`,
            BACKGROUNDS: {
                MAIN: `${BASE_URL}/Border/`,
                COPYRIGHT: `${BASE_URL}/Border/copyright.png`
            }
        },
        RESOURCE_TYPES: ['Wood', 'Wine', 'Marble', 'Crystal', 'Sulfur'],
        UNIT_MAPPING: {
            's303': 'Hoplite',
            's308': 'Steam Giant',
            's315': 'Spearman',
            's302': 'Swordsman',
            's301': 'Slinger',
            's313': 'Archer',
            's304': 'Sulphur Carabineer',
            's307': 'Ram',
            's306': 'Catapult',
            's305': 'Mortar',
            's312': 'Gyrocopter',
            's309': 'Balloon-Bombardier',
            's310': 'Cook',
            's311': 'Doctor',
            's319': 'Spartan',
            's211': 'Fire Ship',
            's216': 'Steam Ram',
            's210': 'Ram Ship',
            's213': 'Ballista Ship',
            's214': 'Catapult Ship',
            's215': 'Mortar Ship',
            's217': 'Rocket Ship',
            's212': 'Diving Boat',
            's218': 'Paddle Speedboat',
            's219': 'Balloon Carrier',
            's220': 'Tender'
        },
        BUILDINGS: [
            { id: 'townHall', name: 'Town Hall', icon: 'townHall.jpg' },
            { id: 'academy', name: 'Academy', icon: 'academy.jpg' },
            { id: 'warehouse', name: 'Warehouse', icon: 'warehouse.jpg' },
            { id: 'tavern', name: 'Tavern', icon: 'tavern.jpg' },
            { id: 'palace', name: 'Palace', icon: 'palace.jpg' },
            { id: 'palaceColony', name: "Governor's Residence", icon: 'palaceColony.jpg' },
            { id: 'museum', name: 'Museum', icon: 'museum.jpg' },
            { id: 'port', name: 'Port', icon: 'port.jpg' },
            { id: 'shipyard', name: 'Shipyard', icon: 'shipyard.jpg' },
            { id: 'barracks', name: 'Barracks', icon: 'barracks.jpg' },
            { id: 'wall', name: 'Wall', icon: 'wall.jpg' },
            { id: 'embassy', name: 'Embassy', icon: 'embassy.jpg' },
            { id: 'branchOffice', name: 'Branch Office', icon: 'branchOffice.jpg' },
            { id: 'workshop', name: 'Workshop', icon: 'workshop.jpg' },
            { id: 'safehouse', name: 'Safehouse', icon: 'safehouse.jpg' },
            { id: 'forester', name: 'Forester', icon: 'forester.jpg' },
            { id: 'glassblowing', name: 'Glassblowing', icon: 'glassblowing.jpg' },
            { id: 'alchemist', name: 'Alchemist', icon: 'alchemist.jpg' },
            { id: 'winegrower', name: 'Winegrower', icon: 'winegrower.jpg' },
            { id: 'stonemason', name: 'Stonemason', icon: 'stonemason.jpg' },
            { id: 'carpentering', name: 'Carpentering', icon: 'carpentering.jpg' },
            { id: 'optician', name: 'Optician', icon: 'optician.jpg' },
            { id: 'fireworker', name: 'Fireworker', icon: 'fireworker.jpg' },
            { id: 'vineyard', name: 'Vineyard', icon: 'vineyard.jpg' },
            { id: 'architect', name: 'Architect', icon: 'architect.jpg' },
            { id: 'temple', name: 'Temple', icon: 'temple.jpg' },
            { id: 'dump', name: 'Dump', icon: 'dump.jpg' },
            { id: 'pirateFortress', name: 'Pirate Fortress', icon: 'pirateFortress.jpg' },
            { id: 'blackMarket', name: 'Black Market', icon: 'blackMarket.jpg' },
            { id: 'marineChartArchive', name: 'Marine Chart Archive', icon: 'marineChartArchive.jpg' },
            { id: 'dockyard', name: 'Dockyard', icon: 'dockyard.jpg' },
            { id: 'shrineOfOlympus', name: 'Shrine of Olympus', icon: 'shrineOfOlympus.jpg' },
            { id: 'chronosForge', name: 'Chronos Forge', icon: 'chronosForge.jpg' }
        ]
    };

    class DataManager {
        static load() {
            let savedData = { resources: {}, army: {}, buildings: {} };
            let position = { top: 50, left: 50 };
            let isMinimized = false;
            let currentView = 'resources';

            try {
                const saved = localStorage.getItem(Constants.STORAGE_KEYS.DATA);
                if (saved) savedData = JSON.parse(saved);
                if (savedData.buildings) {
                    for (const city in savedData.buildings) {
                        const cityBuildings = savedData.buildings[city];
                        for (const name in cityBuildings) {
                            const entry = cityBuildings[name];
                            if (typeof entry === 'number') {
                                cityBuildings[name] = {
                                    currentLevel: entry,
                                    targetLevel: null,
                                    upgrading: false
                                };
                            } else if (entry && typeof entry === 'object' && entry.level !== undefined && entry.upgrading !== undefined && entry.currentLevel === undefined) {
                                if (entry.upgrading) {
                                    cityBuildings[name] = {
                                        currentLevel: Math.max(0, entry.level - 1),
                                        targetLevel: entry.level,
                                        upgrading: true
                                    };
                                } else {
                                    cityBuildings[name] = {
                                        currentLevel: entry.level,
                                        targetLevel: null,
                                        upgrading: false
                                    };
                                }
                            } else if (!entry || entry.currentLevel === undefined) {
                                cityBuildings[name] = {
                                    currentLevel: 0,
                                    targetLevel: null,
                                    upgrading: false
                                };
                            }
                        }
                    }
                } else {
                    savedData.buildings = {};
                }
            } catch (e) { console.error('Failed to load data:', e); }

            try {
                const pos = localStorage.getItem(Constants.STORAGE_KEYS.POSITION);
                if (pos) position = JSON.parse(pos);
            } catch (e) { console.error('Failed to load position:', e); }

            try {
                const min = localStorage.getItem(Constants.STORAGE_KEYS.MINIMIZED);
                if (min !== null) isMinimized = JSON.parse(min);
            } catch (e) { console.error('Failed to load minimized:', e); }

            try {
                const view = localStorage.getItem(Constants.STORAGE_KEYS.VIEW);
                if (view) currentView = view;
            } catch (e) { console.error('Failed to load view:', e); }

            return { savedData, position, isMinimized, currentView };
        }

        static save(data) {
            try {
                localStorage.setItem(Constants.STORAGE_KEYS.DATA, JSON.stringify(data.savedData));
                localStorage.setItem(Constants.STORAGE_KEYS.POSITION, JSON.stringify(data.position));
                localStorage.setItem(Constants.STORAGE_KEYS.MINIMIZED, JSON.stringify(data.isMinimized));
                localStorage.setItem(Constants.STORAGE_KEYS.VIEW, data.currentView);
            } catch (error) {
                console.error('Failed to save data:', error);
            }
        }
    }

    class CityManager {
        static getCurrentCityName() {
            const el = document.querySelector('#js_cityBread.white');
            return el ? el.textContent.trim() : 'Unknown City';
        }

        static getAllCities() {
            try {
                return Object.values(dataSetForView.relatedCityData)
                    .filter(city => city?.name)
                    .map(city => city.name);
            } catch {
                return [this.getCurrentCityName()];
            }
        }

        static parseNumber(text) {
            return parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
        }

        static getCurrentResources() {
            const resources = {};
            for (const resource of Constants.RESOURCE_TYPES) {
                const id = resource.toLowerCase();
                const totalEl = document.querySelector(`#js_GlobalMenu_${id}_Total`);
                if (totalEl) {
                    resources[resource] = this.parseNumber(totalEl.textContent);
                } else {
                    const singleEl = document.querySelector(`#js_GlobalMenu_${id}`);
                    resources[resource] = singleEl ? this.parseNumber(singleEl.textContent) : 0;
                }
            }
            return resources;
        }

        static getCurrentArmy() {
            const army = {};
            for (const unit of Object.values(Constants.UNIT_MAPPING)) {
                army[unit] = 0;
            }

            const tables = document.querySelectorAll('table.militaryList');
            for (const table of tables) {
                const headers = table.querySelectorAll('th');
                const countRow = table.querySelector('tr.count');
                if (!headers.length || !countRow) continue;

                const countCells = countRow.querySelectorAll('td');
                for (let i = 0; i < headers.length; i++) {
                    const header = headers[i];
                    const unitDiv = header.querySelector('div[class^="army"], div[class^="fleet"]');
                    if (unitDiv) {
                        const classCode = unitDiv.className.split(' ')[1];
                        const unitName = Constants.UNIT_MAPPING[classCode];
                        if (unitName && countCells[i]) {
                            army[unitName] = this.parseNumber(countCells[i].textContent);
                        }
                    }
                }
            }
            return army;
        }

        /**
         * Returns raw data from DOM:
         *   completedSum: sum of levels of all finished buildings of this type
         *   upgrading: true if a construction site exists for this type
         *   targetLevel: the level shown in the construction site's tooltip (may be current or target)
         */
        static getCurrentBuildingsRaw() {
            const raw = {};
            for (const b of Constants.BUILDINGS) {
                raw[b.name] = { completedSum: 0, upgrading: false, targetLevel: null };
            }

            if (document.body.id !== 'city') return raw;

            const positionDivs = document.querySelectorAll('[id^="position"]:not(.invisible)');
            for (const div of positionDivs) {
                const classList = div.className.split(' ');
                const isConstruction = classList.includes('constructionSite');
                let buildingDef = null;
                let level = 0;

                if (isConstruction) {
                    const link = div.querySelector('a.hoverable');
                    if (!link) continue;
                    const href = link.getAttribute('href');
                    const match = href.match(/[?&]view=([^&]+)/);
                    if (!match) continue;
                    const view = match[1];
                    buildingDef = Constants.BUILDINGS.find(b => b.id === view);
                    if (!buildingDef) continue;
                    const title = link.getAttribute('title');
                    const levelMatch = title.match(/\((\d+)\)/);
                    level = levelMatch ? parseInt(levelMatch[1], 10) : 0;
                } else {
                    const buildingIndex = classList.indexOf('building');
                    if (buildingIndex === -1) continue;
                    const buildingClass = classList[buildingIndex + 1];
                    buildingDef = Constants.BUILDINGS.find(b => b.id === buildingClass);
                    if (!buildingDef) continue;
                    const levelClass = classList.find(cls => cls.startsWith('level'));
                    if (!levelClass) continue;
                    level = parseInt(levelClass.replace('level', ''), 10) || 0;
                }

                if (buildingDef) {
                    const name = buildingDef.name;
                    if (isConstruction) {
                        raw[name].upgrading = true;
                        // Store the level as read from the tooltip
                        raw[name].targetLevel = level;
                    } else {
                        raw[name].completedSum += level;
                    }
                }
            }
            return raw;
        }

        static async changeCity(cityName, dataSet) {
            const cityInfo = Object.values(dataSet.relatedCityData).find(city => city.name === cityName);
            if (!cityInfo?.id) {
                console.warn(`City "${cityName}" not found`);
                return;
            }

            const postData = new URLSearchParams({
                action: 'header',
                function: 'changeCurrentCity',
                actionRequest: dataSet.actionRequest,
                cityId: cityInfo.id,
                ajax: 1
            });

            try {
                const response = await fetch('/index.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'include',
                    body: postData
                });
                if (response.ok) {
                    window.location.reload();
                } else {
                    console.error('City change failed:', response.status);
                }
            } catch (error) {
                console.error('Fetch error during city change:', error);
            }
        }
    }

    class GridUI {
        constructor(data) {
            this.data = data;
            this.grid = this.createGridElement();
            this.table = null;
            this.buttons = null;
            this.initializeGrid();
        }

        createGridElement() {
            const grid = document.createElement('div');
            grid.id = 'resourceGrid';
            grid.style.cssText = `
                position: fixed;
                top: ${this.data.position.top}px;
                left: ${this.data.position.left}px;
                z-index: 9999;
            `;
            document.body.appendChild(grid);
            return grid;
        }

        initializeGrid() {
            this.addHeaderElements();
            this.addViewButtons();
            this.addCopyright();
            this.applyStyles();
            this.update();
            if (this.data.isMinimized) this.grid.classList.add('minimized');
        }

        addHeaderElements() {
            const toggleButton = document.createElement('img');
            toggleButton.id = 'toggleButton';
            toggleButton.src = this.data.isMinimized
                ? Constants.IMAGE_PATHS.BUTTONS.MAXIMIZE
                : Constants.IMAGE_PATHS.BUTTONS.MINIMIZE;
            toggleButton.style.cssText = this.data.isMinimized
                ? 'position: absolute; top: 2px; left: 2px; width: 25px; height: 25px; cursor: move; z-index: 10000;'
                : 'position: absolute; top: 25px; left: 50px; width: 25px; height: 25px; cursor: pointer; z-index: 10000;';
            toggleButton.alt = 'Toggle minimize/maximize';
            toggleButton.onclick = () => this.toggleMinimized();
            this.grid.appendChild(toggleButton);
        }

        toggleMinimized() {
            this.grid.classList.toggle('minimized');
            this.data.isMinimized = !this.data.isMinimized;
            const toggleButton = this.grid.querySelector('#toggleButton');
            toggleButton.src = this.data.isMinimized
                ? Constants.IMAGE_PATHS.BUTTONS.MAXIMIZE
                : Constants.IMAGE_PATHS.BUTTONS.MINIMIZE;
            toggleButton.style.cssText = this.data.isMinimized
                ? 'position: absolute; top: 2px; left: 2px; width: 25px; height: 25px; cursor: move; z-index: 10000;'
                : 'position: absolute; top: 25px; left: 50px; width: 25px; height: 25px; cursor: pointer; z-index: 10000;';
            DataManager.save(this.data);
        }

        addViewButtons() {
            this.buttons = ['Resources', 'Army', 'Buildings'].map((label, i) => {
                const button = document.createElement('button');
                button.textContent = label;
                button.style.cssText = `
                    position: absolute;
                    top: 25px;
                    left: ${85 + (i * 135)}px;
                    width: 130px;
                    height: 26px;
                    padding: 0;
                `;
                button.className = label.toLowerCase() === this.data.currentView ? 'selected' : 'deselected';
                button.onclick = () => this.changeView(label.toLowerCase());
                button.setAttribute('aria-label', `Switch to ${label} view`);
                this.grid.appendChild(button);
                return button;
            });
        }

        changeView(newView) {
            if (newView === this.data.currentView) return;
            this.data.currentView = newView;
            DataManager.save(this.data);
            this.update();
        }

        addCopyright() {
            const copyright = document.createElement('div');
            copyright.id = 'resourceGridCopyright';
            copyright.className = 'copyright';
            copyright.innerHTML = '<span>By Kronos</span>';
            this.grid.appendChild(copyright);
        }

        applyStyles() {
            GM_addStyle(`
                #resourceGrid {
                    background:
                        url('${Constants.IMAGE_PATHS.BACKGROUNDS.MAIN}bg_head_left.png') left top no-repeat,
                        url('${Constants.IMAGE_PATHS.BACKGROUNDS.MAIN}bg_head_right.png') right top no-repeat,
                        url('${Constants.IMAGE_PATHS.BACKGROUNDS.MAIN}bg_head.png') left 50px top 0 repeat-x,
                        url('${Constants.IMAGE_PATHS.BACKGROUNDS.MAIN}bg_footer_l.png') left bottom 0 no-repeat,
                        url('${Constants.IMAGE_PATHS.BACKGROUNDS.MAIN}bg_footer_r.png') right -2px bottom 0 no-repeat,
                        url('${Constants.IMAGE_PATHS.BACKGROUNDS.MAIN}bg_footer_pat.png') left bottom 0 repeat-x,
                        url('${Constants.IMAGE_PATHS.BACKGROUNDS.MAIN}bg_body_left.png') left 10px top 55px repeat-y,
                        url('${Constants.IMAGE_PATHS.BACKGROUNDS.MAIN}bg_body_right.png') right 8px top 55px repeat-y,
                        #fcdbaa;
                    padding: 35px 40px 50px 40px;
                    min-width: 600px;
                    border: none !important;
                    box-shadow: 3px 3px 10px rgba(0,0,0,0.5);
                    cursor: move;
                }
                #resourceGrid.minimized {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    width: 25px !important;
                    height: 25px !important;
                    cursor: default !important;
                }
                #resourceGrid.minimized > *:not(#toggleButton) {
                    visibility: hidden !important;
                    opacity: 0 !important;
                }
                #resourceGrid.minimized #toggleButton {
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                #resourceGrid table {
                    border-collapse: separate;
                    border-spacing: 0;
                    margin-top: 35px;
                    background-color: #fcdbaa;
                    width: 100%;
                }
                #resourceGrid th, #resourceGrid td {
                    border: 1px solid #d1b263 !important;
                    padding: 4px;
                    text-align: center;
                    background-color: #f8f8f8;
                    font-weight: bold !important;
                }
                #resourceGrid th {
                    background-color: #e0a050;
                    padding: 8px;
                    border-bottom: 2px solid #a08040 !important;
                }
                #resourceGrid tr:hover td {
                    background-color: #f8e8c0 !important;
                    cursor: pointer;
                }
                button.selected {
                    background: url(${Constants.IMAGE_PATHS.BUTTONS.SELECTED}) no-repeat !important;
                    background-size: 100% 100% !important;
                    border: none !important;
                    color: black !important;
                    font-weight: bold !important;
                    font-family: Arial, sans-serif !important;
                }
                button.deselected {
                    background: url(${Constants.IMAGE_PATHS.BUTTONS.DESELECTED}) no-repeat !important;
                    background-size: 100% 100% !important;
                    border: none !important;
                    color: black !important;
                    font-weight: bold !important;
                    font-family: Arial, sans-serif !important;
                }
                #resourceGridCopyright.copyright {
                    background: url(${Constants.IMAGE_PATHS.BACKGROUNDS.COPYRIGHT}) no-repeat center;
                    width: 200px;
                    height: 40px;
                    position: absolute;
                    bottom: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                }
                #resourceGridCopyright.copyright span {
                    font-size: 12px !important;
                    display: block !important;
                    color: white !important;
                    font-weight: bold !important;
                    text-align: center;
                    padding-top: 12px;
                    text-shadow: 1px 1px 2px black;
                }
                .unit-icon, .building-icon {
                    width: 30px !important;
                    height: 30px !important;
                    object-fit: contain;
                }
                .upgrading {
                    color: #00aa00 !important;
                    font-weight: bold;
                }
                .upgrading-arrow {
                    font-weight: bold;
                    margin: 0 2px;
                }
            `);
        }

        update() {
            if (this.data.currentView === 'resources') {
                this.buildResourceTable();
            } else if (this.data.currentView === 'army') {
                this.buildArmyTable();
            } else if (this.data.currentView === 'buildings') {
                this.buildBuildingsTable();
            }
            this.updateButtonStates();
        }

        buildResourceTable() {
            const cities = CityManager.getAllCities();
            let table = this.grid.querySelector('table');
            if (!table) {
                table = document.createElement('table');
                this.grid.appendChild(table);
            }
            table.innerHTML = '';

            const resourceTypes = Constants.RESOURCE_TYPES;
            const headerRow = table.insertRow();
            headerRow.className = 'table-header';
            headerRow.insertCell().textContent = 'City';

            for (const resource of resourceTypes) {
                const cell = headerRow.insertCell();
                cell.innerHTML = `<img src="${Constants.IMAGE_PATHS.RESOURCES[resource.toUpperCase()]}" alt="${resource}" width="20" height="20">`;
            }

            const totals = { Wood:0, Wine:0, Marble:0, Crystal:0, Sulfur:0 };

            for (const city of cities) {
                const row = table.insertRow();
                row.className = 'data-row';
                const cityCell = row.insertCell();
                const isCurrent = city === CityManager.getCurrentCityName();

                const cityLink = document.createElement('span');
                cityLink.textContent = isCurrent ? `${city} ★` : city;
                cityLink.style.cssText = 'cursor: pointer; text-decoration: underline;';
                cityLink.onclick = () => CityManager.changeCity(city.replace(' ★', ''), dataSetForView);
                cityCell.appendChild(cityLink);

                for (const resource of resourceTypes) {
                    const value = this.data.savedData.resources[city]?.[resource] || 0;
                    const cell = row.insertCell();
                    cell.textContent = value.toLocaleString();
                    totals[resource] += value;
                }
            }

            const totalRow = table.insertRow();
            totalRow.className = 'total-row';
            totalRow.insertCell().textContent = 'Total';
            for (const resource of resourceTypes) {
                totalRow.insertCell().textContent = totals[resource].toLocaleString();
            }
        }

        buildArmyTable() {
            const cities = CityManager.getAllCities();
            const units = Object.values(Constants.UNIT_MAPPING);
            let table = this.grid.querySelector('table');
            if (!table) {
                table = document.createElement('table');
                this.grid.appendChild(table);
            }
            table.innerHTML = '';

            const headerRow = table.insertRow();
            headerRow.className = 'table-header';
            headerRow.insertCell().textContent = 'City';

            for (const unit of units) {
                const cell = headerRow.insertCell();
                cell.innerHTML = `<img src="${Constants.IMAGE_PATHS.UNITS}${unit.replace(/ /g, '_')}.png" class="unit-icon" alt="${unit}">`;
            }

            const totals = {};
            for (const unit of units) totals[unit] = 0;

            for (const city of cities) {
                const row = table.insertRow();
                row.className = 'data-row';
                const cityCell = row.insertCell();
                const isCurrent = city === CityManager.getCurrentCityName();

                const cityLink = document.createElement('span');
                cityLink.textContent = isCurrent ? `${city} ★` : city;
                cityLink.style.cssText = 'cursor: pointer; text-decoration: underline;';
                cityLink.onclick = () => CityManager.changeCity(city.replace(' ★', ''), dataSetForView);
                cityCell.appendChild(cityLink);

                for (const unit of units) {
                    const value = this.data.savedData.army[city]?.[unit] || 0;
                    const cell = row.insertCell();
                    cell.textContent = value.toLocaleString();
                    totals[unit] += value;
                }
            }

            const totalRow = table.insertRow();
            totalRow.className = 'total-row';
            totalRow.insertCell().textContent = 'Total';
            for (const unit of units) {
                totalRow.insertCell().textContent = totals[unit].toLocaleString();
            }
        }

        buildBuildingsTable() {
            const cities = CityManager.getAllCities();
            const buildings = Constants.BUILDINGS;
            let table = this.grid.querySelector('table');
            if (!table) {
                table = document.createElement('table');
                this.grid.appendChild(table);
            }
            table.innerHTML = '';

            const headerRow = table.insertRow();
            headerRow.className = 'table-header';
            headerRow.insertCell().textContent = 'City';

            for (const b of buildings) {
                const cell = headerRow.insertCell();
                cell.innerHTML = `<img src="${Constants.IMAGE_PATHS.BUILDINGS}${b.icon}" class="building-icon" alt="${b.name}" title="${b.name}">`;
            }

            const totals = {};
            for (const b of buildings) totals[b.name] = 0;

            const isRTL = document.body.classList.contains('direction_rtl');

            for (const city of cities) {
                const row = table.insertRow();
                row.className = 'data-row';
                const cityCell = row.insertCell();
                const isCurrent = city === CityManager.getCurrentCityName();

                const cityLink = document.createElement('span');
                cityLink.textContent = isCurrent ? `${city} ★` : city;
                cityLink.style.cssText = 'cursor: pointer; text-decoration: underline;';
                cityLink.onclick = () => CityManager.changeCity(city.replace(' ★', ''), dataSetForView);
                cityCell.appendChild(cityLink);

                for (const b of buildings) {
                    const info = this.data.savedData.buildings[city]?.[b.name] || { currentLevel: 0, targetLevel: null, upgrading: false };
                    const currentLevel = info.currentLevel || 0;
                    const targetLevel = info.targetLevel;
                    const upgrading = info.upgrading || false;

                    const cell = row.insertCell();
                    if (currentLevel === 0 && !upgrading) {
                        cell.textContent = '-';
                    } else if (upgrading && targetLevel !== null && targetLevel > 0) {
                        // Force LTR for the arrow to display correctly in RTL layouts
                        const span = document.createElement('span');
                        if (isRTL) span.setAttribute('dir', 'ltr');
                        span.innerHTML = `${currentLevel} → ${targetLevel}`;
                        cell.appendChild(span);
                        cell.classList.add('upgrading');
                    } else if (upgrading) {
                        cell.textContent = currentLevel;
                        cell.classList.add('upgrading');
                    } else {
                        cell.textContent = currentLevel;
                    }
                    totals[b.name] += currentLevel;
                }
            }

            const totalRow = table.insertRow();
            totalRow.className = 'total-row';
            totalRow.insertCell().textContent = 'Total';
            for (const b of buildings) {
                totalRow.insertCell().textContent = totals[b.name];
            }
        }

        updateButtonStates() {
            if (!this.buttons) return;
            for (const button of this.buttons) {
                button.className = button.textContent.toLowerCase() === this.data.currentView
                    ? 'selected'
                    : 'deselected';
            }
        }
    }

    class UpdateManager {
        constructor(gridUI) {
            this.gridUI = gridUI;
            this.lastCity = CityManager.getCurrentCityName();
            this.lastResources = CityManager.getCurrentResources();
            this.lastArmy = CityManager.getCurrentArmy();
            this.lastBuildings = {};
            this.debounceTimeout = null;
        }

        /**
         * Convert raw DOM data into stored format with correct totals.
         * For a building type with an upgrade in progress:
         *   - If completedSum > 0, it's an upgrade → targetLevel = raw.targetLevel + 1
         *   - Otherwise, it's a new building → targetLevel = raw.targetLevel
         * Then:
         *   currentTotal = completedSum + (targetLevel - 1)
         *   targetTotal = completedSum + targetLevel
         */
        enrichBuildings(rawBuildings, previousBuildings) {
            const enriched = {};
            for (const name of Object.keys(rawBuildings)) {
                const raw = rawBuildings[name];
                const prev = previousBuildings[name] || { currentLevel: 0, targetLevel: null, upgrading: false };
                let currentLevel, targetLevel, upgrading;

                if (raw.upgrading && raw.targetLevel !== null) {
                    upgrading = true;
                    // Determine true target level: if there are existing buildings, it's an upgrade (+1)
                    let trueTarget = raw.targetLevel;
                    if (raw.completedSum > 0) {
                        // Existing building(s) → upgrade, so tooltip shows current level
                        trueTarget = raw.targetLevel + 1;
                    }
                    // Current total = finished buildings + (target level - 1)
                    const currentTotal = raw.completedSum + (trueTarget - 1);
                    const targetTotal = raw.completedSum + trueTarget;
                    // Keep previous values if the upgrade is unchanged (same target)
                    if (prev.upgrading && prev.targetLevel === targetTotal) {
                        currentLevel = prev.currentLevel;
                        targetLevel = prev.targetLevel;
                    } else {
                        currentLevel = currentTotal;
                        targetLevel = targetTotal;
                    }
                } else {
                    upgrading = false;
                    currentLevel = raw.completedSum;
                    targetLevel = null;
                }
                enriched[name] = { currentLevel, targetLevel, upgrading };
            }
            return enriched;
        }

        areBuildingsEqual(b1, b2) {
            const keys1 = Object.keys(b1);
            const keys2 = Object.keys(b2);
            if (keys1.length !== keys2.length) return false;
            for (const key of keys1) {
                const a = b1[key];
                const b = b2[key];
                if (!a || !b) return false;
                if (a.currentLevel !== b.currentLevel ||
                    a.targetLevel !== b.targetLevel ||
                    a.upgrading !== b.upgrading) return false;
            }
            return true;
        }

        start() {
            setInterval(() => this.checkUpdates(), 1000);
        }

        checkUpdates() {
            const currentCity = CityManager.getCurrentCityName();
            const currentResources = CityManager.getCurrentResources();
            const currentArmy = CityManager.getCurrentArmy();
            const rawBuildings = CityManager.getCurrentBuildingsRaw();
            const currentBuildings = this.enrichBuildings(rawBuildings, this.lastBuildings);
            const militaryScreen = !!document.querySelector('table.militaryList');
            const cityView = document.body.id === 'city';

            let needsUpdate = false;

            if (currentCity !== this.lastCity || !this.areObjectsEqual(currentResources, this.lastResources)) {
                this.handleResourceUpdate(currentCity, currentResources);
                needsUpdate = true;
            }

            if (militaryScreen && !this.areObjectsEqual(currentArmy, this.lastArmy)) {
                this.handleArmyUpdate(currentCity, currentArmy);
                needsUpdate = true;
            }

            if (cityView && !this.areBuildingsEqual(currentBuildings, this.lastBuildings)) {
                this.handleBuildingsUpdate(currentCity, currentBuildings);
                needsUpdate = true;
            }

            if (needsUpdate) {
                clearTimeout(this.debounceTimeout);
                this.debounceTimeout = setTimeout(() => this.gridUI.update(), 100);
            }
        }

        areObjectsEqual(obj1, obj2) {
            const keys1 = Object.keys(obj1);
            const keys2 = Object.keys(obj2);
            if (keys1.length !== keys2.length) return false;
            for (const key of keys1) {
                if (obj1[key] !== obj2[key]) return false;
            }
            return true;
        }

        handleResourceUpdate(city, resources) {
            this.gridUI.data.savedData.resources[city] = resources;
            DataManager.save(this.gridUI.data);
            this.lastCity = city;
            this.lastResources = resources;
        }

        handleArmyUpdate(city, army) {
            this.gridUI.data.savedData.army[city] = army;
            DataManager.save(this.gridUI.data);
            this.lastArmy = army;
        }

        handleBuildingsUpdate(city, buildings) {
            this.gridUI.data.savedData.buildings[city] = buildings;
            DataManager.save(this.gridUI.data);
            this.lastBuildings = buildings;
        }
    }

    class DragManager {
        constructor(gridElement, data) {
            this.grid = gridElement;
            this.data = data;
            this.isDragging = false;
            this.offset = { x: 0, y: 0 };
            this.boundDrag = null;
            this.boundStop = null;
            this.initialize();
        }

        initialize() {
            this.grid.addEventListener('mousedown', (e) => this.startDrag(e));
        }

        startDrag(e) {
            const isMinimized = this.grid.classList.contains('minimized');
            if (isMinimized && e.target.id !== 'toggleButton') return;
            if (!isMinimized && (e.target.tagName === 'BUTTON' || e.target.tagName === 'IMG')) return;

            this.isDragging = true;
            this.offset = {
                x: e.clientX - this.grid.offsetLeft,
                y: e.clientY - this.grid.offsetTop
            };

            this.boundDrag = this.drag.bind(this);
            this.boundStop = this.stopDrag.bind(this);
            document.addEventListener('mousemove', this.boundDrag);
            document.addEventListener('mouseup', this.boundStop);
        }

        drag(e) {
            if (!this.isDragging) return;
            this.grid.style.left = `${e.clientX - this.offset.x}px`;
            this.grid.style.top = `${e.clientY - this.offset.y}px`;
        }

        stopDrag() {
            this.isDragging = false;
            this.data.position = {
                left: this.grid.offsetLeft,
                top: this.grid.offsetTop
            };
            DataManager.save(this.data);
            if (this.boundDrag) {
                document.removeEventListener('mousemove', this.boundDrag);
                this.boundDrag = null;
            }
            if (this.boundStop) {
                document.removeEventListener('mouseup', this.boundStop);
                this.boundStop = null;
            }
        }
    }

    $(document).ready(() => {
        const loadedData = DataManager.load();
        const gridUI = new GridUI(loadedData);
        new DragManager(gridUI.grid, loadedData);
        const updateManager = new UpdateManager(gridUI);
        updateManager.start();
    });
})();
