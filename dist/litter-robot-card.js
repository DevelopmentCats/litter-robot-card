class LitterRobotCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define a vacuum entity');
    }
    this.config = config;
    this.render();
  }

  // Advanced config options (optional overrides):
  // - waste_drawer_entity: Override auto-constructed waste drawer sensor
  // - litter_level_entity: Override auto-constructed litter level sensor
  // - pet_weight_entity: Override auto-constructed pet weight sensor
  // - last_seen_entity: Override auto-constructed last seen sensor
  // - reset_button_entity: Override auto-constructed reset button
  // - night_light_entity: Override auto-constructed night light

  set hass(hass) {
    this._hass = hass;
    this.updateCard();
  }

  getCardSize() {
    return 8;
  }

  static getStubConfig() {
    return {
      entity: 'vacuum.litter_robot_litter_box',
      cat_name: 'Cat',
    };
  }

  static getConfigForm() {
    return {
      schema: [
        {
          name: 'entity',
          required: true,
          selector: {
            entity: {
              domain: 'vacuum',
            },
          },
        },
        {
          name: 'cat_name',
          selector: {
            text: {},
          },
        },
        {
          name: 'cat_image',
          selector: {
            text: {},
          },
        },
      ],
      computeLabel: (schema) => {
        const labels = {
          entity: 'Litter Robot Entity',
          cat_name: 'Cat Name',
          cat_image: 'Cat Image URL (optional)',
        };
        return labels[schema.name];
      },
      computeHelper: (schema) => {
        if (schema.name === 'cat_image') {
          return 'Upload image to /config/www/, then use /local/filename.jpg';
        }
        return undefined;
      },
    };
  }

  _getBaseEntityName() {
    if (!this.config.entity) return 'litter_robot';
    let baseName = this.config.entity.replace('vacuum.', '');
    baseName = baseName.replace(/_litter_box$/, '');
    baseName = baseName.replace(/_vacuum$/, '');
    return baseName;
  }

  _getEntityName(domain, suffix, configKey) {
    if (this.config[configKey]) {
      return this.config[configKey];
    }
    const base = this._getBaseEntityName();
    return `${domain}.${base}${suffix}`;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        ha-card {
          padding: 12px;
          position: relative;
          overflow: hidden;
          box-shadow: 0px 2px 4px 0px rgba(0,0,0,0.16);
          border-radius: 12px;
        }

        .card-header {
          text-align: center;
          font-size: 1.3em;
          font-weight: 500;
          margin-bottom: 8px;
          color: var(--primary-text-color);
          letter-spacing: -0.3px;
        }

        .robot-container {
          position: relative;
          width: 220px;
          height: 220px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        }

        .robot-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: filter 0.3s ease;
        }

        .robot-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .robot-glow.cleaning {
          opacity: 0.6;
          box-shadow: 0 0 40px 20px rgba(33, 150, 243, 0.8);
          animation: pulse 2s ease-in-out infinite;
        }

        .robot-glow.cat-detected {
          opacity: 0.6;
          box-shadow: 0 0 40px 20px rgba(255, 193, 7, 0.8);
        }

        .robot-glow.error {
          opacity: 0.6;
          box-shadow: 0 0 40px 20px rgba(244, 67, 54, 0.8);
          animation: pulse 2s ease-in-out infinite;
        }

        .robot-glow.offline {
          opacity: 0.6;
          box-shadow: 0 0 40px 20px rgba(244, 67, 54, 0.8);
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }

        .status-text {
          text-align: center;
          font-size: 1.2em;
          font-weight: 500;
          margin-bottom: 16px;
          color: var(--secondary-text-color);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .status-text::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--secondary-text-color);
        }

        .status-text.ready::before { background: #4caf50; }
        .status-text.cleaning::before { background: #2196f3; animation: pulse-dot 2s ease-in-out infinite; }
        .status-text.error::before { background: #f44336; animation: pulse-dot 2s ease-in-out infinite; }
        .status-text.offline::before { background: #f44336; }
        .status-text.cat-detected::before { background: #ffc107; }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .gauges-container {
          display: flex;
          justify-content: space-around;
          margin-bottom: 16px;
          padding: 12px 0;
          border-top: 1px solid var(--divider-color);
          border-bottom: 1px solid var(--divider-color);
        }

        .gauge {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .gauge-label {
          font-size: 0.9em;
          color: var(--secondary-text-color);
          margin-bottom: 8px;
        }

        .waste-bar-container {
          position: relative;
          width: 90px;
          height: 100px;
          background: var(--divider-color);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }

        .waste-bar-fill {
          position: absolute;
          bottom: 0;
          width: 100%;
          background: #4caf50;
          transition: height 0.5s ease, background-color 0.3s ease;
          border-radius: 8px 8px 0 0;
        }

        .waste-bar-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.3em;
          font-weight: 600;
          color: var(--primary-text-color);
          z-index: 1;
        }

        .litter-status-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .litter-circle {
          position: relative;
          width: 90px;
          height: 90px;
          background: rgba(128, 128, 128, 0.2);
          border: 3px solid rgba(128, 128, 128, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .litter-circle::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 2px;
          background: rgba(128, 128, 128, 0.4);
          top: 50%;
          transform: translateY(-50%);
          z-index: 1;
        }

        .litter-circle::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 50%;
          bottom: 0;
          left: 0;
          background: #4caf50;
          border-radius: 0 0 90px 90px;
          transition: background-color 0.3s ease;
        }

        .litter-circle.low::after { background: #f44336; }

        .litter-status-text {
          font-size: 1em;
          font-weight: 500;
          color: var(--primary-text-color);
          transition: color 0.3s ease;
        }

        .litter-status-text.low { color: #f44336; }
        .litter-status-text.optimal { color: #4caf50; }

        .cat-info {
          display: flex;
          align-items: center;
          padding: 12px;
          margin-bottom: 12px;
          background: var(--secondary-background-color);
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }

        .cat-photo {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          object-fit: cover;
          margin-right: 12px;
          border: 2px solid var(--primary-color);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .cat-photo-placeholder {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          margin-right: 12px;
          background: var(--divider-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8em;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .cat-details { flex: 1; }

        .cat-name {
          font-size: 1.1em;
          font-weight: 500;
          margin-bottom: 2px;
          color: var(--primary-text-color);
        }

        .cat-stat {
          font-size: 0.85em;
          color: var(--secondary-text-color);
          margin: 1px 0;
        }

        .controls {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }

        .control-button {
          padding: 16px 12px;
          border: none;
          border-radius: 12px;
          background: var(--primary-color);
          color: var(--text-primary-color);
          font-size: 1em;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .control-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .control-button:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .control-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .control-button.secondary {
          background: var(--card-background-color);
          color: var(--primary-text-color);
          border: 2px solid var(--divider-color);
          transition: all 0.2s ease;
        }

        .control-button.secondary:hover {
          border-color: var(--primary-color);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .control-button.active {
          background: var(--primary-color);
          color: var(--text-primary-color);
          border: 2px solid var(--primary-color);
        }
      </style>

      <ha-card>
        <div class="card-header">Litter Robot</div>
        
        <div class="robot-container">
          <img class="robot-image" id="robot-img" src="${this.config.robot_image || '/local/community/litter-robot-card/litter-robot.png'}" />
          <div class="robot-glow" id="robot-glow"></div>
        </div>

        <div class="status-text" id="status-text">Ready</div>

        <div class="gauges-container">
          <div class="gauge">
            <div class="gauge-label">Waste Drawer</div>
            <div class="waste-bar-container">
              <div class="waste-bar-fill" id="waste-bar"></div>
              <div class="waste-bar-text" id="waste-text">0%</div>
            </div>
          </div>

          <div class="gauge">
            <div class="gauge-label">Litter Level</div>
            <div class="litter-status-container">
              <div class="litter-circle" id="litter-circle"></div>
              <div class="litter-status-text" id="litter-status">Optimal</div>
            </div>
          </div>
        </div>

        <div class="cat-info">
          ${this.config.cat_image ? 
            `<img class="cat-photo" src="${this.config.cat_image}" />` :
            `<div class="cat-photo-placeholder">🐱</div>`
          }
          <div class="cat-details">
            <div class="cat-name" id="cat-name">${this.config.cat_name || 'Cat'}</div>
            <div class="cat-stat" id="cat-weight">Weight: --</div>
            <div class="cat-stat" id="cat-last-seen">Last used: --</div>
          </div>
        </div>

        <div class="controls">
          <button class="control-button secondary" id="cycle-btn">Cycle</button>
          <button class="control-button secondary" id="reset-btn">Reset</button>
          <button class="control-button secondary" id="light-btn">Light</button>
        </div>
      </ha-card>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const cycleBtn = this.shadowRoot.getElementById('cycle-btn');
    const resetBtn = this.shadowRoot.getElementById('reset-btn');
    const lightBtn = this.shadowRoot.getElementById('light-btn');

    cycleBtn?.addEventListener('click', () => this.handleCycle());
    resetBtn?.addEventListener('click', () => this.handleReset());
    lightBtn?.addEventListener('click', () => this.handleLight());
  }

  updateCard() {
    if (!this._hass || !this.config) return;

    const entity = this._hass.states[this.config.entity];
    
    if (!entity) {
      const isStub = this.config.entity === 'vacuum.litter_robot_litter_box' && 
                     !this._hass.states[this.config.entity];
      if (!isStub) return;
    }
    
    const usePlaceholder = !entity;
    const status = usePlaceholder ? 'docked' : entity.state;

    const statusText = this.shadowRoot.getElementById('status-text');
    const robotGlow = this.shadowRoot.getElementById('robot-glow');

    statusText.textContent = this.getStatusText(status);

    robotGlow.className = 'robot-glow';
    statusText.className = 'status-text';

    const statusCode = entity?.attributes?.status_code;
    if (status === 'cleaning' || (status === 'docked' && statusCode === 'ccp')) {
      robotGlow.classList.add('cleaning');
      statusText.classList.add('cleaning');
    } else if (statusCode?.includes('cat')) {
      robotGlow.classList.add('cat-detected');
      statusText.classList.add('cat-detected');
    } else if (status === 'error' || statusCode?.includes('error')) {
      robotGlow.classList.add('error');
      statusText.classList.add('error');
    } else if (status === 'unavailable') {
      robotGlow.classList.add('offline');
      statusText.classList.add('offline');
    } else {
      statusText.classList.add('ready');
    }

    const wasteEntityName = this._getEntityName('sensor', '_waste_drawer', 'waste_drawer_entity');
    const wasteEntity = this._hass.states[wasteEntityName];
    const wasteLevel = usePlaceholder ? 45 : (parseInt(wasteEntity?.state) || 0);
    this.updateWasteBar(wasteLevel);

    const litterEntityName = this._getEntityName('sensor', '_litter_level', 'litter_level_entity');
    const litterEntity = this._hass.states[litterEntityName];
    const litterLevel = usePlaceholder ? 85 : (parseInt(litterEntity?.state) || 0);
    this.updateLitterStatus(litterLevel);

    const weightEntityName = this._getEntityName('sensor', '_pet_weight', 'pet_weight_entity');
    const weightEntity = this._hass.states[weightEntityName];
    const catWeight = this.shadowRoot.getElementById('cat-weight');
    if (catWeight) {
      if (usePlaceholder) {
        catWeight.textContent = 'Weight: 12.3 lbs';
      } else if (weightEntity) {
        catWeight.textContent = `Weight: ${weightEntity.state} ${weightEntity.attributes.unit_of_measurement || 'lbs'}`;
      } else {
        catWeight.textContent = 'Weight: --';
      }
    }

    const lastSeenEntityName = this._getEntityName('sensor', '_last_seen', 'last_seen_entity');
    const lastSeenEntity = this._hass.states[lastSeenEntityName];
    const catLastSeen = this.shadowRoot.getElementById('cat-last-seen');
    if (catLastSeen) {
      if (usePlaceholder) {
        catLastSeen.textContent = 'Last used: 2h ago';
      } else if (lastSeenEntity) {
        const lastSeen = new Date(lastSeenEntity.state);
        const now = new Date();
        const diff = Math.floor((now - lastSeen) / 1000 / 60);
        
        let timeAgo;
        if (diff < 60) {
          timeAgo = `${diff}m ago`;
        } else if (diff < 1440) {
          timeAgo = `${Math.floor(diff / 60)}h ago`;
        } else {
          timeAgo = `${Math.floor(diff / 1440)}d ago`;
        }
        catLastSeen.textContent = `Last used: ${timeAgo}`;
      } else {
        catLastSeen.textContent = 'Last used: --';
      }
    }

    const cycleBtn = this.shadowRoot.getElementById('cycle-btn');
    const lightBtn = this.shadowRoot.getElementById('light-btn');
    
    if (cycleBtn) {
      cycleBtn.disabled = status === 'cleaning';
      if (status === 'cleaning') {
        cycleBtn.classList.remove('secondary');
        cycleBtn.classList.add('active');
      } else {
        cycleBtn.classList.add('secondary');
        cycleBtn.classList.remove('active');
      }
    }

    if (lightBtn) {
      const nightLightName = this._getEntityName('light', '_night_light', 'night_light_entity');
      const nightLight = this._hass.states[nightLightName];
      
      if (nightLight && nightLight.state === 'on') {
        lightBtn.classList.remove('secondary');
        lightBtn.classList.add('active');
      } else {
        lightBtn.classList.add('secondary');
        lightBtn.classList.remove('active');
      }
    }
  }

  updateWasteBar(percentage) {
    const wasteBar = this.shadowRoot.getElementById('waste-bar');
    const wasteText = this.shadowRoot.getElementById('waste-text');
    
    if (wasteBar && wasteText) {
      wasteBar.style.height = `${percentage}%`;
      wasteText.textContent = `${percentage}%`;
      
      let color;
      if (percentage < 50) {
        color = '#4caf50';
      } else if (percentage < 75) {
        color = '#ffc107';
      } else {
        color = '#f44336';
      }
      wasteBar.style.backgroundColor = color;
    }
  }

  updateLitterStatus(percentage) {
    const litterCircle = this.shadowRoot.getElementById('litter-circle');
    const litterStatus = this.shadowRoot.getElementById('litter-status');
    
    if (litterCircle && litterStatus) {
      const isOptimal = percentage >= 50;
      
      litterCircle.className = 'litter-circle';
      if (!isOptimal) {
        litterCircle.classList.add('low');
      }
      
      litterStatus.textContent = isOptimal ? 'Optimal' : 'Low';
      litterStatus.className = 'litter-status-text';
      litterStatus.classList.add(isOptimal ? 'optimal' : 'low');
    }
  }

  getStatusText(state) {
    const statusMap = {
      'docked': 'Ready',
      'cleaning': 'Cleaning...',
      'error': 'Error - Check Robot',
      'paused': 'Paused',
      'unavailable': 'Offline'
    };
    return statusMap[state] || 'Ready';
  }

  handleCycle() {
    this._hass.callService('vacuum', 'start', {
      entity_id: this.config.entity
    });
  }

  handleReset() {
    const resetButtonName = this._getEntityName('button', '_reset_waste_drawer', 'reset_button_entity');
    if (this._hass.states[resetButtonName]) {
      this._hass.callService('button', 'press', {
        entity_id: resetButtonName
      });
    }
  }

  handleLight() {
    const nightLightName = this._getEntityName('light', '_night_light', 'night_light_entity');
    if (this._hass.states[nightLightName]) {
      this._hass.callService('light', 'toggle', {
        entity_id: nightLightName
      });
    }
  }
}

customElements.define('litter-robot-card', LitterRobotCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'litter-robot-card',
  name: 'Litter Robot Card',
  description: 'Custom card for Litter Robot with animations and controls',
  preview: true,
  documentationURL: 'https://github.com/DevelopmentCats/litter-robot-card'
});
