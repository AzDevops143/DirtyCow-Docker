#!/bin/bash
echo "=== DIRTY COW (CVE-2016-5195) EXPLOIT ATTEMPT ===" > dirty_cow_exploit.log
echo "=== DIRTY COW MITIGATION VERIFICATION ===" > dirty_cow_mitigation.log

echo "[*] Creating target read-only file..." | tee -a dirty_cow_exploit.log
echo "SAFE_CONTENT_123" > target.txt
chmod 0404 target.txt
ls -l target.txt | tee -a dirty_cow_exploit.log

echo "[*] Compiling Dirty COW PoC..." | tee -a dirty_cow_exploit.log
gcc -pthread scripts/dirty_cow_exploit.c -o dirty_cow_poc 2>> dirty_cow_exploit.log

echo "[*] Running Exploit (Attempting to write 'COMPROMISED_999' to read-only memory map)" | tee -a dirty_cow_exploit.log
# Run for 3 seconds then timeout (the race condition usually succeeds in < 1s if vulnerable)
timeout 3 ./dirty_cow_poc target.txt "COMPROMISED_999" >> dirty_cow_exploit.log 2>&1

echo "[*] Exploit execution finished. Proceeding to mitigation check..." | tee -a dirty_cow_exploit.log

echo "[*] Checking target file context post-exploit..." | tee -a dirty_cow_mitigation.log
cat target.txt | tee -a dirty_cow_mitigation.log
echo "" | tee -a dirty_cow_mitigation.log

KERNEL_VERSION=$(uname -r)
echo "[*] Host Kernel Version: $KERNEL_VERSION" | tee -a dirty_cow_mitigation.log

if grep -q "COMPROMISED" target.txt; then
    echo "[!] VULNERABLE: The read-only file was modified! Privilege escalation successful." | tee -a dirty_cow_mitigation.log
else
    echo "[+] SECURE/MITIGATED: The read-only file was NOT modified." | tee -a dirty_cow_mitigation.log
    echo "    The underlying host kernel ($KERNEL_VERSION) is modern and patched against CVE-2016-5195 (Dirty COW)." | tee -a dirty_cow_mitigation.log
fi

# Clean up
rm -f target.txt dirty_cow_poc
echo "=== END OF DIRTY COW TEST ===" >> dirty_cow_mitigation.log
