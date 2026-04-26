# 5-Rank System Setup Guide

## 📋 Rank System Overview

This system includes 5 ranks, from lowest to highest:
1. **Initiate** (Level 1) - Newcomer
2. **Operative** (Level 2) - Operator
3. **Specialist** (Level 3) - Specialist
4. **Veteran** (Level 4) - Veteran
5. **Elite** (Level 5) - Elite

## 🚀 Quick Setup Steps

### 1. Create Roles

First, create 5 roles in your Discord server:
- `Initiate` - Newcomer role
- `Operative` - Operator role
- `Specialist` - Specialist role
- `Veteran` - Veteran role
- `Elite` - Elite role

### 2. Setup Rank System

Use `/setupranks` command for quick setup:

```
/setupranks
  initiate: @Initiate
  operative: @Operative
  specialist: @Specialist
  veteran: @Veteran
  elite: @Elite
  operative_xp: 500
  specialist_xp: 2000
  veteran_xp: 5000
  elite_xp: 10000
  sync: true
```

**Parameter Description:**
- `initiate` - Initiate rank role (required)
- `operative` - Operative rank role (required)
- `specialist` - Specialist rank role (required)
- `veteran` - Veteran rank role (required)
- `elite` - Elite rank role (required)
- `operative_xp` - XP required for Operative rank (default: 500)
- `specialist_xp` - XP required for Specialist rank (default: 2000)
- `veteran_xp` - XP required for Veteran rank (default: 5000)
- `elite_xp` - XP required for Elite rank (default: 10000)
- `sync` - Whether to sync existing users' rank roles (default: false)

### 3. Configure XP System (Optional)

Use `/levelconfig` command to adjust XP gain:

```
/levelconfig xprate
  rate: 2
```

```
/levelconfig base
  amount: 15
```

```
/levelconfig lengthbonus
  rate: 2
```

```
/levelconfig cooldown
  seconds: 30
```

## 📊 Rank Progress Explanation

### XP Calculation

- **Base XP**: Base XP gained per message
- **Length Bonus**: Additional XP based on message length
- **XP Multiplier**: Global XP gain multiplier

### Level Progression

Users gain XP by sending messages. When XP reaches the required amount for a rank:
1. Automatic level up
2. Automatic role assignment
3. Level up notification sent (if `level-up` or `announcements` channel exists)

### Default XP Requirements

| Level | Name | Required XP |
|-------|------|-------------|
| 1 | Initiate | 0 XP |
| 2 | Operative | 500 XP |
| 3 | Specialist | 2,000 XP |
| 4 | Veteran | 5,000 XP |
| 5 | Elite | 10,000 XP |

## 🎮 User Commands

### View Level
```
/level
```
or
```
/level target: @user
```

### View Rank Card
```
/rank
```
or
```
/rank target: @user
```

### View Leaderboard
```
/leaderboard type: level
```

### Claim Rewards
```
/rewards claim level: 3
```

## ⚙️ Admin Commands

### View Level Config
```
/levelconfig show
```

### View Rank Roles
```
/levelroles show
```

### View Rewards Config
```
/rewards show
```

### Sync Rank Roles
```
/levelroles sync
```

### Add Rank Reward
```
/rewards add
  level: 3
  type: role
  description: Get Specialist role
  role: @Specialist
```

## 🎨 Customization Suggestions

### Role Color Settings

Recommended colors for different ranks:
- **Initiate** - Gray (#808080)
- **Operative** - Blue (#3498db)
- **Specialist** - Green (#2ecc71)
- **Veteran** - Purple (#9b59b6)
- **Elite** - Gold (#f1c40f)

### Role Permission Settings

Recommended permissions for different ranks:
- **Initiate** - Basic permissions
- **Operative** - Additional channel access
- **Specialist** - Image/link posting permissions
- **Veteran** - Partial channel management
- **Elite** - Advanced permissions and special features

### Level Up Notification Channel

Create `level-up` channel for level up notifications so community members can see others' achievements.

## 🔧 Troubleshooting

### User Not Getting Role

1. Check if Bot has role management permissions
2. Check if role is above Bot role in hierarchy
3. Use `/levelroles sync` to manually sync

### XP Not Increasing

1. Check if level system is enabled: `/levelconfig show`
2. Check cooldown settings: `/levelconfig show`
3. Check if user is in exempt channels

### Level Up Notification Not Showing

1. Ensure `level-up` or `announcements` channel is created
2. Check if Bot has message sending permissions
3. Check if channel has correct permissions

## 📈 Data Statistics

Use `/stats` command to view overall server statistics, including:
- Total user count
- Active user count
- Total XP
- Total messages
- User distribution by rank

## 🎉 Best Practices

1. **Regular Sync**: Regularly use `/levelroles sync` to ensure all users have correct roles
2. **Monitor Abuse**: Set reasonable cooldown times to prevent XP farming
3. **Reward System**: Set special rewards and permissions for high-ranking users
4. **Community Events**: Host rank competitions and events to increase user engagement
5. **Data Backup**: Regularly backup database files to prevent data loss

## 📞 Support

If you have issues, please check Bot logs or contact an administrator.
