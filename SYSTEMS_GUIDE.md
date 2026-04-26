# Ticket System and Prefix System Guide

## 🎫 Ticket System

### Quick Setup

1. **Create Ticket Category**
   - Create a channel category named "Tickets" in your Discord server

2. **Create Support Role**
   - Create a role named "Support" or "Staff"

3. **Setup Ticket System**
   ```
   /ticket setup
     category: #Tickets
     support_role: @Support
     title: 🎫 Need Help?
     description: Click the button below to create a ticket, our support team will respond as soon as possible
   ```

### User Usage

**Create Ticket:**
- Click the "🎫 Create Ticket" button on the ticket panel
- Fill in ticket subject and description
   - System will automatically create a private channel

**Ticket Features:**
- 🔒 Close Ticket - Close ticket when completed
- 📄 Generate Transcript - Export ticket conversation log
- Add/Remove Users - Invite other users to participate in discussion

### Admin Commands

**Create Ticket:**
```
/ticket create
  subject: Need help
  description: Describe your issue in detail
```

**Close Ticket:**
```
/ticket close
  reason: Issue resolved
```

**Add User to Ticket:**
```
/ticket add
  user: @user
```

**Remove User from Ticket:**
```
/ticket remove
  user: @user
```

**Generate Ticket Transcript:**
```
/ticket transcript
```

## 🏷️ Prefix System

### Quick Setup

1. **Create Language Roles**
   - Create "Chinese" role
   - Create "English" role
   - Create other language roles

2. **Configure Prefixes**
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

3. **Enable Prefix System**
   ```
   /prefixconfig toggle
     enabled: true
   ```

4. **Sync Existing Users**
   ```
   /prefixconfig sync
   ```

### Prefix Configuration Examples

**Chinese Users:**
```
/prefixconfig add
  role: @Chinese
  prefix: [CN]
  position: before
```
Result: `[CN] Username`

**English Users:**
```
/prefixconfig add
  role: @English
  prefix: [EN]
  position: before
```
Result: `[EN] Username`

**VIP Users:**
```
/prefixconfig add
  role: @VIP
  prefix: ⭐
  position: after
```
Result: `Username ⭐`

### Admin Commands

**View Prefix Configuration:**
```
/prefixconfig show
```

**Add Role Prefix:**
```
/prefixconfig add
  role: @RoleName
  prefix: [Prefix]
  position: before/after
```

**Remove Role Prefix:**
```
/prefixconfig remove
  role: @RoleName
```

**Toggle Prefix System:**
```
/prefixconfig toggle
  enabled: true/false
```

**Sync All Users:**
```
/prefixconfig sync
```

## 🎯 Rank System Configuration

### 5-Rank System Setup

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

### Rank Role Configuration

**View Rank Roles:**
```
/levelroles show
```

**Add Rank Role:**
```
/levelroles add
  level: 3
  name: Specialist
  role: @Specialist
  required_xp: 2000
```

**Update Rank Role:**
```
/levelroles update
  level: 3
  name: Specialist
  role: @Specialist
  required_xp: 2500
```

**Remove Rank Role:**
```
/levelroles remove
  level: 3
```

**Sync Rank Roles:**
```
/levelroles sync
```

### Rank Rewards Configuration

**View Rewards:**
```
/rewards show
```

**Add Reward:**
```
/rewards add
  level: 3
  type: role
  description: Get Specialist role
  role: @Specialist
```

**Remove Reward:**
```
/rewards remove
  id: 0
```

**Claim Reward:**
```
/rewards claim level: 3
```

**View Claimable Rewards:**
```
/rewards list
```

## 🔧 System Configuration

### Level System Configuration

**View Configuration:**
```
/levelconfig show
```

**Set XP Rate:**
```
/levelconfig xprate
  rate: 2
```

**Set Base XP:**
```
/levelconfig base
  amount: 15
```

**Set Length Bonus:**
```
/levelconfig lengthbonus
  rate: 2
```

**Set Cooldown:**
```
/levelconfig cooldown
  seconds: 30
```

**Toggle Level System:**
```
/levelconfig toggle
  enabled: true
```

**Reset All Levels:**
```
/levelconfig reset
  confirm: true
```

## 📊 User Commands

### Level Related

**View Level:**
```
/level
```
or
```
/level target: @user
```

**View Rank Card:**
```
/rank
```
or
```
/rank target: @user
```

**View Leaderboard:**
```
/leaderboard type: level
```

### Statistics Related

**View Server Statistics:**
```
/stats
```

## 🎨 Customization Suggestions

### Role Color Settings

Set different colors for different ranks:
- **Initiate** - Gray (#808080)
- **Operative** - Blue (#3498db)
- **Specialist** - Green (#2ecc71)
- **Veteran** - Purple (#9b59b6)
- **Elite** - Gold (#f1c40f)

### Prefix Suggestions

**Language Prefixes:**
- Chinese: [CN]
- English: [EN]
- Japanese: [JP]
- Korean: [KR]

**Special Identity Prefixes:**
- VIP: ⭐
- Moderator: 👑
- Admin: 🔥

### Ticket Channel Setup

Recommended channels:
- `#tickets` - Ticket category
- `#ticket-logs` - Ticket log channel
- `#support-announcements` - Support announcement channel

## 🔧 Troubleshooting

### Ticket System Issues

**User Cannot Create Ticket:**
1. Check if ticket system is set up
2. Check if user already has an unclosed ticket
3. Check if Bot has channel creation permissions

**Ticket Channel Permission Issues:**
1. Ensure Bot has channel management permissions
2. Check if support role is correct
3. Verify category exists

### Prefix System Issues

**Prefix Not Auto-Applied:**
1. Check if prefix system is enabled
2. Use `/prefixconfig sync` to manually sync
3. Check if Bot has nickname management permissions

**Prefix Position Incorrect:**
1. Check prefix configuration's position setting
2. Ensure prefix format is correct
3. Re-sync user nicknames

### Rank System Issues

**User Not Getting Rank Role:**
1. Check if rank roles are configured
2. Use `/levelroles sync` to manually sync
3. Check if Bot has role management permissions

**XP Not Increasing:**
1. Check if level system is enabled
2. Check cooldown settings
3. Ensure user is not in exempt channels

## 📈 Best Practices

1. **Regular Sync**: Regularly use sync commands to ensure all users have correct configuration
2. **Monitor Abuse**: Set reasonable cooldown times to prevent XP farming
3. **Permission Management**: Ensure Bot has sufficient permissions for all operations
4. **Data Backup**: Regularly backup database files
5. **User Feedback**: Collect user feedback to continuously improve the system

## 🎉 Combined Feature Usage

### Complete User Experience Flow

1. **User Joins Server**
   - Auto-applies language prefix (e.g., [CN])
   - Sends welcome message
   - Prompts to confirm rules

2. **User Active Participation**
   - Gains XP by sending messages
   - Auto-levels up and gets rank roles
   - Prefix may change with rank

3. **User Needs Help**
   - Creates ticket
   - Support team handles it
   - Generates transcript for archiving

4. **User Reaches High Rank**
   - Gets special permissions
   - Shows on leaderboard
   - Claims rank rewards

## 📞 Support

If you have issues, please check Bot logs or contact an administrator.
