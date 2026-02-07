# SSH Security Monitoring Problem

**Date Created:** 2026-02-04  
**Status:** Active  
**Priority:** High  

## Problem Statement

Currently, SSH access to our servers is monitored passively via log checking during heartbeats. This creates several issues:

1. **Delayed Detection:** Alerts only come during scheduled heartbeat checks (could be minutes or hours)
2. **Single Point of Failure:** If Flux (AI) is offline or busy, alerts don't fire
3. **No Historical Analysis:** Past login patterns aren't easily analyzed
4. **Limited Context:** Can't easily correlate suspicious activity across time

## Current Implementation

- Script: `/usr/local/bin/check-ssh-alerts.sh`
- Log file: `/var/log/ssh-alerts.jsonl`
- Alert method: Telegram message during heartbeat checks
- Detection: Basic - just logs new SSH logins

## Potential Solutions

### Option 1: Real-Time Hook (Similar to Threshold)
**Approach:** Create a systemd service that monitors SSH auth logs in real-time and triggers immediate alerts

**Pros:**
- Instant alerts (seconds, not minutes)
- Independent of Flux availability
- Can run sophisticated checks (geographic anomalies, time patterns, brute force detection)
- More secure - doesn't rely on scheduled checks

**Cons:**
- More complex to set up
- Requires systemd service configuration
- Need to handle alert fatigue

**Implementation:**
```bash
# Systemd service watches /var/log/auth.log
# On new successful SSH login:
#   1. Log to /var/log/ssh-alerts.jsonl
#   2. Check against whitelist/patterns
#   3. If suspicious, trigger immediate webhook/alert
#   4. Update analysis database
```

### Option 2: PAM Hook (Deeper Integration)
**Approach:** Use Linux PAM (Pluggable Authentication Modules) to trigger alerts at the authentication layer

**Pros:**
- Most immediate (microseconds)
- Catches all authentication attempts, not just SSH
- Can block suspicious attempts in real-time
- Industry standard approach

**Cons:**
- Most complex to implement
- Higher risk if misconfigured (could lock you out)
- Requires deep Linux knowledge

**Implementation:**
```bash
# /etc/pam.d/sshd modification
# Add custom PAM module that:
#   1. Logs every auth attempt
#   2. Checks against rules engine
#   3. Can deny/allow based on policy
#   4. Triggers webhooks for alerts
```

### Option 3: Enhanced Scheduled Monitoring (Improved Current)
**Approach:** Keep scheduled approach but make it smarter

**Pros:**
- Simplest to implement
- Builds on existing infrastructure
- Less risk of breaking something

**Cons:**
- Still delayed alerts
- Still dependent on Flux being available

**Enhancements:**
```bash
# Improve check-ssh-alerts.sh to:
#   1. Run more frequently (every 2-5 minutes)
#   2. Add pattern analysis (unusual times, IPs)
#   3. Build baseline of normal activity
#   4. Alert on anomalies, not just every login
#   5. Weekly summary reports
```

### Option 4: Third-Party SIEM Integration
**Approach:** Use a proper Security Information and Event Management system

**Pros:**
- Professional-grade security monitoring
- Correlates events across systems
- Machine learning for anomaly detection
- Compliance reporting

**Cons:**
- Cost (tools like Splunk, Datadog are expensive)
- Overkill for single server?
- Requires ongoing maintenance

**Options:**
- Open source: Wazuh, OSSEC, ELK Stack
- Commercial: Splunk, Datadog, Sumo Logic
- Cloud: AWS CloudWatch, Azure Sentinel

## Recommended Approach

**Phase 1 (Immediate):** Option 3 - Enhanced Scheduled Monitoring
- Quick win, low risk
- Make current system smarter
- Add anomaly detection

**Phase 2 (Within 2 weeks):** Option 1 - Real-Time Hook
- Set up systemd service for instant alerts
- Test thoroughly in non-production
- Migrate once proven stable

**Phase 3 (Future):** Consider SIEM if we expand to multiple servers

## Success Metrics

- Alert latency: < 2 minutes (Phase 1), < 30 seconds (Phase 2)
- False positive rate: < 5% of alerts
- Zero missed intrusions
- Easy to review historical patterns

## Related Files

- Current implementation: `/usr/local/bin/check-ssh-alerts.sh`
- Log file: `/var/log/ssh-alerts.jsonl`
- Heartbeat check: `HEARTBEAT.md`

## Next Steps

1. Discuss with Ayman - which approach?
2. Test enhanced monitoring locally
3. Document implementation plan
4. Build and deploy solution
5. Monitor effectiveness for 2 weeks
6. Iterate based on results
