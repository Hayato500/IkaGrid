// ==UserScript==
// @name         Ikariam Resource and Army Grid
// @namespace    Kronos
// @version      1.0
// @description  Proper multi-city tracking with individual updates
// @author       Kronos
// @match        *://*.ikariam.gameforge.com/*
// @grant        GM_addStyle
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @downloadURL  https://raw.githubusercontent.com/Hayato500/IkaGrid/refs/heads/main/Ikariam%20Resource%20and%20Army%20Grid.js
// @updateURL    https://raw.githubusercontent.com/Hayato500/IkaGrid/refs/heads/main/Ikariam%20Resource%20and%20Army%20Grid.js
// ==/UserScript==

(() => {
    'use strict';

    const Constants = {
        STORAGE_KEYS: {
            DATA: 'ikariamResourceGrid',
            POSITION: 'ikariamResourceGridPosition',
            MINIMIZED: 'ikariamResourceGridMinimized',
            VIEW: 'ikariamResourceGridView'
        },
        IMAGE_PATHS: {
            BUTTONS: {
                MINIMIZE: 'https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Buttons/Minimize.png',
                MAXIMIZE: 'https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Buttons/Maximize.png',
                SELECTED: 'https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Buttons/Button_Standard_Selected.png',
                DESELECTED: 'https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Buttons/Button_Standard_Deselected.png'
            },
            RESOURCES: {
                WOOD: 'https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Resources/icon_wood.png',
                WINE: 'https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Resources/icon_wine.png',
                MARBLE: 'https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Resources/icon_marble.png',
                CRYSTAL: 'https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Resources/icon_glass.png',
                SULFUR: 'https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Resources/icon_sulfur.png'
            },
            UNITS: 'https://raw.githubusercontent.com/Hayato500/IkaGrid/refs/heads/main/Units/',
            BACKGROUNDS: {
                MAIN: 'https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Border/',
                COPYRIGHT: 'https://raw.githubusercontent.com/Hayato500/IkaGrid/refs/heads/main/Border/copyright.png'
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
        }
    };

    class DataManager {
        static load() {
            return {
                savedData: JSON.parse(localStorage.getItem(Constants.STORAGE_KEYS.DATA)) || { resources: {}, army: {} },
                position: JSON.parse(localStorage.getItem(Constants.STORAGE_KEYS.POSITION)) || { top: 50, left: 50 },
                isMinimized: JSON.parse(localStorage.getItem(Constants.STORAGE_KEYS.MINIMIZED)) || false,
                currentView: localStorage.getItem(Constants.STORAGE_KEYS.VIEW) || 'resources'
            };
        }

        static save(data) {
            localStorage.setItem(Constants.STORAGE_KEYS.DATA, JSON.stringify(data.savedData));
            localStorage.setItem(Constants.STORAGE_KEYS.POSITION, JSON.stringify(data.position));
            localStorage.setItem(Constants.STORAGE_KEYS.MINIMIZED, JSON.stringify(data.isMinimized));
            localStorage.setItem(Constants.STORAGE_KEYS.VIEW, data.currentView);
        }
    }

    class CityManager {
        static getCurrentCityName() {
            return $('.white#js_cityBread').text().trim();
        }

        static getAllCities() {
            try {
                return Object.values(dataSetForView.relatedCityData)
                    .filter(city => city.name)
                    .map(city => city.name);
            } catch (e) {
                return [this.getCurrentCityName()];
            }
        }

        static getCurrentResources() {
            return Constants.RESOURCE_TYPES.reduce((acc, resource) => {
                acc[resource] = parseInt($(`#js_GlobalMenu_${resource.toLowerCase()}`).text().replace(/,/g, '') || 0);
                return acc;
            }, {});
        }

        static getCurrentArmy() {
            const army = Object.values(Constants.UNIT_MAPPING).reduce((acc, unit) => {
                acc[unit] = 0;
                return acc;
            }, {});

            document.querySelectorAll('table.militaryList').forEach(table => {
                const headers = table.querySelectorAll('th');
                const countRow = table.querySelector('tr.count');

                if (headers && countRow) {
                    const countCells = countRow.querySelectorAll('td');
                    headers.forEach((header, index) => {
                        const unitDiv = header.querySelector('div[class^="army"], div[class^="fleet"]');
                        if (unitDiv) {
                            const classCode = unitDiv.className.split(' ')[1];
                            const unitName = Constants.UNIT_MAPPING[classCode];
                            if (unitName && countCells[index]) {
                                army[unitName] = parseInt(countCells[index].textContent.replace(/,/g, '')) || 0;
                            }
                        }
                    });
                }
            });

            return army;
        }

        static changeCity(cityName, dataSet) {
            const cityInfo = Object.values(dataSet.relatedCityData).find(city => city.name === cityName);
            if (!cityInfo?.id) return;

            const postData = {
                action: 'header',
                function: 'changeCurrentCity',
                actionRequest: dataSet.actionRequest,
                cityId: cityInfo.id,
                ajax: 1
            };

            fetch('/index.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: new URLSearchParams(postData)
            }).then(response => {
                if (response.ok) window.location.reload();
            });
        }
    }

    class GridUI {
        constructor(data) {
            this.data = data;
            this.grid = this.createGridElement();
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
                cursor: move;
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
            toggleButton.style.cssText = `
                position: absolute;
                top: 25px;
                left: 50px;
                width: 25px;
                height: 25px;
                cursor: pointer;
                z-index: 10000;
            `;
            toggleButton.onclick = () => this.toggleMinimized();
            this.grid.appendChild(toggleButton);
        }

        toggleMinimized() {
            this.grid.classList.toggle('minimized');
            this.data.isMinimized = !this.data.isMinimized;
            const toggleButton = this.grid.querySelector('img');
            toggleButton.src = this.data.isMinimized
                ? 'https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Buttons/Maximize.png'
                : 'https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Buttons/Minimize.png';

            // Force redraw for minimized state
            if(this.data.isMinimized) {
                toggleButton.style.left = '2px';
                toggleButton.style.top = '2px';
            } else {
                toggleButton.style.left = '50px';
                toggleButton.style.top = '25px';
            }

            DataManager.save(this.data);
        }

        addViewButtons() {
            ['Resources', 'Army'].forEach((label, i) => {
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
                button.onclick = () => this.changeView(label.toLowerCase());
                button.className = label.toLowerCase() === this.data.currentView ? 'selected' : 'deselected';
                this.grid.appendChild(button);
            });
        }

        changeView(newView) {
            this.data.currentView = newView;
            DataManager.save(this.data);
            this.update();
        }

        addCopyright() {
            const copyright = document.createElement('div');
            copyright.className = 'copyright';
            copyright.innerHTML = '<span>By Kronos</span>';
            this.grid.appendChild(copyright);
        }

        applyStyles() {
            GM_addStyle(`
                #resourceGrid {
                    background:
                        url('https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Border/bg_head_left.png') left top no-repeat,
                        url('https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Border/bg_head_right.png') right top no-repeat,
                        url('https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Border/bg_head.png') left 50px top 0 repeat-x,
                        url('https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Border/bg_footer_l.png') left bottom 0 no-repeat,
                        url('https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Border/bg_footer_r.png') right -2px bottom 0 no-repeat,
                        url('https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Border/bg_footer_pat.png') left bottom 0 repeat-x,
                        url('https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Border/bg_body_left.png') left 10px top 55px repeat-y,
                        url('https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Border/bg_body_right.png') right 8px top 55px repeat-y,
                        #fcdbaa;
                    padding: 35px 40px 50px 40px;
                    min-width: 600px;
                    border: none !important;
                    box-shadow: 3px 3px 10px rgba(0,0,0,0.5);
                }

                #toggleButton {
                    position: absolute;
                    width: 25px !important;
                    height: 25px !important;
                    transition: all 0.2s ease;
                }

                #resourceGrid.minimized {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    width: 25px !important;
                    height: 25px !important;
                }

                #resourceGrid.minimized > *:not(#toggleButton) {
                    visibility: hidden !important;
                    opacity: 0 !important;
                }

                #resourceGrid.minimized #toggleButton {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    z-index: 10000 !important;
                }

                #resourceGrid.minimized table,
                #resourceGrid.minimized button,
                #resourceGrid.minimized .copyright {
                    display: none !important;
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

                /* Optional: Add smooth transition */
                #resourceGrid tr {
                    transition: background-color 0.2s ease;
                }


                button.selected, button.deselected {
                    background-repeat: no-repeat !important;
                    background-size: 100% 100% !important;
                    border: none !important;
                    color: black !important;
                    font-weight: bold !important;
                    font-family: Arial, sans-serif !important;
                }

                button.selected {
                    background-image: url(${Constants.IMAGE_PATHS.BUTTONS.SELECTED}) !important;
                }

                button.deselected {
                    background-image: url(${Constants.IMAGE_PATHS.BUTTONS.DESELECTED}) !important;
                }

                .copyright {
                    background-image: url(${Constants.IMAGE_PATHS.BACKGROUNDS.COPYRIGHT});
                    background-repeat: no-repeat;
                    background-position: center;
                    width: 200px;
                    height: 40px;
                    position: absolute;
                    bottom: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                }

                .copyright span {
                    font-size: 12px !important;  /* Original was 12px */
                    display: block !important;
                    color: white !important;
                    font-weight: bold !important;
                    text-align: center;
                    padding-top: 12px;
                    text-shadow: 1px 1px 2px black;
                }

                .unit-icon {
                    width: 30px !important;   /* 50% reduction from original 32px */
                    height: 30px !important;
                    object-fit: contain;      /* Maintains aspect ratio */
                }
            `);
        }

        update() {
            const table = this.grid.querySelector('table') || document.createElement('table');
            table.innerHTML = '';

            if (this.data.currentView === 'resources') {
                this.buildResourceTable(table);
            } else {
                this.buildArmyTable(table);
            }

            if (!this.grid.contains(table)) this.grid.appendChild(table);
            this.updateButtonStates();
        }

        buildResourceTable(table) {
            const cities = CityManager.getAllCities();
            const headerRow = table.insertRow();
            headerRow.className = 'table-header';
            headerRow.insertCell().textContent = 'City';

            Constants.RESOURCE_TYPES.forEach(resource => {
                const cell = headerRow.insertCell();
                cell.innerHTML = `<img src="${Constants.IMAGE_PATHS.RESOURCES[resource.toUpperCase()]}" alt="${resource}">`;
            });

            const totals = Constants.RESOURCE_TYPES.reduce((acc, res) => {
                acc[res] = 0;
                return acc;
            }, {});

            cities.forEach(city => {
                const row = table.insertRow();
                row.className = 'data-row';
                const cityCell = row.insertCell();
                const isCurrent = city === CityManager.getCurrentCityName();

                const cityLink = document.createElement('span');
                cityLink.textContent = isCurrent ? `${city} ★` : city;
                cityLink.style.cssText = 'cursor: pointer; text-decoration: underline;';
                cityLink.onclick = () => CityManager.changeCity(city.replace(' ★', ''), dataSetForView);
                cityCell.appendChild(cityLink);

                Constants.RESOURCE_TYPES.forEach(resource => {
                    const value = this.data.savedData.resources[city]?.[resource] || 0;
                    const cell = row.insertCell();
                    cell.textContent = value.toLocaleString();
                    totals[resource] += value;
                });
            });

            const totalRow = table.insertRow();
            totalRow.className = 'total-row';
            totalRow.insertCell().textContent = 'Total';
            Constants.RESOURCE_TYPES.forEach(resource => {
                totalRow.insertCell().textContent = totals[resource].toLocaleString();
            });
        }

        buildArmyTable(table) {
            const cities = CityManager.getAllCities();
            const units = Object.values(Constants.UNIT_MAPPING);
            const headerRow = table.insertRow();
            headerRow.className = 'table-header';
            headerRow.insertCell().textContent = 'City';

            units.forEach(unit => {
                const cell = headerRow.insertCell();
                cell.innerHTML = `<img src="${Constants.IMAGE_PATHS.UNITS}${unit.replace(/ /g, '_')}.png" class="unit-icon">`;
            });

            const totals = units.reduce((acc, unit) => {
                acc[unit] = 0;
                return acc;
            }, {});

            cities.forEach(city => {
                const row = table.insertRow();
                row.className = 'data-row';
                const cityCell = row.insertCell();
                const isCurrent = city === CityManager.getCurrentCityName();

                const cityLink = document.createElement('span');
                cityLink.textContent = isCurrent ? `${city} ★` : city;
                cityLink.style.cssText = 'cursor: pointer; text-decoration: underline;';
                cityLink.onclick = () => CityManager.changeCity(city.replace(' ★', ''), dataSetForView);
                cityCell.appendChild(cityLink);

                units.forEach(unit => {
                    const value = this.data.savedData.army[city]?.[unit] || 0;
                    const cell = row.insertCell();
                    cell.textContent = value.toLocaleString();
                    totals[unit] += value;
                });
            });

            const totalRow = table.insertRow();
            totalRow.className = 'total-row';
            totalRow.insertCell().textContent = 'Total';
            units.forEach(unit => {
                totalRow.insertCell().textContent = totals[unit].toLocaleString();
            });
        }

        updateButtonStates() {
            this.grid.querySelectorAll('button').forEach(button => {
                button.className = button.textContent.toLowerCase() === this.data.currentView
                    ? 'selected'
                    : 'deselected';
            });
        }
    }

    class UpdateManager {
        constructor(gridUI) {
            this.gridUI = gridUI;
            this.lastCity = CityManager.getCurrentCityName();
            this.lastResources = JSON.stringify(CityManager.getCurrentResources());
            this.lastArmy = JSON.stringify({});
        }

        start() {
            setInterval(() => this.checkUpdates(), 2000);
        }

        checkUpdates() {
            const currentCity = CityManager.getCurrentCityName();
            const currentResources = CityManager.getCurrentResources();
            const currentArmy = CityManager.getCurrentArmy();
            const militaryScreen = document.querySelector('table.militaryList');

            let needsUpdate = false;

            if (currentCity !== this.lastCity || JSON.stringify(currentResources) !== this.lastResources) {
                this.handleResourceUpdate(currentCity, currentResources);
                needsUpdate = true;
            }

            if (militaryScreen && JSON.stringify(currentArmy) !== this.lastArmy) {
                this.handleArmyUpdate(currentCity, currentArmy);
                needsUpdate = true;
            }

            if (needsUpdate) {
                this.gridUI.update();
            }
        }

        handleResourceUpdate(city, resources) {
            this.gridUI.data.savedData.resources[city] = resources;
            DataManager.save(this.gridUI.data);
            this.lastCity = city;
            this.lastResources = JSON.stringify(resources);
        }

        handleArmyUpdate(city, army) {
            this.gridUI.data.savedData.army[city] = army;
            DataManager.save(this.gridUI.data);
            this.lastArmy = JSON.stringify(army);
        }
    }

    class DragManager {
        constructor(gridElement, data) {
            this.grid = gridElement;
            this.data = data;
            this.isDragging = false;
            this.offset = { x: 0, y: 0 };
            this.initialize();
        }

        initialize() {
            this.grid.addEventListener('mousedown', (e) => this.startDrag(e));
        }

        startDrag(e) {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'IMG') return;

            this.isDragging = true;
            this.offset = {
                x: e.clientX - this.grid.offsetLeft,
                y: e.clientY - this.grid.offsetTop
            };

            document.addEventListener('mousemove', this.drag.bind(this));
            document.addEventListener('mouseup', this.stopDrag.bind(this));
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
            document.removeEventListener('mousemove', this.drag);
            document.removeEventListener('mouseup', this.stopDrag);
        }
    }

    // Main initialization
    $(document).ready(() => {
        const loadedData = DataManager.load();
        const gridUI = new GridUI(loadedData);
        new DragManager(gridUI.grid, loadedData);
        const updateManager = new UpdateManager(gridUI);
        updateManager.start();
    });
})();
