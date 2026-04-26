# Quick Start Guide

## 🚀 5-Minute Quick Setup

### Step 1: Create Roles

Create the following roles in your Discord server:

**Rank Roles:**
- `Initiate` - Newcomer rank
- `Operative` - Operator rank
- `Specialist` - Specialist rank
- `Veteran` - Veteran rank
- `Elite` - Elite rank

**Language Roles:**
- `Chinese` - Chinese users
- `English` - English users

**Support Role:**
- `Support` - Support staff

### Step 2: Create Channels

Create the following channels:

**Ticket System:**
- Category: `Tickets`
- Ticket panel channel: `#ticket-panel`

**Rank System:**
- Level up notification: `#level-up`
- Announcements: `#announcements`

**Log System:**
- Moderation logs: `#mod-logs`
- Ticket logs: `#ticket-logs`

### Step 3: Setup Rank System

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

### Step 4: Setup Prefix System

```
/prefixconfig add
  role: @Chinese
  prefix: [CN]
  position: before
```

```
/prefixconfig add
  role: @English
  prefix: [EN]
  position: before
```

```
/prefixconfig toggle
  enabled: true
```

```
/prefixconfig sync
```

### Step 5: Setup Ticket System

```
/ticket setup
  category: #Tickets
  support_role: @Support
  title: 🎫 Need Help?
  description: Click the button below to create a ticket, our support team will respond as soon as possible
```

### Step 6: Setup Welcome System

```
/welcome channel
  channel: #welcome
```

```
/welcome message
  content: Welcome {user} to the server!\n\nCurrent members: {memberCount}\nAccount created: {accountAge}
```

```
/welcome toggle
  enabled: true
```

### Step 7: Setup Rules Confirmation

```
/rules setup
  channel: #rules
  role: @Member
  title: 📜 Server Rules
  content: Please read the server rules carefully and click the button below to confirm and get full access.
```

## ✅ Verify Setup

### Check Rank System

```
/levelconfig show
```

```
/levelroles show
```

### Check Prefix System

```
/prefixconfig show
```

### Check Ticket System

You should see the ticket panel in the `#ticket-panel` channel.

### Test Features

1. **Test Rank System**: Send a few messages and check if you gain XP
2. **Test Prefix System**: Add `Chinese` role to yourself and check if nickname becomes `[CN] YourName`
3. **Test Ticket System**: Click the ticket panel button to create a test ticket

## 🎨 Custom Configuration

### Adjust XP Gain

```
/levelconfig xprate
  rate: 2
```

```
/levelconfig base
  amount: 15
```

```
/levelconfig cooldown
  seconds: 30
```

### Add More Prefixes

```
/prefixconfig add
  role: @VIP
  prefix: ⭐
  position: after
```

### Add Rank Rewards

```
/rewards add
  level: 3
  type: role
  description: Get Specialist role
  role: @Specialist
```

## 🔧 Permission Requirements

Ensure Bot has the following permissions:

**Server Permissions:**
- Manage Roles
- Manage Channels
- Manage Nicknames
- Send Messages
- View Channels

**Channel Permissions:**
- Send messages in all channels
- Manage messages
- View message history

## 📊 Monitoring and Maintenance

### Regular Tasks

**Daily:**
- Check ticket system status
- View log channels

**Weekly:**
- Sync rank roles
- Sync prefix system
- Check user activity

**Monthly:**
- Backup database
- Review system configuration
- Collect user feedback

### Data Backup

Regularly backup the `data/database.sqlite` file.

## 🎉 Done!

Your Discord Bot is now fully configured!

**Users can:**
- ✅ Auto-get language prefixes
- ✅ Gain ranks through activity
- ✅ Create tickets for help
- ✅ View their level and ranking

**Admins can:**
- ✅ Manage ticket system
- ✅ Configure ranks and rewards
- ✅ Customize prefix system
- ✅ View detailed statistics

## 📞 Get Help

- See `RANKS_GUIDE.md` for rank system details
- See `SYSTEMS_GUIDE.md` for system usage details
- See `AGENTS.md` for development guide

Enjoy using it! 🎊
