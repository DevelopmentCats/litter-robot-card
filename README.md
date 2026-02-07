# 🤖 Litter Robot Card

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A custom Home Assistant Lovelace card for the Litter Robot integration with animations and visual status indicators.

<p align="center">
  <img src="dist/litter-robot.png" alt="Litter Robot Card" width="400">
</p>

## ✨ Features

- 🤖 Visual status indicator with animated glow effects
- 📊 Waste drawer level gauge (color-coded: green/yellow/red)
- 🐱 Litter level indicator
- 🐾 Cat info panel with weight and last visit
- 🎛️ Control buttons: Cycle, Reset, Light toggle
- 🌙 Dark mode compatible
- ⚙️ Visual editor support

## 📦 Installation

### HACS (Recommended)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=DevelopmentCats&repository=litter-robot-card&category=plugin)

**Or manually:**

1. Open HACS in Home Assistant
2. Go to **Frontend** section
3. Click the menu (⋮) → **Custom repositories**
4. Add URL: `https://github.com/DevelopmentCats/litter-robot-card`
5. Select category: **Lovelace**
6. Click **Add**
7. Search for "Litter Robot Card" and click **Download**
8. Refresh your browser (Ctrl+F5)

### Manual Installation

1. Download `litter-robot-card.js` from the [latest release](https://github.com/DevelopmentCats/litter-robot-card/releases/latest)
2. Copy to `/config/www/community/litter-robot-card/`
3. Add resource in Lovelace:
   ```yaml
   resources:
     - url: /local/community/litter-robot-card/litter-robot-card.js
       type: module
   ```

## ⚙️ Configuration

### Basic

```yaml
type: custom:litter-robot-card
entity: vacuum.litter_robot_litter_box
cat_name: Whiskers
```

### With Cat Image

```yaml
type: custom:litter-robot-card
entity: vacuum.litter_robot_litter_box
cat_name: Whiskers
cat_image: /local/images/my-cat.jpg
```

### Advanced (Entity Overrides)

If your entities don't follow the standard naming convention:

```yaml
type: custom:litter-robot-card
entity: vacuum.poop_goblin_litter_box
cat_name: Carl
waste_drawer_entity: sensor.poop_goblin_waste_drawer
litter_level_entity: sensor.poop_goblin_litter_level
pet_weight_entity: sensor.poop_goblin_pet_weight
last_seen_entity: sensor.poop_goblin_last_seen
reset_button_entity: button.poop_goblin_reset
night_light_entity: light.poop_goblin_night_light
```

## 📋 Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `entity` | string | ✅ | - | Litter Robot vacuum entity |
| `cat_name` | string | | Cat | Your cat's name |
| `cat_image` | string | | - | URL to cat photo |
| `robot_image` | string | | Built-in | Custom robot image |
| `waste_drawer_entity` | string | | Auto | Override waste drawer sensor |
| `litter_level_entity` | string | | Auto | Override litter level sensor |
| `pet_weight_entity` | string | | Auto | Override pet weight sensor |
| `last_seen_entity` | string | | Auto | Override last seen sensor |
| `reset_button_entity` | string | | Auto | Override reset button |
| `night_light_entity` | string | | Auto | Override night light |

## 🚦 Status Indicators

| Status | Color | Description |
|--------|-------|-------------|
| Ready | 🟢 Green | Robot is idle and ready |
| Cleaning | 🔵 Blue (pulsing) | Robot is cycling |
| Cat Detected | 🟡 Yellow | Cat is using the robot |
| Error | 🔴 Red (pulsing) | Check the robot |
| Offline | ⚫ Gray | Robot is unavailable |

## 📋 Requirements

- Home Assistant with the [Litter Robot integration](https://www.home-assistant.io/integrations/litterrobot/)
- A Litter Robot (tested with Litter Robot 4)

## 🐛 Troubleshooting

### Card doesn't appear
- Make sure you refreshed your browser after installation (Ctrl+F5)
- Check browser console for errors (F12 → Console)
- Verify the resource is added in Settings → Dashboards → Resources

### Entity not found
- Ensure the Litter Robot integration is set up and working
- Check the entity ID matches your Litter Robot's vacuum entity
- Try the advanced config with explicit entity overrides

## 📄 License

MIT © [DevelopmentCats](https://github.com/DevelopmentCats)
